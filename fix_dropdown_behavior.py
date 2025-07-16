import os
from bs4 import BeautifulSoup

def fix_dropdown_behavior(file_path):
    print(f"Processing: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # Find the style tag
        style_tag = soup.find('style')
        if not style_tag:
            print("  - No style tag found")
            return False
        
        # Check if we've already fixed the dropdowns in this file
        if '/* Dropdown positioning fix */' in str(style_tag):
            print("  - Dropdown behavior already fixed")
            return False
        
        # Add the dropdown positioning fix
        dropdown_fix = """
        /* Dropdown positioning fix */
        .listing-dropdown {
            position: relative;
        }
        
        .listing-dropdown .countries-list {
            position: absolute;
            right: 0;
            left: auto;
            min-width: 500px;
            max-width: 90vw;
        }
        
        @media (max-width: 1199.98px) {
            .listing-dropdown .countries-list {
                position: static !important;
                min-width: auto !important;
                max-width: 100%;
                padding: 0 15px !important;
                margin: 0 !important;
            }
        }
        """
        
        # Add the fix to the style tag
        style_tag.append(dropdown_fix)
        
        # Update the JavaScript to handle single dropdown at a time
        js_script = """
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Function to close all dropdowns except the current one
            function closeOtherDropdowns(currentDropdown) {
                document.querySelectorAll('.listing-dropdown').forEach(dropdown => {
                    if (dropdown !== currentDropdown) {
                        dropdown.classList.remove('active');
                        const menu = dropdown.querySelector('.countries-list');
                        if (menu) menu.style.display = 'none';
                    }
                });
            }
            
            // Update dropdown toggle functionality
            document.querySelectorAll('.listing-dropdown > a').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const parent = this.parentElement;
                    const isActive = parent.classList.contains('active');
                    const dropdownMenu = parent.querySelector('.countries-list');
                    
                    // Close all other dropdowns first
                    closeOtherDropdowns(parent);
                    
                    // Toggle current dropdown
                    if (!isActive) {
                        parent.classList.add('active');
                        if (dropdownMenu) dropdownMenu.style.display = 'block';
                    } else {
                        parent.classList.remove('active');
                        if (dropdownMenu) dropdownMenu.style.display = 'none';
                    }
                });
            });
            
            // Close dropdowns when clicking outside
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.listing-dropdown')) {
                    closeOtherDropdowns(null);
                }
            });
            
            // Close dropdowns on window resize
            let resizeTimer;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() {
                    closeOtherDropdowns(null);
                }, 250);
            });
        });
        </script>
        """
        
        # Remove any existing dropdown-related scripts
        for script in soup.find_all('script'):
            if 'toggleDropdown' in str(script) or 'closeOtherDropdowns' in str(script):
                script.decompose()
        
        # Add the updated JavaScript before the closing body tag
        body = soup.body
        if body:
            # Remove any existing dropdown JS
            for script in body.find_all('script'):
                if 'toggleDropdown' in str(script) or 'closeOtherDropdowns' in str(script):
                    script.decompose()
            
            # Add the new JS
            body.append(BeautifulSoup(js_script, 'html.parser'))
        
        # Save the updated file
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(str(soup))
        
        print(f"  - Fixed dropdown behavior in {file_path}")
        return True
        
    except Exception as e:
        print(f"  - Error processing {file_path}: {str(e)}")
        return False

def main():
    # Get all university HTML files
    universities_dir = os.path.join('d:\\kishore2', 'universities')
    html_files = [os.path.join(universities_dir, f) for f in os.listdir(universities_dir) 
                 if f.endswith('.html')]
    
    # Also include the main directory HTML files
    main_dir = 'd:\\kishore2'
    main_files = [os.path.join(main_dir, f) for f in os.listdir(main_dir) 
                 if f.endswith('.html') and os.path.isfile(os.path.join(main_dir, f))]
    
    all_files = html_files + main_files
    print(f"Found {len(all_files)} HTML files to process")
    
    # Process each HTML file
    success_count = 0
    for file_path in all_files:
        if fix_dropdown_behavior(file_path):
            success_count += 1
    
    print(f"\nProcessing complete!")
    print(f"Successfully updated {success_count} out of {len(all_files)} files")

if __name__ == "__main__":
    main()
