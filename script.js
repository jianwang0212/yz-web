// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
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

// Timeline/Theme View Toggle
const toggleButtons = document.querySelectorAll('.toggle-btn');
const timelineView = document.getElementById('timeline-view');
const themeView = document.getElementById('theme-view');

if (toggleButtons.length > 0) {
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            
            // Update button states
            toggleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide views
            if (view === 'timeline') {
                timelineView.classList.add('active');
                themeView.classList.remove('active');
            } else {
                timelineView.classList.remove('active');
                themeView.classList.add('active');
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
                    tension: 0.4
                },
                {
                    label: 'Fund Growth (%)',
                    data: financialData.data.fund,
                    borderColor: 'rgb(139, 92, 246)',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4
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
            }
        }
    });
}

function populateFinancialTable() {
    const tableBody = document.getElementById('financial-table-body');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add sample data rows
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
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
