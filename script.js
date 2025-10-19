// DOM Elements
const envelope = document.getElementById('envelope');
const envelopeContent = document.getElementById('envelope-content');
const rsvpForm = document.getElementById('rsvp-form');
const faqItems = document.querySelectorAll('.faq-item');

// Envelope Animation
function initEnvelopeAnimation() {
    envelope.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Add opening animation class
        envelope.classList.add('opened');
        
        // Hide click hint after animation
        setTimeout(() => {
            envelope.style.setProperty('--click-hint-display', 'none');
        }, 400);
        
        // Show content after envelope opens
        setTimeout(() => {
            envelopeContent.style.display = 'flex';
        }, 800);
    });
}

// Smooth Scrolling for Navigation Links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for any fixed header
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Firebase Configuration
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

// Firebase Database Functions
function saveRSVPResponse(data) {
    return new Promise((resolve, reject) => {
        if (!database) {
            reject(new Error('Firebase database not initialized'));
            return;
        }
        
        // Create response data
        const responseData = {
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            name: data.name,
            email: data.email,
            guests: parseInt(data.guests),
            attending: data.attending === 'yes',
            dietary: data.dietary || 'None specified',
            message: data.message || 'No additional message'
        };
        
        // Save to Firebase Realtime Database
        const newResponseRef = database.ref('rsvpResponses').push();
        newResponseRef.set(responseData)
            .then(() => {
                console.log('RSVP response saved to Firebase:', responseData);
                resolve(true);
            })
            .catch((error) => {
                console.error('Error saving RSVP response to Firebase:', error);
                reject(error);
            });
    });
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

// RSVP Form Handling with Firebase
function initRSVPForm() {
    rsvpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(rsvpForm);
        const data = Object.fromEntries(formData);
        
        // Basic validation
        if (!data.name || !data.email || !data.guests || !data.attending) {
            showNotification('Please fill in all required fields.', 'error');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showNotification('Please enter a valid email address.', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = rsvpForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;
        
        // Save response to Firebase
        saveRSVPResponse(data)
            .then(() => {
                console.log('RSVP saved successfully');
                showNotification('Thank you for your RSVP! We\'ll be in touch soon.', 'success');
                rsvpForm.reset();
            })
            .catch((error) => {
                console.error('Error saving RSVP:', error);
                showNotification('Sorry, there was an error saving your RSVP. Please try again.', 'error');
            })
            .finally(() => {
                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
    });
}

// FAQ Accordion
function initFAQAccordion() {
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
            } else {
                item.classList.add('active');
            }
        });
    });
}

// Notification System
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

// Parallax Effect for Hero Section
function initParallaxEffect() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroSection = document.querySelector('.hero-section');
        
        if (heroSection) {
            const rate = scrolled * -0.5;
            heroSection.style.transform = `translateY(${rate}px)`;
        }
    });
}

// Intersection Observer for Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe sections for animation
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
    
    // Observe gallery items
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(item);
    });
    
    // Observe info cards
    const infoCards = document.querySelectorAll('.info-card');
    infoCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

// Form Input Enhancements
function initFormEnhancements() {
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        // Add focus/blur effects
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Check if input has value on load
        if (input.value) {
            input.parentElement.classList.add('focused');
        }
    });
}

// Mobile Menu Toggle (if needed for future mobile navigation)
function initMobileMenu() {
    // This can be expanded if you add a mobile menu later
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Add mobile-specific functionality here
        console.log('Mobile view detected');
    }
}

// Loading Animation
function initLoadingAnimation() {
    // Add a subtle loading animation when the page loads
    document.body.style.opacity = '0';
    
    window.addEventListener('load', () => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    });
}

// Keyboard Navigation
function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // ESC key closes FAQ items
        if (e.key === 'Escape') {
            faqItems.forEach(item => {
                item.classList.remove('active');
            });
        }
        
        // Enter key on envelope opens envelope
        if (e.key === 'Enter' && document.activeElement === envelope) {
            envelope.click();
        }
    });
}

// Initialize all functionality
function init() {
    // Initialize Firebase first
    const firebaseInitialized = initFirebase();
    
    initEnvelopeAnimation();
    initSmoothScrolling();
    initRSVPForm();
    initFAQAccordion();
    initParallaxEffect();
    initScrollAnimations();
    initFormEnhancements();
    initMobileMenu();
    initLoadingAnimation();
    initKeyboardNavigation();
    
    // Add some interactive feedback
    if (firebaseInitialized) {
        console.log('🎉 Interactive Baptism Invitation with Firebase loaded successfully!');
    } else {
        console.log('🎉 Interactive Baptism Invitation loaded (Firebase not available)');
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Handle window resize
window.addEventListener('resize', () => {
    // Reinitialize mobile menu if needed
    initMobileMenu();
});

// Add some fun easter eggs
function addEasterEggs() {
    // Double-click on envelope for a surprise
    envelope.addEventListener('dblclick', () => {
        showNotification('💕 Love is in the air! 💕', 'success');
    });
    
    // Konami code easter egg
    let konamiCode = [];
    const konamiSequence = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyB', 'KeyA'
    ];
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.code);
        
        if (konamiCode.length > konamiSequence.length) {
            konamiCode.shift();
        }
        
        if (konamiCode.join(',') === konamiSequence.join(',')) {
            showNotification('🎊 You found the secret! Sarah & Michael love you! 🎊', 'success');
            konamiCode = [];
        }
    });
}

// Initialize easter eggs
addEasterEggs();

// Admin panel functionality removed - now using dedicated admin.html page
