const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const crypto = require('crypto');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

// Configuration
const CONFIG = {
    // Paths
    criticalCssPath: path.join(__dirname, 'assets', 'css', 'critical.css'),
    performanceJsPath: path.join('assets', 'js', 'performance.js'),
    
    // Cache busting
    cacheBust: true,
    
    // Minification options
    minifyOptions: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
    },
    
    // Logging
    verbose: true
};

// Performance metrics
const metrics = {
    filesProcessed: 0,
    totalSavings: {
        sizeBefore: 0,
        sizeAfter: 0
    },
    startTime: Date.now()
};

// Cache for storing processed files
const fileCache = new Map();

// Generate cache key for a file
function generateCacheKey(filePath, content) {
    const hash = crypto.createHash('md5');
    const stats = fs.statSync(filePath);
    hash.update(content + stats.mtimeMs);
    return hash.digest('hex');
}

// Minify CSS
async function minifyCss(css) {
    const cleanCSS = new CleanCSS({
        level: 2,
        format: 'beautify',
        inline: ['all'],
        rebase: false
    });
    
    const result = await cleanCSS.minify(css);
    return result.styles || css;
}

// Minify JavaScript
async function minifyJs(js) {
    try {
        const result = await minify(js, {
            mangle: true,
            compress: true,
            format: {
                comments: false
            }
        });
        return result.code || js;
    } catch (error) {
        console.error('Error minifying JS:', error);
        return js;
    }
}

// Process and optimize HTML content
async function processHtmlContent(filePath, content) {
    const sizeBefore = Buffer.byteLength(content, 'utf8');
    let optimizedContent = content;
    
    try {
        // 1. Inline critical CSS
        if (optimizedContent.includes('</head>')) {
            try {
                let criticalCss = await readFile(CONFIG.criticalCssPath, 'utf8');
                criticalCss = await minifyCss(criticalCss);
                
                optimizedContent = optimizedContent.replace(
                    '</head>',
                    `<style id="critical-css">${criticalCss}</style>\n    </head>`
                );
            } catch (error) {
                console.warn(`Could not inline critical CSS for ${filePath}:`, error.message);
            }
        }

        // 2. Add performance monitoring
        if (optimizedContent.includes('</body>')) {
            const performanceScript = `
    <!-- Performance Monitoring -->
    <script>
    window.performanceMark = function(markName) {
        if (window.performance && performance.mark) {
            performance.mark(markName);
            
            // Measure time to interactive
            if (markName === 'domInteractive') {
                performance.measure('timeToInteractive', 'navigationStart', 'domInteractive');
                const measure = performance.getEntriesByName('timeToInteractive')[0];
                console.log('Time to interactive:', measure.duration.toFixed(2) + 'ms');
                
                // Send to analytics if available
                if (window.ga) {
                    ga('send', 'timing', 'JS Dependencies', 'interactive', Math.round(measure.duration));
                }
            }
        }
    };
    
    // Mark initial page load
    document.addEventListener('DOMContentLoaded', function() {
        window.performanceMark('domContentLoaded');
    });
    
    window.addEventListener('load', function() {
        window.performanceMark('pageLoaded');
        
        // Load non-critical resources after page is interactive
        const nonCriticalResources = [
            // Add paths to non-critical CSS/JS here
        ];
        
        nonCriticalResources.forEach(function(src) {
            const isCss = src.endsWith('.css');
            const tag = document.createElement(isCss ? 'link' : 'script');
            
            if (isCss) {
                tag.rel = 'stylesheet';
                tag.href = src;
                tag.media = 'print';
                tag.onload = function() { this.media = 'all'; };
            } else {
                tag.src = src;
                tag.async = true;
            }
            
            document.head.appendChild(tag);
        });
    });
    </script>\n`;

            optimizedContent = optimizedContent.replace(
                '</body>',
                `    ${performanceScript}\n    <script src="${CONFIG.performanceJsPath}" defer></script>\n</body>`
            );
        }

        // 3. Optimize resource loading
        optimizedContent = optimizedContent
            // Add preconnect for external domains
            .replace(
                /<link[^>]*href=["']https?:\/\/fonts\.googleapis\.com[^>]*>/g,
                '<link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link rel="dns-prefetch" href="https://fonts.gstatic.com">$&'
            )
            // Add preload for CSS with fallback
            .replace(
                /<link[^>]*href=["'](assets\/(?:vendor|css)\/[^"']+\.css)["'][^>]*>/g,
                (match, href) => {
                    if (match.includes('preload') || match.includes('critical')) {
                        return match;
                    }
                    return `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'" onerror="this.onerror=null;this.rel='stylesheet'">\n    <noscript><link rel="stylesheet" href="${href}"></noscript>`;
                }
            )
            // Optimize images
            .replace(
                /<img([^>]*)src=(["'])(.*?)\2([^>]*)>/g,
                (match, before, quote, src, after) => {
                    // Skip if already processed or is in the header/logo
                    if (match.includes('data-src') || match.includes('header') || match.includes('logo')) {
                        return match;
                    }
                    
                    // Add loading="lazy" for below-the-fold images
                    const loadingAttr = match.includes('loading=') ? '' : ' loading="lazy"';
                    
                    // Add width and height if missing
                    let attrs = before + after;
                    if (!/\swidth=/.test(attrs)) {
                        attrs += ' width="800"';
                    }
                    if (!/\sheight=/.test(attrs)) {
                        attrs += ' height="600"';
                    }
                    
                    // Add srcset if not present
                    if (!/\ssrcset=/.test(attrs)) {
                        const baseSrc = src.replace(/(\.\w+)$/, (_, ext) => `@2x${ext}`);
                        attrs += ` srcset="${src} 1x, ${baseSrc} 2x"`;
                    }
                    
                    // Add decoding and fetchpriority
                    if (!/\sdecoding=/.test(attrs)) {
                        attrs += ' decoding="async"';
                    }
                    
                    // Skip fetchpriority for lazy-loaded images
                    if (loadingAttr.includes('lazy') && !/\sfetchpriority=/.test(attrs)) {
                        attrs += ' fetchpriority="low"';
                    }
                    
                    // Return optimized image tag
                    return `<img src="${src}"${loadingAttr}${attrs}>`;
                }
            );

        // 4. Optimize Google Fonts loading
        const googleFontsRegex = /<link[^>]*href=["']https:\/\/fonts\.googleapis\.com[^>]*>/g;
        if (googleFontsRegex.test(optimizedContent)) {
            optimizedContent = optimizedContent.replace(
                googleFontsRegex,
                '<link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Poppins:wght@400;500;600;700&display=swap">\n    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Poppins:wght@400;500;600;700&display=swap" media="print" onload="this.media=\'all\'">\n    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Poppins:wght@400;500;600;700&display=swap"></noscript>'
            );
        }

        // 5. Add resource hints
        if (optimizedContent.includes('</head>')) {
            const resourceHints = `
    <!-- Preload critical resources -->
    <link rel="preload" href="${path.join('assets', 'css', 'main.css')}" as="style">
    <link rel="preload" href="${path.join('assets', 'js', 'main.js')}" as="script">
    
    <!-- Prefetch DNS for external domains -->
    <link rel="dns-prefetch" href="//www.google-analytics.com">
    <link rel="dns-prefetch" href="//connect.facebook.net">
    
    <!-- Preconnect to required origins -->
    <link rel="preconnect" href="https://www.google-analytics.com">
    <link rel="preconnect" href="https://connect.facebook.net">\n`;
            optimizedContent = optimizedContent.replace('</head>', resourceHints + '    </head>');
        }

        // 6. Add noscript fallback for lazy loading
        if (optimizedContent.includes('</body>')) {
            const noscriptFallback = `
    <noscript>
        <style>
            /* Show all images when JS is disabled */
            img[data-src] {
                display: inline-block !important;
                opacity: 1 !important;
            }
            
            /* Hide loading placeholders */
            img[src*='data:image/svg+xml'] {
                display: none !important;
            }
            
            /* Ensure critical content is visible */
            .lazyload,
            .lazyloading {
                opacity: 1 !important;
                transition: none !important;
            }
        </style>
    </noscript>\n`;
            optimizedContent = optimizedContent.replace('</body>', noscriptFallback + '</body>');
        }
        
        // 7. Minify HTML in production
        if (process.env.NODE_ENV === 'production') {
            optimizedContent = optimizedContent
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                .replace(/\s+/g, ' ')                // Collapse whitespace
                .replace(/>\s+</g, '><');            // Remove whitespace between tags
        }
        
        // Calculate savings
        const sizeAfter = Buffer.byteLength(optimizedContent, 'utf8');
        const savings = sizeBefore - sizeAfter;
        const savingsPercent = ((savings / sizeBefore) * 100).toFixed(2);
        
        // Update metrics
        metrics.filesProcessed++;
        metrics.totalSavings.sizeBefore += sizeBefore;
        metrics.totalSavings.sizeAfter += sizeAfter;
        
        // Log optimization results
        if (CONFIG.verbose) {
            console.log(`✅ Optimized: ${path.basename(filePath)}`);
            console.log(`   Size: ${(sizeBefore / 1024).toFixed(2)} KB → ${(sizeAfter / 1024).toFixed(2)} KB`);
            console.log(`   Savings: ${(savings / 1024).toFixed(2)} KB (${savingsPercent}%)`);
        }
        
        return {
            content: optimizedContent,
            stats: {
                sizeBefore,
                sizeAfter,
                savings,
                savingsPercent
            }
        };
        
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error);
        return {
            content,
            error: error.message,
            stats: {
                sizeBefore,
                sizeAfter: sizeBefore,
                savings: 0,
                savingsPercent: 0
            }
        };
    }
}

// Common optimizations to apply to all HTML files
async function optimizeHtmlFile(filePath) {
    try {
        // Skip if not an HTML file
        if (!filePath.endsWith('.html')) {
            return false;
        }
        
        // Read the file content
        const content = await readFile(filePath, 'utf8');
        
        // Check if file has changed since last optimization
        const cacheKey = generateCacheKey(filePath, content);
        if (fileCache.has(cacheKey)) {
            if (CONFIG.verbose) {
                console.log(`ℹ️  Skipping (no changes): ${path.basename(filePath)}`);
            }
            return true;
        }
        
        // Process the HTML content
        const result = await processHtmlContent(filePath, content);
        
        // Skip if there was an error and we couldn't optimize
        if (result.error) {
            throw new Error(result.error);
        }
        
        // Create backup if enabled
        if (CONFIG.backup) {
            const backupPath = `${filePath}.bak`;
            await writeFile(backupPath, content, 'utf8');
        }
        
        // Write the optimized content back to the file
        await writeFile(filePath, result.content, 'utf8');
        
        // Update cache
        fileCache.set(cacheKey, true);
        
        return true;
        
    } catch (error) {
        console.error(`❌ Error optimizing ${filePath}:`, error);
        return false;
    }
}

// Recursively find all HTML files in a directory
async function findHtmlFiles(dir, fileList = []) {
    try {
        const files = await readdir(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const fileStat = await stat(filePath);
            
            if (fileStat.isDirectory()) {
                // Skip common directories that don't contain HTML files we need to optimize
                const skipDirs = [
                    'node_modules',
                    '.git',
                    '.github',
                    '.vscode',
                    'dist',
                    'build',
                    'cache',
                    'temp',
                    'backups',
                    'assets',
                    'images',
                    'fonts',
                    'vendor'
                ];
                
                if (!skipDirs.includes(file) && !file.startsWith('.')) {
                    await findHtmlFiles(filePath, fileList);
                }
            } else if (file.endsWith('.html') && !file.endsWith('.min.html')) {
                // Skip already minified files
                fileList.push(filePath);
            }
        }
        
        return fileList;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Directory not found: ${dir}`);
            return [];
        }
        throw error;
    }
}

// Create a backup of a file
async function backupFile(filePath) {
    try {
        const backupPath = `${filePath}.${Date.now()}.bak`;
        await fs.copyFile(filePath, backupPath);
        return backupPath;
    } catch (error) {
        console.error(`Failed to create backup for ${filePath}:`, error);
        return null;
    }
}

// Main function to optimize all HTML files
async function optimizeAllHtmlFiles() {
    try {
        console.log('🚀 Starting HTML optimization...\n');
        
        // Initialize metrics
        metrics.startTime = Date.now();
        
        // Find all HTML files
        const htmlFiles = await findHtmlFiles(__dirname);
        
        if (htmlFiles.length === 0) {
            console.log('No HTML files found to optimize.');
            return true;
        }
        
        console.log(`🔍 Found ${htmlFiles.length} HTML files to optimize...\n`);
        
        // Process each file
        let successCount = 0;
        const failedFiles = [];
        
        for (const [index, file] of htmlFiles.entries()) {
            const relativePath = path.relative(process.cwd(), file);
            console.log(`📄 [${index + 1}/${htmlFiles.length}] Processing: ${relativePath}`);
            
            try {
                const success = await optimizeHtmlFile(file);
                
                if (success) {
                    successCount++;
                    console.log('✅ Success\n');
                } else {
                    failedFiles.push(file);
                    console.log('❌ Failed\n');
                }
            } catch (error) {
                console.error(`❌ Error processing ${file}:`, error);
                failedFiles.push(file);
            }
        }
        
        // Calculate total metrics
        const totalTime = (Date.now() - metrics.startTime) / 1000;
        const totalSavings = metrics.totalSavings.sizeBefore - metrics.totalSavings.sizeAfter;
        const totalSavingsPercent = (totalSavings / metrics.totalSavings.sizeBefore * 100).toFixed(2);
        
        // Print summary
        console.log('\n🎉 Optimization Summary:');
        console.log('='.repeat(50));
        console.log(`📊 Files Processed: ${metrics.filesProcessed} of ${htmlFiles.length}`);
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${failedFiles.length}`);
        console.log(`⏱  Total Time: ${totalTime.toFixed(2)}s`);
        console.log(`📦 Total Size Before: ${(metrics.totalSavings.sizeBefore / 1024).toFixed(2)} KB`);
        console.log(`📦 Total Size After: ${(metrics.totalSavings.sizeAfter / 1024).toFixed(2)} KB`);
        console.log(`💾 Total Savings: ${(totalSavings / 1024).toFixed(2)} KB (${totalSavingsPercent}%)`);
        
        // List failed files if any
        if (failedFiles.length > 0) {
            console.log('\n❌ Failed to optimize the following files:');
            failedFiles.forEach((file, index) => {
                console.log(`  ${index + 1}. ${path.relative(process.cwd(), file)}`);
            });
        }
        
        // Save metrics to a file
        const metricsFile = path.join(__dirname, 'optimization-metrics.json');
        const metricsData = {
            timestamp: new Date().toISOString(),
            duration: totalTime,
            files: {
                total: htmlFiles.length,
                successful: successCount,
                failed: failedFiles.length,
                failedFiles
            },
            size: {
                before: metrics.totalSavings.sizeBefore,
                after: metrics.totalSavings.sizeAfter,
                savings: totalSavings,
                savingsPercent: parseFloat(totalSavingsPercent)
            },
            settings: CONFIG
        };
        
        await writeFile(metricsFile, JSON.stringify(metricsData, null, 2), 'utf8');
        console.log(`\n📊 Metrics saved to: ${path.relative(process.cwd(), metricsFile)}`);
        
        return failedFiles.length === 0;
        
    } catch (error) {
        console.error('❌ Error during optimization:', error);
        return false;
    }
}

// Handle command line arguments
function parseArguments() {
    const args = process.argv.slice(2);
    
    args.forEach(arg => {
        if (arg === '--verbose' || arg === '-v') {
            CONFIG.verbose = true;
        } else if (arg === '--no-cache') {
            CONFIG.cacheBust = false;
        } else if (arg === '--backup' || arg === '-b') {
            CONFIG.backup = true;
        }
    });
}

// Main execution
(async () => {
    try {
        // Parse command line arguments
        parseArguments();
        
        // Set environment if not set
        if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = 'production';
        }
        
        console.log(`🔧 Starting optimization in ${process.env.NODE_ENV} mode...`);
        console.log(`📁 Root directory: ${__dirname}\n`);
        
        // Run optimization
        const success = await optimizeAllHtmlFiles();
        
        // Exit with appropriate status code
        process.exit(success ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Unhandled error:', error);
        process.exit(1);
    }
})();
