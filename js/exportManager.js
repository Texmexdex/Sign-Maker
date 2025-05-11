/**
 * Export Manager
 * Handles the export of SVG and STL files
 */
class ExportManager {
    constructor(svgProcessor, modelGenerator) {
        this.svgProcessor = svgProcessor;
        this.modelGenerator = modelGenerator;
        
        this.downloadSvgButton = document.getElementById('download-svg');
        this.downloadStlButton = document.getElementById('download-stl');
        
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the export buttons
     */
    setupEventListeners() {
        this.downloadSvgButton.addEventListener('click', () => this.handleSvgExport());
        this.downloadStlButton.addEventListener('click', () => this.handleStlExport());
    }

    /**
     * Handle SVG export
     */
    handleSvgExport() {
        // Check if we have current path data
        if (!window.currentPathData || !window.currentPathData.paths || window.currentPathData.paths.length === 0) {
            alert('No design to export. Please create or upload a design first.');
            return;
        }
        
        try {
            // Get outline settings
            const outlineColor = document.getElementById('outline-color').value;
            const outlineThickness = parseFloat(document.getElementById('outline-thickness').value);
            
            // Generate SVG string
            const svgString = this.svgProcessor.generateSvgString(
                window.currentPathData,
                outlineColor,
                outlineThickness
            );
            
            if (!svgString) {
                throw new Error('Failed to generate SVG');
            }
            
            // Create a download link
            this.downloadFile(svgString, '3d-sign-design.svg', 'image/svg+xml');
            
        } catch (error) {
            console.error('Error exporting SVG:', error);
            alert('Failed to export SVG. Please try again.');
        }
    }

    /**
     * Handle STL export
     */
    handleStlExport() {
        // Check if we have a current model
        if (!window.currentModel) {
            alert('No 3D model to export. Please create or upload a design first.');
            return;
        }
        
        try {
            // Convert model to STL
            const stlBlob = this.modelGenerator.convertToSTL(window.currentModel);
            
            if (!stlBlob) {
                throw new Error('Failed to generate STL');
            }
            
            // Create a download link
            this.downloadBlob(stlBlob, '3d-sign-model.stl');
            
        } catch (error) {
            console.error('Error exporting STL:', error);
            alert('Failed to export STL. Please try again.');
        }
    }

    /**
     * Download a file from a string
     * @param {string} content - The file content
     * @param {string} fileName - The file name
     * @param {string} contentType - The content type
     */
    downloadFile(content, fileName, contentType) {
        const blob = new Blob([content], { type: contentType });
        this.downloadBlob(blob, fileName);
    }

    /**
     * Download a blob as a file
     * @param {Blob} blob - The blob to download
     * @param {string} fileName - The file name
     */
    downloadBlob(blob, fileName) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
            document.body.removeChild(link);
        }, 100);
    }
}