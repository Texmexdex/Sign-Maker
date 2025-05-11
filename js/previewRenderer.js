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
        this.wireframeMode = false;
        this.frontColor = "#ffffff"; // Default front face color
        
        this.initRenderer();
        this.animate();
        this.handleResize();
        this.initControlButtons();
    }

    /**
     * Initialize the Three.js renderer
     */
    initRenderer() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Use a simpler gradient background approach
        this.createNightSkyBackground();
        
        // Create camera
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
        this.camera.position.set(0, 0, 400);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = false; // Disable shadows completely
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
        
        // Note: Ground plane removed to eliminate reflection
    }
    
    /**
     * Create a night sky background using a simpler approach
     */
    createNightSkyBackground() {
        // Create a gradient background using a simple textured plane
        const topColor = new THREE.Color(0x000022); // Dark night blue
        const bottomColor = new THREE.Color(0x72c5fb); // Light blue (horizon)
        
        // Create a canvas for the gradient
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Create gradient
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, topColor.getStyle());
        gradient.addColorStop(1, bottomColor.getStyle());
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 2, 512);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
        
        // Create a large dome for the sky
        const skyGeometry = new THREE.SphereGeometry(1000, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const sky = new THREE.Mesh(skyGeometry, material);
        sky.rotation.x = Math.PI; // Flip so gradient is right way up
        this.scene.add(sky);
        
        // Add stars to the night sky
        this.addStars();
    }
    
    /**
     * Add stars to the night sky
     */
    addStars() {
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 1,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: false
        });
        
        // Generate random stars positions
        const starVertices = [];
        for (let i = 0; i < 2000; i++) {
            // Place stars in upper hemisphere only
            const x = (Math.random() - 0.5) * 2000;
            const y = Math.random() * 500; // Positive Y is up
            const z = (Math.random() - 0.5) * 2000;
            
            // Don't place stars near the horizon
            if (y > 50) {
                starVertices.push(x, y, z);
            }
        }
        
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
        
        // Create a few larger, brighter stars
        const brightStarMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 2,
            transparent: true,
            opacity: 1.0,
            sizeAttenuation: false
        });
        
        const brightStarVertices = [];
        for (let i = 0; i < 50; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = 100 + Math.random() * 400; // Higher up in the sky
            const z = (Math.random() - 0.5) * 2000;
            brightStarVertices.push(x, y, z);
        }
        
        const brightStarGeometry = new THREE.BufferGeometry();
        brightStarGeometry.setAttribute('position', new THREE.Float32BufferAttribute(brightStarVertices, 3));
        const brightStars = new THREE.Points(brightStarGeometry, brightStarMaterial);
        this.scene.add(brightStars);
        
        // Add a moon
        this.addMoon();
    }
    
    /**
     * Add a moon to the night sky
     */
    addMoon() {
        const moonGeometry = new THREE.SphereGeometry(30, 32, 32);
        const moonMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.8
        });
        
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.position.set(-300, 300, -500); // Position in upper left quadrant
        this.scene.add(moon);
        
        // Add glow around the moon
        const moonGlowGeometry = new THREE.SphereGeometry(35, 32, 32);
        const moonGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xCCDDFF,
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide
        });
        
        const moonGlow = new THREE.Mesh(moonGlowGeometry, moonGlowMaterial);
        moonGlow.position.copy(moon.position);
        this.scene.add(moonGlow);
        
        // Add a subtle light from the moon's position
        const moonLight = new THREE.PointLight(0xCCDDFF, 0.8, 1000);
        moonLight.position.copy(moon.position);
        this.scene.add(moonLight);
    }

    /**
     * Initialize control buttons functionality
     */
    initControlButtons() {
        // Handle reset camera button
        const resetCameraButton = document.getElementById('reset-camera');
        if (resetCameraButton) {
            resetCameraButton.addEventListener('click', () => {
                this.resetCameraView();
            });
        }
        
        // Handle toggle wireframe button
        const toggleWireframeButton = document.getElementById('toggle-wireframe');
        if (toggleWireframeButton) {
            toggleWireframeButton.addEventListener('click', () => {
                this.toggleWireframe();
            });
        }
    }

    /**
     * Add lights to the scene
     */
    addLights() {
        // Ambient light - slightly brighter to better show materials
        const ambientLight = new THREE.AmbientLight(0x333355, 0.4);
        this.scene.add(ambientLight);
        
        // Add a spotlight from above for dramatic lighting
        const spotLight = new THREE.SpotLight(0xCCDDFF, 1.0);
        spotLight.position.set(0, 300, 200);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 0.3;
        spotLight.decay = 1.5;
        spotLight.distance = 1000;
        spotLight.castShadow = false; // Disable shadow casting
        
        this.scene.add(spotLight);
        
        // Add a subtle blue fill light from below for the neon effect
        const fillLight = new THREE.PointLight(0x4444ff, 0.6, 300);
        fillLight.position.set(0, -50, 100);
        this.scene.add(fillLight);
        
        // Add a key light from the front-right to create highlights
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
        keyLight.position.set(100, 50, 200);
        this.scene.add(keyLight);
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
        
        // Remove any existing glow
        if (this.glowEffect) {
            this.scene.remove(this.glowEffect);
            this.glowEffect = null;
        }
        
        // Add the new model
        if (model) {
            this.currentModel = model;
            
            // Force front face to be glossy white
            const frontMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                specular: 0x888888,
                shininess: 80,
                reflectivity: 0.8
            });
            
            // Black side material with more intense metallic, glossy finish
            const blackSideMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x000000,
                specular: 0x999999,
                shininess: 120,
                reflectivity: 1.0
            });
            
            // Apply materials to all meshes
            this.currentModel.traverse(child => {
                if (child.isMesh) {
                    // If it's an array of materials
                    if (Array.isArray(child.material)) {
                        // Make a copy of current materials to avoid reference issues
                        const materials = [];
                        
                        // In the extruded text geometry:
                        // - Index 0 is the front/back face material
                        // - Index 1 is the side material (extrusion)
                        for (let i = 0; i < child.material.length; i++) {
                            if (i === 0) {
                                // Front face - force white color
                                materials.push(frontMaterial);
                            } else {
                                // All other faces - use black material
                                materials.push(blackSideMaterial);
                            }
                        }
                        
                        child.material = materials;
                    }
                    
                    // Disable all shadow casting and receiving
                    child.castShadow = false;
                    child.receiveShadow = false;
                }
            });
            
            // Add the model to the scene
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
     * Toggle wireframe mode on/off
     */
    toggleWireframe() {
        this.wireframeMode = !this.wireframeMode;
        this.applyWireframe(this.wireframeMode);
        
        // Highlight the wireframe button when active
        const wireframeButton = document.getElementById('toggle-wireframe');
        if (wireframeButton) {
            if (this.wireframeMode) {
                wireframeButton.classList.add('active');
            } else {
                wireframeButton.classList.remove('active');
            }
        }
    }
    
    /**
     * Apply or remove wireframe mode to all meshes
     * @param {boolean} enable - Whether to enable or disable wireframe
     */
    applyWireframe(enable) {
        if (!this.currentModel) return;
        
        this.currentModel.traverse(child => {
            if (child.isMesh) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => {
                        material.wireframe = enable;
                    });
                } else {
                    child.material.wireframe = enable;
                }
            }
        });
    }

    /**
     * Update model appearance based on color settings
     * @param {Object} colorSettings - Object with frontColor and sideColor properties
     */
    updateModelColors(colorSettings) {
        if (!this.currentModel) return;
        
        // Store the front color for future use
        if (colorSettings.frontColor) {
            this.frontColor = colorSettings.frontColor;
            
            // Create a new material with the chosen color - now glossy
            const newMaterial = new THREE.MeshPhongMaterial({
                color: new THREE.Color(colorSettings.frontColor),
                specular: 0x888888,
                shininess: 80,
                reflectivity: 0.8
            });
            
            // Update materials on all model meshes
            this.currentModel.traverse(child => {
                if (child.isMesh && Array.isArray(child.material)) {
                    // Update only the front face material (index 0)
                    if (child.material[0]) {
                        child.material[0] = newMaterial;
                    }
                }
            });
        }
    }

    /**
     * Get the current model
     * @returns {THREE.Group} - The current model
     */
    getCurrentModel() {
        return this.currentModel;
    }
}