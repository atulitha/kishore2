import os
import re
from bs4 import BeautifulSoup

# Define the mobile menu CSS to be added
MOBILE_MENU_CSS = """
        /* Mobile Menu Toggle Button */
        .mobile-nav-toggle {
            display: flex !important; /* Force display */
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            cursor: pointer;
            z-index: 1001;
            position: relative;
            background: rgba(13, 110, 253, 0.1);
            border: none;
            border-radius: 4px;
            padding: 10px;
            transition: 0.3s;
        }

        @media (max-width: 1199px) {
            .mobile-nav-toggle {
                display: flex !important;
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

            .listing-dropdown > a::after {
                content: '\\f282';
                font-family: 'bootstrap-icons';
                font-size: 12px;
                margin-left: 8px;
                transition: transform 0.3s ease;
            }

            .listing-dropdown.active > a::after {
                transform: rotate(180deg);
            }

            .listing-dropdown .countries-list {
                position: static !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 0 0 15px !important;
                min-width: auto !important;
                display: none;
                animation: fadeIn 0.3s ease-out;
                background-color: #f8f9fa;
                border-radius: 0 0 8px 8px;
            }

            .listing-dropdown.active .countries-list {
                display: block;
                padding: 10px 15px 10px 30px !important;
            }

            .country-group {
                flex-direction: column;
                gap: 8px;
                margin: 0;
            }
        }
"""

# JavaScript to be added
MOBILE_MENU_JS = """
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM fully loaded');
        
        // Select elements
        const mobileNavToggle = document.getElementById('mobile-nav-toggle');
        const navMenu = document.getElementById('navmenu');
        const navMenuList = navMenu ? navMenu.querySelector('ul') : null;
        const body = document.body;
        
        console.log('Elements selected:', { mobileNavToggle, navMenu, navMenuList });
        
        // Toggle mobile menu
        function toggleMobileMenu() {
            console.log('Toggling mobile menu');
            const isOpen = body.classList.contains('mobile-nav-active');
            
            // Toggle body class
            body.classList.toggle('mobile-nav-active');
            
            // Toggle icon
            if (mobileNavToggle) {
                console.log('Toggling icon');
                if (isOpen) {
                    mobileNavToggle.classList.remove('bi-x');
                    mobileNavToggle.classList.add('bi-list');
                    // Ensure menu is hidden when closing
                    if (navMenuList) {
                        navMenuList.style.display = 'none';
                    }
                } else {
                    mobileNavToggle.classList.remove('bi-list');
                    mobileNavToggle.classList.add('bi-x');
                    // Ensure menu is shown when opening
                    if (navMenuList) {
                        navMenuList.style.display = 'flex';
                    }
                }
            }
            
            console.log('Current classes on body:', body.className);
            console.log('Menu display style:', navMenuList ? window.getComputedStyle(navMenuList).display : 'Menu not found');
        }
        
        // Close mobile menu
        function closeMobileMenu() {
            console.log('Closing mobile menu');
            body.classList.remove('mobile-nav-active');
            const mobileNavToggle = document.getElementById('mobile-nav-toggle');
            if (mobileNavToggle) {
                mobileNavToggle.classList.remove('bi-x');
                mobileNavToggle.classList.add('bi-list');
            }
            if (navMenuList) {
                navMenuList.style.display = 'none';
            }
        }
        
        // Toggle dropdown menu
        function toggleDropdown(link) {
            console.log('Toggling dropdown');
            const parent = link.parentElement;
            const isActive = parent.classList.contains('active');
            
            // Close all other dropdowns
            document.querySelectorAll('.listing-dropdown').forEach(dropdown => {
                if (dropdown !== parent) {
                    dropdown.classList.remove('active');
                    const otherMenu = dropdown.querySelector('.countries-list');
                    if (otherMenu) otherMenu.style.display = 'none';
                }
            });
            
            // Toggle current dropdown
            parent.classList.toggle('active');
            const dropdownMenu = parent.querySelector('.countries-list');
            if (dropdownMenu) {
                dropdownMenu.style.display = isActive ? 'none' : 'block';
            }
            
            // Prevent default link behavior
            return false;
        }
        
        // Initialize event listeners
        function initEventListeners() {
            console.log('Initializing event listeners');
            
            // Mobile menu toggle
            if (mobileNavToggle) {
                console.log('Adding click listener to mobile nav toggle');
                // Remove any existing event listeners first
                const newToggle = mobileNavToggle.cloneNode(true);
                mobileNavToggle.parentNode.replaceChild(newToggle, mobileNavToggle);
                
                newToggle.addEventListener('click', function(e) {
                    console.log('Mobile nav toggle clicked');
                    e.stopPropagation();
                    e.preventDefault();
                    toggleMobileMenu();
                });
                
                // Also add touchstart for better mobile support
                newToggle.addEventListener('touchstart', function(e) {
                    console.log('Mobile nav toggle touched');
                    e.stopPropagation();
                    e.preventDefault();
                    toggleMobileMenu();
                });
            } else {
                console.error('Mobile nav toggle element not found');
            }
            
            // Close menu when clicking outside
            document.addEventListener('click', function(e) {
                const navMenu = document.getElementById('navmenu');
                const mobileNavToggle = document.getElementById('mobile-nav-toggle');
                
                if (navMenu && mobileNavToggle && 
                    !navMenu.contains(e.target) && 
                    !mobileNavToggle.contains(e.target)) {
                    closeMobileMenu();
                }
            });
            
            // Close menu when clicking on a menu item
            const navLinks = document.querySelectorAll('#navmenu ul li a');
            navLinks.forEach(link => {
                // Skip dropdown toggles
                if (link.parentElement.classList.contains('listing-dropdown')) {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleDropdown(this);
                    });
                } else {
                    link.addEventListener('click', closeMobileMenu);
                }
            });
            
            // Close menu on window resize (if needed)
            let resizeTimer;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() {
                    if (window.innerWidth > 1199) {
                        closeMobileMenu();
                    }
                }, 250);
            });
        }
        
        // Initialize everything
        initEventListeners();
    });
    </script>
"""

def update_html_file(file_path):
    print(f"Processing: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # Skip uzbekistan.html as it's our reference
        if 'uzbekistan.html' in file_path:
            print("  - Skipping uzbekistan.html (reference file)")
            return False
        
        # Find or create the navmenu
        navmenu = soup.find(id='navmenu')
        if not navmenu:
            print(f"  - No navmenu found in {file_path}")
            return False
            
        # Add mobile toggle button if it doesn't exist
        if not soup.find(class_='mobile-nav-toggle'):
            toggle_button = soup.new_tag('i', **{
                'class': 'mobile-nav-toggle d-xl-none bi bi-list',
                'id': 'mobile-nav-toggle'
            })
            navmenu.append(toggle_button)
            print("  - Added mobile toggle button")
        
        # Add CSS to style tag in head
        style_tag = soup.find('style')
        if not style_tag:
            style_tag = soup.new_tag('style')
            soup.head.append(style_tag)
        
        # Add mobile menu CSS if not already present
        if 'mobile-nav-toggle' not in str(style_tag):
            style_tag.append(MOBILE_MENU_CSS)
            print("  - Added mobile menu CSS")
        
        # Add JavaScript before closing body tag if not already present
        if 'mobile-nav-active' not in content:
            body = soup.body
            if body:
                # Remove any existing script with the same content to avoid duplicates
                for script in soup.find_all('script'):
                    if 'mobile-nav-active' in str(script):
                        script.decompose()
                
                # Add the JavaScript
                script_tag = BeautifulSoup(MOBILE_MENU_JS, 'html.parser')
                body.append(script_tag)
                print("  - Added mobile menu JavaScript")
        
        # Save the updated file
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(str(soup))
        
        print(f"  - Successfully updated {file_path}")
        return True
        
    except Exception as e:
        print(f"  - Error processing {file_path}: {str(e)}")
        return False

def main():
    # Get all university HTML files
    universities_dir = os.path.join('d:\\kishore2', 'universities')
    html_files = [os.path.join(universities_dir, f) for f in os.listdir(universities_dir) 
                 if f.endswith('.html')]
    
    print(f"Found {len(html_files)} university HTML files to process")
    
    # Process each HTML file
    success_count = 0
    for file_path in html_files:
        if update_html_file(file_path):
            success_count += 1
    
    print(f"\nProcessing complete!")
    print(f"Successfully updated {success_count} out of {len(html_files)} university files")

if __name__ == "__main__":
    main()
