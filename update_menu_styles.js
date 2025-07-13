const fs = require('fs');
const path = require('path');

// Function to get all HTML files in a directory recursively
function getAllHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Skip node_modules and other directories we don't want to process
            if (!['node_modules', '.git', 'vendor', 'assets'].includes(file)) {
                getAllHtmlFiles(filePath, fileList);
            }
        } else if (path.extname(file) === '.html') {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Get all HTML files in the project
const htmlFiles = getAllHtmlFiles(process.cwd());

// List of country names for reference
const countryNames = [
    'russia', 'georgia', 'kyrgyzstan', 'uzbekistan',
    'ireland', 'netherlands', 'spain', 'uk', 'usa',
    'canada', 'france', 'germany'
];

// The new styles to insert
const newStyles = `
    <style>
        /* Countries Dropdown Styling */
        .countries-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            padding: 15px !important;
            min-width: 500px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            position: absolute;
            left: 0;
            top: 100%;
            z-index: 1000;
            margin-top: 5px;
        }
        
        .country-group {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            width: 100%;
        }
        
        .country-item {
            flex: 1 1 calc(25% - 10px);
            min-width: 120px;
            background: #f8f9fa;
            border-radius: 8px;
            transition: all 0.3s ease;
            padding: 10px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .country-item:hover {
            background: #e9ecef;
            transform: translateY(-2px);
        }
        
        .country-item a {
            color: #333;
            text-decoration: none;
            font-weight: 500;
            display: block;
            padding: 5px 0;
        }
        
        .country-item a:hover {
            color: #0d6efd;
        }
        
        .country-item a.active {
            color: #0d6efd;
            font-weight: 600;
        }
        
        .listing-dropdown {
            position: relative;
        }
        
        .listing-dropdown > a {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .listing-dropdown .bi-chevron-down {
            font-size: 0.8em;
            transition: transform 0.3s ease;
        }
        
        .listing-dropdown:hover .bi-chevron-down {
            transform: rotate(180deg);
        }
    </style>`;

// Function to update a single file
function updateFile(filePath) {
    try {
        // Read the file
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove any existing countries-list styles
        content = content.replace(/<style>\s*\/\* Countries Dropdown Styling \*\/[\s\S]*?<\/style>\s*<\/head>/, '');
        
        // Insert the new styles before </head>
        content = content.replace('</head>', newStyles + '\n</head>');
        
        // Update the active class for the current page
        const fileName = path.basename(filePath, '.html');
        const dirName = path.basename(path.dirname(filePath));
        
        // For country pages in universities directory
        if (dirName === 'universities' && countryNames.includes(fileName)) {
            content = content.replace(
                new RegExp(`<a href="${fileName}\\.html"[^>]*>([^<]+)<\\/a>`, 'g'),
                (match, linkText) => {
                    return match.replace('>', ' class="active">');
                }
            );
        }
        
        // For other pages
        const pageName = fileName === 'index' ? 'home' : fileName;
        content = content.replace(
            new RegExp(`<a href=["'](.*[/]?${pageName}\.html|${pageName === 'home' ? 'index\.html' : ''})["'][^>]*>([^<]+)<\\/a>`, 'gi'),
            (match, href, linkText) => {
                return match.replace('>', ' class="active">');
            }
        );
        
        // Ensure the dropdown menu has the correct structure
        content = content.replace(
            /<li class="listing-dropdown">[\s\S]*?<\/li>/,
            `                <li class="listing-dropdown">
                    <a href="#"><span>Countries</span> <i class="bi bi-chevron-down toggle-dropdown"></i></a>
                    <ul class="countries-list">
                        <li class="country-group">
                            <div class="country-item">
                                <a href="russia.html" title="Russia">Russia</a>
                            </div>
                            <div class="country-item">
                                <a href="georgia.html" title="Georgia">Georgia</a>
                            </div>
                            <div class="country-item">
                                <a href="kyrgyzstan.html" title="Kyrgyzstan">Kyrgyzstan</a>
                            </div>
                            <div class="country-item">
                                <a href="uzbekistan.html" title="Uzbekistan">Uzbekistan</a>
                            </div>
                            <div class="country-item">
                                <a href="ireland.html" title="Ireland">Ireland</a>
                            </div>
                            <div class="country-item">
                                <a href="netherlands.html" title="Netherlands">Netherlands</a>
                            </div>
                            <div class="country-item">
                                <a href="spain.html" title="Spain">Spain</a>
                            </div>
                            <div class="country-item">
                                <a href="uk.html" title="United Kingdom">United Kingdom</a>
                            </div>
                            <div class="country-item">
                                <a href="usa.html" title="United States">United States</a>
                            </div>
                            <div class="country-item">
                                <a href="canada.html" title="Canada">Canada</a>
                            </div>
                            <div class="country-item">
                                <a href="france.html" title="France">France</a>
                            </div>
                            <div class="country-item">
                                <a href="germany.html" title="Germany">Germany</a>
                            </div>
                        </li>
                    </ul>
                </li>`
        );
        
        // Write the updated content back to the file
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`Error updating ${filePath}:`, error.message);
        return false;
    }
}

// Process each file
let successCount = 0;

htmlFiles.forEach(filePath => {
    if (updateFile(filePath)) {
        successCount++;
    }
});

console.log(`\nUpdate complete. Successfully updated ${successCount} of ${countryFiles.length} files.`);
