# DAVID.COMPUTER

A personal website and digital garden built with vanilla HTML, CSS, and JavaScript. This project emphasizes simplicity, accessibility, and personal ownership of content in an age of platform dependency.

## 🌟 Features

- **Clean, minimalist design** with focus on readability and accessibility
- **Dark/light theme toggle** with system preference detection
- **Tag-based filtering** for blog posts and content organization
- **Responsive design** that works across all device sizes
- **Zero tracking** - no analytics, cookies, or user data collection
- **Fast loading** with minimal dependencies
- **SEO optimized** with proper meta tags and semantic HTML
- **Accessible** with ARIA labels and semantic markup

## 📁 Project Structure

```
david.computer/
├── index.html                 # Homepage
├── styles.css                 # Main stylesheet with CSS variables
├── script.js                  # Theme toggle and tag filtering
├── updates/                   # Blog posts and updates
│   ├── index.html             # Updates archive
│   ├── hello-world.html       # Individual blog posts
│   ...
├── projects/                  # Project case studies
│   ├── index.html             # Projects archive
│   ├── photos-redesign.html   # Individual project pages
│   ...
├── events/                    # Exhibitions and events
│   ├── index.html             # Events archive
│   ├── hoja-al-viento.html    # Individual event pages
│   └── milagro-coffee-exhibition.html
├── six-questions/             # Personal philosophy pages
│   ├── who/index.html         # About page
│   ├── what/index.html        # Skills and work
│   ├── why/index.html         # Philosophy and motivation
│   ...
└── assets/                    # Icons, images, and static files
```

## 🎨 Design System

The site uses a CSS variable-based design system for easy customization:

### Color Scheme
- Light mode: Cream background (`#fffef1`) with dark text
- Dark mode: Pure black background with light text
- Minimal color palette focusing on readability

### Typography
- **Headers**: Roboto Mono (monospace)
- **Body text**: Atkinson Hyperlegible (accessibility-focused sans-serif)
- **Responsive scale**: Using golden ratio-based sizing

### Layout
- **Container**: Max-width of 50rem with auto margins
- **Grid systems**: Flexible grid classes for image galleries
- **Tables**: Custom styled for content organization
- **Responsive**: Mobile-first approach with breakpoint at 37.5rem

## 🛠️ Key Components

### Theme Toggle
- Automatic system theme detection
- Persistent user preference storage
- Smooth transitions between themes
- Accessible button with proper ARIA labels

### Tag Filtering
- Client-side filtering with JavaScript
- URL-based state management
- Works on both archive and individual post pages
- Visual feedback for active filters

### Responsive Images
- Flexible grid system for galleries
- Proper alt text for accessibility
- Optimized loading with modern formats

## 📱 Browser Support
Works in all modern browsers and many older versions. The site uses standard web technologies with broad compatibility:
- **Modern browsers**: Chrome 60+, Firefox 55+, Safari 11+, Edge 16+
- **Mobile**: iOS Safari 11+, Chrome Mobile 60+
- **Progressive enhancement**: Core content accessible without JavaScript

## 🔧 Dependencies

### External Resources
- **Google Fonts**: Roboto Mono, Atkinson Hyperlegible
- **Font Awesome**: Icons (v6.5.1)
- **No JavaScript frameworks** - vanilla JS only

### Performance
- **Minimal HTTP requests**
- **Optimized CSS** with efficient selectors
- **Fast loading** with properly sized images
- **No tracking scripts** or analytics

## 🎯 Philosophy

This project embodies several key principles:

- **Personal ownership** of content and digital presence
- **Minimal, distraction-free** design
- **Accessibility-first** approach
- **Privacy-respecting** with no tracking
- **Long-term sustainability** with simple technologies

## 🚀 Getting Started

### Prerequisites
- A modern web browser
- A web server (for local development)

### Local Development

1. **Clone or download** the project files
2. **Start a local server**:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```
3. **Open** `http://localhost:8000` in your browser

### Deployment
This is a static site that can be deployed to any web hosting service:
- GitHub Pages
- Netlify
- Vercel
- Traditional web hosting

## ⚙️ Customization

### Changing Colors
Edit CSS variables in `styles.css`:

```css
:root {
    --bg-primary: #fffef1;     /* Background color */
    --text-primary: #202020;   /* Main text color */
    --link-bg: #e0e0e0;       /* Link background */
    /* ... other variables */
}
```

### Adding New Pages
1. Create HTML file following the existing structure
2. Include proper meta tags and navigation
3. Add entry to relevant index pages
4. Update navigation breadcrumbs

### Typography Customization
Modify font families and sizes in CSS variables:

```css
:root {
    --font-heading: "Roboto Mono", monospace;
    --font-content: "Atkinson Hyperlegible", sans-serif;
    --text-base: 1rem;
    /* ... other typography variables */
}
```


## 📄 License

This project structure and code can be used as a template for personal websites. Please replace personal content (name, projects, etc.) with your own.

## 🤝 Contributing

This is a personal website, but if you find bugs or have suggestions for the template structure, feel free to:
- Report issues with the code structure
- Suggest accessibility improvements
- Propose performance optimizations

---

**Note**: This site represents a personal approach to web presence focused on sustainability, accessibility, and content ownership in the modern internet landscape.
