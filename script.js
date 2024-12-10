// Theme handling functionality
const themeToggle = {
    // Initialize theme functionality
    init() {
        this.button = document.getElementById('theme-toggle');
        this.icon = this.button?.querySelector('i');
        
        this.loadSavedTheme();
        this.setupEventListeners();
    },
    
    // Load saved theme or use system preference
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme') || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        this.setTheme(savedTheme);
    },
    
    // Set theme and update button icon
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update button icon
        if (this.icon) {
            this.icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    },
    
    // Toggle between light and dark themes
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        this.setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    },
    
    // Set up event listeners for theme toggle
    setupEventListeners() {
        // Button click handler
        this.button?.addEventListener('click', () => this.toggle());
        
        // Keyboard shortcut (Ctrl/Cmd + J)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
                e.preventDefault();
                this.toggle();
            }
        });
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', e => {
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
    }
};

// External link handling
const externalLinks = {
    init() {
        this.addExternalLinkHandlers();
    },
    
    addExternalLinkHandlers() {
        // Find all external links
        const links = document.querySelectorAll('a[href^="http"]');
        
        links.forEach(link => {
            // Skip if already has handler
            if (link.hasAttribute('data-handled')) return;
            
            // Add visual indicator for external links
            if (!link.querySelector('.fa-external-link')) {
                const icon = document.createElement('i');
                icon.className = 'fas fa-external-link';
                icon.style.marginLeft = '4px';
                icon.style.fontSize = '0.8em';
                link.appendChild(icon);
            }
            
            link.setAttribute('data-handled', 'true');
        });
    }
};

// Page load time tracking
const performance = {
    init() {
        this.trackLoadTime();
    },
    
    trackLoadTime() {
        window.addEventListener('load', () => {
            const loadTime = window.performance.timing.domContentLoadedEventEnd - 
                           window.performance.timing.navigationStart;
            console.log(`Page loaded in: ${loadTime}ms`);
        });
    }
};

// Initialize all functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        themeToggle.init();
        externalLinks.init();
        performance.init();
    } catch (error) {
        console.error('Error initializing site functionality:', error);
    }
});