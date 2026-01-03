# Share-X-Pr0 - Local Network File Sharing

A clean, modern, and responsive web UI for local network file sharing built with Flask.

## 🚀 Features

- **Drag & Drop Upload** - Intuitive file upload interface
- **Real-time Progress** - Visual upload progress tracking
- **File Management** - Browse and download shared files
- **Dark/Light Theme** - Toggle between themes with preference persistence
- **Optional QR Code** - Button-triggered QR code for mobile access
- **Smart Error Handling** - Toast notifications for all error states
- **Upload State Management** - UI disabled during uploads to prevent issues
- **Privacy-Focused** - Local network only, no tracking
- **Responsive Design** - Works seamlessly on all devices

## 📁 Project Structure

```
Share-X-Pr0/
├── main.py              # Flask backend (implement endpoints)
├── templates/
│   └── index.html      # Main UI
├── static/
│   ├── styles.css      # Styling with themes
│   └── main.js         # Frontend functionality
└── README.md
```

## 🔧 Required Flask Endpoints

The frontend expects these endpoints in your `main.py`:

### 1. Main Route
```python
@app.route('/')
def index():
    return render_template('index.html')
```

### 2. Device Info (NEW - Required)
```python
@app.route('/device-info', methods=['GET'])
def device_info():
    """Return server's local IP address and port"""
    import socket
    
    # Get local IP
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = '127.0.0.1'
    finally:
        s.close()
    
    return jsonify({
        'ip': local_ip,
        'port': 5000  # your configured port
    })
```

### 3. Upload Endpoint
```python
@app.route('/upload', methods=['POST'])
def upload():
    # Handle file upload from request.files['file']
    # Save file and return success response
    return jsonify({'success': True})
```

### 4. List Files
```python
@app.route('/files', methods=['GET'])
def get_files():
    # Return list of available files
    return jsonify([
        {
            'id': 'unique_file_id',
            'name': 'filename.pdf',
            'size': 12345  # in bytes
        }
    ])
```

### 4. Download Endpoint
```python
@app.route('/download/<file_id>')
def download(file_id):
    # Send file for download
    return send_file(file_path, as_attachment=True)
```

## 🎨 Customization

### Colors
Edit CSS variables in `static/styles.css`:
```css
:root {
    --accent-primary: #6366f1;
    --accent-secondary: #8b5cf6;
    /* ... more variables */
}
```

### File Icons
Modify the `getFileIcon()` function in `static/main.js`:
```javascript
const iconMap = {
    'pdf': '📄',
    'jpg': '🖼️',
    // Add more file types
};
```

## 📱 Mobile Access

1. Run the app on your local network
2. Scan the QR code with your mobile device
3. Access the same interface on mobile

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## ⚙️ Technical Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Flask
- **Features**: No external dependencies, fully self-contained

## 🔒 Security Notes

- Designed for local network use only
- No authentication by design
- All code runs locally (no CDNs)
- Privacy-focused implementation

## 📝 Integration Steps

1. Implement the 4 required Flask endpoints in `main.py`
2. Configure Flask static/template folders (already done)
3. Run your Flask application
4. Access via browser at `http://localhost:5000`
5. Share IP address with local network users

## 🎯 Quick Start

```bash
# Run your Flask application
python main.py

# Access in browser
http://localhost:5000
```

## ✨ UI Features

- **Theme Toggle**: Click sun/moon icon in top-right corner
- **Upload**: Drag files or click "Choose Files"
- **Download**: Click download button on any file card
- **QR Code**: Automatically generated for current URL

---

**Built for Share-X-Pr0** | Privacy-Focused | Local Network Only
