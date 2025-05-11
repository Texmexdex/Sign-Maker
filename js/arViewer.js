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
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(directionalLight);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true; // Enable WebXR
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
    }
    
    /**
     * Process and prepare the model for AR
     * @param {THREE.Object3D} model - The 3D model to display in AR
     */
    prepareModelForAR(model) {
        // Clone model to avoid modifying the original
        this.modelToPlace = model.clone();
        
        // Remove unnecessary objects from the model (background, stars, etc.)
        // Only keep the actual 3D text meshes
        this.modelToPlace.traverse(child => {
            // Ensure the child is visible
            if (child.isMesh) {
                child.visible = true;
                
                // If it uses MeshPhongMaterial, make sure it has proper properties for AR
                if (child.material && child.material.type === 'MeshPhongMaterial') {
                    child.material.needsUpdate = true;
                    child.castShadow = true;
                    child.receiveShadow = false;
                }
            }
        });
        
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
        }
        
        // Make model initially invisible until placed
        this.modelToPlace.visible = false;
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
        if (!navigator.xr) {
            this.infoMessage.textContent = "WebXR not supported on this browser/device.";
            this.infoMessage.style.display = 'block';
            return;
        }
        
        try {
            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test', 'dom-overlay'],
                domOverlay: { root: this.uiContainer }
            });
            
            this.onSessionStarted(session);
        } catch (e) {
            console.error("Failed to start AR session:", e);
            this.infoMessage.textContent = "Failed to start AR. Ensure your browser supports WebXR and camera permissions are granted.";
            this.infoMessage.style.display = 'block';
        }
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
        if (this.reticle.visible && this.modelToPlace) {
            const newModel = this.modelToPlace.clone();
            newModel.position.setFromMatrixPosition(this.reticle.matrix);
            newModel.visible = true;
            newModel.userData.isPlacedObject = true;
            this.scene.add(newModel);
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
            return;
        }
        
        // Hit testing
        if (!this.hitTestSourceRequested) {
            session.requestReferenceSpace('viewer').then(viewerSpace => {
                session.requestHitTestSource({ space: viewerSpace }).then(source => {
                    this.hitTestSource = source;
                }).catch(err => console.error("Could not get hit test source:", err));
            }).catch(err => console.error("Could not get viewer reference space for hit test:", err));
            
            this.hitTestSourceRequested = true;
        }
        
        if (this.hitTestSource) {
            const hitTestResults = frame.getHitTestResults(this.hitTestSource);
            
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const hitPose = hit.getPose(referenceSpace);
                
                if (hitPose) {
                    this.reticle.visible = true;
                    this.reticle.matrix.fromArray(hitPose.transform.matrix);
                    
                    // Update HTML reticle if needed
                    // const screenPos = this.worldToScreen(this.reticle.position, this.camera, this.renderer.domElement);
                    // if (screenPos) {
                    //     this.reticleElement.style.left = `${screenPos.x}px`;
                    //     this.reticleElement.style.top = `${screenPos.y}px`;
                    //     this.reticleElement.style.display = 'block';
                    // }
                } else {
                    this.reticle.visible = false;
                    // this.reticleElement.style.display = 'none';
                }
            } else {
                this.reticle.visible = false;
                // this.reticleElement.style.display = 'none';
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