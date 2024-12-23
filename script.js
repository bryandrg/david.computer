// Theme handling
function initTheme() {
    // SVG strings for theme icons
    const moonSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>`;
    const sunSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    
    const themeToggle = document.getElementById('theme-toggle');
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeToggle.innerHTML = theme === 'dark' ? sunSvg : moonSvg;
    }
    
    const savedTheme = localStorage.getItem('theme');
    const systemThemeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemThemeDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
}

// Tag filtering functionality
function initTagFiltering() {
    const tags = document.querySelectorAll('.tag');
    const tableRows = document.querySelectorAll('.full-width-table tbody tr');
    const entries = document.querySelectorAll('.entry');
    let activeTag = null;

    // Get current tag from URL
    function getCurrentTag() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('tag');
    }

    // Update URL and history
    function updateHistory(tag) {
        const newUrl = tag 
            ? `${window.location.pathname}?tag=${encodeURIComponent(tag)}`
            : window.location.pathname;
        
        history.pushState({ tag }, '', newUrl);
    }

    // Update content visibility based on tag
    function updateContent(selectedTag) {
        // Update table rows if they exist
        if (tableRows.length > 0) {
            tableRows.forEach(row => {
                const rowTags = Array.from(row.querySelectorAll('.tag'))
                    .map(tag => tag.textContent.trim());
                
                if (!selectedTag || rowTags.includes(selectedTag)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        // Update entries if they exist
        if (entries.length > 0) {
            entries.forEach(entry => {
                const entryTags = Array.from(entry.querySelectorAll('.tag'))
                    .map(tag => tag.textContent.trim());
                
                if (!selectedTag || entryTags.includes(selectedTag)) {
                    entry.style.display = '';
                } else {
                    entry.style.display = 'none';
                }
            });
        }
    }

    // Update visual state of tags
    function updateTagStates(selectedTag) {
        tags.forEach(tag => {
            if (tag.textContent.trim() === selectedTag) {
                tag.classList.add('active');
            } else {
                tag.classList.remove('active');
            }
        });
    }

    // Handle tag clicks
    tags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            const tagName = tag.textContent.trim();

            // If we're in an entry page, navigate to index with tag
            if (document.querySelector('.entry-tags')) {
                window.location.href = `/updates/index.html?tag=${encodeURIComponent(tagName)}`;
                return;
            }

            // Toggle tag if clicking active tag
            if (activeTag === tagName) {
                activeTag = null;
                tags.forEach(t => t.classList.remove('active'));
                updateHistory('');
            } else {
                activeTag = tagName;
                updateTagStates(tagName);
                updateHistory(tagName);
            }
            
            updateContent(activeTag);
        });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (event) => {
        activeTag = event.state?.tag || getCurrentTag();
        updateTagStates(activeTag);
        updateContent(activeTag);
    });

    // Initial state from URL
    const initialTag = getCurrentTag();
    if (initialTag) {
        activeTag = decodeURIComponent(initialTag);
        updateTagStates(activeTag);
        updateContent(activeTag);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTagFiltering();
});