from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash, send_file
from flask_session import Session
from werkzeug.utils import secure_filename
from flask_wtf import CSRFProtect
import psycopg2, uuid, dotenv, os
from datetime import timedelta, datetime
import json
import sqlite3
import threading
import time

UPLOAD_FOLDER= 'upload'
app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = None # Remove any size limit
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
Session(app)
secret_key = uuid.uuid4().hex
app.secret_key = secret_key
METADATA_FILE = "metadata.json"

if os.path.exists(METADATA_FILE):
    with open(METADATA_FILE, "r") as f:
        try:
            metadata = json.load(f)
        except (json.JSONDecodeError, ValueError):
            metadata = {}
else:
    metadata = {}

def get_db_connection():
    conn = sqlite3.connect("share_x.db")
    conn.row_factory = sqlite3.Row
    return conn

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=False
)


@app.route("/upload/<code>", methods=["POST"])
def upload_file(code):
    conn = get_db_connection()
    db = conn.cursor()
    db.execute("SELECT * FROM codes WHERE code = ?", (code,))
    code_record = db.fetchone()
    if not code_record:
        return jsonify({"success": False, "error": "Code is invalid"}), 404
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file provided"}), 400
    
    file = request.files["file"]

    if file.filename == "":
        return jsonify({"success": False, "error": "Empty filename"}), 400
    
    original_name = secure_filename(file.filename)
    file_id = uuid.uuid4().hex

    save_path = os.path.join(app.config["UPLOAD_FOLDER"], file_id)
    file.save(save_path)
    file_size= os.path.getsize(save_path)
    metadata[file_id] = {
    "name": original_name,
    "size": file_size,
    "uploaded_at": "2025-12-28 22:00",
    "usr_code": code}

    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f)

    return jsonify({
        "success": True,
        "file_id": file_id,
        "filename": original_name
    })

@app.route('/files/<code>', methods=['GET'])
def show_files(code):
    files_list=[]
    conn = get_db_connection()
    db = conn.cursor()
    if not session.get('verified_code'):
        db.execute("SELECT * FROM codes WHERE code = ?", (code,))
        code_record = db.fetchone()
        if not code_record:
            session['verified_code'] = False
            return jsonify({"success": False, "error": "Code is invalid"}), 404
        session['verified_code'] = True
    for file_id, info in metadata.items():
        if info.get("usr_code") == code:
            files_list.append({
                "id": file_id,
                "name": info["name"],
                "size": info["size"],
                "uploaded_at": info["uploaded_at"],
                "usr_code": code
            })
    return jsonify(files_list)

@app.route('/main/<code>', methods=['GET', 'POST'])
def index(code):
    if request.method == 'GET':
        conn = get_db_connection()
        db = conn.cursor()
        db.execute("SELECT * FROM codes WHERE code = ?", (code,))
        code_record = db.fetchone()
        if not code_record:
            return redirect(url_for('enter_co', error='invalid_code'))
        return render_template('index.html', code=code_record)
    else:
        return """<script>alert("You Can't Post This Page")</script>"""

@app.route('/device-info', methods=['GET'])
def device_info():
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
        
    return jsonify({
        'ip': f"http://{IP}",
        'port': 5000
    })

@app.route('/download/<file_id>', methods=['GET'])
def download(file_id):
    if file_id not in metadata:
        return "File not found", 404
    
    file_path = os.path.join(UPLOAD_FOLDER, file_id)

    return send_file(
        file_path,
        as_attachment=True,
        download_name=metadata[file_id]["name"]
    )

@app.route('/preview/<file_id>', methods=['GET'])
def preview(file_id):
    if file_id not in metadata:
        return "File not found", 404
    
    file_path = os.path.join(UPLOAD_FOLDER, file_id)

    return send_file(
        file_path,
        as_attachment=False,
        download_name=metadata[file_id]["name"]
    )

@app.route("/delete/<code>", methods=["POST"])
def delete(code):
    data = request.get_json()
    file_id = data.get('file_id')
    conn = get_db_connection()
    db = conn.cursor()
    db.execute("SELECT * FROM codes WHERE code = ?", (code,))
    code_record = db.fetchone()
    if not code_record:
        return jsonify({"success": False, "error": "Code is invalid"}), 404
    if file_id not in metadata:
        return jsonify({"success": False, "error": "File not found"}), 404

    file_path = os.path.join(UPLOAD_FOLDER, file_id)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    metadata.pop(file_id)
    with open('metadata.json', 'w') as f:
        json.dump(metadata, f)
    
    return jsonify({"success": True})


@app.route("/heartbeat/<code>", methods=["POST"])
def heartbeat(code):
    data = request.get_json() or {}
    # Use client-side ID (per tab) to allow counting multiple tabs from same browser
    session_id = data.get('member_id') or session.get('_id', 'anonymous')
    
    conn = get_db_connection()
    db = conn.cursor()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    db.execute("INSERT OR REPLACE INTO members (code, session_id, last_seen) VALUES (?, ?, ?)", 
               (code, session_id, now))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/members/<code>", methods=["GET"])
def get_members(code):
    conn = get_db_connection()
    db = conn.cursor()
    # Active if seen in the last 20 seconds
    threshold = (datetime.now() - timedelta(seconds=20)).strftime('%Y-%m-%d %H:%M:%S')
    db.execute("SELECT COUNT(DISTINCT session_id) FROM members WHERE code = ? AND last_seen > ?", (code, threshold))
    count = db.fetchone()[0]
    conn.close()
    return jsonify({"count": count})

@app.route("/end-session/<code>", methods=["POST"])
def end_session(code):
    conn = get_db_connection()
    db = conn.cursor()
    db.execute("SELECT * FROM codes WHERE code = ?", (code,))
    if not db.fetchone():
        return jsonify({"success": False, "error": "Invalid session"}), 404
        
    delete_session_data(code, db)
    conn.commit()
    conn.close()
    session.pop('verified_code', None)
    return jsonify({"success": True})

def delete_session_data(code, db_cursor):
    # Delete files from disk
    ids_to_remove = []
    for file_id, info in list(metadata.items()):
        if info.get("usr_code") == code:
            file_path = os.path.join(app.config["UPLOAD_FOLDER"], file_id)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass
            ids_to_remove.append(file_id)
    
    # Update metadata
    for fid in ids_to_remove:
        metadata.pop(fid, None)
    
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f)
        
    # Delete from DB
    db_cursor.execute("DELETE FROM codes WHERE code = ?", (code,))
    db_cursor.execute("DELETE FROM members WHERE code = ?", (code,))

def cleanup_worker():
    while True:
        try:
            with sqlite3.connect("share_x.db") as conn:
                db = conn.cursor()
                now = datetime.now()
                
                # 1. Prune stale members
                stale_threshold = (now - timedelta(seconds=30)).strftime('%Y-%m-%d %H:%M:%S')
                db.execute("DELETE FROM members WHERE last_seen < ?", (stale_threshold,))
                
                # 2. Check sessions
                db.execute("SELECT code, empty_since FROM codes")
                codes = db.fetchall()
                
                for code_row in codes:
                    code = code_row[0]
                    empty_since_str = code_row[1]
                    
                    db.execute("SELECT COUNT(*) FROM members WHERE code = ?", (code,))
                    member_count = db.fetchone()[0]
                    
                    if member_count == 0:
                        if empty_since_str is None:
                            db.execute("UPDATE codes SET empty_since = ? WHERE code = ?", 
                                     (now.strftime('%Y-%m-%d %H:%M:%S'), code))
                        else:
                            empty_since = datetime.strptime(empty_since_str, '%Y-%m-%d %H:%M:%S')
                            if (now - empty_since).total_seconds() > 120:
                                delete_session_data(code, db)
                    else:
                        if empty_since_str is not None:
                            db.execute("UPDATE codes SET empty_since = NULL WHERE code = ?", (code,))
                conn.commit()
        except Exception as e:
            print(f"Cleanup Error: {e}")
        time.sleep(30)

# Start background worker
threading.Thread(target=cleanup_worker, daemon=True).start()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route('/join', methods=['GET', 'POST'])
def enter_co():
    conn = get_db_connection()
    db = conn.cursor()
    if request.method == 'GET':
        return render_template('enter_code.html')
    data = request.get_json()
    code = data.get('code')

    if not code:
        return jsonify({"success": False, "error": "Code is required"}), 400
    db.execute("SELECT * FROM codes WHERE code = ?", (code,))
    code_record = db.fetchone()
    if not code_record:
        return jsonify({"success": False, "error": "Code is invalid"}), 404
    return jsonify({"success": True, "code": code_record["code"]})
    
    
@app.route('/create', methods=['GET'])
def create_co():
    conn = get_db_connection()
    db = conn.cursor()
    
    code = str(uuid.uuid4().hex)[::-8]
    db.execute("INSERT INTO codes (code) VALUES (?)", (code,))
    conn.commit()
    return render_template('create_code.html', code=code)


@app.route('/')
def home():
    return render_template('home.html')

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('500.html'), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)