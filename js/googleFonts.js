/**
 * Google Fonts Integration
 * Fetches and manages Google Fonts for use in the 3D Sign Creator
 */
class GoogleFontsManager {
    constructor() {
        // Remove API key and URL for Google Fonts API
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
            // Use only local and system fonts
            this.fonts = [...this.localFonts, ...this.systemFonts];
            console.log(`Using ${this.fonts.length} local and system fonts`);
            return this.fonts;
        } catch (error) {
            console.error('Error loading fonts:', error);
            
            // Fallback to just local fonts if there's an error
            this.fonts = [...this.localFonts];
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
     * Note: This method is kept for compatibility but now returns null
     * @param {string} family - Font family name
     * @param {Array} variants - Array of font variants to load
     * @returns {string|null} - URL to load the font or null if unavailable
     */
    getFontUrl(family, variants = ['regular', '700']) {
        // No longer access Google Fonts API
        return null;
    }

    /**
     * Load a Google Font into the document
     * Note: Now only uses local/system fonts
     * @param {string} family - Font family name
     * @param {Array} variants - Array of font variants to load
     * @returns {Promise} - Resolves when the font is loaded
     */
    loadFont(family, variants = ['regular', '700']) {
        return new Promise((resolve) => {
            // Check if it's one of our local or system fonts
            const localFont = this.localFonts.find(f => f.family === family);
            const systemFont = this.systemFonts.find(f => f.family === family);
            
            if (localFont || systemFont) {
                console.log(`Using local/system font: ${family}`);
                resolve(family);
                return;
            }
            
            // For non-local fonts, resolve with the font name but log a warning
            console.warn(`Font "${family}" not found, using system fallback`);
            resolve(family);
        });
    }

    /**
     * Download a font file and cache it for opentype.js
     * Note: Now only handles local files
     * @param {string} url - URL to the font file
     * @returns {Promise<ArrayBuffer>} - Resolves with the font data
     */
    async downloadFontFile(url) {
        if (this.cachedFontFiles[url]) {
            return this.cachedFontFiles[url];
        }

        try {
            // Only handle local files (those that don't start with http)
            if (url.startsWith('http')) {
                throw new Error('Remote font downloading is disabled');
            }
            
            console.log(`Loading local font file: ${url}`);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to load font: ${response.status} ${response.statusText}`);
            }
            
            const fontData = await response.arrayBuffer();
            this.cachedFontFiles[url] = fontData;
            return fontData;
        } catch (error) {
            console.error('Error loading font:', error);
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
            
            // No Google Fonts available anymore, use Roboto as fallback
            console.log(`Font "${family}" not found, using Roboto Regular as fallback`);
            return 'fonts/Roboto-Regular.ttf';
        } catch (error) {
            console.error('Error getting web font:', error);
            // Fallback to Roboto
            return 'fonts/Roboto-Regular.ttf';
        }
    }
} 