const fs = require('fs');
const path = require('path');

// Function to update HTML files
function updateHTMLFiles(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Skip node_modules and other non-html directories
            if (file !== 'node_modules' && !file.startsWith('.')) {
                updateHTMLFiles(filePath);
            }
        } else if (path.extname(file) === '.html') {
            console.log(`Updating: ${filePath}`);
            
            try {
                let content = fs.readFileSync(filePath, 'utf8');
                
                // Add the new CSS link if not already present
                const cssLink = '<link href="assets/css/dropdown-styles.css" rel="stylesheet">';
                if (!content.includes('dropdown-styles.css')) {
                    // Find the last stylesheet link and add after it
                    const styleRegex = /<link[^>]*\.css[^>]*>/g;
                    const lastStyleMatch = [...content.matchAll(styleRegex)].pop();
                    
                    if (lastStyleMatch) {
                        content = content.replace(
                            lastStyleMatch[0], 
                            `${lastStyleMatch[0]}
    ${cssLink}`
                        );
                    } else {
                        // If no stylesheet found, add before </head>
                        content = content.replace(
                            '</head>',
                            `    ${cssLink}
</head>`
                        );
                    }
                }
                
                // Save the updated content
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✓ Updated: ${filePath}`);
                
            } catch (error) {
                console.error(`Error processing ${filePath}:`, error);
            }
        }
    });
}

// Start updating from the current directory
updateHTMLFiles(__dirname);
console.log('Dropdown styles update completed!');
