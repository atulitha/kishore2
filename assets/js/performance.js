/**
 * Performance Optimization Script
 * This script handles lazy loading, performance monitoring, and other optimizations
 */

// Performance monitoring
function initPerformanceMonitoring() {
    if (window.performance) {
        // Log navigation timing
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        console.log('Page load time: ' + loadTime + 'ms');
        
        // Log slow resources
        if (performance.getEntriesByType) {
            performance.getEntriesByType('resource').forEach(resource => {
                if (resource.duration > 1000) {
                    console.warn('Slow resource load:', resource.name, 'took', Math.round(resource.duration) + 'ms');
                }
            });
        }
    }
}

// Lazy load images and iframes
function initLazyLoading() {
    const lazyMedia = [];
    
    // Find all lazy-load elements
    document.querySelectorAll('img[data-src], iframe[data-src]').forEach(el => {
        lazyMedia.push(el);
    });

    if ('IntersectionObserver' in window) {
        const lazyMediaObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const media = entry.target;
                    if (media.tagName === 'IMG') {
                        media.src = media.dataset.src;
                        if (media.dataset.srcset) media.srcset = media.dataset.srcset;
                    } else if (media.tagName === 'IFRAME') {
                        media.src = media.dataset.src;
                    }
                    media.removeAttribute('data-src');
                    media.removeAttribute('data-srcset');
                    lazyMediaObserver.unobserve(media);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        lazyMedia.forEach(media => {
            lazyMediaObserver.observe(media);
        });
    } else {
        // Fallback for browsers without IntersectionObserver
        let active = false;
        const lazyLoad = function() {
            if (active === false) {
                active = true;
                setTimeout(() => {
                    lazyMedia.forEach(media => {
                        if ((media.getBoundingClientRect().top <= window.innerHeight && 
                             media.getBoundingClientRect().bottom >= 0) &&
                             getComputedStyle(media).display !== 'none') {
                            if (media.tagName === 'IMG') {
                                media.src = media.dataset.src;
                                if (media.dataset.srcset) media.srcset = media.dataset.srcset;
                            } else if (media.tagName === 'IFRAME') {
                                media.src = media.dataset.src;
                            }
                            media.removeAttribute('data-src');
                            media.removeAttribute('data-srcset');
                        }
                    });
                    
                    if (lazyMedia.length === 0) {
                        document.removeEventListener('scroll', lazyLoad);
                        window.removeEventListener('resize', lazyLoad);
                        window.removeEventListener('orientationchange', lazyLoad);
                    }
                    active = false;
                }, 200);
            }
        };

        document.addEventListener('scroll', lazyLoad);
        window.addEventListener('resize', lazyLoad);
        window.addEventListener('orientationchange', lazyLoad);
        lazyLoad();
    }
}

// Optimize WebFont loading
function optimizeFontLoading() {
    // Load WebFont loader
    WebFontConfig = {
        google: {
            families: ['Roboto:300,400,500,700', 'Poppins:400,500,600,700']
        },
        timeout: 2000
    };
    
    // Load WebFont loader asynchronously
    (function(d) {
        const wf = d.createElement('script');
        const s = d.scripts[0];
        wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
        wf.async = true;
        s.parentNode.insertBefore(wf, s);
    })(document);
}

// Initialize all optimizations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initPerformanceMonitoring();
    initLazyLoading();
    
    // Only load WebFont if not already loaded
    if (typeof WebFont === 'undefined') {
        optimizeFontLoading();
    }
});

// Handle browser back/forward cache (bfcache)
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        // Page was restored from bfcache, reinitialize lazy loading
        initLazyLoading();
    }
});
