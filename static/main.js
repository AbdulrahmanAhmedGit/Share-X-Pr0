let isUploading = false;
let deviceInfo = null;
let fileListPollingInterval = null; // Polling interval for automatic file list updates
let heartbeatInterval = null;
let memberCountInterval = null;
const displayedFiles = new Map(); // Track currently displayed files by ID
if (!sessionStorage.getItem('member_id')) {
    sessionStorage.setItem('member_id', Math.random().toString(36).substring(2, 15));
}
const member_id = sessionStorage.getItem('member_id');

// ==================== DOM ELEMENTS ====================
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const filePickerBtn = document.getElementById('filePickerBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const uploadFileName = document.getElementById('uploadFileName');
const uploadPercent = document.getElementById('uploadPercent');
const filesList = document.getElementById('filesList');
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
const previewModal = document.getElementById('previewModal');
const previewTitle = document.getElementById('previewTitle');
const previewContent = document.getElementById('previewContent');
const closePreviewBtn = document.getElementById('closePreview');
const downloadPreviewBtn = document.getElementById('downloadPreviewBtn');
const copyPreviewBtn = document.getElementById('copyPreviewBtn');
const memberCount = document.getElementById('memberCount');
const endSessionBtn = document.getElementById('endSessionBtn');

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initDragAndDrop();
    initFilePicker();
    loadFiles();
    fetchDeviceInfo();
    initQRButton();
    initMobileMenu();
    initPreviewModal();
    startFileListPolling(); // Start automatic file list updates
    startHeartbeat();
    initEndSession();
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
    xhr.open('POST', '/upload/' + window.ROOM_CODE);
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
        const response = await fetch('/files/' + window.ROOM_CODE);

        if (!response.ok) {
            throw new Error('Failed to fetch files');
        }

        const files = await response.json();
        displayFiles(files);
    } catch (error) {
        console.error('Error loading files:', error);
        // Silently handle errors during polling to avoid spamming alerts
        // Only show error state if the file list is currently empty or in loading state
        if (!filesList.innerHTML || filesList.querySelector('.loading') || filesList.innerHTML.includes('loading-spinner')) {
            filesList.innerHTML = `
                <div class="empty-state">
                    <p>Unable to load files. Please make sure the server is running.</p>
                </div>
            `;
            displayedFiles.clear();
        }
    }
}

// ==================== DISPLAY FILES ====================
function displayFiles(files) {
    if (fileCount) {
        fileCount.textContent = files ? files.length : 0;
    }

    // Handle empty list
    if (!files || files.length === 0) {
        if (displayedFiles.size > 0) {
            filesList.innerHTML = '';
            displayedFiles.clear();
        }

        if (!filesList.querySelector('.empty-state')) {
            filesList.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem; opacity: 0.3;">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <p>No files shared yet.</p>
            </div>
            `;
        }
        return;
    }

    // Clear loading or empty state if present
    if (filesList.querySelector('.empty-state') || filesList.querySelector('.loading')) {
        filesList.innerHTML = '';
        displayedFiles.clear();
    }

    const incomingIds = new Set(files.map(f => f.id));

    // Remove deleted files
    for (const [id, element] of displayedFiles) {
        if (!incomingIds.has(id)) {
            element.remove();
            displayedFiles.delete(id);
        }
    }

    // Add new files
    files.forEach(file => {
        if (!displayedFiles.has(file.id)) {
            const fileCard = createFileCard(file);
            filesList.appendChild(fileCard);
            displayedFiles.set(file.id, fileCard);
        }
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
            <button class="icon-btn" onclick="openPreview('${file.id}', '${file.name}')" title="Preview">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            </button>
            <button class="download-btn" onclick="downloadFile('${file.id}', '${file.name}')" title="Download">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </button>
            <button class="delete-btn icon-btn" onclick="deleteFile('${file.id}', '${file.name}')" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
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
        const response = await fetch('/delete/' + window.ROOM_CODE, {
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

// ==================== PREVIEW MODAL LOGIC ====================
function initPreviewModal() {
    closePreviewBtn.addEventListener('click', () => {
        previewModal.close();
    });

    // Close on backdrop click
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.close();
        }
    });

    // Copy button logic
    if (copyPreviewBtn) {
        copyPreviewBtn.addEventListener('click', () => {
            const codeBlock = previewContent.querySelector('code');
            if (codeBlock) {
                navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                    const originalText = copyPreviewBtn.textContent;
                    copyPreviewBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyPreviewBtn.textContent = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                    showToast('Failed to copy text', 'error');
                });
            }
        });
    }
}

function openPreview(fileId, fileName) {
    const ext = getFileExtension(fileName);
    const mimeType = getMimeType(ext);
    const url = `/preview/${fileId}`;

    previewTitle.textContent = fileName;
    downloadPreviewBtn.onclick = () => downloadFile(fileId, fileName);

    // Reset state
    previewContent.innerHTML = '<div class="loading">Loading preview...</div>';
    if (copyPreviewBtn) copyPreviewBtn.style.display = 'none';

    previewModal.showModal();

    if (imageExtensions.includes(ext)) {
        const img = new Image();
        img.onload = () => {
            previewContent.innerHTML = '';
            img.className = 'preview-media';
            img.alt = fileName;
            previewContent.appendChild(img);
        };
        img.onerror = () => {
            showPreviewError();
        };
        img.src = url;
    } else if (videoExtensions.includes(ext)) {
        previewContent.innerHTML = `
            <video controls class="preview-media" autoplay>
                <source src="${url}" type="${mimeType}">
                Your browser does not support the video tag.
            </video>`;
    } else if (audioExtensions.includes(ext)) {
        previewContent.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%;">
                <div class="file-icon" style="font-size: 4rem;">
                    ${getFileIcon(ext)}
                </div>
                <audio controls class="preview-media" style="width: 100%; max-width: 400px;" autoplay>
                    <source src="${url}" type="${mimeType}">
                    Your browser does not support the audio element.
                </audio>
            </div>`;
    } else if (ext === 'pdf') {
        previewContent.innerHTML = `<iframe src="${url}" class="preview-frame"></iframe>`;
    } else if (textExtensions.includes(ext) || codeExtensions.includes(ext)) {
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.text();
            })
            .then(text => {
                // Escape HTML to prevent XSS
                const escaped = text
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
                previewContent.innerHTML = `<pre class="preview-text"><code>${escaped}</code></pre>`;
                if (copyPreviewBtn) copyPreviewBtn.style.display = 'inline-flex';
            })
            .catch(err => {
                showPreviewError();
            });
    } else {
        previewContent.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary);">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem; opacity: 0.5;">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <p>Preview not available for this file type.</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem; color: var(--text-tertiary);">Download the file to view it.</p>
            </div>`;
    }
}

function showPreviewError() {
    previewContent.innerHTML = `
        <div class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>Failed to load preview.</p>
        </div>`;
}

// Helper arrays
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a'];
const textExtensions = ['txt', 'md', 'csv', 'json', 'xml', 'log', 'ini', 'conf'];
const codeExtensions = ['js', 'css', 'html', 'py', 'java', 'c', 'cpp', 'h', 'go', 'rs', 'ts', 'jsx', 'tsx', 'sql', 'sh', 'bat'];

function getMimeType(ext) {
    // Basic mapping, browser usually handles it but good for video/audio tags
    const map = {
        'mp4': 'video/mp4', 'webm': 'video/webm', 'ogg': 'video/ogg', 'mov': 'video/quicktime',
        'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'm4a': 'audio/mp4'
    };
    return map[ext] || '';
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

// ==================== HEARTBEAT & MEMBERS ====================
function startHeartbeat() {
    sendHeartbeat();
    heartbeatInterval = setInterval(sendHeartbeat, 5000);

    updateMemberCount();
    memberCountInterval = setInterval(updateMemberCount, 5000);
}

async function sendHeartbeat() {
    try {
        await fetch('/heartbeat/' + window.ROOM_CODE, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_id: member_id })
        });
    } catch (e) {
        // Fail silently
    }
}

async function updateMemberCount() {
    try {
        const res = await fetch('/members/' + window.ROOM_CODE);
        if (res.status === 404) {
            // Session likely ended
            window.location.href = '/join?error=session_ended';
            return;
        }
        const data = await res.json();
        if (memberCount) {
            memberCount.textContent = `${data.count} Active Member${data.count > 1 ? 's' : ''}`;
        }
    } catch (e) {
        // Fail silently
    }
}

// ==================== END SESSION ====================
function initEndSession() {
    if (endSessionBtn) {
        endSessionBtn.addEventListener('click', async () => {
            const confirmed = await showDeleteConfirmation("THIS ENTIRE SESSION");
            if (confirmed) {
                try {
                    const response = await fetch('/end-session/' + window.ROOM_CODE, {
                        method: 'POST'
                    });

                    if (response.ok) {
                        window.location.href = '/';
                    } else {
                        showToast('Failed to end session', 'error');
                    }
                } catch (error) {
                    console.error('Error ending session:', error);
                    showToast('Error ending session', 'error');
                }
            }
        });
    }
}

// Make functions available globally
window.downloadFile = downloadFile;
window.deleteFile = deleteFile;
window.openPreview = openPreview;

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
