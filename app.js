/**
 * Main Application
 * Initializes and coordinates the components of the 3D Sign Creator
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    const fontManager = new FontManager();
    const svgProcessor = new SvgProcessor();
    const modelGenerator = new ModelGenerator();
    const previewRenderer = new PreviewRenderer('preview-container');
    const exportManager = new ExportManager(svgProcessor, modelGenerator);
    
    // Global variables to store current state
    window.currentPathData = null;
    window.currentModel = null;
    window.designMode = 'text'; // 'text' or 'svg'
    
    // Input elements
    const textInput = document.getElementById('text-input');
    // Create virtual outline elements since they were removed from UI
    const outlineColor = '#000000';
    const outlineThickness = 20;
    const extrusionDepthInput = document.getElementById('extrusion-depth');
    const extrusionDepthValue = document.getElementById('extrusion-depth-value');
    const dynamicDepthInput = document.getElementById('dynamic-depth');
    const bevelEnabledInput = document.getElementById('bevel-enabled');
    const frontColorInput = document.getElementById('front-color');
    const sideColorInput = document.getElementById('side-color');
    const updatePreviewButton = document.getElementById('update-preview');
    const svgUploadInput = document.getElementById('svg-upload');
    
    // Set default colors
    frontColorInput.value = "#ffffff"; // White for front
    sideColorInput.value = "#000000"; // Black for sides
    
    // Apply the color setting to the previewRenderer
    previewRenderer.frontColor = frontColorInput.value;
    
    // Hide the side color input group since we're making all sides black
    const sideColorGroup = sideColorInput.closest('.input-group');
    if (sideColorGroup) {
        sideColorGroup.style.display = 'none';
    }
    
    // Add a retro theme toggle
    const themeToggle = document.createElement('button');
    themeToggle.className = 'btn';
    themeToggle.innerHTML = '<i class="ri-sun-line"></i> Toggle Light Mode';
    themeToggle.style.marginTop = '20px';
    document.querySelector('.export-options').after(themeToggle);
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
    });
    
    // Color display elements
    const colorPickerContainers = document.querySelectorAll('.color-picker-container');
    colorPickerContainers.forEach(container => {
        const colorInput = container.querySelector('input[type="color"]');
        const colorValue = container.querySelector('.color-value');
        
        if (colorInput && colorValue) {
            // Initial value
            colorValue.textContent = colorInput.value;
            
            // Update on change
            colorInput.addEventListener('input', () => {
                colorValue.textContent = colorInput.value;
            });
        }
    });
    
    // File upload styling
    if (svgUploadInput) {
        const fileUploadLabel = document.querySelector('.file-upload-label');
        
        svgUploadInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                const fileName = this.files[0].name;
                fileUploadLabel.innerHTML = `<i class="ri-file-line"></i><span>${fileName}</span>`;
            } else {
                fileUploadLabel.innerHTML = `<i class="ri-upload-cloud-line"></i><span>Choose a file or drag it here</span>`;
            }
        });
    }
    
    // Update values display for range inputs
    extrusionDepthInput.addEventListener('input', () => {
        extrusionDepthValue.textContent = `${extrusionDepthInput.value}mm`;
    });
    
    // Event listener for font changes
    document.addEventListener('fontChanged', () => {
        // Switch to text mode when font is changed
        window.designMode = 'text';
        updatePreview();
    });
    
    // Event listener for SVG uploads
    document.addEventListener('svgUploaded', (event) => {
        // Switch to SVG mode when an SVG is uploaded
        window.designMode = 'svg';
        window.currentPathData = event.detail;
        updatePreview();
    });
    
    // Event listener for color changes (real-time update without regenerating geometry)
    frontColorInput.addEventListener('input', updateModelColors);
    
    // Event listener for the update preview button
    updatePreviewButton.addEventListener('click', updatePreview);
    
    // Event listeners for export buttons
    document.getElementById('download-svg').addEventListener('click', () => {
        exportManager.exportSVG();
    });
    
    document.getElementById('download-stl').addEventListener('click', () => {
        exportManager.exportSTL(previewRenderer.getCurrentModel());
    });
    
    /**
     * Update the preview based on current settings
     */
    function updatePreview() {
        // Show loading indicator
        document.getElementById('loading-indicator').classList.remove('hidden');
        
        try {
            // Generate path data based on design mode
            if (window.designMode === 'text') {
                const text = textInput.value || 'Hello';
                window.currentPathData = fontManager.generateTextPath(text, 72);
            }
            
            // Check if we have valid path data
            if (!window.currentPathData || !window.currentPathData.paths || window.currentPathData.paths.length === 0) {
                throw new Error('No valid path data');
            }
            
            // Get 3D settings
            const settings = get3DSettings();
            
            // Generate 3D model
            window.currentModel = modelGenerator.generateModelFromPaths(window.currentPathData, settings);
            
            // Update the preview (this will apply the color from the previewRenderer.frontColor)
            previewRenderer.updateModel(window.currentModel);
            
            // Hide loading indicator
            document.getElementById('loading-indicator').classList.add('hidden');
            
        } catch (error) {
            console.error('Error updating preview:', error);
            document.getElementById('loading-indicator').classList.add('hidden');
            document.getElementById('error-message').classList.remove('hidden');
            
            setTimeout(() => {
                document.getElementById('error-message').classList.add('hidden');
            }, 3000);
        }
    }
    
    /**
     * Update model colors without regenerating the geometry
     */
    function updateModelColors() {
        const colorSettings = {
            frontColor: frontColorInput.value,
            // We're ignoring the side color since all sides are black
            sideColor: '#000000' 
        };
        
        previewRenderer.updateModelColors(colorSettings);
    }
    
    /**
     * Get current 3D settings from the UI
     * @returns {Object} - 3D settings object
     */
    function get3DSettings() {
        return {
            extrusionDepth: parseFloat(extrusionDepthInput.value),
            dynamicDepth: dynamicDepthInput.checked,
            bevelEnabled: bevelEnabledInput.checked,
            bevelThickness: 1,
            bevelSize: 0.5,
            bevelSegments: 3,
            frontColor: frontColorInput.value,
            sideColor: '#000000', // Always black sides
            outlineColor: outlineColor,
            outlineThickness: outlineThickness
        };
    }
    
    // Initial preview generation
    setTimeout(() => {
        updatePreview();
    }, 1000); // Wait for fonts to load
});