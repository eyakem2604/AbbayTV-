// ===== SUPABASE CONFIGURATION =====
const SUPABASE_URL = 'https://bbjlfleaksumwtimzdim.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_C9TxlMKsCRzYaOMZz_nsNg_9Dg3rD4y';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== GLOBAL VARIABLES =====
let isMobileMenuOpen = false;

// ===== HAMBURGER MENU FUNCTIONALITY =====
function setupHamburgerMenu() {
    console.log('Setting up hamburger menu...');
    
    // Get elements
    const hamburgerBtn = document.querySelector('.hamburger-menu');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    const closeBtn = document.querySelector('.mobile-menu-close');
    const mobileLinks = document.querySelectorAll('.mobile-nav-menu a');
    
    console.log('Elements found:', {
        hamburgerBtn: !!hamburgerBtn,
        mobileMenu: !!mobileMenu,
        closeBtn: !!closeBtn,
        mobileLinks: mobileLinks.length
    });
    
    // Open mobile menu
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function(e) {
            console.log('Hamburger clicked');
            e.stopPropagation();
            openMobileMenu();
        });
    } else {
        console.error('Hamburger button not found!');
        // Create it if it doesn't exist
        createHamburgerButton();
    }
    
    // Close mobile menu
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            console.log('Close button clicked');
            e.stopPropagation();
            closeMobileMenu();
        });
    }
    
    // Close when clicking on links
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            console.log('Mobile link clicked');
            closeMobileMenu();
        });
    });
    
    // Close when clicking outside
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function(e) {
            if (e.target === mobileMenu) {
                console.log('Clicked outside menu');
                closeMobileMenu();
            }
        });
    }
    
    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMobileMenuOpen) {
            console.log('Escape key pressed');
            closeMobileMenu();
        }
    });
}

function createHamburgerButton() {
    console.log('Creating hamburger button...');
    
    // Find top-bar-left
    const topBarLeft = document.querySelector('.top-bar-left');
    if (!topBarLeft) {
        console.error('Top bar left not found');
        return;
    }
    
    // Create hamburger button
    const hamburgerBtn = document.createElement('div');
    hamburgerBtn.className = 'hamburger-menu';
    hamburgerBtn.innerHTML = `
        <div class="hamburger-line"></div>
        <div class="hamburger-line"></div>
        <div class="hamburger-line"></div>
    `;
    
    // Insert at beginning
    topBarLeft.insertBefore(hamburgerBtn, topBarLeft.firstChild);
    
    // Add event listener
    hamburgerBtn.addEventListener('click', function(e) {
        console.log('Dynamic hamburger clicked');
        e.stopPropagation();
        openMobileMenu();
    });
    
    console.log('Hamburger button created');
}

function openMobileMenu() {
    console.log('Opening mobile menu...');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    if (!mobileMenu) {
        console.error('Mobile menu not found');
        return;
    }
    
    mobileMenu.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    isMobileMenuOpen = true;
    
    // Add animation class
    setTimeout(() => {
        mobileMenu.style.opacity = '1';
        mobileMenu.style.transform = 'translateX(0)';
    }, 10);
    
    console.log('Mobile menu opened');
}

function closeMobileMenu() {
    console.log('Closing mobile menu...');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    if (!mobileMenu) {
        console.error('Mobile menu not found');
        return;
    }
    
    // Add closing animation
    mobileMenu.style.opacity = '0';
    mobileMenu.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
        mobileMenu.style.display = 'none';
        document.body.style.overflow = 'auto';
        isMobileMenuOpen = false;
    }, 300);
    
    console.log('Mobile menu closed');
}

// ===== NAVIGATION ACTIVE STATE =====
function setActiveNavigation() {
    console.log('Setting active navigation...');
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('Current page:', currentPage);
    
    // Update desktop navigation
    const navItems = document.querySelectorAll('.nav-item a');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        const parent = item.parentElement;
        
        if (href === currentPage) {
            parent.classList.add('active');
            console.log('Active item found:', href);
        } else {
            parent.classList.remove('active');
        }
    });
    
    // Update mobile navigation
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

function formatDate(dateString) {
    if (!dateString) return 'No date';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return 'Invalid date';
    }
}

function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
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
                background-color: #10b981;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                z-index: 9999;
                box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
                animation: slideInRight 0.3s ease-out;
                max-width: 400px;
            }
            .notification-error {
                background-color: #ef4444;
            }
            .notification-warning {
                background-color: #f59e0b;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0.25rem;
                font-size: 1rem;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    });
}

// ===== SEARCH FUNCTIONALITY =====
function setupSearch() {
    console.log('Setting up search...');
    
    const searchInput = document.getElementById('global-search');
    if (!searchInput) {
        console.log('Search input not found on this page');
        return;
    }
    
    searchInput.addEventListener('input', debounce(async function(e) {
        const searchTerm = e.target.value.trim();
        console.log('Searching for:', searchTerm);
        
        if (searchTerm.length < 2) {
            clearSearchResults();
            return;
        }
        
        await performSearch(searchTerm);
    }, 500));
    
    // Clear search when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            clearSearchResults();
        }
    });
}

async function performSearch(searchTerm) {
    try {
        console.log('Performing search for:', searchTerm);
        
        // Search across all tables
        const [newsResults, programsResults, jobsResults] = await Promise.all([
            supabaseClient
                .from('news')
                .select('*')
                .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
                .limit(5),
            supabaseClient
                .from('programs')
                .select('*')
                .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
                .limit(5),
            supabaseClient
                .from('jobs')
                .select('*')
                .or(`title.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
                .limit(5)
        ]);
        
        console.log('Search results:', {
            news: newsResults.data?.length || 0,
            programs: programsResults.data?.length || 0,
            jobs: jobsResults.data?.length || 0
        });
        
        displaySearchResults({
            news: newsResults.data || [],
            programs: programsResults.data || [],
            jobs: jobsResults.data || []
        });
        
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Error performing search', 'error');
    }
}

function displaySearchResults(results) {
    // Remove existing dropdown
    clearSearchResults();
    
    const totalResults = results.news.length + results.programs.length + results.jobs.length;
    if (totalResults === 0) {
        return;
    }
    
    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'search-results-dropdown';
    
    let html = '';
    
    // Add news results
    if (results.news.length > 0) {
        html += `
            <div class="search-result-section">
                <h4><i class="fas fa-newspaper"></i> News</h4>
                ${results.news.map(item => `
                    <div class="search-result-item" data-type="news" data-id="${item.id}">
                        <div class="search-result-title">${item.title}</div>
                        <div class="search-result-meta">${item.category} • ${formatDate(item.date)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Add programs results
    if (results.programs.length > 0) {
        html += `
            <div class="search-result-section">
                <h4><i class="fas fa-film"></i> Programs</h4>
                ${results.programs.map(item => `
                    <div class="search-result-item" data-type="program" data-id="${item.id}">
                        <div class="search-result-title">${item.title}</div>
                        <div class="search-result-meta">${item.category} • ${formatDate(item.date)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Add jobs results
    if (results.jobs.length > 0) {
        html += `
            <div class="search-result-section">
                <h4><i class="fas fa-briefcase"></i> Jobs</h4>
                ${results.jobs.map(item => `
                    <div class="search-result-item" data-type="job" data-id="${item.id}">
                        <div class="search-result-title">${item.title} at ${item.company}</div>
                        <div class="search-result-meta">${item.location || 'Remote'} • ${item.type}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    dropdown.innerHTML = html;
    
    // Add styles
    if (!document.querySelector('#search-dropdown-styles')) {
        const style = document.createElement('style');
        style.id = 'search-dropdown-styles';
        style.textContent = `
            .search-results-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background-color: #1a1a1a;
                border-radius: 0.5rem;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                margin-top: 0.5rem;
                max-height: 400px;
                overflow-y: auto;
                z-index: 1000;
                border: 1px solid rgba(212, 175, 55, 0.3);
            }
            .search-result-section {
                padding: 1rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .search-result-section:last-child {
                border-bottom: none;
            }
            .search-result-section h4 {
                color: #d4af37;
                margin-bottom: 0.75rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;
            }
            .search-result-item {
                padding: 0.75rem;
                border-radius: 0.25rem;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .search-result-item:hover {
                background-color: rgba(212, 175, 55, 0.1);
            }
            .search-result-title {
                font-weight: 500;
                color: white;
                margin-bottom: 0.25rem;
                font-size: 0.9rem;
            }
            .search-result-meta {
                font-size: 0.8rem;
                color: #999;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to DOM
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        searchContainer.appendChild(dropdown);
    }
    
    // Add click handlers
    dropdown.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', function() {
            const type = this.dataset.type;
            const id = this.dataset.id;
            
            let url = '';
            switch (type) {
                case 'news':
                    url = `news.html#item-${id}`;
                    break;
                case 'program':
                    url = `programs.html#item-${id}`;
                    break;
                case 'job':
                    url = `jobs.html#item-${id}`;
                    break;
            }
            
            if (url) {
                window.location.href = url;
            }
        });
    });
}

function clearSearchResults() {
    const dropdown = document.querySelector('.search-results-dropdown');
    if (dropdown) {
        dropdown.remove();
    }
}

// ===== MODAL FUNCTIONALITY =====
function setupModals() {
    console.log('Setting up modals...');
    
    // Video modal
    const videoModal = document.getElementById('video-modal');
    if (videoModal) {
        videoModal.addEventListener('click', function(e) {
            if (e.target === videoModal || e.target.closest('.modal-close')) {
                closeVideoModal();
            }
        });
        
        // Close with Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && videoModal.style.display === 'flex') {
                closeVideoModal();
            }
        });
    }
    
    // Job modal
    const jobModal = document.getElementById('job-modal');
    if (jobModal) {
        jobModal.addEventListener('click', function(e) {
            if (e.target === jobModal || e.target.closest('.modal-close')) {
                closeJobModal();
            }
        });
        
        // Close with Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && jobModal.style.display === 'flex') {
                closeJobModal();
            }
        });
    }
}

function openVideoModal(title, youtubeUrl) {
    console.log('Opening video modal:', title);
    
    const modal = document.getElementById('video-modal');
    const titleElement = document.getElementById('video-title');
    const player = document.getElementById('video-player');
    
    if (!modal || !titleElement || !player) {
        console.error('Video modal elements not found');
        return;
    }
    
    titleElement.textContent = title;
    
    // Extract YouTube ID
    const youtubeId = extractYouTubeId(youtubeUrl);
    if (youtubeId) {
        player.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    const player = document.getElementById('video-player');
    
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    if (player) {
        player.src = '';
    }
}

function openJobModal(jobId) {
    console.log('Opening job modal for ID:', jobId);
    // Implementation for job modal
}

function closeJobModal() {
    const modal = document.getElementById('job-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function extractYouTubeId(url) {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
}

// ===== CONTACT FORM =====
function setupContactForm() {
    console.log('Setting up contact form...');
    
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await submitContactForm();
    });
}

async function submitContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    
    // Simple validation
    if (!name || !email || !message) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
        showNotification('Please enter a valid email', 'error');
        return;
    }
    
    try {
        // Insert into Supabase
        const { data, error } = await supabaseClient
            .from('messages')
            .insert([{
                name: name,
                email: email,
                message: message
            }]);
        
        if (error) throw error;
        
        // Show success message
        showNotification('Message sent successfully!');
        
        // Reset form
        form.reset();
        
        // Show thank you message
        const successMessage = document.getElementById('success-message');
        const sendAnotherBtn = document.getElementById('send-another');
        
        if (successMessage && sendAnotherBtn) {
            form.style.display = 'none';
            successMessage.style.display = 'block';
            
            sendAnotherBtn.addEventListener('click', function() {
                successMessage.style.display = 'none';
                form.style.display = 'flex';
            });
        }
        
    } catch (error) {
        console.error('Error submitting contact form:', error);
        showNotification('Error sending message. Please try again.', 'error');
    }
}

// ===== ANNOUNCEMENT SYSTEM =====
async function loadAnnouncement() {
    console.log('Loading announcement...');
    
    const announcementElement = document.getElementById('announcement-text');
    if (!announcementElement) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('site_settings')
            .select('announcement')
            .eq('id', 1)
            .single();
        
        if (error) {
            console.log('No announcement found, using default');
            announcementElement.textContent = 'Welcome to Abbay TV Ethiopia';
            return;
        }
        
        if (data && data.announcement) {
            announcementElement.textContent = data.announcement;
        } else {
            announcementElement.textContent = 'Welcome to Abbay TV Ethiopia';
        }
        
    } catch (error) {
        console.error('Error loading announcement:', error);
        announcementElement.textContent = 'Welcome to Abbay TV Ethiopia';
    }
}

// ===== HOME PAGE FUNCTIONS =====
async function loadLatestNews(limit = 4) {
    console.log('Loading latest news...');
    
    const container = document.getElementById('latest-news');
    if (!container) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('news')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="no-content">No news available</p>';
            return;
        }
        
        container.innerHTML = data.map(item => createNewsCard(item)).join('');
        
        // Add click handlers for video modal
        container.querySelectorAll('.card').forEach(card => {
            const youtubeUrl = card.dataset.youtubeUrl;
            if (youtubeUrl) {
                card.addEventListener('click', () => {
                    openVideoModal(card.dataset.title, youtubeUrl);
                });
            }
        });
        
    } catch (error) {
        console.error('Error loading news:', error);
        container.innerHTML = '<p class="error">Error loading news</p>';
    }
}

async function loadFeaturedPrograms(limit = 4) {
    console.log('Loading featured programs...');
    
    const container = document.getElementById('featured-programs');
    if (!container) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('programs')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="no-content">No programs available</p>';
            return;
        }
        
        container.innerHTML = data.map(item => createProgramCard(item)).join('');
        
        // Add click handlers for video modal
        container.querySelectorAll('.card').forEach(card => {
            const youtubeUrl = card.dataset.youtubeUrl;
            if (youtubeUrl) {
                card.addEventListener('click', () => {
                    openVideoModal(card.dataset.title, youtubeUrl);
                });
            }
        });
        
    } catch (error) {
        console.error('Error loading programs:', error);
        container.innerHTML = '<p class="error">Error loading programs</p>';
    }
}

async function loadJobHighlights(limit = 3) {
    console.log('Loading job highlights...');
    
    const container = document.getElementById('job-highlights');
    if (!container) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('jobs')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="no-content">No job opportunities available</p>';
            return;
        }
        
        container.innerHTML = data.map(item => createJobCard(item)).join('');
        
        // Add click handlers for job modal
        container.querySelectorAll('.card').forEach(card => {
            const jobId = card.dataset.jobId;
            card.addEventListener('click', () => {
                openJobModal(jobId);
            });
        });
        
    } catch (error) {
        console.error('Error loading jobs:', error);
        container.innerHTML = '<p class="error">Error loading jobs</p>';
    }
}

// ===== CARD CREATION FUNCTIONS =====
function createNewsCard(item) {
    const youtubeId = extractYouTubeId(item.youtube_url);
    const thumbnail = youtubeId ? 
        `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : 
        'https://via.placeholder.com/300x200?text=News';
    
    return `
        <div class="card" data-youtube-url="${item.youtube_url || ''}" data-title="${item.title}">
            <div class="card-image">
                <img src="${thumbnail}" alt="${item.title}" loading="lazy">
                ${youtubeId ? '<div class="play-button"><i class="fas fa-play"></i></div>' : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <p class="card-description">${item.description ? item.description.substring(0, 100) + '...' : 'No description available'}</p>
                <div class="card-meta">
                    <span class="card-category">${item.category}</span>
                    <span>${formatDate(item.date)}</span>
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
        <div class="card" data-youtube-url="${item.youtube_url || ''}" data-title="${item.title}">
            <div class="card-image">
                <img src="${thumbnail}" alt="${item.title}" loading="lazy">
                ${youtubeId ? '<div class="play-button"><i class="fas fa-play"></i></div>' : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <p class="card-description">${item.description ? item.description.substring(0, 100) + '...' : 'No description available'}</p>
                <div class="card-meta">
                    <span class="card-category">${item.category}</span>
                    <span>${formatDate(item.date)}</span>
                </div>
            </div>
        </div>
    `;
}

function createJobCard(item) {
    return `
        <div class="card job-card" data-job-id="${item.id}">
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <div class="job-company">${item.company}</div>
                <p class="card-description">${item.description ? item.description.substring(0, 100) + '...' : 'No description available'}</p>
                <div class="card-meta">
                    <div class="job-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${item.location || 'Remote'}</span>
                    </div>
                    <span class="card-category">${item.type}</span>
                    <span>${item.deadline ? formatDate(item.deadline) : 'No deadline'}</span>
                </div>
            </div>
        </div>
    `;
}

// ===== ADMIN DASHBOARD =====
function setupAdminDashboard() {
    console.log('Setting up admin dashboard...');
    
    // Check if we're on admin page
    if (!window.location.pathname.includes('admin.html')) {
        return;
    }
    
    // Check admin session
    const isAdmin = localStorage.getItem('abbaytv_admin') === 'true';
    
    if (isAdmin) {
        // User is logged in
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        
        // Setup admin navigation
        setupAdminNavigation();
        
        // Load initial data
        loadAdminData();
    } else {
        // Show login screen
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
        
        // Setup login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleAdminLogin();
            });
        }
    }
}

function handleAdminLogin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorElement = document.getElementById('login-error');
    
    // Default admin credentials
    if (email === 'eyakemabi@gmail.com' && password === '@Eyu26042604') {
        // Set admin session
        localStorage.setItem('abbaytv_admin', 'true');
        localStorage.setItem('abbaytv_admin_email', email);
        
        // Reload admin interface
        setupAdminDashboard();
        
        showNotification('Admin login successful!', 'success');
    } else {
        // Show error
        if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.textContent = 'Invalid email or password';
        }
        showNotification('Invalid credentials', 'error');
    }
}

function setupAdminNavigation() {
    console.log('Setting up admin navigation...');
    
    // Tab switching
    const navItems = document.querySelectorAll('.admin-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all
            navItems.forEach(i => i.classList.remove('active'));
            
            // Add active to clicked
            this.classList.add('active');
            
            // Show corresponding tab
            const tabId = this.dataset.tab;
            showAdminTab(tabId);
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('abbaytv_admin');
            localStorage.removeItem('abbaytv_admin_email');
            setupAdminDashboard();
            showNotification('Logged out successfully');
        });
    }
}

function showAdminTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabId}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
}

async function loadAdminData() {
    console.log('Loading admin data...');
    // Implementation for loading admin data
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Abbay TV...');
    
    // Setup hamburger menu (CRITICAL FIX)
    setupHamburgerMenu();
    
    // Set active navigation
    setActiveNavigation();
    
    // Setup search
    setupSearch();
    
    // Setup modals
    setupModals();
    
    // Load announcement
    loadAnnouncement();
    
    // Check if we need to load homepage data
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname === '/') {
        console.log('On homepage, loading data...');
        loadLatestNews();
        loadFeaturedPrograms();
        loadJobHighlights();
    }
    
    // Check if we need to setup contact form
    if (window.location.pathname.includes('contact.html')) {
        setupContactForm();
    }
    
    // Check if we need to setup admin dashboard
    if (window.location.pathname.includes('admin.html')) {
        setupAdminDashboard();
    }
    
    // Add logo animation
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.animation = 'logoFloat 3s ease-in-out infinite';
    }
    
    console.log('Abbay TV initialization complete!');
});

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('An error occurred. Please refresh the page.', 'error');
});

// Add CSS for mobile menu animation if not present
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .mobile-menu-overlay {
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
    `;
    document.head.appendChild(style);
});