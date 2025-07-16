import os
from bs4 import BeautifulSoup

def fix_mobile_menu_visibility(file_path):
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
        
        # Check if we've already fixed this file
        if '/* Mobile menu visibility fix */' in str(style_tag):
            print("  - Already fixed mobile menu visibility")
            return False
        
        # Add the mobile menu visibility fix
        visibility_fix = """
        /* Mobile menu visibility fix */
        .mobile-nav-toggle {
            display: none !important; /* Hide by default */
        }
        
        @media (max-width: 1199.98px) {
            .mobile-nav-toggle {
                display: flex !important; /* Show only on mobile */
            }
            
            /* Ensure desktop menu is hidden on mobile */
            #navmenu > ul {
                display: none !important;
            }
            
            /* Show menu when active */
            .mobile-nav-active #navmenu > ul {
                display: flex !important;
            }
        }
        """
        
        # Add the fix to the style tag
        style_tag.append(visibility_fix)
        
        # Save the updated file
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(str(soup))
        
        print(f"  - Fixed mobile menu visibility in {file_path}")
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
        if fix_mobile_menu_visibility(file_path):
            success_count += 1
    
    print(f"\nProcessing complete!")
    print(f"Successfully updated {success_count} out of {len(all_files)} files")

if __name__ == "__main__":
    main()
