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

// Lightbox functionality
function initLightbox() {
    // Create lightbox elements dynamically
    function createLightbox() {
        // Check if lightbox already exists
        if (document.getElementById('lightbox')) return;
        
        // Create lightbox container
        const lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.className = 'lightbox';
        lightbox.setAttribute('aria-hidden', 'true');
        lightbox.setAttribute('role', 'dialog');
        lightbox.setAttribute('aria-label', 'Image viewer');
        
        // Create inner content wrapper
        const lightboxContent = document.createElement('div');
        lightboxContent.className = 'lightbox-content';
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'lightbox-close';
        closeBtn.setAttribute('aria-label', 'Close image viewer');
        closeBtn.innerHTML = '×';
        
        // Create image element
        const img = document.createElement('img');
        img.className = 'lightbox-image';
        img.alt = '';
        
        // Create caption element
        const caption = document.createElement('div');
        caption.className = 'lightbox-caption';
        
        // Create image counter element
        const counter = document.createElement('div');
        counter.className = 'lightbox-counter';
        counter.setAttribute('aria-live', 'polite');
        counter.setAttribute('aria-atomic', 'true');
        
        // Create navigation buttons
        const prevBtn = document.createElement('button');
        prevBtn.className = 'lightbox-nav lightbox-prev';
        prevBtn.setAttribute('aria-label', 'Previous image');
        prevBtn.innerHTML = '‹';
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'lightbox-nav lightbox-next';
        nextBtn.setAttribute('aria-label', 'Next image');
        nextBtn.innerHTML = '›';
        
        // Assemble lightbox
        lightboxContent.appendChild(closeBtn);
        lightboxContent.appendChild(counter);
        lightboxContent.appendChild(prevBtn);
        lightboxContent.appendChild(nextBtn);
        lightboxContent.appendChild(img);
        lightboxContent.appendChild(caption);
        lightbox.appendChild(lightboxContent);
        document.body.appendChild(lightbox);
        
        return {
            container: lightbox,
            image: img,
            caption: caption,
            counter: counter,
            close: closeBtn,
            prev: prevBtn,
            next: nextBtn
        };
    }
    
    // Initialize lightbox
    const lightboxElements = createLightbox();
    let currentImageIndex = 0;
    let lightboxImages = [];
    
    // Find all images that should trigger lightbox
    const images = document.querySelectorAll(
        'article img:not(.no-lightbox), ' +
        '.grid-item img:not(.no-lightbox), ' +
        '.content-with-image img:not(.no-lightbox)'
    );
    
    // Process all images in DOM order
    images.forEach((img, domIndex) => {
        // Skip if explicitly excluded
        if (img.classList.contains('no-lightbox')) return;
        
        // Add placeholder to maintain DOM order
        const imageIndex = lightboxImages.length;
        lightboxImages.push({
            src: img.src,
            alt: img.alt,
            caption: img.getAttribute('title') || img.alt || '',
            element: img,
            valid: true  // Assume valid until proven otherwise
        });
        
        // Store the index on the element
        img.dataset.lightboxIndex = imageIndex;
        
        // Function to validate and setup image
        const validateAndSetup = () => {
            // Check if image is too small (likely an icon)
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                if (img.naturalWidth < 100 && img.naturalHeight < 100) {
                    // Mark as invalid but keep in array to maintain indices
                    lightboxImages[imageIndex].valid = false;
                    return;
                }
            }
            
            // Image is valid, make it clickable
            img.style.cursor = 'zoom-in';
            img.setAttribute('tabindex', '0');
            img.setAttribute('role', 'button');
            img.setAttribute('aria-label', 'Click to enlarge image');
            
            // Add click handler
            img.addEventListener('click', function(e) {
                e.preventDefault();
                const index = parseInt(this.dataset.lightboxIndex);
                openLightbox(index);
            });
            
            // Add keyboard handler
            img.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const index = parseInt(this.dataset.lightboxIndex);
                    openLightbox(index);
                }
            });
        };
        
        // Check if image is already loaded
        if (img.complete && img.naturalWidth > 0) {
            validateAndSetup();
        } else {
            // Wait for image to load
            img.addEventListener('load', validateAndSetup);
            img.addEventListener('error', () => {
                lightboxImages[imageIndex].valid = false;
            });
        }
    });
    
    // Get valid images only (for navigation)
    function getValidImages() {
        return lightboxImages.filter(img => img.valid);
    }
    
    // Get the valid index from the full array index
    function getValidIndex(fullIndex) {
        let validCount = 0;
        for (let i = 0; i <= fullIndex; i++) {
            if (lightboxImages[i] && lightboxImages[i].valid) {
                if (i === fullIndex) return validCount;
                validCount++;
            }
        }
        return 0;
    }
    
    // Get the full index from valid index
    function getFullIndex(validIndex) {
        let validCount = 0;
        for (let i = 0; i < lightboxImages.length; i++) {
            if (lightboxImages[i] && lightboxImages[i].valid) {
                if (validCount === validIndex) return i;
                validCount++;
            }
        }
        return 0;
    }
    
    // Open lightbox function
    function openLightbox(fullIndex) {
        // Check if image is valid
        if (!lightboxImages[fullIndex] || !lightboxImages[fullIndex].valid) return;
        
        currentImageIndex = getValidIndex(fullIndex);
        updateLightboxImage();
        lightboxElements.container.classList.add('active');
        lightboxElements.container.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Focus management for accessibility
        lightboxElements.close.focus();
        
        // Update navigation visibility
        updateNavigation();
    }
    
    // Close lightbox function
    function closeLightbox() {
        lightboxElements.container.classList.remove('active');
        lightboxElements.container.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Return focus to the image that opened the lightbox
        const fullIndex = getFullIndex(currentImageIndex);
        const triggerImage = lightboxImages[fullIndex]?.element;
        if (triggerImage) triggerImage.focus();
    }
    
    // Update displayed image
    function updateLightboxImage() {
        const validImages = getValidImages();
        const imageData = validImages[currentImageIndex];
        if (!imageData) return;
        
        lightboxElements.image.src = imageData.src;
        lightboxElements.image.alt = imageData.alt;
        lightboxElements.caption.textContent = imageData.caption;
        
        // Update counter
        lightboxElements.counter.textContent = `${currentImageIndex + 1}/${validImages.length}`;
    }
    
    // Update navigation buttons visibility
    function updateNavigation() {
        const validImages = getValidImages();
        lightboxElements.prev.style.display = currentImageIndex > 0 ? 'block' : 'none';
        lightboxElements.next.style.display = currentImageIndex < validImages.length - 1 ? 'block' : 'none';
        
        // Hide counter if only one image
        lightboxElements.counter.style.display = validImages.length > 1 ? 'block' : 'none';
    }
    
    // Navigate to previous image
    function showPrevImage() {
        const validImages = getValidImages();
        if (currentImageIndex > 0) {
            currentImageIndex--;
            updateLightboxImage();
            updateNavigation();
        }
    }
    
    // Navigate to next image
    function showNextImage() {
        const validImages = getValidImages();
        if (currentImageIndex < validImages.length - 1) {
            currentImageIndex++;
            updateLightboxImage();
            updateNavigation();
        }
    }
    
    // Event listeners
    lightboxElements.close.addEventListener('click', closeLightbox);
    lightboxElements.prev.addEventListener('click', showPrevImage);
    lightboxElements.next.addEventListener('click', showNextImage);
    
    // Close on image click
    lightboxElements.image.addEventListener('click', closeLightbox);
    
    // Close on background click
    lightboxElements.container.addEventListener('click', function(e) {
        if (e.target === this) {
            closeLightbox();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (!lightboxElements.container.classList.contains('active')) return;
        
        switch(e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                showPrevImage();
                break;
            case 'ArrowRight':
                showNextImage();
                break;
        }
    });
    
    // Touch gesture support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    lightboxElements.container.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    lightboxElements.container.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swiped left - show next
                showNextImage();
            } else {
                // Swiped right - show previous
                showPrevImage();
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTagFiltering();
    initLightbox();
});