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
    const outlineColorInput = document.getElementById('outline-color');
    const outlineThicknessInput = document.getElementById('outline-thickness');
    const outlineThicknessValue = document.getElementById('outline-thickness-value');
    const extrusionDepthInput = document.getElementById('extrusion-depth');
    const extrusionDepthValue = document.getElementById('extrusion-depth-value');
    const dynamicDepthInput = document.getElementById('dynamic-depth');
    const bevelEnabledInput = document.getElementById('bevel-enabled');
    const frontColorInput = document.getElementById('front-color');
    const sideColorInput = document.getElementById('side-color');
    const updatePreviewButton = document.getElementById('update-preview');
    
    // Update values display for range inputs
    outlineThicknessInput.addEventListener('input', () => {
        outlineThicknessValue.textContent = `${outlineThicknessInput.value}px`;
    });
    
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
    sideColorInput.addEventListener('input', updateModelColors);
    
    // Event listener for the update preview button
    updatePreviewButton.addEventListener('click', updatePreview);
    
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
            
            // Update the preview
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
            sideColor: sideColorInput.value
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
            sideColor: sideColorInput.value
        };
    }
    
    // Initial preview generation
    setTimeout(() => {
        updatePreview();
    }, 1000); // Wait for fonts to load
});