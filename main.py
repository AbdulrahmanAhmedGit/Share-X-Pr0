from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash, send_file
from flask_session import Session
from werkzeug.utils import secure_filename
from flask_wtf import CSRFProtect
import psycopg2, uuid, dotenv, os
from datetime import timedelta, datetime
import re
from psycopg2.extras import RealDictCursor
import requests
import csv
import io
import json

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
        metadata = json.load(f)
else:
    metadata = {}




os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=False
)


@app.route("/upload", methods=["POST"])
def upload_file():
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
    "uploaded_at": "2025-12-28 22:00"}

    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f)

    return jsonify({
        "success": True,
        "file_id": file_id,
        "filename": original_name
    })

@app.route('/files', methods=['GET'])
def show_files():
    files_list=[]
    for file_id, info in metadata.items():
        files_list.append({
            "id": file_id,
            "name": info["name"],
            "size": info["size"],
            "uploaded_at": info["uploaded_at"]
        })
    return jsonify(files_list)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'GET':
        return render_template('index.html')
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

@app.route("/delete", methods=["POST"])
def delete():
    data = request.json
    file_id = data.get('file_id')

    if file_id not in metadata:
        return jsonify({"success": False, "error": "File not found"}), 404

    file_path = os.path.join(UPLOAD_FOLDER, file_id)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    metadata.pop(file_id)
    with open('metadata.json', 'w') as f:
        json.dump(metadata, f)
    
    return jsonify({"success": True})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)