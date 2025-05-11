/**
 * Google Fonts Integration
 * Fetches and manages Google Fonts for use in the 3D Sign Creator
 */
class GoogleFontsManager {
    constructor() {
        this.apiKey = 'AIzaSyAOES8EmKhuJEnsn9kS1XKBpxxp-TgN0Rg'; // This is a restricted API key for demonstration
        this.apiUrl = `https://www.googleapis.com/webfonts/v1/webfonts?key=${this.apiKey}`;
        this.fonts = [];
        this.categories = ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'];
        this.popularFonts = [
            'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 
            'Source Sans Pro', 'Slabo 27px', 'Raleway', 'PT Sans', 'Merriweather',
            'Ubuntu', 'Playfair Display', 'Rubik', 'Poppins', 'Dancing Script'
        ];

        // Cached fonts that have been downloaded
        this.cachedFontFiles = {};

        // Add our local fonts for guaranteed options
        this.localFonts = this.convertLocalFonts(LocalFontsCollection.getBundledFonts());
        
        // If we have the LocalFontsCollection, pre-populate with system fonts
        if (typeof LocalFontsCollection !== 'undefined') {
            this.systemFonts = this.convertLocalFonts(LocalFontsCollection.getSystemFonts());
        } else {
            this.systemFonts = [];
        }
    }
    
    /**
     * Convert local fonts to Google Fonts API format
     * @param {Array} fonts - Array of local font objects
     * @returns {Array} - Array of converted font objects
     */
    convertLocalFonts(fonts) {
        return fonts.map(font => {
            return {
                family: font.displayName || font.family,
                category: font.category || 'sans-serif',
                variants: font.variants || ['regular'],
                files: font.url ? { regular: font.url } : null,
                isLocal: true
            };
        });
    }

    /**
     * Fetch the list of available Google Fonts
     * @returns {Promise} - Resolves with the list of fonts
     */
    async fetchFontsList() {
        try {
            // Add local fonts first to ensure we always have options
            this.fonts = [...this.localFonts];
            
            // Then try to fetch from Google
            const response = await fetch(this.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Add Google Fonts
            this.fonts = [...this.localFonts, ...data.items];
            console.log(`Successfully loaded ${this.fonts.length} fonts (including ${this.localFonts.length} local fonts)`);
            return this.fonts;
        } catch (error) {
            console.error('Error fetching Google Fonts:', error);
            console.log('Using local and system fonts instead');
            
            // Use local and system fonts if API fails
            this.fonts = [...this.localFonts, ...this.systemFonts];
            console.log(`Using ${this.fonts.length} local fonts`);
            return this.fonts;
        }
    }

    /**
     * Get a subset of fonts (popular fonts or by category)
     * @param {string} category - Optional category to filter by
     * @param {number} limit - Maximum number of fonts to return
     * @returns {Array} - Array of font objects
     */
    getFonts(category = null, limit = 50) {
        if (this.fonts.length === 0) {
            // If fonts haven't been loaded yet, return local fonts
            return this.localFonts;
        }
        
        let filteredFonts = this.fonts;
        
        if (category === 'popular') {
            // If we only have local/system fonts, return all of them
            if (this.fonts.length <= this.localFonts.length + this.systemFonts.length) {
                return this.fonts;
            }
            
            // Otherwise filter by popular fonts
            filteredFonts = this.fonts.filter(font => 
                this.popularFonts.includes(font.family) || font.isLocal
            );
        } else if (category && this.categories.includes(category)) {
            filteredFonts = this.fonts.filter(font => 
                font.category === category
            );
        }
        
        return filteredFonts.slice(0, limit);
    }

    /**
     * Generate the CSS link for a Google Font
     * @param {string} family - Font family name
     * @param {Array} variants - Array of font variants to load
     * @returns {string} - URL to load the font
     */
    getFontUrl(family, variants = ['regular', '700']) {
        const familyParam = family.replace(/ /g, '+');
        const variantsParam = variants.join(',');
        return `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${variantsParam}&display=swap`;
    }

    /**
     * Load a Google Font into the document
     * @param {string} family - Font family name
     * @param {Array} variants - Array of font variants to load
     * @returns {Promise} - Resolves when the font is loaded
     */
    loadFont(family, variants = ['regular', '700']) {
        return new Promise((resolve, reject) => {
            // If it's one of our local fonts, resolve immediately
            const localFont = this.localFonts.find(f => f.family === family);
            const systemFont = this.systemFonts.find(f => f.family === family);
            
            if (localFont || systemFont) {
                console.log(`Using local/system font: ${family}`);
                resolve(family);
                return;
            }
            
            const link = document.createElement('link');
            link.href = this.getFontUrl(family, variants);
            link.rel = 'stylesheet';
            
            link.onload = () => {
                // Create a dummy element to trigger font loading
                const testElement = document.createElement('div');
                testElement.style.fontFamily = family;
                testElement.style.opacity = '0';
                testElement.textContent = 'Font loaded';
                document.body.appendChild(testElement);
                
                // Give the font some time to load
                setTimeout(() => {
                    document.body.removeChild(testElement);
                    resolve(family);
                }, 100);
            };
            
            link.onerror = () => {
                console.warn(`Failed to load font: ${family}, falling back to system font`);
                // Resolve anyway to allow the UI to continue
                resolve(family);
            };
            
            document.head.appendChild(link);
        });
    }

    /**
     * Download a font file and cache it for opentype.js
     * @param {string} url - URL to the font file
     * @returns {Promise<ArrayBuffer>} - Resolves with the font data
     */
    async downloadFontFile(url) {
        if (this.cachedFontFiles[url]) {
            return this.cachedFontFiles[url];
        }

        try {
            console.log(`Downloading font file from: ${url}`);
            const response = await fetch(url, { 
                mode: 'cors', 
                credentials: 'omit',
                redirect: 'follow'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to download font: ${response.status} ${response.statusText}`);
            }
            
            const fontData = await response.arrayBuffer();
            this.cachedFontFiles[url] = fontData;
            return fontData;
        } catch (error) {
            console.error('Error downloading font:', error);
            throw error;
        }
    }

    /**
     * Get web font CSS for use with opentype.js
     * @param {string} family - Font family name
     * @returns {Promise} - Resolves with the font data or url
     */
    async getWebFont(family) {
        try {
            // Check if it's a local font first (bundled with the app)
            const localFont = this.localFonts.find(f => f.family === family);
            if (localFont && localFont.files && localFont.files.regular) {
                console.log(`Using local bundled font: ${family} (${localFont.files.regular})`);
                return localFont.files.regular;
            }
            
            // Check if it's a system font
            const systemFont = this.systemFonts.find(f => f.family === family);
            if (systemFont) {
                // For system fonts, we can't get a direct file URL,
                // so use Roboto as a fallback
                console.log(`Using bundled font for system font: ${family}`);
                return 'fonts/Roboto-Regular.ttf';
            }
            
            // Find the font in the Google Fonts list
            const fontInfo = this.fonts.find(f => f.family === family);
            if (!fontInfo) {
                console.warn(`Font family "${family}" not found, using Roboto Regular`);
                return 'fonts/Roboto-Regular.ttf';
            }
            
            // Get regular variant (or the first available)
            const variant = fontInfo.variants.includes('regular') 
                ? 'regular' 
                : fontInfo.variants[0];
            
            // Check if we have a direct URL to the font file
            if (!fontInfo.files || !fontInfo.files[variant]) {
                console.warn(`No suitable file found for ${family}, using Roboto Regular`);
                return 'fonts/Roboto-Regular.ttf';
            }
            
            const fontUrl = fontInfo.files[variant];
            console.log(`Using Google Font: ${family} (${fontUrl})`);
            
            // At this point, we have a Google font URL
            // Return the URL directly - don't try to download it as it may cause CORS issues
            return fontUrl;
        } catch (error) {
            console.error('Error getting web font:', error);
            // Fallback to Roboto
            return 'fonts/Roboto-Regular.ttf';
        }
    }
} 