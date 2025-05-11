/**
 * Font Manager
 * Handles font loading, font selection UI, and path generation from text
 */
class FontManager {
    constructor() {
        this.fonts = [];
        this.loadedFonts = {};
        this.currentFont = null;
        this.fontPickerContainer = document.querySelector('.font-picker-container');
        this.initializeFontList();
    }

    /**
     * Initialize the font list and populate the selector
     */
    async initializeFontList() {
        // Instead of hardcoding the fonts, let's use the LocalFontsCollection
        this.fonts = LocalFontsCollection.getBundledFonts().map(font => {
            return {
                name: font.displayName,
                url: font.url,
                category: font.category || 'sans-serif'
            };
        });

        // Sort fonts by name within each category
        this.fonts.sort((a, b) => {
            // First sort by category
            if (a.category !== b.category) {
                // Define category order
                const categoryOrder = {
                    'sans-serif': 1,
                    'serif': 2, 
                    'monospace': 3,
                    'display': 4,
                    'handwriting': 5
                };
                return (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
            }
            // Then sort by name within category
            return a.name.localeCompare(b.name);
        });

        // Preload the first font
        if (this.fonts.length > 0) {
            try {
                await this.loadFont(this.fonts[0].url);
                this.currentFont = this.fonts[0];
                console.log(`Default font "${this.fonts[0].name}" loaded`);
            } catch (error) {
                console.error('Failed to load default font:', error);
            }
        }
        
        // Initialize the font picker with the current FontManager instance
        this.fontPicker = new FontPicker(this.fontPickerContainer, this, this.onFontSelected.bind(this));
    }

    /**
     * Group fonts by category
     * @returns {Object} - Object with category keys and arrays of fonts as values
     */
    getFontsByCategory() {
        const categories = {};
        
        this.fonts.forEach(font => {
            const category = font.category || 'sans-serif';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(font);
        });
        
        return categories;
    }

    /**
     * Called when a font is selected from the font picker
     * @param {Object} fontData - Data about the selected font
     */
    async onFontSelected(fontData) {
        try {
            console.log(`Loading font from URL: ${fontData.url}`);
            if (!this.loadedFonts[fontData.url]) {
                await this.loadFont(fontData.url);
            }
            
            this.currentFont = fontData;
            console.log(`Font "${fontData.name}" selected`);
            
            // Trigger preview update
            const event = new CustomEvent('fontChanged', { 
                detail: { font: fontData } 
            });
            document.dispatchEvent(event);
            
        } catch (error) {
            console.error(`Failed to load font "${fontData.name}":`, error);
            document.getElementById('error-message').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('error-message').classList.add('hidden');
            }, 3000);
        }
    }

    /**
     * Load a font file using opentype.js
     * @param {string} url - URL to the font file
     * @returns {Promise} - Resolves with the loaded font
     */
    async loadFont(url) {
        return new Promise((resolve, reject) => {
            console.log(`Starting to load font from ${url}`);
            opentype.load(url, (err, font) => {
                if (err) {
                    console.error(`Error loading font from ${url}:`, err);
                    reject(err);
                    return;
                }
                
                console.log(`Successfully loaded font from ${url}`);
                this.loadedFonts[url] = font;
                resolve(font);
            });
        });
    }

    /**
     * Get the currently selected font
     * @returns {Object} - The currently selected font
     */
    getCurrentFont() {
        return this.currentFont;
    }

    /**
     * Get the opentype.js font object for the currently selected font
     * @returns {Object} - The opentype.js font object
     */
    getCurrentFontObject() {
        if (!this.currentFont) return null;
        return this.loadedFonts[this.currentFont.url];
    }

    /**
     * Generate SVG path data from text using the current font
     * @param {string} text - The text to convert to path data
     * @param {number} fontSize - The font size to use
     * @param {number} letterSpacing - Letter spacing in pixels
     * @returns {Object} - SVG path data and bounds
     */
    generateTextPath(text, fontSize = 72, letterSpacing = 0) {
        const fontObject = this.getCurrentFontObject();
        if (!fontObject || !text) {
            return { paths: [], bounds: null };
        }
        
        try {
            // Apply letter spacing by manually positioning each character
            let x = 0;
            const combinedPaths = [];
            const characters = text.split('');
            
            for (let i = 0; i < characters.length; i++) {
                const char = characters[i];
                if (char === ' ') {
                    // Handle spaces - just advance the position
                    x += fontObject.getAdvanceWidth(' ', fontSize) + letterSpacing;
                    continue;
                }
                
                // Create individual character path
                const charPath = fontObject.getPath(char, x, 0, fontSize);
                x += fontObject.getAdvanceWidth(char, fontSize) + letterSpacing;
                
                // Convert to SVG path data
                const svgPath = charPath.toSVG(2);
                combinedPaths.push(svgPath.replace(/^<path d="([^"]+)".*$/, '$1'));
            }
            
            // Use fixed outline settings since UI elements were removed
            const outlineColor = '#000000';
            const outlineThickness = 20;
            
            // Calculate bounds manually
            const totalWidth = x - letterSpacing; // Subtract the last added spacing
            const fontAscent = fontObject.ascender / fontObject.unitsPerEm * fontSize;
            const fontDescent = Math.abs(fontObject.descender) / fontObject.unitsPerEm * fontSize;
            const bounds = {
                x1: 0,
                y1: -fontAscent,
                x2: totalWidth,
                y2: fontDescent
            };
            
            // If no characters were processed, return empty result
            if (combinedPaths.length === 0) {
                return { paths: [], bounds: null };
            }
            
            // Create path data with combined paths
            return {
                paths: [{ 
                    path: combinedPaths.join(' '),
                    fill: '#000000',
                    stroke: outlineColor,
                    strokeWidth: outlineThickness
                }],
                bounds: bounds
            };
        } catch (error) {
            console.error('Error generating text path:', error);
            return { paths: [], bounds: null };
        }
    }
}