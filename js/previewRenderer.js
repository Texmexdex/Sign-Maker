/**
 * Preview Renderer
 * Handles the 3D preview of the model using Three.js
 */
class PreviewRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentModel = null;
        
        this.initRenderer();
        this.animate();
        this.handleResize();
    }

    /**
     * Initialize the Three.js renderer
     */
    initRenderer() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        
        // Create camera
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
        this.camera.position.set(0, 0, 400);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // Create orbit controls for camera
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.rotateSpeed = 0.5;
        this.controls.enablePan = true;
        this.controls.enableZoom = true;
        this.controls.update();
        
        // Add lights
        this.addLights();
        
        // Add a grid helper for reference
        const gridHelper = new THREE.GridHelper(200, 10, 0x888888, 0xcccccc);
        gridHelper.rotation.x = Math.PI / 2;
        this.scene.add(gridHelper);
    }

    /**
     * Add lights to the scene
     */
    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        // Directional lights from different angles
        const createDirectionalLight = (color, intensity, x, y, z) => {
            const light = new THREE.DirectionalLight(color, intensity);
            light.position.set(x, y, z);
            light.castShadow = true;
            
            // Adjust shadow camera parameters
            light.shadow.camera.near = 1;
            light.shadow.camera.far = 1000;
            light.shadow.camera.left = -200;
            light.shadow.camera.right = 200;
            light.shadow.camera.top = 200;
            light.shadow.camera.bottom = -200;
            
            light.shadow.mapSize.width = 1024;
            light.shadow.mapSize.height = 1024;
            
            return light;
        };
        
        // Main light (top-right)
        const mainLight = createDirectionalLight(0xffffff, 0.8, 100, 100, 100);
        this.scene.add(mainLight);
        
        // Back light (behind model)
        const backLight = createDirectionalLight(0xffffff, 0.4, -100, 50, -100);
        this.scene.add(backLight);
        
        // Fill light (left side)
        const fillLight = createDirectionalLight(0xffffff, 0.2, -100, 0, 100);
        this.scene.add(fillLight);
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        window.addEventListener('resize', () => {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(width, height);
        });
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update controls
        this.controls.update();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Update the 3D model in the preview
     * @param {THREE.Group} model - The new model to display
     */
    updateModel(model) {
        // Remove the current model if it exists
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
        }
        
        // Add the new model
        if (model) {
            this.currentModel = model;
            this.scene.add(this.currentModel);
            
            // Reset camera position for a good view of the model
            this.resetCameraView();
        }
    }

    /**
     * Reset the camera view to show the model properly
     */
    resetCameraView() {
        if (!this.currentModel) return;
        
        // Create a bounding box for the model
        const bbox = new THREE.Box3().setFromObject(this.currentModel);
        
        // Calculate the size of the bounding box
        const size = new THREE.Vector3();
        bbox.getSize(size);
        
        // Calculate the center of the bounding box
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        
        // Calculate the distance based on the size
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 1.5; // Adjust this multiplier as needed
        
        // Move the camera to a position that shows the model well
        this.camera.position.set(center.x, center.y, center.z + distance);
        this.camera.lookAt(center);
        
        // Update the controls target to the center of the model
        this.controls.target.copy(center);
        this.controls.update();
    }

    /**
     * Update model appearance based on color settings
     * @param {Object} colorSettings - Object with frontColor and sideColor properties
     */
    updateModelColors(colorSettings) {
        if (!this.currentModel) return;
        
        // Update materials on all model meshes
        this.currentModel.traverse(child => {
            if (child.isMesh) {
                // Check if the material is an array
                if (Array.isArray(child.material)) {
                    // Material[0] is typically the side material
                    if (child.material[0] && colorSettings.sideColor) {
                        child.material[0].color.set(colorSettings.sideColor);
                    }
                    
                    // Material[1] is typically the face material
                    if (child.material[1] && colorSettings.frontColor) {
                        child.material[1].color.set(colorSettings.frontColor);
                    }
                } else {
                    // Single material
                    if (colorSettings.frontColor) {
                        child.material.color.set(colorSettings.frontColor);
                    }
                }
            }
        });
    }

    /**
     * Get the current model
     * @returns {THREE.Group} - The current model
     */
    getCurrentModel() {
        return this.currentModel;
    }
}