let currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

function updateStaticQrCode() {
    const staticQrImg = document.getElementById('qrCodeImg');
    if (staticQrImg) {
        const roomCodeElement = document.getElementById('roomCode');
        if (roomCodeElement) {
            const code = roomCodeElement.innerText.trim();
            const isDark = currentTheme === 'dark';
            const bg = isDark ? '1e293b' : 'ffffff';
            const fg = isDark ? '818cf8' : '4f46e5';
            staticQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(code)}&bgcolor=${bg}&color=${fg}`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial static QR update on load
    updateStaticQrCode();

    const themeToggles = document.querySelectorAll('#themeToggle');
    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', currentTheme);
            localStorage.setItem('theme', currentTheme);

            // Regenerate QR code if generateQRCode is available (from main.js)
            if (typeof generateQRCode === 'function') {
                const qrContainer = document.querySelector('.qr-container');
                const sidebarQr = document.querySelector('.qr-item');
                if ((qrContainer && qrContainer.style.display !== 'none') ||
                    (sidebarQr && sidebarQr.style.display !== 'none')) {
                    generateQRCode();
                }
            }

            // Update static QR code if present
            updateStaticQrCode();
        });
    });
});
