import os
import re
from bs4 import BeautifulSoup

def extract_country_name(file_path):
    """Extract country name from file path"""
    return os.path.basename(file_path).replace('.html', '').title()

def update_university_page(file_path):
    print(f"Processing: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # Skip if already standardized (check for russia-specific class)
        if soup.find(class_='russia-hero'):
            print("  - Already standardized")
            return False
            
        # Get country name for customization
        country = extract_country_name(file_path)
        
        # Update hero section
        hero = soup.find('section', class_='hero-section')
        if not hero:
            hero = soup.new_tag('section', **{'class': 'hero-section country-hero'})
            container = soup.new_tag('div', **{'class': 'container'})
            hero.append(container)
            
            # Add hero content
            row = soup.new_tag('div', **{'class': 'row align-items-center'})
            col = soup.new_tag('div', **{'class': 'col-lg-6'})
            h1 = soup.new_tag('h1')
            h1.string = f"Study in {country}"
            p = soup.new_tag('p', **{'class': 'lead'})
            p.string = f"Discover top medical universities in {country} with affordable fees and world-class education"
            
            col.append(h1)
            col.append(p)
            row.append(col)
            container.append(row)
            
            # Insert at the beginning of body
            body = soup.body
            if body:
                body.insert(0, hero)
        
        # Add country-specific CSS
        style_tag = soup.find('style')
        if not style_tag:
            style_tag = soup.new_tag('style')
            soup.head.append(style_tag)
        
        # Add country-specific styles
        country_css = f"""
        /* Country-specific styles for {country} */
        .country-hero {{
            background: linear-gradient(135deg, #e3e9f7 60%, #c7d2fe 100%);
            padding: 100px 0 60px;
            margin-top: 80px;
        }}
        
        .country-section {{
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
            padding: 32px 28px;
            margin-bottom: 32px;
        }}
        
        .country-section h2 {{
            color: #0d6efd;
            font-weight: 700;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 2px solid #e9ecef;
        }}
        
        .country-section ul, 
        .country-section ol {{
            padding-left: 20px;
        }}
        
        .country-section li {{
            margin-bottom: 8px;
            line-height: 1.6;
        }}
        
        .country-table {{
            width: 100%;
            margin: 20px 0;
            border-collapse: collapse;
        }}
        
        .country-table th, 
        .country-table td {{
            padding: 12px 15px;
            border: 1px solid #dee2e6;
            text-align: left;
        }}
        
        .country-table th {{
            background-color: #f8f9fa;
            font-weight: 600;
        }}
        
        .highlight-box {{
            background: #f8f9fa;
            border-left: 4px solid #0d6efd;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }}
        
        /* Responsive adjustments */
        @media (max-width: 768px) {{
            .country-hero {{
                padding: 80px 0 40px;
                margin-top: 70px;
                text-align: center;
            }}
            
            .country-section {{
                padding: 20px 15px;
            }}
        }}
        """
        
        # Add the CSS if not already present
        if 'country-hero' not in str(style_tag):
            style_tag.append(country_css)
        
        # Update section classes
        for section in soup.find_all('section'):
            if not section.get('class') or 'country-section' not in section.get('class', []):
                section['class'] = section.get('class', []) + ['country-section']
        
        # Update tables
        for table in soup.find_all('table'):
            if 'country-table' not in table.get('class', []):
                table['class'] = table.get('class', []) + ['country-table', 'table', 'table-striped']
        
        # Save the updated file
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(str(soup))
        
        print(f"  - Updated {file_path} with standardized layout")
        return True
        
    except Exception as e:
        print(f"  - Error processing {file_path}: {str(e)}")
        return False

def main():
    # Get all university HTML files
    universities_dir = os.path.join('d:\\kishore2', 'universities')
    html_files = [os.path.join(universities_dir, f) for f in os.listdir(universities_dir) 
                 if f.endswith('.html') and f != 'russia.html']
    
    print(f"Found {len(html_files)} university pages to update")
    
    # Process each HTML file
    success_count = 0
    for file_path in html_files:
        if update_university_page(file_path):
            success_count += 1
    
    print(f"\nProcessing complete!")
    print(f"Successfully updated {success_count} out of {len(html_files)} university pages")

if __name__ == "__main__":
    main()
