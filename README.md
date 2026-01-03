# Share-X-Pr0 - Premium Local File Sharing

A stunning, modern, and high-performance web application for secure local network file sharing. Built with **Flask** and **Vanilla JS**, featuring a premium glassmorphism design, real-time updates, and instant mobile connectivity.

![Share-X-Pr0 Banner](https://raw.githubusercontent.com/AbdulrahmanAhmedGit/Share-X-Pr0/refs/heads/main/static/img/Gemini_Generated_Image_spupzjspupzjspup.png)

## 🚀 Key Features

*   **🎨 Premium Glassmorphism UI**: A beautiful, modern interface with frosted glass effects, mesh gradients, and smooth micro-interactions.
*   **🌓 Dynamic Themes**: Seamlessly switch between Light and Dark modes with persistent preferences.
*   **📱 Fully Responsive**: A professionally designed layout that adapts perfectly from large desktops to mobile phones.
*   **⚡ Instant Mobile Connect**: Automatically generates a theme-aware **QR Code** for one-scan connection from any mobile device on the network.
*   **📂 Drag & Drop Uploads**: Intuitive drop zone with visual feedback and real-time progress bars. Supports **unlimited file sizes**.
*   **🔄 Real-Time Sync**: The file list automatically updates across all connected devices when files are added or removed using efficient polling.
*   **👁️ Smart Previews**: Built-in preview support for Images, Videos, Audio, PDFs, and Code/Text files directly in the browser.
*   **🔒 Secure & Private**: File transfers happen strictly within your local network (LAN). Files are stored locally on your machine.
*   **✨ Smart Experience**: Includes toast notifications for status updates (success, error, info) and a polished "empty state" for new sessions.

## 🛠️ Technology Stack

*   **Backend**: Python (Flask)
*   **Frontend**: HTML5, CSS3 (Variables, Flexbox/Grid, Animations), Vanilla JavaScript
*   **Storage**: Lightweight JSON-based metadata storage (No complex database setup required).
*   **Styling**: Custom CSS with Glassmorphism & Mesh Gradients (No heavy frameworks like Bootstrap or Tailwind).
*   **Icons**: Hand-picked SVG Icons for file types and UI elements.

## 📦 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/AbdulrahmanAhmedGit/Share-X-Pr0.git
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
    *   **Desktop**: Open your browser and go to `http://localhost:5000`
    *   **Mobile**: Scan the QR code displayed in the sidebar to connect instantly.

    *Note: Ensure your devices are connected to the same Wi-Fi/Network.*

## 📁 Project Structure

```
Share-X-Pr0/
├── main.py              # Flask server, routes & logic
├── requirements.txt     # Python dependencies
├── metadata.json        # File metadata (auto-generated)
├── upload/              # Physical storage for uploaded files
├── templates/
│   └── index.html      # Main application interface
└── static/
    ├── styles.css      # Premium styling, variables & themes
    └── main.js         # Frontend logic (Drag&Drop, Polling, UI)
```

## 🔒 Security & Privacy

*   **Local Network Only**: Designed to be used within a trusted local network (Home/Office WiFi).
*   **Self-Hosted**: All files are stored directly on the host machine in the `upload/` folder.
*   **Zero Analytics**: No user tracking or external telemetry.

## 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request or open an issue.

---

**Share-X-Pr0** © 2026. Simple. Fast. Secure.
