// Theme handling
function initTheme() {
    // Get the theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Function to set theme
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    // If no saved theme, check system preference
    const systemThemeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Use saved theme or system preference
    const initialTheme = savedTheme || (systemThemeDark ? 'dark' : 'light');
    
    // Set initial theme
    setTheme(initialTheme);
    
    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initTheme);