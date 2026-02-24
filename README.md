# Share-X-Pr0 - Premium Local File Sharing (v2.0)

A stunning, modern, and high-performance web application for secure local network file sharing. Built with **Flask** and **Vanilla JS**, featuring a premium glassmorphism design, real-time updates, instant mobile connectivity, and now with **organized room-based sharing**.

![Share-X-Pr0 Banner](https://raw.githubusercontent.com/AbdulrahmanAhmedGit/Share-X-Pr0/refs/heads/main/static/img/Gemini_Generated_Image_spupzjspupzjspup.png)

## 🎉 What's New in Version 2.0

*   **🔑 Secure Room Codes**: Files are no longer just dumped in a single global space. Create secure, isolated rooms with unique 4-digit codes to share files privately.
*   **💾 SQLite Migration**: Upgraded from simple JSON metadata storage to a robust SQLite3 database (`share_x.db`) for improved performance, thread safety, and multi-user concurrency.
*   **🌌 Dynamic Theme Backgrounds**: Enhanced UI with a dedicated dark/light mode toggle and adaptive dynamic background gradients that shift based on your theme across all pages.

## 🚀 Key Features

*   **🎨 Premium Glassmorphism UI**: A beautiful, modern interface with frosted glass effects, mesh gradients, and smooth micro-interactions.
*   **🌓 Dynamic Themes**: Seamlessly switch between Light and Dark modes with persistent preferences and adaptive backgrounds.
*   **📱 Fully Responsive**: A professionally designed layout that adapts perfectly from large desktops to mobile phones.
*   **⚡ Instant Mobile Connect**: Automatically generates a theme-aware **QR Code** for one-scan connection from any mobile device on the network.
*   **📂 Drag & Drop Uploads**: Intuitive drop zone with visual feedback and real-time progress bars. Supports **unlimited file sizes**.
*   **🔄 Real-Time Sync**: The file list automatically updates across all connected devices in a room when files are added or removed using efficient polling.
*   **👁️ Smart Previews**: Built-in preview support for Images, Videos, Audio, PDFs, and Code/Text files directly in the browser.
*   **🔒 Secure & Private**: File transfers happen strictly within your local network (LAN) and are organized into specified rooms. Files are stored locally on your machine.
*   **✨ Smart Experience**: Includes toast notifications for status updates (success, error, info) and a polished "empty state" for new sessions.

## 🛠️ Technology Stack

*   **Backend**: Python (Flask)
*   **Frontend**: HTML5, CSS3 (Variables, Flexbox/Grid, Animations), Vanilla JavaScript
*   **Storage**: SQLite3 database (`share_x.db`) for robust metadata and room management.
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
    *   **Mobile**: Scan the QR code displayed to connect instantly.

    *Note: Ensure your devices are connected to the same Wi-Fi/Network.*

## 📁 Project Structure

```
Share-X-Pr0/
├── main.py              # Flask server, routes & logic
├── requirements.txt     # Python dependencies
├── share_x.db           # SQLite database for files and rooms (auto-generated)
├── upload/              # Physical storage for uploaded files
├── templates/
│   ├── home.html        # Landing page
│   ├── create_code.html # Room creation page
│   ├── enter_code.html  # Join room page
│   └── index.html       # Main application interface for a room
└── static/
    ├── styles.css      # Premium styling, variables & themes
    ├── main.js         # Frontend logic (Drag&Drop, Polling, UI)
    ├── theme.js        # Dynamic theme and background management
    └── img/            # Images and assets
```

## 🔒 Security & Privacy

*   **Local Network Only**: Designed to be used within a trusted local network (Home/Office WiFi).
*   **Room Isolation**: Files are segregated into rooms via 4-digit codes, preventing accidental access from others on the network.
*   **Self-Hosted**: All files are stored directly on the host machine in the `upload/` folder.
*   **Zero Analytics**: No user tracking or external telemetry.

## 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request or open an issue.

---

**Share-X-Pr0** © 2026. Simple. Fast. Secure.
