/**
 * Font Picker Component
 * Provides a UI for selecting from Google Fonts and local fonts
 */
class FontPicker {
    constructor(container, fontManager, onFontSelected) {
        this.container = container;
        this.fontManager = fontManager;
        this.onFontSelected = onFontSelected;
        this.googleFontsManager = new GoogleFontsManager();
        this.selectedFont = null;
        this.isModalOpen = false;
        this.loadedPreviewFonts = new Set();
        
        this.init();
    }
    
    /**
     * Initialize the font picker UI
     */
    async init() {
        // Create selected font display element
        this.createSelectedFontDisplay();
        
        // Create modal container (hidden initially)
        this.createModalContainer();
        
        // Load Google Fonts
        await this.loadGoogleFonts();
    }
    
    /**
     * Create the selected font display element
     */
    createSelectedFontDisplay() {
        this.selectedFontDisplay = document.createElement('div');
        this.selectedFontDisplay.className = 'font-selected-display';
        this.selectedFontDisplay.textContent = 'Select Font';
        this.selectedFontDisplay.addEventListener('click', () => this.openModal());
        
        // Replace the existing select element
        const existingSelect = this.container.querySelector('select');
        if (existingSelect) {
            this.container.replaceChild(this.selectedFontDisplay, existingSelect);
        } else {
            this.container.appendChild(this.selectedFontDisplay);
        }
    }
    
    /**
     * Create the modal container
     */
    createModalContainer() {
        this.modal = document.createElement('div');
        this.modal.className = 'font-picker-modal hidden';
        
        const content = document.createElement('div');
        content.className = 'font-picker-content';
        
        // Header with search and category filter
        const header = document.createElement('div');
        header.className = 'font-picker-header';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'font-picker-search';
        searchInput.placeholder = 'Search fonts...';
        searchInput.addEventListener('input', (e) => this.searchFonts(e.target.value));
        
        const categorySelect = document.createElement('select');
        categorySelect.className = 'font-picker-category';
        
        const categories = [
            { value: 'all', label: 'All Fonts' },
            { value: 'sans-serif', label: 'Sans Serif' },
            { value: 'serif', label: 'Serif' },
            { value: 'monospace', label: 'Monospace' },
            { value: 'display', label: 'Display' },
            { value: 'handwriting', label: 'Handwriting' }
        ];
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = cat.label;
            categorySelect.appendChild(option);
        });
        
        categorySelect.addEventListener('change', (e) => this.filterFontsByCategory(e.target.value));
        
        header.appendChild(searchInput);
        header.appendChild(categorySelect);
        
        // Font list container
        this.fontListContainer = document.createElement('div');
        this.fontListContainer.className = 'font-list';
        
        // Loading indicator
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.className = 'font-loading';
        this.loadingIndicator.innerHTML = '<div class="font-loading-spinner"></div><span>Loading fonts...</span>';
        this.fontListContainer.appendChild(this.loadingIndicator);
        
        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'font-picker-buttons';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'font-picker-btn secondary';
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => this.closeModal());
        
        const applyButton = document.createElement('button');
        applyButton.className = 'font-picker-btn primary';
        applyButton.textContent = 'Apply';
        applyButton.addEventListener('click', () => this.applySelectedFont());
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(applyButton);
        
        // Assemble modal content
        content.appendChild(header);
        content.appendChild(this.fontListContainer);
        content.appendChild(buttonContainer);
        
        this.modal.appendChild(content);
        document.body.appendChild(this.modal);
    }
    
    /**
     * Load Google Fonts
     */
    async loadGoogleFonts() {
        try {
            this.fontListContainer.innerHTML = '';
            this.loadingIndicator = document.createElement('div');
            this.loadingIndicator.className = 'font-loading';
            this.loadingIndicator.innerHTML = '<div class="font-loading-spinner"></div><span>Loading fonts...</span>';
            this.fontListContainer.appendChild(this.loadingIndicator);
            
            await this.googleFontsManager.fetchFontsList();
            
            // Check if we got any fonts
            if (this.googleFontsManager.fonts.length === 0) {
                throw new Error('No fonts found');
            }
            
            // Get all bundled fonts first - these are guaranteed to work
            const bundledFonts = this.fontManager.fonts;
            
            // Render the bundled fonts first
            this.renderFontList(bundledFonts);
            
        } catch (error) {
            console.error('Failed to load Google Fonts:', error);
            
            // Try to load local fonts as a fallback
            const localFonts = this.googleFontsManager.localFonts;
            if (localFonts && localFonts.length > 0) {
                this.renderFontList(localFonts);
            } else {
                this.fontListContainer.innerHTML = '<div style="padding: 20px; text-align: center;">Failed to load fonts. Please try restarting the application.</div>';
            }
        }
    }
    
    /**
     * Render the font list
     * @param {Array} fonts - Array of font objects to render
     */
    renderFontList(fonts) {
        this.fontListContainer.innerHTML = '';
        
        if (!fonts || fonts.length === 0) {
            this.fontListContainer.innerHTML = '<div style="padding: 20px; text-align: center;">No fonts found. Please try restarting the application.</div>';
            return;
        }
        
        // Group fonts by category for better organization
        const fontsByCategory = {};
        fonts.forEach(font => {
            const category = font.category || 'sans-serif';
            if (!fontsByCategory[category]) {
                fontsByCategory[category] = [];
            }
            fontsByCategory[category].push(font);
        });
        
        // Create category headers and font items
        const categoryOrder = ['sans-serif', 'serif', 'monospace', 'display', 'handwriting'];
        const categoryLabels = {
            'sans-serif': 'Sans Serif',
            'serif': 'Serif',
            'monospace': 'Monospace',
            'display': 'Display',
            'handwriting': 'Handwriting'
        };
        
        // Create a fragment to improve performance
        const fragment = document.createDocumentFragment();
        
        // Add fonts by category in the specified order
        categoryOrder.forEach(category => {
            const fontsInCategory = fontsByCategory[category];
            
            if (fontsInCategory && fontsInCategory.length > 0) {
                // Add category header
                const categoryHeader = document.createElement('div');
                categoryHeader.className = 'font-category-header';
                categoryHeader.textContent = categoryLabels[category] || category;
                fragment.appendChild(categoryHeader);
                
                // Add fonts in this category
                fontsInCategory.forEach(font => {
                    const fontItem = this.createFontItem(font);
                    fragment.appendChild(fontItem);
                });
            }
        });
        
        // Add any remaining categories not in our predefined order
        Object.keys(fontsByCategory).forEach(category => {
            if (!categoryOrder.includes(category)) {
                const fontsInCategory = fontsByCategory[category];
                
                // Add category header
                const categoryHeader = document.createElement('div');
                categoryHeader.className = 'font-category-header';
                categoryHeader.textContent = categoryLabels[category] || category;
                fragment.appendChild(categoryHeader);
                
                // Add fonts in this category
                fontsInCategory.forEach(font => {
                    const fontItem = this.createFontItem(font);
                    fragment.appendChild(fontItem);
                });
            }
        });
        
        this.fontListContainer.appendChild(fragment);
    }
    
    /**
     * Create a font item element
     * @param {Object} font - Font object
     * @returns {HTMLElement} - Font item element
     */
    createFontItem(font) {
        const fontItem = document.createElement('div');
        fontItem.className = 'font-item';
        fontItem.setAttribute('data-font-family', font.family || font.name);
        fontItem.setAttribute('data-category', font.category || 'sans-serif');
        
        const fontName = document.createElement('div');
        fontName.className = 'font-name';
        fontName.textContent = font.family || font.name;
        
        const fontPreview = document.createElement('div');
        fontPreview.className = 'font-preview';
        fontPreview.textContent = 'The quick brown fox jumps over the lazy dog';
        
        // For local fonts, set the font family directly
        const isLocalFont = font.isLocal || (font.url && font.url.startsWith('fonts/'));
        
        if (isLocalFont) {
            // For bundled fonts that we have direct access to
            if (font.url && font.url.includes('Roboto')) {
                if (font.url.includes('Bold')) {
                    fontPreview.style.fontFamily = 'Roboto, sans-serif';
                    fontPreview.style.fontWeight = 'bold';
                } else if (font.url.includes('Light')) {
                    fontPreview.style.fontFamily = 'Roboto, sans-serif';
                    fontPreview.style.fontWeight = '300';
                } else {
                    fontPreview.style.fontFamily = 'Roboto, sans-serif';
                }
            } else if (font.url && font.url.includes('Ubuntu')) {
                // Handle Ubuntu fonts
                if (font.url.includes('Bold')) {
                    fontPreview.style.fontWeight = 'bold';
                }
                if (font.url.includes('Italic')) {
                    fontPreview.style.fontStyle = 'italic';
                }
                if (font.url.includes('Mono')) {
                    fontPreview.style.fontFamily = 'Ubuntu Mono, monospace';
                } else {
                    fontPreview.style.fontFamily = 'Ubuntu, sans-serif';
                }
            } else {
                // For other local fonts, use the family name directly
                fontPreview.style.fontFamily = `"${font.family || font.name}", sans-serif`;
            }
            
            this.loadedPreviewFonts.add(font.family || font.name);
        } else {
            // For Google Fonts, load them dynamically
            fontPreview.style.fontFamily = `"${font.family || font.name}", sans-serif`;
            
            // Load font for preview if not already loaded
            if (!this.loadedPreviewFonts.has(font.family || font.name)) {
                // Apply a default font initially
                fontPreview.style.fontFamily = 'sans-serif';
                
                // Load the font
                this.googleFontsManager.loadFont(font.family || font.name)
                    .then(() => {
                        fontPreview.style.fontFamily = `"${font.family || font.name}", sans-serif`;
                        this.loadedPreviewFonts.add(font.family || font.name);
                    })
                    .catch(err => {
                        console.error(`Failed to load font preview for ${font.family || font.name}:`, err);
                        // Set a default font if loading fails
                        fontPreview.style.fontFamily = 'sans-serif';
                    });
            }
        }
        
        fontItem.appendChild(fontName);
        fontItem.appendChild(fontPreview);
        
        // Selection handling
        fontItem.addEventListener('click', () => {
            const previously = this.fontListContainer.querySelector('.font-item.selected');
            if (previously) {
                previously.classList.remove('selected');
            }
            fontItem.classList.add('selected');
            this.selectedFont = font;
        });
        
        return fontItem;
    }
    
    /**
     * Filter fonts by category
     * @param {string} category - Category to filter by
     */
    filterFontsByCategory(category) {
        // First, find all font items
        const fontItems = this.fontListContainer.querySelectorAll('.font-item');
        const categoryHeaders = this.fontListContainer.querySelectorAll('.font-category-header');
        
        if (category === 'all') {
            // Show all fonts and headers
            fontItems.forEach(item => item.style.display = 'flex');
            categoryHeaders.forEach(header => header.style.display = 'block');
        } else {
            // Show only fonts in the selected category
            let lastHeader = null;
            let hasVisibleFonts = false;
            
            // Hide all headers initially
            categoryHeaders.forEach(header => header.style.display = 'none');
            
            // Process each font item
            fontItems.forEach(item => {
                const fontCategory = item.getAttribute('data-category');
                
                if (fontCategory === category) {
                    item.style.display = 'flex';
                    hasVisibleFonts = true;
                    
                    // Find the header for this category
                    const prevElem = item.previousElementSibling;
                    if (prevElem && prevElem.classList.contains('font-category-header')) {
                        prevElem.style.display = 'block';
                    }
                } else {
                    item.style.display = 'none';
                }
            });
            
            // If no fonts are visible, show a message
            if (!hasVisibleFonts) {
                this.fontListContainer.innerHTML = '<div style="padding: 20px; text-align: center;">No fonts found in this category.</div>';
            }
        }
    }
    
    /**
     * Search fonts by name
     * @param {string} query - Search query
     */
    searchFonts(query) {
        if (!query || query.length < 2) {
            // Reset to show all fonts
            const fontItems = this.fontListContainer.querySelectorAll('.font-item');
            const categoryHeaders = this.fontListContainer.querySelectorAll('.font-category-header');
            
            fontItems.forEach(item => item.style.display = 'flex');
            categoryHeaders.forEach(header => header.style.display = 'block');
            
            return;
        }
        
        const lowercaseQuery = query.toLowerCase();
        
        // Hide all category headers
        const categoryHeaders = this.fontListContainer.querySelectorAll('.font-category-header');
        categoryHeaders.forEach(header => header.style.display = 'none');
        
        // Filter font items
        const fontItems = this.fontListContainer.querySelectorAll('.font-item');
        let hasVisibleFonts = false;
        
        fontItems.forEach(item => {
            const fontFamily = item.getAttribute('data-font-family').toLowerCase();
            
            if (fontFamily.includes(lowercaseQuery)) {
                item.style.display = 'flex';
                hasVisibleFonts = true;
            } else {
                item.style.display = 'none';
            }
        });
        
        // If no fonts are visible, show a message
        if (!hasVisibleFonts) {
            this.fontListContainer.innerHTML = '<div style="padding: 20px; text-align: center;">No fonts match your search.</div>';
        }
    }
    
    /**
     * Open the font picker modal
     */
    openModal() {
        this.modal.classList.remove('hidden');
        this.isModalOpen = true;
    }
    
    /**
     * Close the font picker modal
     */
    closeModal() {
        this.modal.classList.add('hidden');
        this.isModalOpen = false;
    }
    
    /**
     * Apply the selected font
     */
    async applySelectedFont() {
        if (!this.selectedFont) {
            this.closeModal();
            return;
        }
        
        try {
            document.getElementById('loading-indicator').classList.remove('hidden');
            
            // Get the font URL for opentype.js
            let fontUrl = this.selectedFont.url;
            
            // If no direct URL is available (e.g., for Google Fonts), get it
            if (!fontUrl) {
                fontUrl = await this.googleFontsManager.getWebFont(this.selectedFont.family || this.selectedFont.name);
            }
            
            // Update the selected font display
            this.selectedFontDisplay.textContent = this.selectedFont.family || this.selectedFont.name;
            this.selectedFontDisplay.style.fontFamily = `"${this.selectedFont.family || this.selectedFont.name}", sans-serif`;
            
            // Call the callback with the selected font
            if (this.onFontSelected) {
                const fontData = {
                    name: this.selectedFont.family || this.selectedFont.name,
                    url: fontUrl
                };
                this.onFontSelected(fontData);
            }
            
            document.getElementById('loading-indicator').classList.add('hidden');
            this.closeModal();
            
        } catch (error) {
            console.error('Failed to apply font:', error);
            document.getElementById('error-message').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('error-message').classList.add('hidden');
            }, 3000);
            this.closeModal();
        }
    }
} 