// ===== SUPABASE CONFIGURATION =====
const SUPABASE_URL = 'https://bbjlfleaksumwtimzdim.supabase.co';
const SUPABASE_KEY = 'sb_publishable_C9TxlMKsCRzYaOMZz_nsNg_9Dg3rD4y';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== HAMBURGER MENU =====
document.addEventListener('DOMContentLoaded', function() {
    // Setup hamburger menu
    const hamburger = document.querySelector('.hamburger-menu');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    const closeBtn = document.querySelector('.mobile-menu-close');
    const mobileLinks = document.querySelectorAll('.mobile-nav-menu a');
    
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
    
    // Close menu when clicking on links
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
    
    // Set active navigation
    setActiveNav();
    
    // Load announcement
    loadAnnouncement();
});

// Set active navigation item
function setActiveNav() {
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    
    // Desktop nav
    const navItems = document.querySelectorAll('.nav-item a');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.parentElement.classList.add('active');
        } else {
            item.parentElement.classList.remove('active');
        }
    });
    
    // Mobile nav
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

// Load announcement
async function loadAnnouncement() {
    const element = document.getElementById('announcement-text');
    if (!element) return;
    
    try {
        const { data } = await supabase
            .from('site_settings')
            .select('announcement')
            .eq('id', 1)
            .single();
            
        if (data && data.announcement) {
            element.textContent = data.announcement;
        }
    } catch (error) {
        console.log('Using default announcement');
    }
}

// Simple content loading functions
async function loadLatestNews(limit = 4) {
    const container = document.getElementById('latest-news');
    if (!container) return;
    
    try {
        const { data } = await supabase
            .from('news')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);
            
        if (data && data.length > 0) {
            container.innerHTML = data.map(createNewsCard).join('');
            setupCardClickListeners();
        }
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

// Similar functions for programs, jobs, etc.
// Keep your existing card creation functions

function createNewsCard(item) {
    return `
        <div class="card" data-youtube="${item.youtube_url || ''}">
            <div class="card-image">
                <img src="https://img.youtube.com/vi/${extractYouTubeId(item.youtube_url)}/hqdefault.jpg" alt="${item.title}">
                <div class="play-button"><i class="fas fa-play"></i></div>
            </div>
            <div class="card-content">
                <h3>${item.title}</h3>
                <p>${item.description?.substring(0, 100)}...</p>
                <div class="card-meta">
                    <span>${item.category}</span>
                    <span>${new Date(item.date).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `;
}

function extractYouTubeId(url) {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : '';
}

function setupCardClickListeners() {
    document.querySelectorAll('.card[data-youtube]').forEach(card => {
        card.addEventListener('click', function() {
            const youtubeUrl = this.getAttribute('data-youtube');
            if (youtubeUrl) {
                openVideoModal('Video Title', youtubeUrl);
            }
        });
    });
}

// Video modal functions
function openVideoModal(title, url) {
    const modal = document.getElementById('video-modal');
    const titleEl = document.getElementById('video-title');
    const player = document.getElementById('video-player');
    
    if (modal && titleEl && player) {
        titleEl.textContent = title;
        player.src = `https://www.youtube.com/embed/${extractYouTubeId(url)}?autoplay=1`;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('video-modal');
        if (modal && modal.style.display === 'flex') {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            const player = document.getElementById('video-player');
            if (player) player.src = '';
        }
    }
});