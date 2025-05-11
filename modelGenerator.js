/**
 * Model Generator
 * Converts SVG path data into 3D models using Three.js
 */
class ModelGenerator {
    constructor() {
        this.svgLoader = new THREE.SVGLoader();
    }

    /**
     * Generate a 3D model from SVG path data
     * @param {Object} pathData - Object containing paths and bounds information
     * @param {Object} options - Options for 3D model generation
     * @returns {THREE.Group} - Three.js group containing the 3D model
     */
    generateModelFromPaths(pathData, options = {}) {
        // Default options
        const defaults = {
            extrusionDepth: 20,
            dynamicDepth: false,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 0.5,
            bevelSegments: 3,
            frontColor: '#ffffff',
            sideColor: '#cccccc'
        };
        
        // Merge provided options with defaults
        const settings = { ...defaults, ...options };
        
        // Create a new group to hold all the meshes
        const group = new THREE.Group();
        
        // Calculate dynamic depth if enabled
        let depth = settings.extrusionDepth;
        if (settings.dynamicDepth && pathData.bounds) {
            const height = pathData.bounds.y2 - pathData.bounds.y1;
            depth = height / 4; // Use 1/4 of the design height
        }
        
        // Process each path
        pathData.paths.forEach(pathInfo => {
            try {
                // Parse SVG path string
                const paths = this.svgLoader.parse(`<svg><path d="${pathInfo.path}"/></svg>`).paths;
                
                // Process each path shape
                paths.forEach(path => {
                    const shapes = THREE.SVGLoader.createShapes(path);
                    
                    // Create a mesh for each shape
                    shapes.forEach(shape => {
                        // Extrusion settings
                        const extrudeSettings = {
                            depth: depth,
                            bevelEnabled: settings.bevelEnabled,
                            bevelThickness: settings.bevelThickness,
                            bevelSize: settings.bevelSize,
                            bevelSegments: settings.bevelSegments
                        };
                        
                        // Create geometry
                        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                        
                        // Create materials
                        const materials = [
                            new THREE.MeshStandardMaterial({ 
                                color: settings.sideColor,
                                roughness: 0.5,
                                metalness: 0.2
                            }),
                            new THREE.MeshStandardMaterial({ 
                                color: settings.frontColor,
                                roughness: 0.3,
                                metalness: 0.1
                            })
                        ];
                        
                        // Create mesh with front and side materials
                        const mesh = new THREE.Mesh(geometry, materials);
                        
                        // Add the mesh to the group
                        group.add(mesh);
                    });
                });
            } catch (error) {
                console.error('Error creating 3D model from path:', error);
            }
        });
        
        // Center the model based on the bounding box
        if (group.children.length > 0) {
            this.centerModel(group);
        }
        
        return group;
    }

    /**
     * Center the model based on its bounding box
     * @param {THREE.Group} group - The group containing the model
     */
    centerModel(group) {
        // Create a bounding box for the group
        const bbox = new THREE.Box3().setFromObject(group);
        
        // Calculate the center of the bounding box
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        
        // Move the group to center it at origin
        group.position.sub(center);
        
        // Flip the model to display correctly (SVG Y-axis is inverted in Three.js)
        group.scale.set(1, -1, 1);
    }

    /**
     * Convert a Three.js model to STL format
     * @param {THREE.Object3D} model - The 3D model to convert
     * @returns {Blob} - STL file as a Blob
     */
    convertToSTL(model) {
        if (!model) return null;
        
        // Create an STL exporter
        const exporter = new THREE.STLExporter();
        
        // Convert the model to STL (binary format)
        const stl = exporter.parse(model, { binary: true });
        
        // Create a blob from the STL data
        return new Blob([stl], { type: 'application/octet-stream' });
    }
}