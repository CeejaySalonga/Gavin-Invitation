// Firebase Configuration (same as main site)
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDBXN0mGFyl1_tLVpuV8xuMIZZTO-uW-sg",
    authDomain: "rsvp-responses-215ff.firebaseapp.com",
    databaseURL: "https://rsvp-responses-215ff-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rsvp-responses-215ff",
    storageBucket: "rsvp-responses-215ff.firebasestorage.app",
    messagingSenderId: "200884806247",
    appId: "1:200884806247:web:3b748e67e01fceb8de6ac2"
};

// Initialize Firebase
let database;
function initFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(FIREBASE_CONFIG);
            database = firebase.database();
            console.log('Firebase initialized successfully');
            return true;
        } else {
            console.error('Firebase not loaded - check if CDN scripts are included');
            return false;
        }
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        return false;
    }
}

// Get all RSVP responses from Firebase
function getAllRSVPResponses() {
    return new Promise((resolve, reject) => {
        if (!database) {
            reject(new Error('Firebase database not initialized'));
            return;
        }
        
        database.ref('rsvpResponses').once('value')
            .then((snapshot) => {
                const responses = [];
                snapshot.forEach((childSnapshot) => {
                    const response = childSnapshot.val();
                    response.id = childSnapshot.key;
                    responses.push(response);
                });
                resolve(responses);
            })
            .catch((error) => {
                console.error('Error retrieving RSVP responses from Firebase:', error);
                reject(error);
            });
    });
}

// Listen for real-time updates to RSVP responses
function listenForRSVPUpdates(callback) {
    if (!database) {
        console.error('Firebase database not initialized');
        return;
    }
    
    database.ref('rsvpResponses').on('value', (snapshot) => {
        const responses = [];
        snapshot.forEach((childSnapshot) => {
            const response = childSnapshot.val();
            response.id = childSnapshot.key;
            responses.push(response);
        });
        callback(responses);
    });
}

// Update statistics display
function updateStatistics(responses) {
    const totalResponses = responses.length;
    const attendingCount = responses.filter(r => r.attending).length;
    const notAttendingCount = totalResponses - attendingCount;
    const totalGuests = responses.reduce((sum, r) => sum + (r.attending ? r.guests : 0), 0);
    
    document.getElementById('total-responses').textContent = totalResponses;
    document.getElementById('attending-count').textContent = attendingCount;
    document.getElementById('not-attending-count').textContent = notAttendingCount;
    document.getElementById('total-guests').textContent = totalGuests;
}

// Pagination variables
let currentPage = 1;
const itemsPerPage = 5; // Reduced to 5 for testing - you can change back to 10
let allResponses = [];

// Display responses in table format with pagination
function displayResponses(responses) {
    allResponses = responses;
    currentPage = 1;
    renderTable();
}

// Render the table with current page data
function renderTable() {
    const tbody = document.getElementById('responses-tbody');
    const paginationContainer = document.getElementById('pagination-container');
    
    console.log('Rendering table with', allResponses.length, 'responses, current page:', currentPage);
    
    if (allResponses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No responses yet.</td></tr>';
        paginationContainer.innerHTML = '';
        return;
    }
    
    // Sort responses by timestamp (newest first)
    allResponses.sort((a, b) => b.timestamp - a.timestamp);
    
    // Calculate pagination
    const totalPages = Math.ceil(allResponses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageResponses = allResponses.slice(startIndex, endIndex);
    
    console.log('Pagination: totalPages =', totalPages, 'startIndex =', startIndex, 'endIndex =', endIndex);
    
    // Render table rows
    tbody.innerHTML = pageResponses.map(response => `
        <tr>
            <td><strong>${response.name}</strong></td>
            <td>${response.email}</td>
            <td class="${response.attending ? 'status-attending' : 'status-not-attending'}">
                ${response.attending ? '✓ Attending' : '✗ Not Attending'}
            </td>
            <td>${response.attending ? response.guests : '-'}</td>
            <td>${response.dietary !== 'None specified' ? response.dietary : '-'}</td>
            <td>${response.message !== 'No additional message' ? response.message : '-'}</td>
            <td>${new Date(response.timestamp).toLocaleDateString()}</td>
        </tr>
    `).join('');
    
    // Render pagination
    renderPagination(totalPages);
}

// Render pagination controls
function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination-container');
    
    console.log('Rendering pagination for', totalPages, 'pages, current page:', currentPage);
    
    if (totalPages <= 1) {
        // Show page info even for single page
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, allResponses.length);
        paginationContainer.innerHTML = `
            <span class="pagination-info">
                Showing ${startItem}-${endItem} of ${allResponses.length} responses
            </span>
        `;
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            ← Previous
        </button>
    `;
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-info">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-info">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    paginationHTML += `
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            Next →
        </button>
    `;
    
    // Page info
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, allResponses.length);
    paginationHTML += `
        <span class="pagination-info">
            Showing ${startItem}-${endItem} of ${allResponses.length} responses
        </span>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
    console.log('Pagination HTML generated:', paginationHTML);
}

// Change page function (global scope for onclick)
window.changePage = function(page) {
    const totalPages = Math.ceil(allResponses.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderTable();
    }
}

// Load and display all data
function loadAdminData() {
    const tbody = document.getElementById('responses-tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading responses...</td></tr>';
    
    getAllRSVPResponses()
        .then(responses => {
            updateStatistics(responses);
            displayResponses(responses);
        })
        .catch(error => {
            console.error('Error loading admin data:', error);
            tbody.innerHTML = '<tr><td colspan="7" class="error">Error loading data. Please check your Firebase connection.</td></tr>';
        });
}

// Export to CSV
function exportToCSV() {
    getAllRSVPResponses()
        .then(responses => {
            if (responses.length === 0) {
                showNotification('No data to export.', 'error');
                return;
            }
            
            // Create CSV content
            const headers = ['Name', 'Email', 'Attending', 'Guests', 'Dietary Restrictions', 'Message', 'Timestamp'];
            const csvContent = [
                headers.join(','),
                ...responses.map(r => [
                    `"${r.name}"`,
                    `"${r.email}"`,
                    r.attending ? 'Yes' : 'No',
                    r.guests,
                    `"${r.dietary}"`,
                    `"${r.message}"`,
                    `"${new Date(r.timestamp).toLocaleString()}"`
                ].join(','))
            ].join('\n');
            
            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `rsvp_responses_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('CSV file downloaded successfully!', 'success');
        })
        .catch(error => {
            console.error('Error exporting CSV:', error);
            showNotification('Error exporting data. Please try again.', 'error');
        });
}

// Export to JSON
function exportToJSON() {
    getAllRSVPResponses()
        .then(responses => {
            if (responses.length === 0) {
                showNotification('No data to export.', 'error');
                return;
            }
            
            // Download JSON
            const jsonContent = JSON.stringify(responses, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `rsvp_responses_${new Date().toISOString().split('T')[0]}.json`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('JSON file downloaded successfully!', 'success');
        })
        .catch(error => {
            console.error('Error exporting JSON:', error);
            showNotification('Error exporting data. Please try again.', 'error');
        });
}

// Clear data functionality removed for safety

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
    `;
    
    notification.querySelector('.notification-close').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 5000);
}

// Initialize admin panel
function initAdminPanel() {
    // Initialize Firebase
    const firebaseInitialized = initFirebase();
    
    if (!firebaseInitialized) {
        document.getElementById('responses-list').innerHTML = '<div class="error">Firebase not available. Please check your configuration.</div>';
        return;
    }
    
    // Load initial data
    loadAdminData();
    
    // Set up real-time updates
    listenForRSVPUpdates((responses) => {
        updateStatistics(responses);
        displayResponses(responses);
    });
    
    // Add event listeners
    document.getElementById('export-csv').addEventListener('click', exportToCSV);
    document.getElementById('export-json').addEventListener('click', exportToJSON);
    
    console.log('Admin panel initialized successfully');
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
} else {
    initAdminPanel();
}
