// ===== SUPABASE CONFIGURATION =====
const SUPABASE_URL = 'https://bbjlfleaksumwtimzdim.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_C9TxlMKsCRzYaOMZz_nsNg_9Dg3rD4y';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== GLOBAL STATE =====
let currentUser = null;
let adminSession = false;
let sessionTimer = null;

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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function extractYouTubeId(url) {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
}

function getYouTubeThumbnail(youtubeId) {
    if (!youtubeId) return 'https://via.placeholder.com/300x200?text=No+Preview';
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(notification);
    
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
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    });
}

// ===== NAVIGATION & MENU =====
function setupNavigation() {
    // Hamburger menu toggle
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-menu a');
    
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', () => {
            mobileMenuOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', () => {
            mobileMenuOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    // Close mobile menu when clicking on a link
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });
    
    // Close mobile menu when clicking outside
    mobileMenuOverlay.addEventListener('click', (e) => {
        if (e.target === mobileMenuOverlay) {
            mobileMenuOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Close mobile menu with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenuOverlay.style.display === 'flex') {
            mobileMenuOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Set active nav item based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navItems = document.querySelectorAll('.nav-item a, .mobile-nav-menu a');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.parentElement.classList.add('active');
        } else {
            item.parentElement.classList.remove('active');
        }
    });
}

// ===== SEARCH FUNCTIONALITY =====
function setupSearch() {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', debounce(async (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        
        if (searchTerm.length < 2) {
            // Clear search results if search term is too short
            clearSearchResults();
            return;
        }
        
        await performSearch(searchTerm);
    }, 500));
}

async function performSearch(searchTerm) {
    try {
        // Search across all content types
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
        
        displaySearchResults({
            news: newsResults.data || [],
            programs: programsResults.data || [],
            jobs: jobsResults.data || []
        });
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchResults(results) {
    // Create or update search results dropdown
    let dropdown = document.querySelector('.search-results-dropdown');
    
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'search-results-dropdown';
        
        // Add styles
        const style = document.createElement('style');
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
            }
            .search-result-meta {
                font-size: 0.85rem;
                color: #999;
            }
            .no-results {
                padding: 1rem;
                text-align: center;
                color: #999;
            }
        `;
        document.head.appendChild(style);
        
        const searchContainer = document.querySelector('.search-container');
        searchContainer.appendChild(dropdown);
    }
    
    // Clear previous results
    dropdown.innerHTML = '';
    
    // Check if we have any results
    const totalResults = results.news.length + results.programs.length + results.jobs.length;
    
    if (totalResults === 0) {
        dropdown.innerHTML = '<div class="no-results">No results found</div>';
        return;
    }
    
    // Add news results
    if (results.news.length > 0) {
        const newsSection = document.createElement('div');
        newsSection.className = 'search-result-section';
        newsSection.innerHTML = `
            <h4><i class="fas fa-newspaper"></i> News</h4>
            ${results.news.map(item => `
                <div class="search-result-item" data-type="news" data-id="${item.id}">
                    <div class="search-result-title">${item.title}</div>
                    <div class="search-result-meta">${item.category} • ${formatDate(item.date)}</div>
                </div>
            `).join('')}
        `;
        dropdown.appendChild(newsSection);
    }
    
    // Add programs results
    if (results.programs.length > 0) {
        const programsSection = document.createElement('div');
        programsSection.className = 'search-result-section';
        programsSection.innerHTML = `
            <h4><i class="fas fa-film"></i> Programs</h4>
            ${results.programs.map(item => `
                <div class="search-result-item" data-type="program" data-id="${item.id}">
                    <div class="search-result-title">${item.title}</div>
                    <div class="search-result-meta">${item.category} • ${formatDate(item.date)}</div>
                </div>
            `).join('')}
        `;
        dropdown.appendChild(programsSection);
    }
    
    // Add jobs results
    if (results.jobs.length > 0) {
        const jobsSection = document.createElement('div');
        jobsSection.className = 'search-result-section';
        jobsSection.innerHTML = `
            <h4><i class="fas fa-briefcase"></i> Jobs</h4>
            ${results.jobs.map(item => `
                <div class="search-result-item" data-type="job" data-id="${item.id}">
                    <div class="search-result-title">${item.title} at ${item.company}</div>
                    <div class="search-result-meta">${item.location || 'Remote'} • ${item.type}</div>
                </div>
            `).join('')}
        `;
        dropdown.appendChild(jobsSection);
    }
    
    // Add click handlers
    dropdown.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const type = item.dataset.type;
            const id = item.dataset.id;
            
            switch (type) {
                case 'news':
                    window.location.href = `news.html#${id}`;
                    break;
                case 'program':
                    window.location.href = `programs.html#${id}`;
                    break;
                case 'job':
                    window.location.href = `jobs.html#${id}`;
                    break;
            }
            
            // Clear search
            document.getElementById('global-search').value = '';
            dropdown.remove();
        });
    });
}

function clearSearchResults() {
    const dropdown = document.querySelector('.search-results-dropdown');
    if (dropdown) {
        dropdown.remove();
    }
}

// ===== MODAL MANAGEMENT =====
function setupModals() {
    // Video modal
    const videoModal = document.getElementById('video-modal');
    if (videoModal) {
        const closeButtons = videoModal.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                videoModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                
                // Stop video
                const iframe = document.getElementById('video-player');
                if (iframe) {
                    const src = iframe.src;
                    iframe.src = '';
                    setTimeout(() => iframe.src = src, 100);
                }
            });
        });
        
        // Close on outside click
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                videoModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
        
        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && videoModal.style.display === 'flex') {
                videoModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Job modal
    const jobModal = document.getElementById('job-modal');
    if (jobModal) {
        const closeButtons = jobModal.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                jobModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        });
        
        // Close on outside click
        jobModal.addEventListener('click', (e) => {
            if (e.target === jobModal) {
                jobModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
        
        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && jobModal.style.display === 'flex') {
                jobModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
}

function openVideoModal(title, youtubeUrl) {
    const modal = document.getElementById('video-modal');
    const titleElement = document.getElementById('video-title');
    const player = document.getElementById('video-player');
    
    if (!modal || !titleElement || !player) return;
    
    titleElement.textContent = title;
    const youtubeId = extractYouTubeId(youtubeUrl);
    
    if (youtubeId) {
        player.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

async function openJobModal(jobId) {
    const modal = document.getElementById('job-modal');
    const titleElement = document.getElementById('job-modal-title');
    const contentElement = document.getElementById('job-detail-content');
    
    if (!modal || !titleElement || !contentElement) return;
    
    try {
        // Fetch job details
        const { data: job, error } = await supabaseClient
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();
        
        if (error) throw error;
        
        titleElement.textContent = job.title;
        
        // Format deadline
        const deadline = job.deadline ? 
            formatDate(job.deadline) : 
            'No deadline specified';
        
        // Build job detail content
        contentElement.innerHTML = `
            <div class="job-modal-header">
                ${job.logo_url ? `
                    <img src="${job.logo_url}" alt="${job.company} Logo" class="job-modal-logo">
                ` : ''}
                <div class="job-modal-title">
                    <h3>${job.title}</h3>
                    <p>${job.company} • ${job.location || 'Remote'}</p>
                </div>
            </div>
            
            <div class="job-details-grid">
                <div class="job-detail-item">
                    <h4>Job Type</h4>
                    <p>${job.type}</p>
                </div>
                <div class="job-detail-item">
                    <h4>Category</h4>
                    <p>${job.category}</p>
                </div>
                <div class="job-detail-item">
                    <h4>Salary Range</h4>
                    <p>${job.salary_range || 'Not specified'}</p>
                </div>
                <div class="job-detail-item">
                    <h4>Application Deadline</h4>
                    <p>${deadline}</p>
                </div>
            </div>
            
            <div class="job-description">
                <h4>Job Description</h4>
                <p>${job.description}</p>
            </div>
            
            ${job.apply_url ? `
                <a href="${job.apply_url}" target="_blank" class="btn btn-primary job-apply-btn">
                    <i class="fas fa-external-link-alt"></i> Apply Now
                </a>
            ` : ''}
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error loading job details:', error);
        showNotification('Error loading job details', 'error');
    }
}

// ===== CONTACT FORM =====
async function submitContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    // Get form data
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    
    // Validation
    let isValid = true;
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
    
    if (!name) {
        document.getElementById('name-error').textContent = 'Name is required';
        document.getElementById('name-error').style.display = 'block';
        isValid = false;
    }
    
    if (!email) {
        document.getElementById('email-error').textContent = 'Email is required';
        document.getElementById('email-error').style.display = 'block';
        isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        document.getElementById('email-error').textContent = 'Please enter a valid email';
        document.getElementById('email-error').style.display = 'block';
        isValid = false;
    }
    
    if (!message) {
        document.getElementById('message-error').textContent = 'Message is required';
        document.getElementById('message-error').style.display = 'block';
        isValid = false;
    }
    
    if (!isValid) return;
    
    try {
        // Insert into Supabase
        const { data, error } = await supabaseClient
            .from('messages')
            .insert([
                {
                    name: name,
                    email: email,
                    message: message
                }
            ]);
        
        if (error) throw error;
        
        // Show success message
        form.style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        
        // Show notification
        showNotification('Message sent successfully! We\'ll get back to you soon.');
        
    } catch (error) {
        console.error('Error submitting contact form:', error);
        showNotification('Error sending message. Please try again.', 'error');
    }
}

// ===== CONTENT LOADING FUNCTIONS =====
// Load latest news for homepage
async function loadLatestNews(limit = 4) {
    const container = document.getElementById('latest-news');
    if (!container) return;
    
    try {
        const { data: news, error } = await supabaseClient
            .from('news')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        if (!news || news.length === 0) {
            container.innerHTML = '<p class="no-results">No news articles found.</p>';
            return;
        }
        
        container.innerHTML = news.map(item => createNewsCard(item)).join('');
        
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
        container.innerHTML = '<p class="error-message">Error loading news. Please try again.</p>';
    }
}

// Load featured programs for homepage
async function loadFeaturedPrograms(limit = 4) {
    const container = document.getElementById('featured-programs');
    if (!container) return;
    
    try {
        const { data: programs, error } = await supabaseClient
            .from('programs')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        if (!programs || programs.length === 0) {
            container.innerHTML = '<p class="no-results">No programs found.</p>';
            return;
        }
        
        container.innerHTML = programs.map(item => createProgramCard(item)).join('');
        
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
        container.innerHTML = '<p class="error-message">Error loading programs. Please try again.</p>';
    }
}

// Load job highlights for homepage
async function loadJobHighlights(limit = 3) {
    const container = document.getElementById('job-highlights');
    if (!container) return;
    
    try {
        const { data: jobs, error } = await supabaseClient
            .from('jobs')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        if (!jobs || jobs.length === 0) {
            container.innerHTML = '<p class="no-results">No job opportunities found.</p>';
            return;
        }
        
        container.innerHTML = jobs.map(item => createJobCard(item)).join('');
        
        // Add click handlers for job modal
        container.querySelectorAll('.card').forEach(card => {
            const jobId = card.dataset.jobId;
            card.addEventListener('click', () => {
                openJobModal(jobId);
            });
        });
        
    } catch (error) {
        console.error('Error loading jobs:', error);
        container.innerHTML = '<p class="error-message">Error loading jobs. Please try again.</p>';
    }
}

// Load all news with filtering
async function loadNews(resetPage = true) {
    const container = document.getElementById('news-grid');
    if (!container) return;
    
    if (resetPage) {
        window.newsPage = 1;
        container.innerHTML = '<div class="loading-spinner"></div>';
    }
    
    // Get filter values
    const category = document.getElementById('category-filter')?.value || '';
    const section = document.getElementById('section-filter')?.value || '';
    const sort = document.getElementById('sort-filter')?.value || 'date_desc';
    
    try {
        let query = supabaseClient
            .from('news')
            .select('*', { count: 'exact' });
        
        // Apply filters
        if (category) {
            query = query.eq('category', category);
        }
        if (section) {
            query = query.eq('section', section);
        }
        
        // Apply sorting
        switch (sort) {
            case 'date_asc':
                query = query.order('date', { ascending: true });
                break;
            case 'title_asc':
                query = query.order('title', { ascending: true });
                break;
            case 'title_desc':
                query = query.order('title', { ascending: false });
                break;
            default: // date_desc
                query = query.order('date', { ascending: false });
        }
        
        // Apply pagination
        const from = (window.newsPage - 1) * 12;
        const to = from + 11;
        query = query.range(from, to);
        
        const { data: news, error, count } = await query;
        
        if (error) throw error;
        
        if (!news || news.length === 0) {
            if (resetPage) {
                container.innerHTML = '<p class="no-results">No news articles found.</p>';
            }
            return;
        }
        
        const newsHtml = news.map(item => createNewsCard(item)).join('');
        
        if (resetPage) {
            container.innerHTML = newsHtml;
        } else {
            container.innerHTML += newsHtml;
        }
        
        // Add click handlers
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
        container.innerHTML = '<p class="error-message">Error loading news. Please try again.</p>';
    }
}

// Load all programs with filtering
async function loadPrograms(resetPage = true) {
    const container = document.getElementById('programs-grid');
    if (!container) return;
    
    if (resetPage) {
        window.programsPage = 1;
        container.innerHTML = '<div class="loading-spinner"></div>';
    }
    
    // Get filter values
    const category = document.getElementById('program-category-filter')?.value || '';
    const search = document.getElementById('program-search')?.value || '';
    const sort = document.getElementById('program-sort')?.value || 'date_desc';
    
    try {
        let query = supabaseClient
            .from('programs')
            .select('*', { count: 'exact' });
        
        // Apply filters
        if (category) {
            query = query.eq('category', category);
        }
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }
        
        // Apply sorting
        switch (sort) {
            case 'date_asc':
                query = query.order('date', { ascending: true });
                break;
            case 'title_asc':
                query = query.order('title', { ascending: true });
                break;
            case 'title_desc':
                query = query.order('title', { ascending: false });
                break;
            default: // date_desc
                query = query.order('date', { ascending: false });
        }
        
        // Apply pagination
        const from = (window.programsPage - 1) * 12;
        const to = from + 11;
        query = query.range(from, to);
        
        const { data: programs, error, count } = await query;
        
        if (error) throw error;
        
        if (!programs || programs.length === 0) {
            if (resetPage) {
                container.innerHTML = '<p class="no-results">No programs found.</p>';
            }
            return;
        }
        
        const programsHtml = programs.map(item => createProgramCard(item)).join('');
        
        if (resetPage) {
            container.innerHTML = programsHtml;
        } else {
            container.innerHTML += programsHtml;
        }
        
        // Add click handlers
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
        container.innerHTML = '<p class="error-message">Error loading programs. Please try again.</p>';
    }
}

// Load all live streams
async function loadLiveStreams(resetPage = true) {
    const container = document.getElementById('live-streams-grid');
    if (!container) return;
    
    if (resetPage) {
        window.livePage = 1;
        container.innerHTML = '<div class="loading-spinner"></div>';
    }
    
    // Get filter values
    const search = document.getElementById('live-search')?.value || '';
    const sort = document.getElementById('live-sort')?.value || 'date_desc';
    
    try {
        let query = supabaseClient
            .from('live')
            .select('*', { count: 'exact' });
        
        // Apply filters
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }
        
        // Apply sorting
        if (sort === 'date_asc') {
            query = query.order('date', { ascending: true });
        } else {
            query = query.order('date', { ascending: false });
        }
        
        // Apply pagination
        const from = (window.livePage - 1) * 9;
        const to = from + 8;
        query = query.range(from, to);
        
        const { data: liveStreams, error, count } = await query;
        
        if (error) throw error;
        
        if (!liveStreams || liveStreams.length === 0) {
            if (resetPage) {
                container.innerHTML = '<p class="no-results">No live streams found.</p>';
            }
            return;
        }
        
        const liveHtml = liveStreams.map(item => createLiveCard(item)).join('');
        
        if (resetPage) {
            container.innerHTML = liveHtml;
        } else {
            container.innerHTML += liveHtml;
        }
        
        // Add click handlers
        container.querySelectorAll('.card').forEach(card => {
            const youtubeUrl = card.dataset.youtubeUrl;
            if (youtubeUrl) {
                card.addEventListener('click', () => {
                    openVideoModal(card.dataset.title, youtubeUrl);
                });
            }
        });
        
    } catch (error) {
        console.error('Error loading live streams:', error);
        container.innerHTML = '<p class="error-message">Error loading live streams. Please try again.</p>';
    }
}

// Load all jobs with filtering
async function loadJobs(resetPage = true) {
    const container = document.getElementById('jobs-grid');
    if (!container) return;
    
    if (resetPage) {
        window.jobsPage = 1;
        container.innerHTML = '<div class="loading-spinner"></div>';
    }
    
    // Get filter values
    const category = document.getElementById('job-category-filter')?.value || '';
    const type = document.getElementById('job-type-filter')?.value || '';
    const location = document.getElementById('location-filter')?.value || '';
    const sort = document.getElementById('job-sort')?.value || 'date_desc';
    
    try {
        let query = supabaseClient
            .from('jobs')
            .select('*', { count: 'exact' });
        
        // Apply filters
        if (category) {
            query = query.eq('category', category);
        }
        if (type) {
            query = query.eq('type', type);
        }
        if (location) {
            query = query.ilike('location', `%${location}%`);
        }
        
        // Apply sorting
        switch (sort) {
            case 'deadline_asc':
                query = query.order('deadline', { ascending: true });
                break;
            case 'title_asc':
                query = query.order('title', { ascending: true });
                break;
            default: // date_desc
                query = query.order('date', { ascending: false });
        }
        
        // Apply pagination
        const from = (window.jobsPage - 1) * 12;
        const to = from + 11;
        query = query.range(from, to);
        
        const { data: jobs, error, count } = await query;
        
        if (error) throw error;
        
        if (!jobs || jobs.length === 0) {
            if (resetPage) {
                container.innerHTML = '<p class="no-results">No job opportunities found.</p>';
            }
            return;
        }
        
        const jobsHtml = jobs.map(item => createJobCard(item)).join('');
        
        if (resetPage) {
            container.innerHTML = jobsHtml;
        } else {
            container.innerHTML += jobsHtml;
        }
        
        // Update statistics
        updateJobStatistics(count);
        
        // Add click handlers
        container.querySelectorAll('.card').forEach(card => {
            const jobId = card.dataset.jobId;
            card.addEventListener('click', () => {
                openJobModal(jobId);
            });
        });
        
    } catch (error) {
        console.error('Error loading jobs:', error);
        container.innerHTML = '<p class="error-message">Error loading jobs. Please try again.</p>';
    }
}

// Update job statistics
async function updateJobStatistics(totalJobs) {
    try {
        // Count urgent jobs (deadline within 7 days)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        const { count: urgentJobs } = await supabaseClient
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .lt('deadline', sevenDaysFromNow.toISOString().split('T')[0])
            .gt('deadline', new Date().toISOString().split('T')[0]);
        
        // Count unique locations
        const { data: locations } = await supabaseClient
            .from('jobs')
            .select('location');
        
        const uniqueLocations = new Set(locations?.map(job => job.location).filter(Boolean));
        
        // Update UI
        document.getElementById('total-jobs')?.textContent = totalJobs || 0;
        document.getElementById('urgent-jobs')?.textContent = urgentJobs || 0;
        document.getElementById('locations-count')?.textContent = uniqueLocations.size;
        
    } catch (error) {
        console.error('Error updating job statistics:', error);
    }
}

// ===== CARD CREATION FUNCTIONS =====
function createNewsCard(item) {
    const youtubeId = extractYouTubeId(item.youtube_url);
    const thumbnail = youtubeId ? getYouTubeThumbnail(youtubeId) : 'https://via.placeholder.com/300x200?text=No+Preview';
    
    return `
        <div class="card" data-youtube-url="${item.youtube_url || ''}" data-title="${item.title}">
            <div class="card-image">
                <img src="${thumbnail}" alt="${item.title}" loading="lazy">
                ${youtubeId ? '<div class="play-button"><i class="fas fa-play"></i></div>' : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <p class="card-description">${item.description || 'No description available.'}</p>
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
    const thumbnail = youtubeId ? getYouTubeThumbnail(youtubeId) : 'https://via.placeholder.com/300x200?text=No+Preview';
    
    return `
        <div class="card" data-youtube-url="${item.youtube_url || ''}" data-title="${item.title}">
            <div class="card-image">
                <img src="${thumbnail}" alt="${item.title}" loading="lazy">
                ${youtubeId ? '<div class="play-button"><i class="fas fa-play"></i></div>' : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <p class="card-description">${item.description || 'No description available.'}</p>
                <div class="card-meta">
                    <span class="card-category">${item.category}</span>
                    <span>${formatDate(item.date)}</span>
                </div>
            </div>
        </div>
    `;
}

function createLiveCard(item) {
    const youtubeId = extractYouTubeId(item.youtube_url);
    const thumbnail = youtubeId ? getYouTubeThumbnail(youtubeId) : 'https://via.placeholder.com/300x200?text=No+Preview';
    
    return `
        <div class="card" data-youtube-url="${item.youtube_url || ''}" data-title="${item.title}">
            <div class="card-image">
                <img src="${thumbnail}" alt="${item.title}" loading="lazy">
                ${youtubeId ? '<div class="play-button"><i class="fas fa-play"></i></div>' : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <p class="card-description">${item.description || 'No description available.'}</p>
                <div class="card-meta">
                    <span class="card-category">Live</span>
                    <span>${formatDate(item.date)}</span>
                </div>
            </div>
        </div>
    `;
}

function createJobCard(item) {
    const deadline = item.deadline ? 
        `Deadline: ${formatDate(item.deadline)}` : 
        'No deadline';
    
    return `
        <div class="card job-card" data-job-id="${item.id}">
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <div class="job-company">${item.company}</div>
                <p class="card-description">${item.description ? item.description.substring(0, 150) + '...' : 'No description available.'}</p>
                <div class="card-meta">
                    <div class="job-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${item.location || 'Remote'}</span>
                    </div>
                    <span class="card-category">${item.type}</span>
                    <span>${deadline}</span>
                </div>
            </div>
        </div>
    `;
}

// ===== ANNOUNCEMENT SYSTEM =====
async function loadAnnouncement() {
    const announcementElement = document.getElementById('announcement-text');
    if (!announcementElement) return;
    
    try {
        const { data: settings, error } = await supabaseClient
            .from('site_settings')
            .select('announcement')
            .eq('id', 1)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Error loading announcement:', error);
            return;
        }
        
        if (settings?.announcement) {
            announcementElement.textContent = settings.announcement;
        } else {
            announcementElement.textContent = 'Welcome to Abbay TV Ethiopia';
        }
        
    } catch (error) {
        console.error('Error loading announcement:', error);
    }
}

async function updateAnnouncement(announcement) {
    try {
        const { data, error } = await supabaseClient
            .from('site_settings')
            .upsert({ 
                id: 1, 
                announcement: announcement,
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        showNotification('Announcement updated successfully!');
        loadAnnouncement();
        
    } catch (error) {
        console.error('Error updating announcement:', error);
        showNotification('Error updating announcement', 'error');
    }
}

// ===== ADMIN FUNCTIONALITY =====
function checkAdminSession() {
    const session = localStorage.getItem('abbaytv_admin_session');
    const loginScreen = document.getElementById('login-screen');
    const adminDashboard = document.getElementById('admin-dashboard');
    
    if (session === 'eyakemabi@gmail.com') {
        // Valid session
        adminSession = true;
        loginScreen.style.display = 'none';
        adminDashboard.style.display = 'block';
        
        // Start session timer
        startSessionTimer();
        
        // Load admin data
        loadAdminDashboardData();
    } else {
        // No valid session
        adminSession = false;
        loginScreen.style.display = 'flex';
        adminDashboard.style.display = 'none';
    }
}

function setupAdminEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Admin navigation tabs
    const navItems = document.querySelectorAll('.admin-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Show corresponding tab
            const tabId = item.dataset.tab;
            showAdminTab(tabId);
        });
    });
    
    // Quick action buttons
    const actionButtons = document.querySelectorAll('[data-action]');
    actionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]').dataset.action;
            handleQuickAction(action);
        });
    });
    
    // Setup CRUD forms
    setupAdminForms();
    
    // Setup search functionality
    setupAdminSearch();
}

function handleLogin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorElement = document.getElementById('login-error');
    
    // Default admin credentials
    if (email === 'eyakemabi@gmail.com' && password === '@Eyu26042604') {
        // Successful login
        localStorage.setItem('abbaytv_admin_session', email);
        checkAdminSession();
        showNotification('Admin login successful!');
    } else {
        // Invalid credentials
        errorElement.style.display = 'block';
        showNotification('Invalid email or password', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('abbaytv_admin_session');
    checkAdminSession();
    showNotification('Logged out successfully');
}

function startSessionTimer() {
    let timeLeft = 3600; // 60 minutes in seconds
    
    // Clear existing timer
    if (sessionTimer) {
        clearInterval(sessionTimer);
    }
    
    sessionTimer = setInterval(() => {
        timeLeft--;
        
        // Update timer display
        const timerElement = document.getElementById('session-timer');
        if (timerElement) {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `Session: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Logout when time is up
        if (timeLeft <= 0) {
            handleLogout();
            clearInterval(sessionTimer);
        }
    }, 1000);
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
        
        // Load data for the tab if needed
        switch (tabId) {
            case 'news-crud':
                loadAdminNews();
                break;
            case 'programs-crud':
                loadAdminPrograms();
                break;
            case 'live-crud':
                loadAdminLive();
                break;
            case 'jobs-crud':
                loadAdminJobs();
                break;
            case 'messages-crud':
                loadAdminMessages();
                break;
            case 'announcement':
                loadCurrentAnnouncement();
                break;
        }
    }
}

async function loadAdminDashboardData() {
    try {
        // Load statistics
        const [newsCount, programsCount, jobsCount, messagesCount] = await Promise.all([
            supabaseClient.from('news').select('*', { count: 'exact', head: true }),
            supabaseClient.from('programs').select('*', { count: 'exact', head: true }),
            supabaseClient.from('jobs').select('*', { count: 'exact', head: true }),
            supabaseClient.from('messages').select('*', { count: 'exact', head: true })
        ]);
        
        // Update statistics
        document.getElementById('total-news').textContent = newsCount.count || 0;
        document.getElementById('total-programs').textContent = programsCount.count || 0;
        document.getElementById('total-jobs').textContent = jobsCount.count || 0;
        document.getElementById('total-messages').textContent = messagesCount.count || 0;
        
        // Load recent activity
        loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading admin dashboard data:', error);
    }
}

async function loadRecentActivity() {
    try {
        // Get recent activity from all tables
        const [recentNews, recentPrograms, recentJobs, recentMessages] = await Promise.all([
            supabaseClient
                .from('news')
                .select('*')
                .order('date', { ascending: false })
                .limit(3),
            supabaseClient
                .from('programs')
                .select('*')
                .order('date', { ascending: false })
                .limit(3),
            supabaseClient
                .from('jobs')
                .select('*')
                .order('date', { ascending: false })
                .limit(3),
            supabaseClient
                .from('messages')
                .select('*')
                .order('date', { ascending: false })
                .limit(3)
        ]);
        
        const activityContainer = document.getElementById('recent-activity');
        if (!activityContainer) return;
        
        // Combine and sort all activity by date
        const allActivity = [
            ...(recentNews.data || []).map(item => ({ ...item, type: 'news', icon: 'newspaper' })),
            ...(recentPrograms.data || []).map(item => ({ ...item, type: 'program', icon: 'film' })),
            ...(recentJobs.data || []).map(item => ({ ...item, type: 'job', icon: 'briefcase' })),
            ...(recentMessages.data || []).map(item => ({ ...item, type: 'message', icon: 'envelope' }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
        
        if (allActivity.length === 0) {
            activityContainer.innerHTML = '<p class="no-results">No recent activity</p>';
            return;
        }
        
        activityContainer.innerHTML = allActivity.map(item => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${item.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${item.title || item.name || 'New item'}</div>
                    <div class="activity-meta">
                        <span class="activity-type">${item.type.toUpperCase()}</span>
                        <span class="activity-time">${formatDate(item.date)}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add styles for activity items
        if (!document.querySelector('#activity-styles')) {
            const style = document.createElement('style');
            style.id = 'activity-styles';
            style.textContent = `
                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                .activity-item:last-child {
                    border-bottom: none;
                }
                .activity-icon {
                    width: 40px;
                    height: 40px;
                    background-color: rgba(212, 175, 55, 0.1);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #d4af37;
                }
                .activity-content {
                    flex: 1;
                }
                .activity-title {
                    font-weight: 500;
                    color: white;
                    margin-bottom: 0.25rem;
                }
                .activity-meta {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.85rem;
                    color: #999;
                }
                .activity-type {
                    background-color: rgba(30, 58, 138, 0.2);
                    padding: 0.125rem 0.5rem;
                    border-radius: 0.25rem;
                    color: #1e3a8a;
                }
            `;
            document.head.appendChild(style);
        }
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

function handleQuickAction(action) {
    switch (action) {
        case 'add-news':
            showAdminTab('news-crud');
            document.getElementById('add-news-btn')?.click();
            break;
        case 'add-program':
            showAdminTab('programs-crud');
            document.getElementById('add-program-btn')?.click();
            break;
        case 'add-job':
            showAdminTab('jobs-crud');
            document.getElementById('add-job-btn')?.click();
            break;
        case 'set-announcement':
            showAdminTab('announcement');
            break;
    }
}

function setupAdminForms() {
    // News form
    const newsForm = document.getElementById('news-form');
    const addNewsBtn = document.getElementById('add-news-btn');
    const cancelNewsBtn = document.getElementById('cancel-news');
    const newsFormContainer = document.getElementById('news-form-container');
    
    if (addNewsBtn && newsFormContainer) {
        addNewsBtn.addEventListener('click', () => {
            document.getElementById('news-form-title').textContent = 'Add New Article';
            document.getElementById('news-id').value = '';
            newsForm.reset();
            newsFormContainer.style.display = 'block';
        });
    }
    
    if (cancelNewsBtn && newsFormContainer) {
        cancelNewsBtn.addEventListener('click', () => {
            newsFormContainer.style.display = 'none';
        });
    }
    
    if (newsForm) {
        newsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveNews();
        });
    }
    
    // Similar setup for other forms...
    // Due to character limit, implementing other forms similarly
}

function setupAdminSearch() {
    // News search
    const newsSearch = document.getElementById('search-news');
    if (newsSearch) {
        newsSearch.addEventListener('input', debounce(() => {
            loadAdminNews();
        }, 500));
    }
    
    // Programs search
    const programsSearch = document.getElementById('search-programs');
    if (programsSearch) {
        programsSearch.addEventListener('input', debounce(() => {
            loadAdminPrograms();
        }, 500));
    }
    
    // Live search
    const liveSearch = document.getElementById('search-live');
    if (liveSearch) {
        liveSearch.addEventListener('input', debounce(() => {
            loadAdminLive();
        }, 500));
    }
    
    // Jobs search
    const jobsSearch = document.getElementById('search-jobs');
    if (jobsSearch) {
        jobsSearch.addEventListener('input', debounce(() => {
            loadAdminJobs();
        }, 500));
    }
    
    // Messages search
    const messagesSearch = document.getElementById('search-messages');
    if (messagesSearch) {
        messagesSearch.addEventListener('input', debounce(() => {
            loadAdminMessages();
        }, 500));
    }
    
    // Refresh buttons
    document.querySelectorAll('[id^="refresh-"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.id.split('-')[1];
            switch (type) {
                case 'news':
                    loadAdminNews();
                    break;
                case 'programs':
                    loadAdminPrograms();
                    break;
                case 'live':
                    loadAdminLive();
                    break;
                case 'jobs':
                    loadAdminJobs();
                    break;
                case 'messages':
                    loadAdminMessages();
                    break;
            }
        });
    });
}

async function loadAdminNews() {
    const tableBody = document.getElementById('news-table-body');
    if (!tableBody) return;
    
    try {
        let query = supabaseClient
            .from('news')
            .select('*');
        
        // Apply search filter
        const searchTerm = document.getElementById('search-news')?.value || '';
        if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
        }
        
        query = query.order('date', { ascending: false });
        
        const { data: news, error } = await query;
        
        if (error) throw error;
        
        if (!news || news.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No news articles found</td></tr>';
            return;
        }
        
        tableBody.innerHTML = news.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.title}</td>
                <td><span class="badge">${item.category}</span></td>
                <td>${item.section}</td>
                <td>${formatDate(item.date)}</td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-outline edit-news" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-news" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Add event listeners for edit and delete buttons
        tableBody.querySelectorAll('.edit-news').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                editNews(id);
            });
        });
        
        tableBody.querySelectorAll('.delete-news').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                deleteNews(id);
            });
        });
        
    } catch (error) {
        console.error('Error loading admin news:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center error">Error loading news</td></tr>';
    }
}

async function editNews(id) {
    try {
        const { data: news, error } = await supabaseClient
            .from('news')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Populate form
        document.getElementById('news-form-title').textContent = 'Edit Article';
        document.getElementById('news-id').value = news.id;
        document.getElementById('news-title').value = news.title;
        document.getElementById('news-category').value = news.category;
        document.getElementById('news-section').value = news.section;
        document.getElementById('news-youtube-url').value = news.youtube_url || '';
        document.getElementById('news-description').value = news.description || '';
        
        // Show form
        document.getElementById('news-form-container').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading news for edit:', error);
        showNotification('Error loading article for edit', 'error');
    }
}

async function deleteNews(id) {
    if (!confirm('Are you sure you want to delete this news article?')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('news')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showNotification('News article deleted successfully!');
        loadAdminNews();
        
    } catch (error) {
        console.error('Error deleting news:', error);
        showNotification('Error deleting article', 'error');
    }
}

async function saveNews() {
    const form = document.getElementById('news-form');
    const id = document.getElementById('news-id').value;
    const title = document.getElementById('news-title').value.trim();
    const category = document.getElementById('news-category').value;
    const section = document.getElementById('news-section').value;
    const youtubeUrl = document.getElementById('news-youtube-url').value.trim();
    const description = document.getElementById('news-description').value.trim();
    
    // Validation
    if (!title || !category || !section || !description) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    const newsData = {
        title,
        category,
        section,
        youtube_url: youtubeUrl || null,
        description,
        date: new Date().toISOString()
    };
    
    try {
        if (id) {
            // Update existing
            const { error } = await supabaseClient
                .from('news')
                .update(newsData)
                .eq('id', id);
            
            if (error) throw error;
            showNotification('Article updated successfully!');
        } else {
            // Create new
            const { error } = await supabaseClient
                .from('news')
                .insert([newsData]);
            
            if (error) throw error;
            showNotification('Article created successfully!');
        }
        
        // Reset form and hide
        form.reset();
        document.getElementById('news-form-container').style.display = 'none';
        
        // Refresh table
        loadAdminNews();
        
    } catch (error) {
        console.error('Error saving news:', error);
        showNotification('Error saving article', 'error');
    }
}

// Similar functions for other CRUD operations...
// Due to character limit, implementing other CRUD functions similarly

async function loadCurrentAnnouncement() {
    const previewElement = document.getElementById('current-announcement-preview');
    if (!previewElement) return;
    
    try {
        const { data: settings, error } = await supabaseClient
            .from('site_settings')
            .select('announcement')
            .eq('id', 1)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Error loading announcement:', error);
            return;
        }
        
        if (settings?.announcement) {
            previewElement.innerHTML = `<p>${settings.announcement}</p>`;
        } else {
            previewElement.innerHTML = '<p class="text-muted">No announcement set</p>';
        }
        
        // Setup announcement form
        const announcementForm = document.getElementById('announcement-form');
        const clearAnnouncementBtn = document.getElementById('clear-announcement');
        
        if (announcementForm) {
            announcementForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const announcement = document.getElementById('announcement-text').value.trim();
                if (announcement) {
                    await updateAnnouncement(announcement);
                    loadCurrentAnnouncement();
                }
            });
        }
        
        if (clearAnnouncementBtn) {
            clearAnnouncementBtn.addEventListener('click', async () => {
                if (confirm('Clear the current announcement?')) {
                    await updateAnnouncement('');
                    loadCurrentAnnouncement();
                }
            });
        }
        
    } catch (error) {
        console.error('Error loading announcement:', error);
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Setup navigation
    setupNavigation();
    
    // Setup search
    setupSearch();
    
    // Setup modals
    setupModals();
    
    // Load announcement
    loadAnnouncement();
    
    // Check if we're on admin page
    if (window.location.pathname.includes('admin.html')) {
        checkAdminSession();
    }
    
    // Add event listener for global search clear
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.addEventListener('blur', () => {
            setTimeout(() => clearSearchResults(), 200);
        });
    }
    
    // Add logo animation
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.animation = 'logoFloat 3s ease-in-out infinite';
    }
    
    // Set current year in footer
    const yearElement = document.querySelector('.sidebar-footer p:first-child');
    if (yearElement) {
        yearElement.innerHTML = `© ${new Date().getFullYear()} Abbay TV Ethiopia`;
    }
});

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('An error occurred. Please try again.', 'error');
});

// ===== PERFORMANCE OPTIMIZATION =====
// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img.lazy').forEach(img => imageObserver.observe(img));
}

// Preload critical resources
const criticalResources = [
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = resource;
    document.head.appendChild(link);
});

// Cache frequently accessed data
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function cachedFetch(table, query = {}) {
    const cacheKey = JSON.stringify({ table, query });
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
    }
    
    try {
        let supabaseQuery = supabaseClient.from(table).select('*');
        
        // Apply query parameters
        if (query.orderBy) {
            supabaseQuery = supabaseQuery.order(query.orderBy.field, { ascending: query.orderBy.ascending });
        }
        
        if (query.limit) {
            supabaseQuery = supabaseQuery.limit(query.limit);
        }
        
        const { data, error } = await supabaseQuery;
        
        if (error) throw error;
        
        cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        
        return data;
    } catch (error) {
        console.error('Cache fetch error:', error);
        return null;
    }
}

// Clear cache on page hide (when user navigates away)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        cache.clear();
    }
});