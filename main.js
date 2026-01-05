// ===== CONFIGURATION =====
const CONFIG = {
    itemsPerPage: 12,
    youtubeThumbnailBase: 'https://img.youtube.com/vi/',
    defaultThumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    logoUrl: 'https://bbjlfleaksumwtimzdim.supabase.co/storage/v1/object/public/image/abbay-logo-gold.png'
};

// ===== STATE MANAGEMENT =====
let state = {
    currentPage: '',
    news: [],
    programs: [],
    liveStreams: [],
    jobs: [],
    currentFilter: 'all',
    currentCategory: '',
    currentSort: 'newest',
    isLoading: false,
    currentPageIndex: {
        news: 1,
        programs: 1,
        live: 1,
        jobs: 1
    }
};

// ===== DOM CONTENT LOADED =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Abbay TV Ethiopia - Initializing...');
    
    // Get current page
    state.currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    
    // Setup hamburger menu
    setupHamburgerMenu();
    
    // Set active navigation
    setActiveNavigation();
    
    // Setup search functionality
    setupSearch();
    
    // Setup modals
    setupModals();
    
    // Setup filter event listeners
    setupFilters();
    
    // Setup contact form
    setupContactForm();
    
    // Setup back to top button
    setupBackToTop();
    
    // Load appropriate content based on page
    loadPageContent();
    
    console.log('Initialization complete');
});

// ===== HAMBURGER MENU FUNCTIONALITY =====
function setupHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger-menu');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    const closeBtn = document.querySelector('.mobile-menu-close');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            if (mobileMenu) {
                mobileMenu.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (mobileMenu) {
                mobileMenu.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    const mobileLinks = document.querySelectorAll('.mobile-nav-menu a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (mobileMenu) {
                mobileMenu.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function(e) {
            if (e.target === mobileMenu) {
                mobileMenu.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (mobileMenu && mobileMenu.style.display === 'flex') {
                mobileMenu.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            
            const videoModal = document.getElementById('video-modal');
            if (videoModal && videoModal.style.display === 'flex') {
                closeVideoModal();
            }
            
            const jobModal = document.getElementById('job-modal');
            if (jobModal && jobModal.style.display === 'flex') {
                closeJobModal();
            }
        }
    });
}

// ===== NAVIGATION =====
function setActiveNavigation() {
    const currentPage = state.currentPage;
    const pageMap = {
        'index': 'index.html',
        'news': 'news.html',
        'programs': 'programs.html',
        'live': 'live.html',
        'jobs': 'jobs.html',
        'contact': 'contact.html'
    };
    
    const currentFile = pageMap[currentPage] || 'index.html';
    
    const navItems = document.querySelectorAll('.nav-item a');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        const parent = item.parentElement;
        
        if (href === currentFile) {
            parent.classList.add('active');
        } else {
            parent.classList.remove('active');
        }
    });
    
    const mobileItems = document.querySelectorAll('.mobile-nav-menu a');
    mobileItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentFile) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// ===== PAGE CONTENT LOADING =====
function loadPageContent() {
    state.isLoading = true;
    
    switch(state.currentPage) {
        case 'index':
            loadHomePage();
            break;
        case 'news':
            loadNewsPage();
            break;
        case 'programs':
            loadProgramsPage();
            break;
        case 'live':
            loadLivePage();
            break;
        case 'jobs':
            loadJobsPage();
            break;
        case 'contact':
            state.isLoading = false;
            break;
    }
}

async function loadHomePage() {
    try {
        // Load all data in parallel
        const [news, programs, live, jobs] = await Promise.all([
            loadJSONData('news'),
            loadJSONData('programs'),
            loadJSONData('live'),
            loadJSONData('jobs')
        ]);
        
        // Store in state
        state.news = news;
        state.programs = programs;
        state.liveStreams = live;
        state.jobs = jobs;
        
        // Display featured content
        if (news && news.length > 0) {
            displayFeaturedNews(news.filter(item => item.is_featured).slice(0, 4));
        }
        
        if (programs && programs.length > 0) {
            displayPopularPrograms(programs.slice(0, 4));
        }
        
        if (live && live.length > 0) {
            displayLiveNow(live.filter(item => item.is_live).slice(0, 3));
        }
        
        if (jobs && jobs.length > 0) {
            displayJobHighlights(jobs.slice(0, 3));
            updateStatistics(jobs);
        }
        
    } catch (error) {
        console.error('Error loading homepage data:', error);
        showError('Failed to load content. Please check your JSON files.');
    } finally {
        state.isLoading = false;
    }
}

async function loadNewsPage() {
    const container = document.getElementById('news-grid');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const news = await loadJSONData('news');
        state.news = news;
        
        if (news && news.length > 0) {
            // Populate category filter
            populateCategoryFilter('category-filter', news);
            
            // Display all news
            displayNews(news);
            updateCount('news-count', news.length);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <h3>No News Articles</h3>
                    <p>Add news articles to news.json file</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading news:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading News</h3>
                <p>Failed to load news.json file</p>
            </div>
        `;
    } finally {
        state.isLoading = false;
    }
}

async function loadProgramsPage() {
    const container = document.getElementById('programs-grid');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const programs = await loadJSONData('programs');
        state.programs = programs;
        
        if (programs && programs.length > 0) {
            // Populate category filter
            populateCategoryFilter('category-filter', programs);
            
            // Display all programs
            displayPrograms(programs);
            updateCount('programs-count', programs.length);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tv"></i>
                    <h3>No TV Programs</h3>
                    <p>Add TV programs to programs.json file</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading programs:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Programs</h3>
                <p>Failed to load programs.json file</p>
            </div>
        `;
    } finally {
        state.isLoading = false;
    }
}

async function loadLivePage() {
    const container = document.getElementById('streams-grid');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const liveStreams = await loadJSONData('live');
        state.liveStreams = liveStreams;
        
        if (liveStreams && liveStreams.length > 0) {
            // Display live streams
            displayLiveStreams(liveStreams);
            updateCount('streams-count', liveStreams.length);
            
            // Update live now count
            const liveNow = liveStreams.filter(item => item.is_live);
            updateCount('live-now-count', liveNow.length);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-satellite-dish"></i>
                    <h3>No Live Streams</h3>
                    <p>Add live streams to live.json file</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading live streams:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Live Streams</h3>
                <p>Failed to load live.json file</p>
            </div>
        `;
    } finally {
        state.isLoading = false;
    }
}

async function loadJobsPage() {
    const container = document.getElementById('jobs-grid');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const jobs = await loadJSONData('jobs');
        state.jobs = jobs;
        
        if (jobs && jobs.length > 0) {
            // Populate filters
            populateJobFilters(jobs);
            
            // Display all jobs
            displayJobs(jobs);
            updateCount('jobs-count', jobs.length);
            
            // Update statistics
            updateStatistics(jobs);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase"></i>
                    <h3>No Job Listings</h3>
                    <p>Add job listings to jobs.json file</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading jobs:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Jobs</h3>
                <p>Failed to load jobs.json file</p>
            </div>
        `;
    } finally {
        state.isLoading = false;
    }
}

// ===== JSON DATA LOADING =====
async function loadJSONData(type) {
    const url = `${type}.json`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${type}.json`);
        }
        const data = await response.json();
        
        // Validate data is array
        if (!Array.isArray(data)) {
            console.warn(`${type}.json is not an array`);
            return [];
        }
        
        return data;
    } catch (error) {
        console.error(`Error loading ${type}.json:`, error);
        return [];
    }
}

// ===== DISPLAY FUNCTIONS =====
function displayFeaturedNews(news) {
    const container = document.getElementById('featured-news');
    if (!container || !news || news.length === 0) {
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <h3>No Featured News</h3>
                    <p>Add news with "is_featured": true to news.json</p>
                </div>
            `;
        }
        return;
    }
    
    container.innerHTML = news.map(item => createNewsCard(item)).join('');
    attachVideoClickListeners(container);
}

function displayPopularPrograms(programs) {
    const container = document.getElementById('popular-programs');
    if (!container || !programs || programs.length === 0) {
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tv"></i>
                    <h3>No Programs</h3>
                    <p>Add TV programs to programs.json</p>
                </div>
            `;
        }
        return;
    }
    
    container.innerHTML = programs.map(item => createProgramCard(item)).join('');
    attachVideoClickListeners(container);
}

function displayLiveNow(liveStreams) {
    const container = document.getElementById('live-now');
    if (!container || !liveStreams || liveStreams.length === 0) {
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-satellite-dish"></i>
                    <h3>No Live Streams</h3>
                    <p>Add live streams with "is_live": true to live.json</p>
                </div>
            `;
        }
        return;
    }
    
    container.innerHTML = liveStreams.map(item => createLiveCard(item)).join('');
    attachVideoClickListeners(container);
}

function displayJobHighlights(jobs) {
    const container = document.getElementById('job-highlights');
    if (!container || !jobs || jobs.length === 0) {
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase"></i>
                    <h3>No Jobs</h3>
                    <p>Add job listings to jobs.json</p>
                </div>
            `;
        }
        return;
    }
    
    container.innerHTML = jobs.map(item => createJobCard(item)).join('');
    attachJobClickListeners(container);
}

function displayNews(news) {
    const container = document.getElementById('news-grid');
    if (!container || !news || news.length === 0) return;
    
    container.innerHTML = news.map(item => createNewsCard(item)).join('');
    attachVideoClickListeners(container);
}

function displayPrograms(programs) {
    const container = document.getElementById('programs-grid');
    if (!container || !programs || programs.length === 0) return;
    
    container.innerHTML = programs.map(item => createProgramCard(item)).join('');
    attachVideoClickListeners(container);
}

function displayLiveStreams(streams) {
    const container = document.getElementById('streams-grid');
    if (!container || !streams || streams.length === 0) return;
    
    container.innerHTML = streams.map(item => createLiveCard(item)).join('');
    attachVideoClickListeners(container);
}

function displayJobs(jobs) {
    const container = document.getElementById('jobs-grid');
    if (!container || !jobs || jobs.length === 0) return;
    
    container.innerHTML = jobs.map(item => createJobCard(item)).join('');
    attachJobClickListeners(container);
}

// ===== CARD CREATION =====
function createNewsCard(item) {
    const youtubeId = extractYouTubeId(item.youtube_url);
    const thumbnail = youtubeId ? 
        `${CONFIG.youtubeThumbnailBase}${youtubeId}/hqdefault.jpg` : 
        CONFIG.defaultThumbnail;
    
    const date = item.date ? formatDate(item.date) : 'No date';
    
    return `
        <div class="card" data-youtube="${item.youtube_url || ''}">
            <div class="card-image">
                <img src="${thumbnail}" alt="${item.title}" loading="lazy">
                ${youtubeId ? '<div class="play-button"><i class="fas fa-play"></i></div>' : ''}
                ${item.is_featured ? '<div class="live-badge"><i class="fas fa-star"></i> Featured</div>' : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.title || 'Untitled'}</h3>
                <p class="card-description">${item.description || 'No description'}</p>
                <div class="card-meta">
                    <span><i class="fas fa-tag"></i> ${item.category || 'General'}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${date}</span>
                </div>
            </div>
        </div>
    `;
}

function createProgramCard(item) {
    const youtubeId = extractYouTubeId(item.youtube_url);
    const thumbnail = youtubeId ? 
        `${CONFIG.youtubeThumbnailBase}${youtubeId}/hqdefault.jpg` : 
        CONFIG.defaultThumbnail;
    
    const airDate = item.air_date ? formatDate(item.air_date) : 'No date';
    const duration = item.duration ? `${item.duration} min` : '';
    
    return `
        <div class="card" data-youtube="${item.youtube_url || ''}">
            <div class="card-image">
                <img src="${thumbnail}" alt="${item.name}" loading="lazy">
                ${youtubeId ? '<div class="play-button"><i class="fas fa-play"></i></div>' : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.name || 'Untitled'}</h3>
                <p class="card-description">${item.description || 'No description'}</p>
                <div class="card-meta">
                    <span><i class="fas fa-tag"></i> ${item.category || 'General'}</span>
                    <span><i class="fas fa-clock"></i> ${airDate} ${duration ? '• ' + duration : ''}</span>
                </div>
            </div>
        </div>
    `;
}

function createLiveCard(item) {
    const thumbnail = CONFIG.defaultThumbnail;
    const scheduleDate = item.schedule_date ? formatDate(item.schedule_date) : 'No schedule';
    
    return `
        <div class="card" data-youtube="${item.youtube_url || ''}">
            <div class="card-image">
                <img src="${thumbnail}" alt="${item.title}" loading="lazy">
                <div class="play-button"><i class="fas fa-play"></i></div>
                ${item.is_live ? '<div class="live-badge"><i class="fas fa-circle"></i> LIVE NOW</div>' : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.title || 'Untitled'}</h3>
                <p class="card-description">${item.description || 'No description'}</p>
                <div class="card-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${scheduleDate}</span>
                    <span>${item.is_live ? 'Live Now' : 'Upcoming'}</span>
                </div>
            </div>
        </div>
    `;
}

function createJobCard(item) {
    const deadline = item.deadline ? formatDate(item.deadline) : 'No deadline';
    
    return `
        <div class="card" data-job-id="${item.id || ''}">
            <div class="card-content">
                <h3 class="card-title">${item.title || 'Untitled'}</h3>
                <p class="card-description"><i class="fas fa-building"></i> ${item.company || 'Unknown'} • <i class="fas fa-map-marker-alt"></i> ${item.location || 'Not specified'}</p>
                <p class="card-description">${item.description || 'No description'}</p>
                <div class="card-meta">
                    <span><i class="fas fa-briefcase"></i> ${item.job_type || 'Not specified'}</span>
                    <span><i class="fas fa-clock"></i> ${deadline}</span>
                </div>
            </div>
        </div>
    `;
}

// ===== UTILITY FUNCTIONS =====
function extractYouTubeId(url) {
    if (!url) return '';
    
    // If it's already a YouTube ID
    if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
        return url;
    }
    
    // Extract from URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
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
    } catch (error) {
        return dateString;
    }
}

function populateCategoryFilter(filterId, items) {
    const filter = document.getElementById(filterId);
    if (!filter) return;
    
    // Get unique categories
    const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
    
    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filter.appendChild(option);
    });
}

function populateJobFilters(jobs) {
    const typeFilter = document.getElementById('job-type-filter');
    const locationFilter = document.getElementById('location-filter');
    
    if (typeFilter) {
        const jobTypes = [...new Set(jobs.map(item => item.job_type).filter(Boolean))];
        jobTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeFilter.appendChild(option);
        });
    }
    
    if (locationFilter) {
        const locations = [...new Set(jobs.map(item => item.location).filter(Boolean))];
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });
    }
}

function updateStatistics(jobs) {
    // Update job count
    const jobCountElement = document.getElementById('job-count');
    if (jobCountElement) {
        jobCountElement.textContent = jobs.length;
    }
    
    // Update urgent jobs (deadline in next 7 days)
    const urgentJobsElement = document.getElementById('urgent-jobs');
    if (urgentJobsElement && jobs.length > 0) {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const urgentJobs = jobs.filter(job => {
            if (!job.deadline) return false;
            try {
                const deadline = new Date(job.deadline);
                return deadline >= now && deadline <= nextWeek;
            } catch (e) {
                return false;
            }
        });
        
        urgentJobsElement.textContent = urgentJobs.length;
    }
}

function updateCount(elementId, count) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = `${count} items`;
    }
}

// ===== EVENT LISTENER ATTACHMENT =====
function attachVideoClickListeners(container) {
    if (!container) return;
    
    container.querySelectorAll('.card[data-youtube]').forEach(card => {
        const youtubeUrl = card.getAttribute('data-youtube');
        if (youtubeUrl) {
            card.addEventListener('click', function(e) {
                if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || 
                    e.target.closest('a') || e.target.closest('button')) {
                    return;
                }
                
                const title = this.querySelector('.card-title')?.textContent || 'Video';
                openVideoModal(title, youtubeUrl);
            });
            
            card.style.cursor = 'pointer';
        }
    });
}

function attachJobClickListeners(container) {
    if (!container) return;
    
    container.querySelectorAll('.card[data-job-id]').forEach(card => {
        card.addEventListener('click', async function(e) {
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || 
                e.target.closest('a') || e.target.closest('button')) {
                return;
            }
            
            const jobId = this.getAttribute('data-job-id');
            if (!jobId) return;
            
            try {
                const jobs = await loadJSONData('jobs');
                const job = jobs.find(j => j.id && j.id.toString() === jobId);
                if (job) {
                    openJobModal(job);
                }
            } catch (error) {
                console.error('Error loading job details:', error);
            }
        });
        
        card.style.cursor = 'pointer';
    });
}

// ===== MODAL FUNCTIONS =====
function setupModals() {
    const videoModal = document.getElementById('video-modal');
    if (videoModal) {
        videoModal.addEventListener('click', function(e) {
            if (e.target === videoModal || e.target.classList.contains('modal-close')) {
                closeVideoModal();
            }
        });
    }
    
    const jobModal = document.getElementById('job-modal');
    if (jobModal) {
        jobModal.addEventListener('click', function(e) {
            if (e.target === jobModal || e.target.classList.contains('modal-close')) {
                closeJobModal();
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
        player.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
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

function openJobModal(job) {
    const modal = document.getElementById('job-modal');
    if (!modal) return;
    
    const modalContent = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${job.title || 'Job Details'}</h3>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="job-detail-content">
                <div class="job-detail-header">
                    ${job.logo_url ? 
                        `<img src="${job.logo_url}" alt="${job.company}" class="company-logo">` : 
                        `<div class="company-logo" style="background: var(--primary-blue); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold;">${(job.company || 'A').charAt(0)}</div>`
                    }
                    <div class="job-detail-info">
                        <h3>${job.title || 'Untitled'}</h3>
                        <div class="job-meta">
                            <span><i class="fas fa-building"></i> ${job.company || 'Unknown'}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${job.location || 'Not specified'}</span>
                            <span><i class="fas fa-clock"></i> ${job.job_type || 'Not specified'}</span>
                            ${job.salary ? `<span><i class="fas fa-money-bill-wave"></i> ${job.salary}</span>` : ''}
                            ${job.deadline ? `<span><i class="fas fa-calendar-alt"></i> Deadline: ${formatDate(job.deadline)}</span>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="job-detail-section">
                    <h4><i class="fas fa-align-left"></i> Job Description</h4>
                    <p>${job.description || 'No description available.'}</p>
                </div>
                
                ${job.requirements ? `
                <div class="job-detail-section">
                    <h4><i class="fas fa-tasks"></i> Requirements</h4>
                    <ul class="job-requirements">
                        ${job.requirements.split('\n').map(req => `<li>${req.trim()}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                <div class="job-detail-section">
                    <h4><i class="fas fa-paper-plane"></i> How to Apply</h4>
                    <p>
                        ${job.apply_link ? 
                            `Apply by clicking the button below or send your application to: ${job.apply_link}` :
                            'To apply for this position, please contact us through our contact page.'
                        }
                    </p>
                    ${job.apply_link ? 
                        `<a href="${job.apply_link.startsWith('http') ? job.apply_link : 'mailto:' + job.apply_link}" 
                           class="btn btn-primary" 
                           target="_blank" 
                           style="margin-top: 20px;">
                            <i class="fas fa-external-link-alt"></i> Apply Now
                        </a>` : ''
                    }
                </div>
            </div>
        </div>
    `;
    
    modal.innerHTML = modalContent;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeJobModal);
    }
}

function closeJobModal() {
    const modal = document.getElementById('job-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        modal.innerHTML = '';
    }
}

// ===== FILTERS =====
function setupFilters() {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function(e) {
            state.currentCategory = e.target.value;
            filterContent();
        });
    }
    
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
        typeFilter.addEventListener('change', function(e) {
            state.currentFilter = e.target.value;
            filterContent();
        });
    }
    
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortFilter.addEventListener('change', function(e) {
            state.currentSort = e.target.value;
            filterContent();
        });
    }
    
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            state.currentFilter = 'all';
            state.currentCategory = '';
            state.currentSort = 'newest';
            
            if (categoryFilter) categoryFilter.value = '';
            if (typeFilter) typeFilter.value = 'all';
            if (sortFilter) sortFilter.value = 'newest';
            
            filterContent();
        });
    }
}

function filterContent() {
    const page = state.currentPage;
    
    switch(page) {
        case 'news':
            filterNews();
            break;
        case 'programs':
            filterPrograms();
            break;
        case 'live':
            filterLive();
            break;
        case 'jobs':
            filterJobs();
            break;
    }
}

function filterNews() {
    if (!state.news || state.news.length === 0) return;
    
    let filtered = [...state.news];
    
    // Apply category filter
    if (state.currentCategory) {
        filtered = filtered.filter(item => 
            item.category && item.category.toLowerCase() === state.currentCategory.toLowerCase()
        );
    }
    
    // Apply type filter
    if (state.currentFilter === 'featured') {
        filtered = filtered.filter(item => item.is_featured);
    } else if (state.currentFilter === 'video') {
        filtered = filtered.filter(item => item.youtube_url);
    }
    
    // Apply sorting
    filtered = sortItems(filtered, state.currentSort);
    
    // Display filtered news
    displayNews(filtered);
    updateCount('news-count', filtered.length);
}

function filterPrograms() {
    if (!state.programs || state.programs.length === 0) return;
    
    let filtered = [...state.programs];
    
    // Apply category filter
    if (state.currentCategory) {
        filtered = filtered.filter(item => 
            item.category && item.category.toLowerCase() === state.currentCategory.toLowerCase()
        );
    }
    
    // Apply type filter
    if (state.currentFilter === 'series') {
        filtered = filtered.filter(item => item.episode);
    } else if (state.currentFilter === 'special') {
        filtered = filtered.filter(item => !item.episode);
    }
    
    // Apply sorting
    filtered = sortItems(filtered, state.currentSort);
    
    // Display filtered programs
    displayPrograms(filtered);
    updateCount('programs-count', filtered.length);
}

function filterLive() {
    if (!state.liveStreams || state.liveStreams.length === 0) return;
    
    let filtered = [...state.liveStreams];
    
    // Apply stream type filter
    if (state.currentFilter === 'live') {
        filtered = filtered.filter(item => item.is_live);
    } else if (state.currentFilter === 'upcoming') {
        filtered = filtered.filter(item => !item.is_live);
    }
    
    // Apply sorting
    filtered = sortItems(filtered, state.currentSort);
    
    // Display filtered streams
    displayLiveStreams(filtered);
    updateCount('streams-count', filtered.length);
}

function filterJobs() {
    if (!state.jobs || state.jobs.length === 0) return;
    
    let filtered = [...state.jobs];
    
    // Apply job type filter
    const jobTypeFilter = document.getElementById('job-type-filter');
    if (jobTypeFilter && jobTypeFilter.value !== 'all') {
        filtered = filtered.filter(item => 
            item.job_type && item.job_type.toLowerCase() === jobTypeFilter.value.toLowerCase()
        );
    }
    
    // Apply location filter
    const locationFilter = document.getElementById('location-filter');
    if (locationFilter && locationFilter.value) {
        filtered = filtered.filter(item => 
            item.location && item.location.toLowerCase().includes(locationFilter.value.toLowerCase())
        );
    }
    
    // Apply sorting
    filtered = sortItems(filtered, state.currentSort);
    
    // Display filtered jobs
    displayJobs(filtered);
    updateCount('jobs-count', filtered.length);
}

function sortItems(items, sortType) {
    const sorted = [...items];
    
    switch(sortType) {
        case 'newest':
            return sorted.sort((a, b) => new Date(b.date || b.air_date || b.schedule_date || b.deadline) - 
                                       new Date(a.date || a.air_date || a.schedule_date || a.deadline));
        case 'oldest':
            return sorted.sort((a, b) => new Date(a.date || a.air_date || a.schedule_date || a.deadline) - 
                                       new Date(b.date || b.air_date || b.schedule_date || b.deadline));
        case 'az':
            return sorted.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
        case 'za':
            return sorted.sort((a, b) => (b.title || b.name || '').localeCompare(a.title || a.name || ''));
        case 'deadline':
            return sorted.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        default:
            return sorted;
    }
}

// ===== SEARCH =====
function setupSearch() {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const term = e.target.value.toLowerCase().trim();
        
        if (term.length < 2) {
            loadPageContent();
            return;
        }
        
        performSearch(term);
    });
}

function performSearch(term) {
    const page = state.currentPage;
    
    switch(page) {
        case 'index':
            searchAll(term);
            break;
        case 'news':
            searchNews(term);
            break;
        case 'programs':
            searchPrograms(term);
            break;
        case 'jobs':
            searchJobs(term);
            break;
        case 'live':
            searchLive(term);
            break;
    }
}

function searchAll(term) {
    // Search across all content types on homepage
    const newsResults = state.news.filter(item => 
        (item.title && item.title.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term))
    );
    
    const programResults = state.programs.filter(item => 
        (item.name && item.name.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term))
    );
    
    const jobResults = state.jobs.filter(item => 
        (item.title && item.title.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.company && item.company.toLowerCase().includes(term))
    );
    
    // Display results on homepage
    if (document.getElementById('featured-news')) {
        document.getElementById('featured-news').innerHTML = newsResults.slice(0, 4).map(item => createNewsCard(item)).join('');
        attachVideoClickListeners(document.getElementById('featured-news'));
    }
    
    if (document.getElementById('popular-programs')) {
        document.getElementById('popular-programs').innerHTML = programResults.slice(0, 4).map(item => createProgramCard(item)).join('');
        attachVideoClickListeners(document.getElementById('popular-programs'));
    }
    
    if (document.getElementById('job-highlights')) {
        document.getElementById('job-highlights').innerHTML = jobResults.slice(0, 3).map(item => createJobCard(item)).join('');
        attachJobClickListeners(document.getElementById('job-highlights'));
    }
}

function searchNews(term) {
    const filtered = state.news.filter(item => 
        (item.title && item.title.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.category && item.category.toLowerCase().includes(term))
    );
    
    displayNews(filtered);
    updateCount('news-count', filtered.length);
}

function searchPrograms(term) {
    const filtered = state.programs.filter(item => 
        (item.name && item.name.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.category && item.category.toLowerCase().includes(term))
    );
    
    displayPrograms(filtered);
    updateCount('programs-count', filtered.length);
}

function searchJobs(term) {
    const filtered = state.jobs.filter(item => 
        (item.title && item.title.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.company && item.company.toLowerCase().includes(term)) ||
        (item.location && item.location.toLowerCase().includes(term))
    );
    
    displayJobs(filtered);
    updateCount('jobs-count', filtered.length);
}

function searchLive(term) {
    const filtered = state.liveStreams.filter(item => 
        (item.title && item.title.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term))
    );
    
    displayLiveStreams(filtered);
    updateCount('streams-count', filtered.length);
}

// ===== CONTACT FORM =====
function setupContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            subject: document.getElementById('subject').value.trim(),
            message: document.getElementById('message').value.trim(),
            date: new Date().toISOString(),
            status: 'New'
        };
        
        if (!formData.name || !formData.email || !formData.message) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        if (!isValidEmail(formData.email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;
        
        try {
            const messages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
            messages.push(formData);
            localStorage.setItem('contact_messages', JSON.stringify(messages));
            
            showNotification('Message sent successfully!', 'success');
            contactForm.reset();
            
        } catch (error) {
            console.error('Error submitting contact form:', error);
            showNotification('Failed to send message. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ===== NOTIFICATION =====
function showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
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
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showError(message) {
    console.error('Error:', message);
    showNotification(message, 'error');
}

// ===== BACK TO TOP =====
function setupBackToTop() {
    if (!document.querySelector('.back-to-top')) {
        const backToTopBtn = document.createElement('div');
        backToTopBtn.className = 'back-to-top';
        backToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        backToTopBtn.title = 'Back to top';
        document.body.appendChild(backToTopBtn);
        
        window.addEventListener('scroll', function() {
            if (window.scrollY > 500) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
        
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}