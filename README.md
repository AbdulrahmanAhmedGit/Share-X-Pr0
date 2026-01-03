# Share-X-Pr0 - Premium Local File Sharing

A stunning, modern, and high-performance web application for secure local network file sharing. Built with **Flask** and **Vanilla JS**, featuring a premium glassmorphism design, real-time updates, and instant mobile connectivity.

![Share-X-Pr0 Banner](https://raw.githubusercontent.com/AbdulrahmanAhmedGit/Share-X-Pr0/refs/heads/main/static/img/Gemini_Generated_Image_spupzjspupzjspup.png)

## 🚀 Key Features

*   **🎨 Premium Glassmorphism UI**: A beautiful, modern interface with frosted glass effects, mesh gradients, and smooth micro-interactions.
*   **🌓 Dynamic Themes**: Seamlessly switch between Light and Dark modes with persistent preferences.
*   **📱 Fully Responsive**: A professionally designed layout that adapts perfectly from large desktops to mobile phones.
*   **⚡ Instant Mobile Connect**: Automatically generates a theme-aware **QR Code** for one-scan connection from any mobile device on the network.
*   **📂 Drag & Drop Uploads**: Intuitive drop zone with visual feedback and real-time progress bars.
*   **🔄 Real-Time Sync**: The file list automatically updates across all connected devices when files are added or removed.
*   **� Secure & Private**: Works entirely on your local network/WiFi. No data leaves your permises.
*   **✨ Smart Experience**: Includes toast notifications for status updates (success, error, info) and a polished "empty state" for new sessions.

## 🛠️ Technology Stack

*   **Backend**: Python (Flask)
*   **Frontend**: HTML5, CSS3 (Variables, Flexbox/Grid, Animations), Vanilla JavaScript
*   **Styling**: Custom CSS with Glassmorphism & Mesh Gradients (No heavy frameworks like Bootstrap or Tailwind)
*   **Icons**: Hand-picked SVG Icons for file types and UI elements.

## 📦 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/Share-X-Pr0.git
    cd Share-X-Pr0
    ```

2.  **Install Dependencies**
    Ensure you have Python installed, then run:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the Application**
    ```bash
    python main.py
    ```

4.  **Access the App**
    *   Open your browser and go to `http://localhost:5000`
    *   **On Mobile**: Scan the QR code displayed in the sidebar to connect instantly.

## 📁 Project Structure

```
Share-X-Pr0/
├── main.py              # Flask server & logic
├── requirements.txt     # Python dependencies
├── templates/
│   └── index.html      # Main HTML structure
├── static/
│   ├── styles.css      # Premium styling & themes
│   └── main.js         # Client-side logic & interactions
├── upload/              # Storage for shared files
└── metadata.json        # Simple file metadata storage
```

## 🔒 Security & Privacy

*   **Local Network Only**: Designed to be used within a trusted local network (Home/Office WiFi).
*   **No Cloud Storage**: All files are stored directly on the host machine.
*   **No Tracking**: Zero analytics or external trackers.

## 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request.

---

**Share-X-Pr0** © 2026. Simple. Fast. Secure.
