# Share-X-Pr0 - Premium Local File Sharing (v2.3)

A stunning, modern, and high-performance web application for secure local network file sharing. Built with **Flask** and **Vanilla JS**, featuring a premium glassmorphism design, real-time updates, instant mobile connectivity, and now with **organized room-based sharing**.

![Share-X-Pr0 Banner](https://raw.githubusercontent.com/AbdulrahmanAhmedGit/Share-X-Pr0/refs/heads/main/static/img/Gemini_Generated_Image_spupzjspupzjspup.png)

## 🎉 What's New in Version 2.3

*   **👥 Real-time Member Tracking**: See exactly how many people (and tabs) are currently active in the room. Each device and tab is uniquely tracked for accurate occupancy stats.
*   **🛑 Manual Session Control**: The new "End Session" feature allows users to instantly terminate a room. Ending a session immediately wipes all shared files and data from the server.
*   **🧹 Automatic Ghost-Room Cleanup**: Added a background worker that monitors session activity. Any room left empty for more than **2 minutes** is automatically deleted along with all its files, ensuring your temporary shared data doesn't stick around.

## 🔄 Version 2.2 Highlights

*   **📷 Native & Fallback QR Scanning**: Added a powerful in-browser QR code scanner to instantly join rooms. Now includes a smart fallback for non-HTTPS (Not Secure) local network connections, allowing users to take a photo of the QR code which is instantly resized and scanned directly on the device!
*   **🔗 Native QR Code Sharing**: Added a native "Share QR Code" button when creating a room. Integrates with the Web Share API to easily pass the room's QR code image into WhatsApp, Telegram, Email, and Messages directly from your phone.

## 🔄 Version 2.1 Highlights

*   **👨‍💻 Developer Credit Toast**: A sleek, animated pop-up toast that appears on every page — featuring gradient text, a pulsing heart, and sparkle animations. Links to the developer's portfolio. Appears briefly and then fades away gracefully.
*   **🚫 Custom Error Pages**: Beautiful, themed 404 ("Lost in Space") and 500 ("Something Went Wrong") error pages with smooth animations, matching the app's design system.
*   **📱 Enhanced Responsiveness**: Improved mobile layout across all centered pages (Home, Create Room, Join Room) with proper margins, padding, and scaled UI elements on small screens.

## 🔄 Version 2.0 Highlights

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
│   ├── index.html       # Main application interface for a room
│   ├── 404.html         # Custom 404 error page
│   └── 500.html         # Custom 500 error page
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

**Share-X-Pr0** © 2026 — Developed by [Abdulrahman AH](https://abdulrahmanp0rtfolio.pythonanywhere.com). Simple. Fast. Secure.
