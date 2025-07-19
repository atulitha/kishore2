const fs = require('fs');
const path = require('path');

// Function to update the mobile menu toggle functionality
function updateMobileMenu(htmlContent) {
    // Add the mobile menu overlay div if it doesn't exist
    if (!htmlContent.includes('mobile-nav-overlay')) {
        const bodyEnd = htmlContent.indexOf('</body>');
        if (bodyEnd !== -1) {
            const overlayHtml = '\n    <!-- Mobile Navigation Overlay -->\n    <div class="mobile-nav-overlay"></div>\n    ';
            htmlContent = htmlContent.slice(0, bodyEnd) + overlayHtml + htmlContent.slice(bodyEnd);
        }
    }

    // Update the mobile menu toggle script
    const newScript = `
    <!-- Mobile Navigation Toggle Script -->
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Mobile menu toggle functionality
        const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
        const body = document.body;
        const overlay = document.querySelector('.mobile-nav-overlay');
        const navMenu = document.getElementById('navmenu');
        
        // Initialize mobile menu state
        if (window.innerWidth < 1200) {
            if (navMenu) navMenu.style.display = 'block';
        }
        
        if (mobileNavToggle) {
            mobileNavToggle.addEventListener('click', function(e) {
                e.preventDefault();
                body.classList.toggle('mobile-nav-active');
                if (overlay) overlay.classList.toggle('active');
                
                // Toggle between hamburger and close icon
                const icon = this.querySelector('i');
                if (icon) {
                    if (icon.classList.contains('bi-list')) {
                        icon.classList.remove('bi-list');
                        icon.classList.add('bi-x');
                        if (navMenu) navMenu.style.right = '0';
                    } else {
                        icon.classList.remove('bi-x');
                        icon.classList.add('bi-list');
                        if (navMenu) navMenu.style.right = '-100%';
                    }
                }
            });
            
            // Close menu when clicking on overlay
            if (overlay) {
                overlay.addEventListener('click', function() {
                    body.classList.remove('mobile-nav-active');
                    this.classList.remove('active');
                    const icon = mobileNavToggle.querySelector('i');
                    if (icon && icon.classList.contains('bi-x')) {
                        icon.classList.remove('bi-x');
                        icon.classList.add('bi-list');
                        if (navMenu) navMenu.style.right = '-100%';
                    }
                });
            }
            
            // Close menu when clicking on a nav link
            if (navMenu) {
                navMenu.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', function() {
                        if (body.classList.contains('mobile-nav-active')) {
                            body.classList.remove('mobile-nav-active');
                            if (overlay) overlay.classList.remove('active');
                            const icon = mobileNavToggle.querySelector('i');
                            if (icon && icon.classList.contains('bi-x')) {
                                icon.classList.remove('bi-x');
                                icon.classList.add('bi-list');
                                if (navMenu) navMenu.style.right = '-100%';
                            }
                        }
                    });
                });
            }
        }
        
        // Close menu on window resize above mobile breakpoint
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth >= 1200) {
                    body.classList.remove('mobile-nav-active');
                    if (overlay) overlay.classList.remove('active');
                    const icon = mobileNavToggle ? mobileNavToggle.querySelector('i') : null;
                    if (icon && icon.classList.contains('bi-x')) {
                        icon.classList.remove('bi-x');
                        icon.classList.add('bi-list');
                    }
                    if (navMenu) navMenu.style.right = '';
                } else if (navMenu) {
                    navMenu.style.display = 'block';
                }
            }, 250);
        });
    });
    </script>`;

    // Remove any existing mobile menu script
    htmlContent = htmlContent.replace(
        /<script>[\s\S]*?Mobile[\s\S]*?Navigation[\s\S]*?<\/script>/g,
        ''
    );

    // Add the new script before the closing body tag
    const bodyEnd = htmlContent.lastIndexOf('</body>');
    if (bodyEnd !== -1) {
        htmlContent = htmlContent.slice(0, bodyEnd) + newScript + '\n' + htmlContent.slice(bodyEnd);
    } else {
        htmlContent += newScript;
    }

    return htmlContent;
}

// Function to update the CSS for mobile menu
function updateMobileMenuCSS(htmlContent) {
    const newCSS = `
    <style>
        /* Mobile Navigation Overlay */
        .mobile-nav-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .mobile-nav-overlay.active {
            opacity: 1;
            visibility: visible;
        }
        
        @media (max-width: 1199px) {
            .mobile-nav-toggle {
                display: flex !important;
                align-items: center;
                justify-content: center;
                width: 44px;
                height: 44px;
                cursor: pointer;
                z-index: 1001;
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                border: none;
                padding: 0;
            }
            
            .mobile-nav-toggle i {
                font-size: 24px;
                color: #0d6efd;
                transition: all 0.3s ease;
            }
            
            #navmenu > ul {
                display: none !important;
                position: fixed;
                top: 80px;
                left: 15px;
                right: 15px;
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                padding: 15px 0;
                z-index: 1000;
                max-height: calc(100vh - 120px);
                overflow-y: auto;
                flex-direction: column;
                gap: 0;
                margin: 0;
                list-style: none;
            }
            
            .mobile-nav-active #navmenu > ul,
            #navmenu > ul.mobile-nav-active {
                display: flex !important;
                animation: fadeInDown 0.3s ease-out;
            }
            
            #navmenu > ul > li {
                width: 100%;
                padding: 0;
                margin: 0;
                border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            }
            
            #navmenu > ul > li:last-child {
                border-bottom: none;
            }
            
            #navmenu > ul > li > a {
                padding: 14px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: #2c3e50;
                text-decoration: none;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            #navmenu > ul > li > a:hover,
            #navmenu > ul > li > a:focus {
                background-color: rgba(13, 110, 253, 0.05);
                color: #0d6efd;
            }
            
            /* Animation for dropdown */
            @keyframes fadeInDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        }
    </style>`;

    // Remove any existing mobile menu CSS
    htmlContent = htmlContent.replace(
        /<style>[\s\S]*?Mobile[\s\S]*?Navigation[\s\S]*?<\/style>/g,
        ''
    );

    // Add the new CSS before the closing head tag
    const headEnd = htmlContent.indexOf('</head>');
    if (headEnd !== -1) {
        htmlContent = htmlContent.slice(0, headEnd) + newCSS + '\n    ' + htmlContent.slice(headEnd);
    } else {
        // If no head tag, add it at the beginning
        htmlContent = '<head>' + newCSS + '\n    </head>\n' + htmlContent;
    }

    return htmlContent;
}

// Main function to update the index.html file
function updateIndexHTML() {
    const filePath = path.join(__dirname, 'index.html');
    
    try {
        // Read the current content
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Update mobile menu functionality
        content = updateMobileMenu(content);
        content = updateMobileMenuCSS(content);
        
        // Write the updated content back to the file
        fs.writeFileSync(filePath, content, 'utf8');
        
        console.log('✅ Successfully updated mobile menu in index.html');
    } catch (error) {
        console.error('❌ Error updating index.html:', error.message);
    }
}

// Run the update
updateIndexHTML();
