// Dropdown Menu Toggle
const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');
const dropdowns = document.querySelectorAll('.nav-dropdown');

dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = toggle.nextElementSibling;
        
        // Close all other dropdowns
        dropdowns.forEach(d => {
            if (d !== dropdown) {
                d.classList.remove('active');
            }
        });
        
        // Toggle current dropdown
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    });
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-menu-item')) {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
});

// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link (but not dropdown toggle)
    document.querySelectorAll('.nav-menu > li > a:not(.nav-dropdown-toggle)').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
    
    // Handle dropdown links in mobile menu
    document.querySelectorAll('.nav-dropdown a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        });
    });
}

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar Background on Scroll
const navbar = document.querySelector('.navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });
}

// Timeline/Theme/Articles View Toggle
const toggleButtons = document.querySelectorAll('.toggle-btn');
const timelineView = document.getElementById('timeline-view');
const themeView = document.getElementById('theme-view');
const articlesView = document.getElementById('articles-view');

if (toggleButtons.length > 0) {
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            
            // Update button states
            toggleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide views
            [timelineView, themeView, articlesView].forEach(v => {
                if (v) v.classList.remove('active');
            });
            
            if (view === 'timeline') {
                if (timelineView) timelineView.classList.add('active');
            } else if (view === 'theme') {
                if (themeView) themeView.classList.add('active');
            } else if (view === 'articles') {
                if (articlesView) articlesView.classList.add('active');
                // Populate articles if not already done
                if (cleanedContentData && cleanedContentData.articles && 
                    document.getElementById('articles-list').children.length === 0) {
                    populateArticles();
                }
            }
        });
    });
}

// Financial Data Visualization
let financialChart = null;

const chartButtons = document.querySelectorAll('.chart-btn');
const summaryView = document.getElementById('summary-view');
const trendView = document.getElementById('trend-view');
const tableView = document.getElementById('table-view');
const chartCanvas = document.getElementById('financial-chart');

// Sample financial data (will be replaced with actual data from XML)
const financialData = {
    years: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    categories: ['Investment', 'Fund', 'Trading'],
    data: {
        investment: [0, 0, 0, 0, 0, 0, 0, 0, 0, 120, 120],
        fund: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100],
        trading: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
};

if (chartButtons.length > 0) {
    chartButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const chartType = btn.getAttribute('data-chart');
            
            // Update button states
            chartButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide views
            [summaryView, trendView, tableView].forEach(view => {
                if (view) view.classList.remove('active');
            });
            
            if (chartType === 'summary') {
                summaryView.classList.add('active');
            } else if (chartType === 'trend') {
                trendView.classList.add('active');
                initFinancialChart();
            } else if (chartType === 'table') {
                tableView.classList.add('active');
                populateFinancialTable();
            }
        });
    });
}

function initFinancialChart() {
    if (!chartCanvas) return;
    
    const ctx = chartCanvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (financialChart) {
        financialChart.destroy();
    }
    
    // Update financial data from content if available
    if (contentData && contentData.financial) {
        const financialItems = contentData.financial;
        const years = [];
        const investmentData = [];
        const fundData = [];
        
        financialItems.forEach(item => {
            const year = new Date(item.date).getFullYear();
            if (!years.includes(year)) {
                years.push(year);
                
                // Extract percentages from content
                const percentMatches = item.content.match(/(\d+)%/g);
                if (percentMatches) {
                    const percentages = percentMatches.map(m => parseInt(m));
                    if (item.title.toLowerCase().includes('fund') || item.title.includes('基金')) {
                        fundData.push(Math.max(...percentages));
                        investmentData.push(0);
                    } else {
                        investmentData.push(Math.max(...percentages));
                        fundData.push(0);
                    }
                } else {
                    investmentData.push(0);
                    fundData.push(0);
                }
            }
        });
        
        // Sort by year
        const sortedIndices = years.map((_, i) => i).sort((a, b) => years[a] - years[b]);
        financialData.years = sortedIndices.map(i => years[i]);
        financialData.data.investment = sortedIndices.map(i => investmentData[i] || 0);
        financialData.data.fund = sortedIndices.map(i => fundData[i] || 0);
    }
    
    financialChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: financialData.years,
            datasets: [
                {
                    label: 'Investment Performance (%)',
                    data: financialData.data.investment,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Fund Growth (%)',
                    data: financialData.data.fund,
                    borderColor: 'rgb(139, 92, 246)',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function populateFinancialTable() {
    const tableBody = document.getElementById('financial-table-body');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Use actual financial data if available
    if (contentData && contentData.financial) {
        contentData.financial.slice(0, 10).forEach(item => {
            const date = new Date(item.date);
            const year = date.getFullYear();
            
            // Extract category from title
            let category = 'General';
            if (item.title.toLowerCase().includes('fund') || item.title.includes('基金')) {
                category = 'Fund';
            } else if (item.title.toLowerCase().includes('investment') || item.title.includes('投资')) {
                category = 'Investment';
            } else if (item.title.toLowerCase().includes('trading') || item.title.includes('交易')) {
                category = 'Trading';
            }
            
            // Extract performance metrics (percentages)
            const percentMatch = item.content.match(/(\d+)%/);
            const performance = percentMatch ? `${percentMatch[1]}%` : 'Ongoing';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${year}</td>
                <td>${category}</td>
                <td>${performance}</td>
            `;
            tableBody.appendChild(tr);
        });
    } else {
        // Fallback to sample data
        const tableData = [
            { year: '2020-2023', category: 'Citadel Securities', performance: 'Quantitative Trading' },
            { year: '2023', category: 'A47G Fund', performance: 'Ongoing Growth' },
            { year: '2016-2018', category: 'Alfie Trading', performance: 'Crypto Market Making' },
            { year: '2023-2024', category: 'Investment', performance: '120%+ Annualized Return' }
        ];
        
        tableData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.year}</td>
                <td>${row.category}</td>
                <td>${row.performance}</td>
            `;
            tableBody.appendChild(tr);
        });
    }
}

// Music Player
let currentAudio = null;
let currentTrackIndex = 0;
let isPlaying = false;

// Sample playlist (will be replaced with actual data)
const playlist = [
    {
        title: 'Sample Track 1',
        artist: 'Zi Yin',
        src: 'music/track1.mp3',
        duration: '3:45'
    },
    {
        title: 'Sample Track 2',
        artist: 'Zi Yin',
        src: 'music/track2.mp3',
        duration: '4:12'
    }
];

function initMusicPlayer() {
    const playBtn = document.getElementById('play-btn');
    const playlistContainer = document.getElementById('playlist');
    
    if (!playBtn || !playlistContainer) return;
    
    // Populate playlist
    playlist.forEach((track, index) => {
        const trackItem = document.createElement('div');
        trackItem.className = 'playlist-item';
        trackItem.innerHTML = `
            <span class="track-number">${index + 1}</span>
            <span class="track-title">${track.title}</span>
            <span class="track-artist">${track.artist}</span>
            <span class="track-duration">${track.duration}</span>
            <button class="download-track-btn" data-track="${index}">⬇</button>
        `;
        trackItem.addEventListener('click', () => playTrack(index));
        playlistContainer.appendChild(trackItem);
    });
    
    // Play button
    playBtn.addEventListener('click', togglePlay);
    
    // Progress bar
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            if (currentAudio) {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                currentAudio.currentTime = percent * currentAudio.duration;
            }
        });
    }
}

function playTrack(index) {
    if (currentAudio) {
        currentAudio.pause();
    }
    
    currentTrackIndex = index;
    const track = playlist[index];
    
    // In a real implementation, you would load the actual audio file
    // For now, we'll just simulate
    currentAudio = new Audio(track.src);
    
    currentAudio.addEventListener('loadedmetadata', () => {
        document.getElementById('total-time').textContent = formatTime(currentAudio.duration);
    });
    
    currentAudio.addEventListener('timeupdate', () => {
        const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
        document.getElementById('progress').style.width = progress + '%';
        document.getElementById('current-time').textContent = formatTime(currentAudio.currentTime);
    });
    
    currentAudio.addEventListener('ended', () => {
        playNext();
    });
    
    currentAudio.play().catch(err => {
        console.log('Audio play failed:', err);
        // Handle error - maybe show message that track is not available
    });
    
    isPlaying = true;
    updatePlayButton();
}

function togglePlay() {
    if (!currentAudio) {
        playTrack(0);
        return;
    }
    
    if (isPlaying) {
        currentAudio.pause();
        isPlaying = false;
    } else {
        currentAudio.play();
        isPlaying = true;
    }
    updatePlayButton();
}

function updatePlayButton() {
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.textContent = isPlaying ? '⏸' : '▶';
    }
}

function playNext() {
    if (currentTrackIndex < playlist.length - 1) {
        playTrack(currentTrackIndex + 1);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Download Works
function initDownloadSection() {
    const downloadGrid = document.getElementById('download-grid');
    if (!downloadGrid) return;
    
    // Sample download items (will be replaced with actual data)
    const downloadItems = [
        { title: 'Music Album', file: 'works/album.zip', type: 'music' },
        { title: 'Research Paper', file: 'works/paper.pdf', type: 'document' },
        { title: 'Code Repository', file: 'works/code.zip', type: 'code' }
    ];
    
    downloadItems.forEach(item => {
        const downloadItem = document.createElement('div');
        downloadItem.className = 'download-item';
        downloadItem.innerHTML = `
            <div class="download-icon">${getDownloadIcon(item.type)}</div>
            <h4>${item.title}</h4>
            <button class="download-btn" data-file="${item.file}">Download</button>
        `;
        
        const downloadBtn = downloadItem.querySelector('.download-btn');
        downloadBtn.addEventListener('click', () => {
            // In a real implementation, trigger download
            window.location.href = item.file;
        });
        
        downloadGrid.appendChild(downloadItem);
    });
}

function getDownloadIcon(type) {
    const icons = {
        music: '🎵',
        document: '📄',
        code: '💻',
        image: '🖼️'
    };
    return icons[type] || '📦';
}

// Load content data
let contentData = null;
let cleanedContentData = null;

async function loadContentData() {
    try {
        // Try to load cleaned data first
        const cleanedResponse = await fetch('data/cleaned_content.json');
        if (cleanedResponse.ok) {
            cleanedContentData = await cleanedResponse.json();
            populateContent();
            return;
        }
    } catch (error) {
        console.log('Cleaned data not available, trying original data...');
    }
    
    try {
        const response = await fetch('data/content.json');
        contentData = await response.json();
        populateContent();
    } catch (error) {
        console.error('Failed to load content data:', error);
    }
}

function populateContent() {
    // Use cleaned data if available, otherwise use original data
    const dataToUse = cleanedContentData || contentData;
    if (!dataToUse) return;
    
    // Populate highlights
    populateHighlights();
    
    // Populate timeline (use cleaned timeline if available)
    populateTimeline();
    
    // Populate financial data
    populateFinancialData();
    
    // Populate music works
    populateMusicWorks();
    
    // Populate projects
    populateProjects();
    
    // Populate articles
    if (cleanedContentData && cleanedContentData.articles) {
        populateArticles();
    }
}

function populateHighlights() {
    // Highlights are already in HTML, but we can enhance them with actual data
    // This can be done later if needed
}

function populateTimeline() {
    const timelineContainer = document.querySelector('#timeline-view .timeline');
    if (!timelineContainer) return;
    
    // Use cleaned timeline if available
    const timelineData = cleanedContentData?.timeline || contentData?.timeline;
    if (!timelineData) return;
    
    // Clear existing timeline items
    const existingItems = timelineContainer.querySelectorAll('.timeline-item');
    existingItems.forEach(item => item.remove());
    
    // Sort years (descending order)
    const years = Object.keys(timelineData).sort((a, b) => parseInt(b) - parseInt(a));
    
    years.forEach(year => {
        const events = timelineData[year];
        if (!events || events.length === 0) return;
        
        events.forEach((event) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.setAttribute('data-event', JSON.stringify(event));
            
            const date = new Date(event.date);
            const dateStr = date.toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            // Clean description (remove HTML tags if any)
            let description = event.description || event.title || '';
            // Remove HTML tags and decode HTML entities
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = description;
            description = tempDiv.textContent || tempDiv.innerText || '';
            description = description.trim();
            // Limit length for timeline view
            if (description.length > 150) {
                description = description.substring(0, 150) + '...';
            }
            
            timelineItem.innerHTML = `
                <div class="timeline-year">${dateStr}</div>
                <div class="timeline-content">
                    <h3>${event.title}</h3>
                    <p>${description}</p>
                </div>
            `;
            
            // Add hover tooltip
            timelineItem.addEventListener('mouseenter', (e) => {
                showTimelineTooltip(e, event);
            });
            
            timelineItem.addEventListener('mouseleave', () => {
                hideTimelineTooltip();
            });
            
            timelineContainer.appendChild(timelineItem);
        });
    });
}

function populateArticles() {
    if (!cleanedContentData || !cleanedContentData.articles) return;
    
    const articlesList = document.getElementById('articles-list');
    const articleDetail = document.getElementById('article-detail');
    
    if (!articlesList || !articleDetail) return;
    
    // Clear existing content
    articlesList.innerHTML = '';
    
    // Create article list items
    cleanedContentData.articles.forEach((article, index) => {
        const articleItem = document.createElement('div');
        articleItem.className = 'article-item';
        articleItem.setAttribute('data-index', index);
        
        const date = new Date(article.date);
        const dateStr = date.toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        articleItem.innerHTML = `
            <div class="article-item-header">
                <h4>${article.title}</h4>
                <span class="article-date">${dateStr}</span>
            </div>
            <div class="article-preview">${article.preview}</div>
        `;
        
        articleItem.addEventListener('click', () => {
            showArticleDetail(article, index);
            // Update active state
            articlesList.querySelectorAll('.article-item').forEach(item => {
                item.classList.remove('active');
            });
            articleItem.classList.add('active');
        });
        
        articlesList.appendChild(articleItem);
    });
}

function showArticleDetail(article, index) {
    const articleDetail = document.getElementById('article-detail');
    if (!articleDetail) return;
    
    const date = new Date(article.date);
    const dateStr = date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Format content (preserve line breaks)
    const formattedContent = article.content
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    articleDetail.innerHTML = `
        <div class="article-detail-header">
            <h2>${article.title}</h2>
            <span class="article-detail-date">${dateStr}</span>
        </div>
        <div class="article-detail-content">
            <p>${formattedContent}</p>
        </div>
    `;
    
    // Scroll to top of detail
    articleDetail.scrollTop = 0;
}

let tooltipElement = null;

function showTimelineTooltip(e, event) {
    // Remove existing tooltip
    if (tooltipElement) {
        tooltipElement.remove();
    }
    
    // Clean description text
    let description = event.description || '详细信息';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = description;
    description = tempDiv.textContent || tempDiv.innerText || '详细信息';
    // Limit tooltip description length
    if (description.length > 300) {
        description = description.substring(0, 300) + '...';
    }
    
    // Create tooltip
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'timeline-tooltip';
    tooltipElement.innerHTML = `
        <div class="tooltip-header">
            <h4>${event.title || '事件'}</h4>
            <span class="tooltip-date">${new Date(event.date).toLocaleDateString('zh-CN')}</span>
        </div>
        <div class="tooltip-content">
            <p>${description}</p>
            ${event.type ? `<span class="tooltip-type">${event.type}</span>` : ''}
        </div>
    `;
    
    document.body.appendChild(tooltipElement);
    
    // Position tooltip
    const rect = e.currentTarget.getBoundingClientRect();
    tooltipElement.style.left = rect.right + 20 + 'px';
    tooltipElement.style.top = rect.top + 'px';
    
    // Adjust if tooltip goes off screen
    setTimeout(() => {
        const tooltipRect = tooltipElement.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            tooltipElement.style.left = (rect.left - tooltipRect.width - 20) + 'px';
        }
        if (tooltipRect.bottom > window.innerHeight) {
            tooltipElement.style.top = (window.innerHeight - tooltipRect.height - 20) + 'px';
        }
    }, 0);
}

function hideTimelineTooltip() {
    if (tooltipElement) {
        tooltipElement.remove();
        tooltipElement = null;
    }
}

function populateFinancialData() {
    if (!contentData.financial) return;
    
    // Update financial chart data
    const financialItems = contentData.financial;
    
    // Extract years and create chart data
    const years = [];
    const performance = [];
    
    financialItems.forEach((item, index) => {
        const year = new Date(item.date).getFullYear();
        if (!years.includes(year)) {
            years.push(year);
            // Extract percentage from content if available
            const percentMatch = item.content.match(/(\d+)%/);
            performance.push(percentMatch ? parseInt(percentMatch[1]) : 0);
        }
    });
    
    // Update financialData
    financialData.years = years.sort();
    financialData.data.investment = performance;
    
    // Update table
    populateFinancialTable();
}

function populateMusicWorks() {
    if (!contentData.music_works) return;
    
    // Update playlist with actual music works
    const musicWorks = contentData.music_works.slice(0, 10);
    
    // This will be used when music player is initialized
    window.musicWorksData = musicWorks;
}

function populateProjects() {
    if (!contentData.projects) return;
    
    // Store projects data for potential use
    window.projectsData = contentData.projects;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadContentData();
    initMusicPlayer();
    initDownloadSection();
    
    // Initialize financial chart if trend view is active
    if (trendView && trendView.classList.contains('active')) {
        initFinancialChart();
    }
});

// Fade-in animation on scroll
const fadeElements = document.querySelectorAll('.highlight-card, .timeline-item, .theme-category, .interest-category');

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            fadeObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1
});

fadeElements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeObserver.observe(element);
});

