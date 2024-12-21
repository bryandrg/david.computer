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
    let activeTag = null;
    
    // Check for tag parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const tagParam = urlParams.get('tag');
    
    function updateTable(selectedTag) {
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
    
    function updateTagStates(selectedTag) {
        tags.forEach(tag => {
            if (tag.textContent.trim() === selectedTag) {
                tag.classList.add('active');
            } else {
                tag.classList.remove('active');
            }
        });
    }
    
    // Handle tag clicks in the updates index
    if (tableRows.length > 0) {
        tags.forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.preventDefault();
                const tagName = tag.textContent.trim();
                
                if (activeTag === tagName) {
                    activeTag = null;
                    tags.forEach(t => t.classList.remove('active'));
                    history.pushState({}, '', window.location.pathname);
                } else {
                    activeTag = tagName;
                    updateTagStates(tagName);
                    history.pushState({}, '', `?tag=${encodeURIComponent(tagName)}`);
                }
                
                updateTable(activeTag);
            });
        });
        
        // Apply filter from URL parameter if it exists
        if (tagParam) {
            activeTag = decodeURIComponent(tagParam);
            updateTagStates(activeTag);
            updateTable(activeTag);
        }
    }
    
    // Handle tags in blog entries
    if (document.querySelector('.entry-tags')) {
        const entryTags = document.querySelectorAll('.entry-tags .tag');
        entryTags.forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.preventDefault();
                const tagName = tag.textContent.trim();
                window.location.href = `/updates/index.html?tag=${encodeURIComponent(tagName)}`;
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTagFiltering();
});