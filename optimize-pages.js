const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Critical CSS to be inlined in the head
const CRITICAL_CSS_PATH = path.join(__dirname, 'assets', 'css', 'critical.css');
const PERFORMANCE_JS_PATH = path.join('assets', 'js', 'performance.js');

// Common optimizations to apply to all HTML files
async function optimizeHtmlFile(filePath) {
    try {
        // Read the file content
        let content = await readFile(filePath, 'utf8');
        
        // 1. Add critical CSS in the head
        if (content.includes('</head>')) {
            const criticalCSS = await readFile(CRITICAL_CSS_PATH, 'utf8');
            content = content.replace(
                '</head>',
                `<style>${criticalCSS}</style>\n    </head>`
            );
        }

        // 2. Add performance.js before closing body
        if (content.includes('</body>')) {
            content = content.replace(
                '</body>',
                `    <script src="${PERFORMANCE_JS_PATH}" defer></script>\n</body>`
            );
        }

        // 3. Optimize resource loading
        content = content
            // Add preconnect for external domains
            .replace(
                /<link[^>]*href=["']https?:\/\/fonts\.googleapis\.com[^>]*>/g,
                '<link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n$&'
            )
            // Add preload for CSS
            .replace(
                /<link[^>]*href=["'](assets\/vendor\/[^"']+\.css)["'][^>]*>/g,
                '<link rel="preload" href="$1" as="style" onload="this.rel=\'stylesheet\'">\n    <noscript><link rel="stylesheet" href="$1"></noscript>'
            )
            // Add loading="lazy" to images
            .replace(
                /<img((?:(?!loading=)[^>])+)>/g,
                (match, p1) => {
                    // Skip if already has loading attribute or is in the header
                    if (match.includes('loading=') || match.includes('header') || match.includes('logo')) {
                        return match;
                    }
                    return `<img loading="lazy" ${p1}>`;
                }
            )
            // Convert src to data-src for lazy loading
            .replace(
                /<img([^>]*)src=(["'])(.*?)\2([^>]*)>/g,
                (match, before, quote, src, after) => {
                    // Skip if already has data-src or is in the header/logo
                    if (match.includes('data-src') || match.includes('header') || match.includes('logo')) {
                        return match;
                    }
                    return `<img${before}src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" data-src=${quote}${src}${quote}${after}>`;
                }
            );

        // 4. Optimize Google Fonts loading
        const googleFontsRegex = /<link[^>]*href=["']https:\/\/fonts\.googleapis\.com[^>]*>/g;
        if (googleFontsRegex.test(content)) {
            content = content.replace(
                googleFontsRegex,
                '<link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Poppins:wght@400;500;600;700&display=swap">\n    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Poppins:wght@400;500;600;700&display=swap" media="print" onload="this.media=\'all\'">'
            );
        }

        // 5. Add noscript fallback for lazy loading
        if (content.includes('</body>')) {
            content = content.replace(
                '</body>',
                '    <noscript>\n        <style>\n            img[data-src] { display: none !important; }\n            .lazyload { display: block !important; }\n        </style>\n    </noscript>\n</body>'
            );
        }

        // Write the optimized content back to the file
        await writeFile(filePath, content, 'utf8');
        console.log(`Optimized: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`Error optimizing ${filePath}:`, error);
        return false;
    }
}

// Recursively find all HTML files in a directory
async function findHtmlFiles(dir) {
    const files = await readdir(dir, { withFileTypes: true });
    let htmlFiles = [];

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            // Skip node_modules and other directories
            if (file.name === 'node_modules' || file.name.startsWith('.')) {
                continue;
            }
            const subDirFiles = await findHtmlFiles(fullPath);
            htmlFiles = htmlFiles.concat(subDirFiles);
        } else if (file.name.endsWith('.html')) {
            htmlFiles.push(fullPath);
        }
    }

    return htmlFiles;
}

// Main function to optimize all HTML files
async function optimizeAllHtmlFiles() {
    try {
        const htmlFiles = await findHtmlFiles(__dirname);
        console.log(`Found ${htmlFiles.length} HTML files to optimize`);
        
        let successCount = 0;
        for (const file of htmlFiles) {
            const success = await optimizeHtmlFile(file);
            if (success) successCount++;
        }
        
        console.log(`\nOptimization complete!`);
        console.log(`Successfully optimized ${successCount} of ${htmlFiles.length} files`);
        
        if (successCount < htmlFiles.length) {
            console.log('Some files could not be optimized. Check the logs for errors.');
        }
        
        return successCount === htmlFiles.length;
    } catch (error) {
        console.error('Error during optimization:', error);
        return false;
    }
}

// Run the optimization
optimizeAllHtmlFiles()
    .then(success => {
        if (success) {
            console.log('All files optimized successfully!');
        } else {
            console.log('Optimization completed with some issues.');
        }
    })
    .catch(error => {
        console.error('Fatal error during optimization:', error);
    });
