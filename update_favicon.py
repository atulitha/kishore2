import os
import re
from bs4 import BeautifulSoup

def update_favicon(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Create a backup of the original file
        with open(f"{file_path}.bak", 'w', encoding='utf-8') as backup:
            backup.write(content)
        
        # Parse the HTML
        soup = BeautifulSoup(content, 'html.parser')
        
        # Find all link tags that might be favicons
        favicon_links = soup.find_all('link', rel=re.compile(r'(?:icon|shortcut icon|apple-touch-icon)', re.IGNORECASE))
        
        # Update or add favicon link
        if favicon_links:
            for link in favicon_links:
                # Update existing favicon link
                link['href'] = re.sub(r'favicon\.(png|ico)', 'kxy-logo.png', link['href'])
        else:
            # Add new favicon link if none exists
            head = soup.find('head')
            if head:
                favicon_link = soup.new_tag('link', rel='icon', href='assets/img/kxy-logo.png')
                head.insert(0, favicon_link)
        
        # Save the updated file
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(str(soup))
            
        print(f"Updated favicon in {file_path}")
        return True
        
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        return False

def main():
    # Get the root directory of the project
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Count of updated files
    updated_count = 0
    
    # Process all HTML files in the project
    for root, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.html') and not file.endswith('.bak'):
                file_path = os.path.join(root, file)
                if update_favicon(file_path):
                    updated_count += 1
    
    print(f"\nFavicon update complete! Updated {updated_count} HTML files.")
    print("Backup files with the .bak extension have been created for each modified file.")

if __name__ == "__main__":
    main()
