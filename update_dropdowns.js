const fs = require('fs');
const path = require('path');

// CSS to add/update
const dropdownCSS = `
        /* Fix for double arrow in dropdown */
        .listing-dropdown > a::after {
            display: none !important;
        }
        
        .listing-dropdown > a .bi-chevron-down {
            margin-left: 5px;
            font-size: 0.8em;
            transition: transform 0.3s ease;
        }
        
        .listing-dropdown.active > a .bi-chevron-down {
            transform: rotate(180deg);
        }
`;

// JavaScript to add/update
const dropdownJS = `
            // Simple dropdown toggle functionality
            document.addEventListener('click', function(e) {
                const dropdownToggle = e.target.closest('.listing-dropdown > a');
                const dropdownMenu = document.querySelector('.countries-list');
                
                // If clicking the dropdown toggle
                if (dropdownToggle) {
                    e.preventDefault();
                    const isActive = dropdownToggle.parentElement.classList.contains('active');
                    
                    // Close all dropdowns first
                    document.querySelectorAll('.listing-dropdown').forEach(d => {
                        d.classList.remove('active');
                    });
                    
                    // Toggle current dropdown
                    if (!isActive) {
                        dropdownToggle.parentElement.classList.add('active');
                        if (dropdownMenu) {
                            dropdownMenu.style.display = 'flex';
                            dropdownMenu.style.visibility = 'visible';
                            dropdownMenu.style.opacity = '1';
                        }
                    }
                    return;
                }
                
                // If clicking a dropdown item
                const dropdownItem = e.target.closest('.countries-list a');
                if (dropdownItem) {
                    e.stopPropagation();
                    window.location.href = dropdownItem.getAttribute('href');
                    return;
                }
                
                // If clicking outside, close all dropdowns
                document.querySelectorAll('.listing-dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                    const menu = dropdown.querySelector('.countries-list');
                    if (menu) {
                        menu.style.display = 'none';
                        menu.style.visibility = 'hidden';
                        menu.style.opacity = '0';
                    }
                });
            });
`;

// Process all HTML files in the universities folder
const universitiesDir = path.join(__dirname, 'universities');
const files = fs.readdirSync(universitiesDir);

files.forEach(file => {
    if (file.endsWith('.html') && !file.includes('_backup')) {
        const filePath = path.join(universitiesDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Add/update CSS
        if (content.includes('.listing-dropdown > a::after')) {
            // Update existing CSS
            content = content.replace(
                /\.listing-dropdown > a::after\s*\{[^}]+\}/s,
                '.listing-dropdown > a::after {\n            display: none !important;\n        }'
            );
        } else {
            // Add new CSS before the Countries Dropdown Styling comment
            content = content.replace(
                /(\/\* Countries Dropdown Styling \*\/)/,
                `${dropdownCSS}\n        $1`
            );
        }
        
        // Add/update JavaScript
        if (content.includes('// Simple dropdown toggle functionality')) {
            // Update existing JS
            const jsStart = content.indexOf('// Simple dropdown toggle functionality');
            const jsEnd = content.indexOf('});', jsStart) + 2;
            content = content.substring(0, jsStart) + dropdownJS + content.substring(jsEnd);
        } else {
            // Add new JS before the closing script tag
            const scriptEnd = content.lastIndexOf('</script>');
            if (scriptEnd !== -1) {
                content = content.substring(0, scriptEnd) + dropdownJS + '\n        ' + content.substring(scriptEnd);
            }
        }
        
        // Save the updated file
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});

console.log('All files have been updated!');
