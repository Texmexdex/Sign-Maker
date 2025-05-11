/**
 * AR Viewer
 * Handles viewing 3D models in augmented reality using WebXR
 */
class ARViewer {
    constructor() {
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.controller = null;
        this.reticle = null;
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;
        this.modelToPlace = null;
        
        // DOM Elements (will be created when needed)
        this.arContainer = null;
        this.uiContainer = null;
        this.arButtonElement = null;
        this.infoMessage = null;
        this.reticleElement = null;
    }
    
    /**
     * Initialize the AR viewer with a 3D model
     * @param {THREE.Object3D} model - The 3D model to display in AR
     */
    initWithModel(model) {
        // Create necessary DOM elements if they don't exist
        this.createDOMElements();
        
        // Initialize Three.js scene, camera, etc.
        this.initThreeJS();
        
        // Process and prepare the model for AR
        this.prepareModelForAR(model);
        
        // Attach event listeners
        this.attachEventListeners();
    }
    
    /**
     * Create necessary DOM elements for AR
     */
    createDOMElements() {
        // Check if elements already exist
        if (document.getElementById('ar-container')) {
            // Clean up existing elements
            document.getElementById('ar-container').remove();
            document.getElementById('ar-ui-container').remove();
            document.getElementById('ar-reticle').remove();
        }
        
        // Create AR container
        this.arContainer = document.createElement('div');
        this.arContainer.id = 'ar-container';
        this.arContainer.style.position = 'fixed';
        this.arContainer.style.top = '0';
        this.arContainer.style.left = '0';
        this.arContainer.style.width = '100%';
        this.arContainer.style.height = '100%';
        this.arContainer.style.zIndex = '1000';
        this.arContainer.style.display = 'none';
        
        // Create UI container
        this.uiContainer = document.createElement('div');
        this.uiContainer.id = 'ar-ui-container';
        this.uiContainer.style.position = 'fixed';
        this.uiContainer.style.top = '0';
        this.uiContainer.style.left = '0';
        this.uiContainer.style.width = '100%';
        this.uiContainer.style.height = '100%';
        this.uiContainer.style.display = 'flex';
        this.uiContainer.style.flexDirection = 'column';
        this.uiContainer.style.justifyContent = 'center';
        this.uiContainer.style.alignItems = 'center';
        this.uiContainer.style.zIndex = '1001';
        this.uiContainer.style.pointerEvents = 'none';
        
        // Create AR button
        this.arButtonElement = document.createElement('button');
        this.arButtonElement.id = 'ar-button';
        this.arButtonElement.textContent = 'Start AR';
        this.arButtonElement.style.backgroundColor = '#3b82f6';
        this.arButtonElement.style.color = 'white';
        this.arButtonElement.style.padding = '1rem 1.5rem';
        this.arButtonElement.style.borderRadius = '0.5rem';
        this.arButtonElement.style.border = 'none';
        this.arButtonElement.style.fontSize = '1rem';
        this.arButtonElement.style.fontWeight = 'bold';
        this.arButtonElement.style.cursor = 'pointer';
        this.arButtonElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        this.arButtonElement.style.transition = 'background-color 0.3s';
        this.arButtonElement.style.pointerEvents = 'auto';
        
        // Create info message
        this.infoMessage = document.createElement('div');
        this.infoMessage.id = 'ar-info-message';
        this.infoMessage.textContent = 'Point your camera at a surface and tap to place the object.';
        this.infoMessage.style.marginTop = '1rem';
        this.infoMessage.style.backgroundColor = 'rgba(0,0,0,0.7)';
        this.infoMessage.style.padding = '0.75rem 1rem';
        this.infoMessage.style.display = 'none';
        this.infoMessage.style.borderRadius = '0.5rem';
        this.infoMessage.style.pointerEvents = 'auto';
        
        // Create reticle element
        this.reticleElement = document.createElement('div');
        this.reticleElement.id = 'ar-reticle';
        this.reticleElement.className = 'reticle';
        this.reticleElement.style.position = 'absolute';
        this.reticleElement.style.width = '30px';
        this.reticleElement.style.height = '30px';
        this.reticleElement.style.border = '2px solid white';
        this.reticleElement.style.borderRadius = '50%';
        this.reticleElement.style.boxSizing = 'border-box';
        this.reticleElement.style.transform = 'translate(-50%, -50%)';
        this.reticleElement.style.display = 'none';
        this.reticleElement.style.zIndex = '1002';
        
        // Add everything to the body
        this.uiContainer.appendChild(this.arButtonElement);
        this.uiContainer.appendChild(this.infoMessage);
        
        document.body.appendChild(this.arContainer);
        document.body.appendChild(this.uiContainer);
        document.body.appendChild(this.reticleElement);
    }
    
    /**
     * Initialize Three.js scene, camera, renderer, etc.
     */
    initThreeJS() {
        console.log("Initializing AR ThreeJS environment");
        
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        
        // Add lights - much brighter for AR environment
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Brighter ambient
        this.scene.add(ambientLight);
        
        // Directional light to simulate sun
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(1, 2, 1).normalize();
        this.scene.add(directionalLight);
        
        // Add a hemisphere light for better ambient lighting
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
        this.scene.add(hemisphereLight);
        
        // Add a point light that will follow the camera
        const pointLight = new THREE.PointLight(0xffffff, 0.8, 5);
        pointLight.position.set(0, 0, 0.5); // Slightly in front of camera
        this.camera.add(pointLight);
        this.scene.add(this.camera); // Need to add camera to scene for its children to work
        
        console.log("AR lighting setup complete");
        
        // Create renderer with physically correct lighting
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            logarithmicDepthBuffer: true, // Helps with depth precision
            preserveDrawingBuffer: true // Needed for AR
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true; // Enable WebXR
        this.renderer.outputEncoding = THREE.sRGBEncoding; // Better color accuracy
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping; // Better contrast
        this.arContainer.appendChild(this.renderer.domElement);
        
        // Create reticle
        const reticleGeometry = new THREE.RingGeometry(0.05, 0.07, 32).rotateX(-Math.PI / 2);
        const reticleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            opacity: 0.7, 
            transparent: true 
        });
        this.reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add(this.reticle);
        
        console.log("AR scene initialization complete");
    }
    
    /**
     * Process and prepare the model for AR
     * @param {THREE.Object3D} model - The 3D model to display in AR
     */
    prepareModelForAR(model) {
        console.log("Preparing model for AR...", model);
        
        // Clone model to avoid modifying the original
        this.modelToPlace = model.clone();
        
        // Create a new group to hold only mesh objects
        const cleanGroup = new THREE.Group();
        
        // Extract only the mesh objects from the model
        this.modelToPlace.traverse(child => {
            if (child.isMesh) {
                console.log("Found mesh in model:", child.name || "unnamed mesh");
                
                // Create a new mesh with the same geometry but ensure materials are visible in AR
                const newMesh = child.clone();
                
                // Handle array of materials
                if (Array.isArray(newMesh.material)) {
                    newMesh.material = newMesh.material.map(mat => {
                        // Create a new material that will work in AR lighting conditions
                        if (mat.type === 'MeshPhongMaterial') {
                            return new THREE.MeshPhongMaterial({
                                color: mat.color,
                                specular: mat.specular || 0x999999,
                                shininess: mat.shininess || 100,
                                reflectivity: mat.reflectivity || 1.0
                            });
                        } else {
                            // If not a MeshPhongMaterial, convert to one for better AR rendering
                            return new THREE.MeshPhongMaterial({
                                color: mat.color,
                                specular: 0x999999,
                                shininess: 100,
                                reflectivity: 1.0
                            });
                        }
                    });
                } else {
                    // Single material
                    const originalColor = newMesh.material.color;
                    if (newMesh.material.type === 'MeshPhongMaterial') {
                        newMesh.material = new THREE.MeshPhongMaterial({
                            color: originalColor,
                            specular: newMesh.material.specular || 0x999999,
                            shininess: newMesh.material.shininess || 100,
                            reflectivity: newMesh.material.reflectivity || 1.0
                        });
                    } else {
                        // If not a MeshPhongMaterial, convert to one for better AR rendering
                        newMesh.material = new THREE.MeshPhongMaterial({
                            color: originalColor,
                            specular: 0x999999,
                            shininess: 100,
                            reflectivity: 1.0
                        });
                    }
                }
                
                // Ensure the mesh is set up correctly for AR
                newMesh.castShadow = true;
                newMesh.receiveShadow = true;
                
                // Add this mesh to our clean group
                cleanGroup.add(newMesh);
            }
        });
        
        // If we found any meshes, use the clean group
        if (cleanGroup.children.length > 0) {
            console.log(`Found ${cleanGroup.children.length} meshes for AR`);
            this.modelToPlace = cleanGroup;
        } else {
            console.warn("No meshes found in the model for AR");
        }
        
        // Center the model
        const box = new THREE.Box3().setFromObject(this.modelToPlace);
        const center = new THREE.Vector3();
        box.getCenter(center);
        this.modelToPlace.position.sub(center);
        
        // Scale model appropriately for AR
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const desiredSize = 0.3; // 30cm in AR space
        if (maxDim > 0) {
            const scale = desiredSize / maxDim;
            this.modelToPlace.scale.set(scale, scale, scale);
            console.log(`Scaled model by ${scale} to fit ${desiredSize}m size`);
        }
        
        // Make model initially invisible until placed
        this.modelToPlace.visible = false;
        
        // Add to scene so it's ready to be placed
        this.scene.add(this.modelToPlace);
        console.log("Model prepared and added to AR scene");
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // AR button click event
        this.arButtonElement.addEventListener('click', () => this.startARSession());
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    /**
     * Start AR session
     */
    async startARSession() {
        console.log("Attempting to start AR session");
        
        // First, check if WebXR is supported
        if (!navigator.xr) {
            console.warn("WebXR not supported on this browser/device");
            this.showErrorMessage("WebXR not supported on this browser/device. Try using an AR-capable device.");
            return;
        }
        
        // Then check if AR is supported
        try {
            const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
            if (!isSupported) {
                console.warn("Immersive AR not supported on this device");
                this.showErrorMessage("AR is not supported on this device. Try using a device with AR capabilities.");
                return;
            }
            
            console.log("AR is supported, requesting session");
            
            // Now try to start the AR session
            try {
                const session = await navigator.xr.requestSession('immersive-ar', {
                    requiredFeatures: ['hit-test'],
                    optionalFeatures: ['dom-overlay'],
                    domOverlay: { root: this.uiContainer }
                });
                
                console.log("AR session successfully started");
                this.onSessionStarted(session);
            } catch (error) {
                console.error("Error starting AR session:", error);
                
                if (error.name === 'NotAllowedError') {
                    this.showErrorMessage("Camera permission denied. Please allow camera access for AR.");
                } else if (error.name === 'SecurityError') {
                    this.showErrorMessage("AR requires HTTPS for security reasons.");
                } else {
                    this.showErrorMessage("Failed to start AR. Check camera permissions and try again.");
                }
            }
        } catch (error) {
            console.error("Error checking AR support:", error);
            this.showErrorMessage("Could not determine AR support. Try a different browser or device.");
        }
    }
    
    /**
     * Display an error message to the user
     * @param {string} message - The error message to display
     */
    showErrorMessage(message) {
        this.infoMessage.textContent = message;
        this.infoMessage.style.display = 'block';
        this.infoMessage.style.backgroundColor = 'rgba(220, 53, 69, 0.9)'; // Error red background
        
        // Reset style after 4 seconds
        setTimeout(() => {
            this.infoMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        }, 4000);
    }
    
    /**
     * Handle AR session start
     * @param {XRSession} session - The WebXR session
     */
    onSessionStarted(session) {
        // Make the container visible
        this.arContainer.style.display = 'block';
        
        // Setup session event listeners
        session.addEventListener('end', () => this.onSessionEnded());
        
        // Configure renderer for XR
        this.renderer.xr.setSession(session);
        
        // Update UI
        this.arButtonElement.style.display = 'none';
        this.infoMessage.textContent = "Move your phone to detect surfaces. Tap to place.";
        this.infoMessage.style.display = 'block';
        
        // Setup controller for tap detection
        this.controller = this.renderer.xr.getController(0);
        this.controller.addEventListener('select', () => this.onSelect());
        this.scene.add(this.controller);
        
        // Start the render loop
        this.renderer.setAnimationLoop((timestamp, frame) => this.renderARFrame(timestamp, frame));
    }
    
    /**
     * Handle AR session end
     */
    onSessionEnded() {
        // Clean up session resources
        if (this.controller) {
            this.controller.removeEventListener('select', () => this.onSelect());
        }
        
        this.hitTestSourceRequested = false;
        this.hitTestSource = null;
        
        this.renderer.xr.setSession(null);
        this.renderer.setAnimationLoop(null);
        
        // Hide the AR container
        this.arContainer.style.display = 'none';
        
        // Reset UI
        this.arButtonElement.style.display = 'block';
        this.infoMessage.style.display = 'none';
        this.reticle.visible = false;
        this.reticleElement.style.display = 'none';
        
        // Remove any placed objects
        const objectsToRemove = [];
        this.scene.traverse(child => {
            if (child.userData && child.userData.isPlacedObject) {
                objectsToRemove.push(child);
            }
        });
        
        objectsToRemove.forEach(obj => this.scene.remove(obj));
    }
    
    /**
     * Handle select (tap) event
     */
    onSelect() {
        console.log("Select event triggered", { 
            reticleVisible: this.reticle.visible, 
            modelReady: !!this.modelToPlace 
        });
        
        if (this.reticle.visible && this.modelToPlace) {
            console.log("Placing model at reticle position");
            
            // Clone the model to place multiple instances
            const newModel = this.modelToPlace.clone();
            
            // Get the position from the reticle's matrix
            newModel.position.setFromMatrixPosition(this.reticle.matrix);
            
            // Ensure it's visible
            newModel.visible = true;
            newModel.userData.isPlacedObject = true;
            
            // Log the materials for debugging
            newModel.traverse(child => {
                if (child.isMesh) {
                    console.log("Placed mesh materials:", 
                        Array.isArray(child.material) 
                            ? child.material.map(m => m.type) 
                            : child.material.type
                    );
                }
            });
            
            // Add to scene
            this.scene.add(newModel);
            
            // Update the UI to indicate success
            this.infoMessage.textContent = "Model placed! Tap again to place more.";
            console.log("Model placed at", newModel.position);
        } else {
            console.warn("Cannot place model - reticle not visible or model not ready");
            this.infoMessage.textContent = "Move your phone until the placement ring appears, then tap.";
        }
    }
    
    /**
     * Render AR frame
     * @param {DOMHighResTimeStamp} timestamp - The time when this function was called
     * @param {XRFrame} frame - The XR frame to render
     */
    renderARFrame(timestamp, frame) {
        if (!frame) return;
        
        const session = this.renderer.xr.getSession();
        const referenceSpace = this.renderer.xr.getReferenceSpace();
        
        if (!referenceSpace) {
            console.warn("Reference space not available yet");
            return;
        }
        
        // Hit testing - only once per session
        if (!this.hitTestSourceRequested) {
            console.log("Requesting hit test source...");
            
            session.requestReferenceSpace('viewer')
                .then(viewerSpace => {
                    console.log("Viewer space obtained, requesting hit test source");
                    return session.requestHitTestSource({ space: viewerSpace });
                })
                .then(source => {
                    console.log("Hit test source successfully created");
                    this.hitTestSource = source;
                })
                .catch(err => {
                    console.error("Error setting up hit test:", err);
                    // Try again on next frame if there was an error
                    this.hitTestSourceRequested = false;
                    this.infoMessage.textContent = "Error setting up AR tracking. Please try again.";
                });
            
            this.hitTestSourceRequested = true;
        }
        
        // Process hit test results
        if (this.hitTestSource) {
            const hitTestResults = frame.getHitTestResults(this.hitTestSource);
            
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const hitPose = hit.getPose(referenceSpace);
                
                if (hitPose) {
                    // Make reticle visible and update position
                    if (!this.reticle.visible) {
                        console.log("Reticle now visible - surface detected");
                        this.infoMessage.textContent = "Surface detected! Tap to place the model.";
                    }
                    
                    this.reticle.visible = true;
                    this.reticle.matrix.fromArray(hitPose.transform.matrix);
                }
            } else if (this.reticle.visible) {
                // Hide reticle when no hit test results
                console.log("No surfaces detected, hiding reticle");
                this.reticle.visible = false;
                this.infoMessage.textContent = "Move your phone to detect surfaces. Tap to place.";
            }
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        if (this.renderer.xr.isPresenting) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Convert world coordinates to screen coordinates
     * @param {THREE.Vector3} worldPosition - Position in 3D world
     * @param {THREE.Camera} camera - Camera
     * @param {HTMLElement} canvas - Canvas element
     * @returns {Object|null} - Screen coordinates or null if behind camera
     */
    worldToScreen(worldPosition, camera, canvas) {
        const vector = worldPosition.clone().project(camera);
        const x = (vector.x * 0.5 + 0.5) * canvas.clientWidth;
        const y = (vector.y * -0.5 + 0.5) * canvas.clientHeight;
        
        if (vector.z > 1) return null; // Behind camera
        
        return { x, y };
    }
} 