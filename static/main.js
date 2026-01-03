// ==================== GLOBAL VARIABLES ====================
let currentTheme = localStorage.getItem('theme') || 'light';
let isUploading = false;
let deviceInfo = null;
let fileListPollingInterval = null; // Polling interval for automatic file list updates

// ==================== DOM ELEMENTS ====================
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const filePickerBtn = document.getElementById('filePickerBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const uploadFileName = document.getElementById('uploadFileName');
const uploadPercent = document.getElementById('uploadPercent');
const filesList = document.getElementById('filesList');
const themeToggle = document.getElementById('themeToggle');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const qrCode = document.getElementById('qrCode');
const networkAddress = document.getElementById('networkAddress');
const dragOverlay = document.getElementById('dragOverlay');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const fileCount = document.getElementById('fileCount');
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDelete');

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initDragAndDrop();
    initFilePicker();
    loadFiles();
    fetchDeviceInfo();
    initQRButton();
    initMobileMenu();
    startFileListPolling(); // Start automatic file list updates
});

// ==================== MOBILE MENU ====================
function initMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (mobileMenuBtn && sidebar) {
        function toggleSidebar(show) {
            if (show) {
                sidebar.classList.add('active');
                if (sidebarOverlay) sidebarOverlay.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent scrolling
            } else {
                sidebar.classList.remove('active');
                if (sidebarOverlay) sidebarOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }

        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = sidebar.classList.contains('active');
            toggleSidebar(!isActive);
        });

        // Close when clicking overlay
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                toggleSidebar(false);
            });
        }

        // Close sidebar when clicking outside (keep for robustness)
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('active') &&
                !sidebar.contains(e.target) &&
                !mobileMenuBtn.contains(e.target)) {
                toggleSidebar(false);
            }
        });

        // Close on resize to larger screens
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
                toggleSidebar(false);
            }
        });
    }
}

// ==================== THEME MANAGEMENT ====================
function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);

    themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);

        // Regenerate QR code if visible
        const qrContainer = document.querySelector('.qr-container');
        if (qrContainer && qrContainer.style.display !== 'none') {
            generateQRCode();
        }
    });
}

// ==================== DRAG & DROP ====================
// ==================== DRAG & DROP ====================
function initDragAndDrop() {
    let dragCounter = 0;

    // Prevent default drag behaviors on entire document
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Handle drag enter/leave for the entire body to show overlay
    document.body.addEventListener('dragenter', (e) => {
        if (isUploading) return;
        dragCounter++;
        if (dragCounter === 1) {
            dragOverlay.classList.add('active');
        }
    });

    document.body.addEventListener('dragleave', (e) => {
        if (isUploading) return;
        dragCounter--;
        if (dragCounter === 0) {
            dragOverlay.classList.remove('active');
        }
    });

    // Handle dropped files on the overlay or drop zone
    document.body.addEventListener('drop', (e) => {
        if (isUploading) return;
        dragCounter = 0; // Reset
        dragOverlay.classList.remove('active');

        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // Keep the specific highlight for the drop zone just in case
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
        }, false);
    });
}

// ==================== FILE PICKER ====================
function initFilePicker() {
    filePickerBtn.addEventListener('click', () => {
        if (isUploading) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (isUploading) return;
        const files = e.target.files;
        handleFiles(files);
    });
}

// ==================== FILE UPLOAD ====================
function handleFiles(files) {
    if (files.length === 0) return;

    Array.from(files).forEach(file => {
        uploadFile(file);
    });
}

function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    // Set uploading state
    isUploading = true;
    setUploadUIState(false);

    // Show progress bar
    uploadProgress.style.display = 'block';
    uploadFileName.textContent = `Uploading: ${file.name}`;
    uploadPercent.textContent = '0%';
    progressFill.style.width = '0%';

    // Use XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();

    // Progress event
    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            progressFill.style.width = percentComplete + '%';
            uploadPercent.textContent = percentComplete + '%';
        }
    });

    // Success event
    xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
            // Upload successful
            showToast('File uploaded successfully', 'success');
            setTimeout(() => {
                uploadProgress.style.display = 'none';
                progressFill.style.width = '0%';
                isUploading = false;
                setUploadUIState(true);
                // Reload file list
                loadFiles();
            }, 500);
        } else if (xhr.status === 413) {
            // File too large
            showToast('File too large. Maximum size exceeded.', 'error');
            uploadProgress.style.display = 'none';
            isUploading = false;
            setUploadUIState(true);
        } else {
            // Upload failed
            showToast('Upload failed. Please try again.', 'error');
            uploadProgress.style.display = 'none';
            isUploading = false;
            setUploadUIState(true);
        }
    });

    // Error event
    xhr.addEventListener('error', () => {
        showToast('Server unreachable. Check connection.', 'error');
        uploadProgress.style.display = 'none';
        isUploading = false;
        setUploadUIState(true);
    });

    // Send request
    xhr.open('POST', '/upload');
    xhr.send(formData);

    // Reset file input
    fileInput.value = '';
}

// ==================== AUTOMATIC FILE LIST POLLING ====================
/**
 * Start polling the server every 2 seconds to automatically refresh the file list.
 * This ensures that when files are uploaded/deleted from any device on the network,
 * all connected clients see the updates without manually refreshing the page.
 */
function startFileListPolling() {
    // Clear any existing interval to prevent duplicates
    if (fileListPollingInterval) {
        clearInterval(fileListPollingInterval);
    }

    // Poll every 2 seconds (2000 milliseconds) for faster updates
    fileListPollingInterval = setInterval(() => {
        loadFiles();
    }, 2000);
}

/**
 * Stop the automatic polling (useful if needed for cleanup)
 */
function stopFileListPolling() {
    if (fileListPollingInterval) {
        clearInterval(fileListPollingInterval);
        fileListPollingInterval = null;
    }
}

// ==================== LOAD FILES ====================
async function loadFiles() {
    try {
        const response = await fetch('/files');

        if (!response.ok) {
            throw new Error('Failed to fetch files');
        }

        const files = await response.json();
        displayFiles(files);
    } catch (error) {
        console.error('Error loading files:', error);
        // Silently handle errors during polling to avoid spamming alerts
        // Only show error state if the file list is currently empty
        if (!filesList.innerHTML || filesList.innerHTML.includes('loading-spinner')) {
            filesList.innerHTML = `
                <div class="empty-state">
                    <p>Unable to load files. Please make sure the server is running.</p>
                </div>
            `;
        }
    }
}

// ==================== DISPLAY FILES ====================
function displayFiles(files) {
    if (fileCount) {
        fileCount.textContent = files ? files.length : 0;
    }

    if (!files || files.length === 0) {
        filesList.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem; opacity: 0.3;">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <p>No files shared yet.</p>
            </div>
        `;
        return;
    }

    filesList.innerHTML = '';

    files.forEach(file => {
        const fileCard = createFileCard(file);
        filesList.appendChild(fileCard);
    });
}

// ==================== CREATE FILE CARD ====================
function createFileCard(file) {
    const card = document.createElement('div');
    card.className = 'file-card';

    const fileExtension = getFileExtension(file.name);
    const fileIcon = getFileIcon(fileExtension);

    card.innerHTML = `
        <div class="file-header">
            <div class="file-icon">
                ${fileIcon}
            </div>
            <div class="file-info">
                <div class="file-name" title="${file.name}">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
        </div>
        <div class="file-actions">
            <button class="download-btn" onclick="downloadFile('${file.id}', '${file.name}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download
            </button>
            <button class="delete-btn" onclick="deleteFile('${file.id}', '${file.name}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Delete
            </button>
        </div>
    `;

    return card;
}

// ==================== FILE DOWNLOAD ====================
function downloadFile(fileId, fileName) {
    const link = document.createElement('a');
    link.href = `/download/${fileId}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==================== FILE DELETE ====================
async function deleteFile(fileId, fileName) {
    // Custom Modal Confirmation
    const confirmed = await showDeleteConfirmation(fileName);
    if (!confirmed) return;

    try {
        const response = await fetch('/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ file_id: fileId })
        });

        if (!response.ok) {
            throw new Error('Failed to delete file');
        }

        const result = await response.json();

        if (result.success) {
            showToast('File deleted successfully', 'success');
            // Refresh file list
            loadFiles();
        } else {
            throw new Error(result.error || 'Delete failed');
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showToast('Failed to delete file', 'error');
    }
}

// ==================== UTILITY FUNCTIONS ====================
function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
}

function getFileIcon(extension) {
    const iconMap = {
        // PDF
        'pdf': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        // Documents
        'doc': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        'docx': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        'txt': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        // Spreadsheets
        'xls': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        'xlsx': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        // Images
        'jpg': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
        'jpeg': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
        'png': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
        'gif': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
        // Media
        'mp4': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>',
        'mp3': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
        // Archives
        'zip': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
    };

    return iconMap[extension] || '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ==================== NETWORK INFO ====================
async function fetchDeviceInfo() {
    networkAddress.textContent = 'Connecting...';

    try {
        const response = await fetch('/device-info');

        if (!response.ok) {
            throw new Error('Failed to fetch device info');
        }

        deviceInfo = await response.json();
        const address = deviceInfo.port ? `${deviceInfo.ip}:${deviceInfo.port}` : deviceInfo.ip;
        networkAddress.textContent = address;

        // Auto-generate QR code after device info is loaded
        generateQRCode();
    } catch (error) {
        console.error('Error fetching device info:', error);
        networkAddress.textContent = 'Unable to connect';
    }
}

// ==================== UPLOAD UI STATE ====================
function setUploadUIState(enabled) {
    if (enabled) {
        dropZone.classList.remove('disabled');
        filePickerBtn.disabled = false;
        // Re-enable interactions if needed
    } else {
        dropZone.classList.add('disabled');
        filePickerBtn.disabled = true;
        // Remove drag overlay if active
        dragOverlay.classList.remove('active');
    }
}

// ==================== CUSTOM MODAL LOGIC ====================
function showDeleteConfirmation(fileName) {
    return new Promise((resolve) => {
        confirmMessage.textContent = `Are you sure you want to delete "${fileName}"?`;
        confirmModal.showModal();

        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            confirmDeleteBtn.removeEventListener('click', handleConfirm);
            cancelDeleteBtn.removeEventListener('click', handleCancel);

            // Handle closing via Esc key or other means
            confirmModal.removeEventListener('close', handleCancel);

            confirmModal.close();
        };

        confirmDeleteBtn.addEventListener('click', handleConfirm);
        cancelDeleteBtn.addEventListener('click', handleCancel);

        // Handle native close (e.g. Esc key)
        confirmModal.addEventListener('close', () => {
            resolve(false);
        }, { once: true });
    });
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    // Add icon based on type
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        setTimeout(() => toast.classList.add('show'), 10);
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Make functions available globally
window.downloadFile = downloadFile;
window.deleteFile = deleteFile;

// ==================== QR CODE LOGIC ====================
function initQRButton() {
    // Placeholder if we ever want a manual regenerate button
    // Currently handled automatically
}

function generateQRCode() {
    if (!deviceInfo) return;

    const qrElement = document.getElementById('qrCode');
    const qrLabel = document.getElementById('qrLabel');

    if (!qrElement) return;

    // deviceInfo.ip comes from server with http:// prefix
    const url = deviceInfo.port ? `${deviceInfo.ip}:${deviceInfo.port}` : deviceInfo.ip;

    // Get colors based on theme
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Hex colors matching our CSS variables
    // Dark: bg=#1e293b (surface), fg=#6366f1 (brand) or #f8fafc (text)
    // Light: bg=#ffffff (surface), fg=#4f46e5 (brand) or #1f2937 (text)

    // Let's use brand color for the QR code for a premium look
    const bg = isDark ? '1e293b' : 'ffffff';
    const fg = isDark ? '818cf8' : '4f46e5';

    // Use QR Server API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=${bg}&color=${fg}&margin=10&format=svg`;

    qrElement.src = qrUrl;

    qrElement.onload = () => {
        qrElement.style.display = 'block';
        if (qrLabel) qrLabel.style.display = 'block';
    };

    qrElement.onerror = () => {
        // Hide if API fails (offline)
        qrElement.style.display = 'none';
        if (qrLabel) qrLabel.style.display = 'none';
    };
}
