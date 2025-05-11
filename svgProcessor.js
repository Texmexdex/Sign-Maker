/**
 * SVG Processor
 * Handles SVG file upload, parsing, and path extraction
 */
class SvgProcessor {
    constructor() {
        this.svgUploadInput = document.getElementById('svg-upload');
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for SVG upload
     */
    setupEventListeners() {
        this.svgUploadInput.addEventListener('change', (e) => this.handleSvgUpload(e));
    }

    /**
     * Handle SVG file upload
     * @param {Event} event - The file input change event
     */
    handleSvgUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.type !== 'image/svg+xml') {
            alert('Please upload an SVG file.');
            this.svgUploadInput.value = '';
            return;
        }
        
        // Show loading indicator
        document.getElementById('loading-indicator').classList.remove('hidden');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const svgContent = e.target.result;
                const pathData = this.extractPathsFromSvg(svgContent);
                
                // Hide loading indicator
                document.getElementById('loading-indicator').classList.add('hidden');
                
                // Trigger event to update the preview
                const event = new CustomEvent('svgUploaded', { 
                    detail: { 
                        paths: pathData.paths,
                        bounds: pathData.bounds,
                        originalSvg: svgContent
                    } 
                });
                document.dispatchEvent(event);
                
            } catch (error) {
                console.error('Error processing SVG:', error);
                document.getElementById('error-message').classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('error-message').classList.add('hidden');
                }, 3000);
            }
        };
        
        reader.readAsText(file);
    }

    /**
     * Extract path data from SVG content
     * @param {string} svgContent - The SVG file content
     * @returns {Object} - Object containing paths and bounds
     */
    extractPathsFromSvg(svgContent) {
        // Create a temporary container to parse the SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');
        
        if (!svgElement) {
            throw new Error('Invalid SVG: No SVG element found');
        }
        
        // Get viewBox or width/height
        let viewBox = svgElement.getAttribute('viewBox');
        let width = parseFloat(svgElement.getAttribute('width') || 0);
        let height = parseFloat(svgElement.getAttribute('height') || 0);
        
        // Parse viewBox if available
        let minX = 0, minY = 0, svgWidth = width, svgHeight = height;
        if (viewBox) {
            const viewBoxValues = viewBox.split(' ').map(parseFloat);
            if (viewBoxValues.length === 4) {
                [minX, minY, svgWidth, svgHeight] = viewBoxValues;
            }
        }
        
        // Extract all path elements
        const pathElements = svgDoc.querySelectorAll('path');
        const paths = [];
        
        pathElements.forEach(pathElement => {
            const d = pathElement.getAttribute('d');
            if (d) {
                // Get the fill color
                const fill = pathElement.getAttribute('fill') || '#000000';
                // Get the stroke color and width
                const stroke = pathElement.getAttribute('stroke');
                const strokeWidth = pathElement.getAttribute('stroke-width');
                
                const pathData = {
                    path: d,
                    fill: fill
                };
                
                // Add stroke attributes if they exist
                if (stroke) pathData.stroke = stroke;
                if (strokeWidth) pathData.strokeWidth = parseFloat(strokeWidth);
                
                paths.push(pathData);
            }
        });
        
        // Create a bound object
        const bounds = {
            x1: minX,
            y1: minY,
            x2: minX + svgWidth,
            y2: minY + svgHeight
        };
        
        return { paths, bounds };
    }

    /**
     * Generate an SVG string from path data
     * @param {Object} pathData - Object containing paths and bounds
     * @param {string} outlineColor - Color for the outline
     * @param {number} outlineThickness - Thickness of the outline
     * @returns {string} - SVG string
     */
    generateSvgString(pathData, outlineColor = '#000000', outlineThickness = 20) {
        if (!pathData || !pathData.paths || pathData.paths.length === 0) {
            return null;
        }
        
        const bounds = pathData.bounds || { x1: 0, y1: 0, x2: 100, y2: 100 };
        const width = bounds.x2 - bounds.x1;
        const height = bounds.y2 - bounds.y1;
        
        let svgString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="${width}" height="${height}" viewBox="${bounds.x1} ${bounds.y1} ${width} ${height}" 
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
`;
        
        // Add each path
        pathData.paths.forEach(pathInfo => {
            svgString += `  <path d="${pathInfo.path}" fill="${pathInfo.fill}" `;
            
            // Add stroke from path info or from parameters
            if (pathInfo.stroke && pathInfo.strokeWidth) {
                svgString += `stroke="${pathInfo.stroke}" stroke-width="${pathInfo.strokeWidth}" `;
            } else if (outlineThickness > 0) {
                svgString += `stroke="${outlineColor}" stroke-width="${outlineThickness}" `;
            }
            
            svgString += `/>\n`;
        });
        
        svgString += `</svg>`;
        
        return svgString;
    }
}