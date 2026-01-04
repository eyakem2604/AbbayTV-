// ===== SUPABASE CONFIGURATION =====
const SUPABASE_URL = 'https://bbjlfleaksumwtimzdim.supabase.co';
const SUPABASE_KEY = 'sb_publishable_C9TxlMKsCRzYaOMZz_nsNg_9Dg3rD4y';

// Initialize Supabase
const supabase = window.supabase ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ===== HAMBURGER MENU FUNCTIONALITY =====
document.addEventListener('DOMContentLoaded', function() {
    // Setup hamburger menu
    const hamburger = document.querySelector('.hamburger-menu');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    const closeBtn = document.querySelector('.mobile-menu-close');
    
    // Open mobile menu
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            if (mobileMenu) {
                mobileMenu.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    // Close mobile menu
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (mobileMenu) {
                mobileMenu.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Close menu when clicking on links
    const mobileLinks = document.querySelectorAll('.mobile-nav-menu a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (mobileMenu) {
                mobileMenu.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Close menu when clicking outside
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function(e) {
            if (e.target === mobileMenu) {
                mobileMenu.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Close menu with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu && mobileMenu.style.display === 'flex') {
            mobileMenu.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // Close video modal with Escape
        const videoModal = document.getElementById('video-modal');
        if (e.key === 'Escape' && videoModal && videoModal.style.display === 'flex') {
            videoModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            const player = document.getElementById('video-player');
            if (player) player.src = '';
        }
    });
    
    // Set active navigation
    setActiveNavigation();
    
    // Load announcement
    loadAnnouncement();
    
    // Setup search
    setupSearch();
    
    // Setup modals
    setupModals();
});

// Set active navigation item
function setActiveNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Desktop navigation
    const navItems = document.querySelectorAll('.nav-item a');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        const parent = item.parentElement;
        
        if (href === currentPage) {
            parent.classList.add('active');
        } else {
            parent.classList.remove('active');
        }
    });
    
    // Mobile navigation
    const mobileItems = document.querySelectorAll('.mobile-nav-menu a');
    mobileItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Load announcement from Supabase
async function loadAnnouncement() {
    const element = document.getElementById('announcement-text');
    if (!element || !supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('announcement')
            .eq('id', 1)
            .single();
            
        if (error) throw error;
        
        if (data && data.announcement) {
            element.textContent = data.announcement;
        }
    } catch (error) {
        console.log('Using default announcement');
    }
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        // Simple search - hide/show cards based on search term
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.card-description')?.textContent.toLowerCase() || '';
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Setup modal functionality
function setupModals() {
    // Video modal
    const videoModal = document.getElementById('video-modal');
    if (videoModal) {
        videoModal.addEventListener('click', function(e) {
            if (e.target === videoModal || e.target.classList.contains('modal-close')) {
                videoModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                const player = document.getElementById('video-player');
                if (player) player.src = '';
            }
        });
    }
}

// Open video modal
function openVideoModal(title, youtubeUrl) {
    const modal = document.getElementById('video-modal');
    const titleElement = document.getElementById('video-title');
    const player = document.getElementById('video-player');
    
    if (!modal || !titleElement || !player) return;
    
    titleElement.textContent = title;
    
    // Extract YouTube ID from URL
    const youtubeId = extractYouTubeId(youtubeUrl);
    if (youtubeId) {
        player.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Extract YouTube ID from URL
function extractYouTubeId(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
}

// Load latest news for homepage
async function loadLatestNews(limit = 4) {
    const container = document.getElementById('latest-news');
    if (!container || !supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('news')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);
            
        if (error) throw error;
        
        if (data && data.length > 0) {
            container.innerHTML = data.map(item => createNewsCard(item)).join('');
            
            // Add click listeners for video modal
            container.querySelectorAll('.card').forEach(card => {
                const youtubeUrl = card.getAttribute('data-youtube');
                if (youtubeUrl) {
                    card.addEventListener('click', function() {
                        const title = this.querySelector('.card-title').textContent;
                        openVideoModal(title, youtubeUrl);
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error loading news:', error);
        container.innerHTML = '<p>Error loading news</p>';
    }
}

// Load featured programs for homepage
async function loadFeaturedPrograms(limit = 4) {
    const container = document.getElementById('featured-programs');
    if (!container || !supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('programs')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);
            
        if (error) throw error;
        
        if (data && data.length > 0) {
            container.innerHTML = data.map(item => createProgramCard(item)).join('');
            
            // Add click listeners for video modal
            container.querySelectorAll('.card').forEach(card => {
                const youtubeUrl = card.getAttribute('data-youtube');
                if (youtubeUrl) {
                    card.addEventListener('click', function() {
                        const title = this.querySelector('.card-title').textContent;
                        openVideoModal(title, youtubeUrl);
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error loading programs:', error);
        container.innerHTML = '<p>Error loading programs</p>';
    }
}

// Load job highlights for homepage
async function loadJobHighlights(limit = 3) {
    const container = document.getElementById('job-highlights');
    if (!container || !supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);
            
        if (error) throw error;
        
        if (data && data.length > 0) {
            container.innerHTML = data.map(item => createJobCard(item)).join('');
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        container.innerHTML = '<p>Error loading jobs</p>';
    }
}

// Card creation functions
function createNewsCard(item) {
    const youtubeId = extractYouTubeId(item.youtube_url);
    const thumbnail = youtubeId ? 
        `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : 
        'https://via.placeholder.com/300x200?text=News';
    
    return `
        <div class="card" data-youtube="${item.youtube_url || ''}">
            <div class="card-image">
                <img src="${thumbnail}" alt="${item.title}" loading="lazy">
                ${youtubeId ? '<div class="play-button"><i class="fas fa-play"></i></div>' : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <p class="card-description">${item.description ? item.description.substring(0, 100) + '...' : 'No description available'}</p>
                <div class="card-meta">
                    <span>${item.category}</span>
                    <span>${new Date(item.date).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `;
}

function createProgramCard(item) {
    const youtubeId = extractYouTubeId(item.youtube_url);
    const thumbnail = youtubeId ? 
        `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : 
        'https://via.placeholder.com/300x200?text=Program';
    
    return `
        <div class="card" data-youtube="${item.youtube_url || ''}">
            <div class="card-image">
                <img src="${thumbnail}" alt="${item.title}" loading="lazy">
                ${youtubeId ? '<div class="play-button"><i class="fas fa-play"></i></div>' : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <p class="card-description">${item.description ? item.description.substring(0, 100) + '...' : 'No description available'}</p>
                <div class="card-meta">
                    <span>${item.category}</span>
                    <span>${new Date(item.date).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `;
}

function createJobCard(item) {
    return `
        <div class="card">
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <p class="card-description">${item.company} • ${item.location || 'Remote'}</p>
                <p class="card-description">${item.description ? item.description.substring(0, 100) + '...' : 'No description available'}</p>
                <div class="card-meta">
                    <span>${item.type}</span>
                    <span>${item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline'}</span>
                </div>
            </div>
        </div>
    `;
}

// Page-specific loading functions
async function loadNews() {
    const container = document.getElementById('news-grid');
    if (!container || !supabase) return;
    
    container.innerHTML = '<div class="loading-spinner"></div>';
    
    // Get filter values
    const category = document.getElementById('category-filter')?.value || '';
    const section = document.getElementById('section-filter')?.value || '';
    const sort = document.getElementById('sort-filter')?.value || 'date_desc';
    
    try {
        let query = supabase
            .from('news')
            .select('*');
            
        if (category) query = query.eq('category', category);
        if (section) query = query.eq('section', section);
        
        if (sort === 'date_asc') {
            query = query.order('date', { ascending: true });
        } else {
            query = query.order('date', { ascending: false });
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            container.innerHTML = data.map(item => createNewsCard(item)).join('');
            
            // Add click listeners
            container.querySelectorAll('.card').forEach(card => {
                const youtubeUrl = card.getAttribute('data-youtube');
                if (youtubeUrl) {
                    card.addEventListener('click', function() {
                        const title = this.querySelector('.card-title').textContent;
                        openVideoModal(title, youtubeUrl);
                    });
                }
            });
        } else {
            container.innerHTML = '<p>No news articles found</p>';
        }
    } catch (error) {
        console.error('Error loading news:', error);
        container.innerHTML = '<p>Error loading news</p>';
    }
}

// Similar functions for programs, live streams, and jobs
async function loadPrograms() {
    const container = document.getElementById('programs-grid');
    if (!container || !supabase) return;
    
    container.innerHTML = '<div class="loading-spinner"></div>';
    
    // Implementation similar to loadNews()
}

async function loadLiveStreams() {
    const container = document.getElementById('streams-grid');
    if (!container || !supabase) return;
    
    container.innerHTML = '<div class="loading-spinner"></div>';
    
    // Implementation similar to loadNews()
}

async function loadJobs() {
    const container = document.getElementById('jobs-grid');
    if (!container || !supabase) return;
    
    container.innerHTML = '<div class="loading-spinner"></div>';
    
    // Implementation similar to loadNews()
}

// Load more functions
function loadMoreNews() {
    // Implementation for pagination
    console.log('Load more news');
}

function loadMorePrograms() {
    console.log('Load more programs');
}

function loadMoreLiveStreams() {
    console.log('Load more live streams');
}

function loadMoreJobs() {
    console.log('Load more jobs');
}

// ===== CONTACT FORM SUBMISSION =====
// Note: Contact form submission is handled inline in contact.html
// This keeps the implementation simple and working

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--dark-gray);
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 9999;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                border-left: 4px solid var(--primary-gold);
            }
            .notification.success {
                border-left-color: var(--success);
            }
            .notification.error {
                border-left-color: var(--danger);
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}