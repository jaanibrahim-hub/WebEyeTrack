/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!**********************************************!*\
  !*** ./src/content/content-script-simple.ts ***!
  \**********************************************/

/**
 * EyeTrack Browser Extension - Simplified Content Script
 * A simplified version that demonstrates the eye tracking concept without full WebEyeTrack
 */
class SimpleEyeTrackContentScript {
    constructor() {
        this.gazeCursor = null;
        this.statusIndicator = null;
        this.videoElement = null;
        this.stream = null;
        this.isInitialized = false;
        this.isTracking = false;
        // Mock tracking data for demonstration
        this.mousePosition = { x: 0, y: 0 };
        this.mockEyeState = 'open';
        this.lastBlinkTime = 0;
        // Animation frame tracking
        this.animationFrameId = null;
        this.settings = {
            enabled: true,
            blinkSensitivity: 0.7,
            gazeSmoothness: 0.3,
            showCursor: true,
            debugMode: false
        };
        this.blinkDetector = new SimpleBlinkDetector(this.settings.blinkSensitivity);
        this.init();
    }
    async init() {
        console.log('[EyeTrack] Simple content script initializing...');
        // Load settings from storage
        await this.loadSettings();
        // Listen for messages from popup/background
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
        // Track mouse for demonstration purposes
        this.setupMouseTracking();
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeEyeTracking());
        }
        else {
            this.initializeEyeTracking();
        }
    }
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['eyetrackSettings']);
            if (result.eyetrackSettings) {
                this.settings = { ...this.settings, ...result.eyetrackSettings };
            }
        }
        catch (error) {
            console.warn('[EyeTrack] Failed to load settings:', error);
        }
    }
    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'toggle':
                this.toggleTracking();
                sendResponse({ success: true, tracking: this.isTracking });
                break;
            case 'getStatus':
                sendResponse({
                    initialized: this.isInitialized,
                    tracking: this.isTracking,
                    settings: this.settings
                });
                break;
            case 'updateSettings':
                this.updateSettings(request.settings);
                sendResponse({ success: true });
                break;
            case 'calibrate':
                this.startCalibration();
                sendResponse({ success: true });
                break;
        }
    }
    setupMouseTracking() {
        // Use mouse position as proxy for gaze tracking in this demo
        document.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
        });
        // Simulate blinks with spacebar for demo
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isTracking) {
                e.preventDefault();
                this.simulateBlink();
            }
        });
    }
    simulateBlink() {
        const now = Date.now();
        if (now - this.lastBlinkTime < 500) {
            // Double blink detected
            this.blinkDetector.handleDoubleBlink();
        }
        this.lastBlinkTime = now;
        // Visual feedback
        this.mockEyeState = 'closed';
        setTimeout(() => {
            this.mockEyeState = 'open';
        }, 200);
    }
    async initializeEyeTracking() {
        if (this.isInitialized)
            return;
        try {
            // Create video element for demonstration
            this.createVideoElement();
            // Create UI elements
            this.createGazeCursor();
            this.createStatusIndicator();
            this.isInitialized = true;
            console.log('[EyeTrack] Successfully initialized (demo mode)');
            // Auto-start if enabled
            if (this.settings.enabled) {
                await this.startTracking();
            }
        }
        catch (error) {
            console.error('[EyeTrack] Failed to initialize:', error);
            this.showError('Failed to initialize eye tracking demo.');
        }
    }
    createVideoElement() {
        this.videoElement = document.createElement('video');
        this.videoElement.id = 'eyetrack-webcam-' + Date.now();
        this.videoElement.className = 'eyetrack-video';
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        document.body.appendChild(this.videoElement);
    }
    createGazeCursor() {
        this.gazeCursor = document.createElement('div');
        this.gazeCursor.className = 'eyetrack-gaze-cursor';
        if (!this.settings.showCursor) {
            this.gazeCursor.classList.add('hidden');
        }
        document.body.appendChild(this.gazeCursor);
    }
    createStatusIndicator() {
        this.statusIndicator = document.createElement('div');
        this.statusIndicator.className = 'eyetrack-status';
        this.statusIndicator.innerHTML = `
            <div class="eyetrack-status-indicator"></div>
            <span>EyeTrack Demo: Inactive (Use mouse + spacebar)</span>
        `;
        document.body.appendChild(this.statusIndicator);
    }
    async startTracking() {
        if (!this.isInitialized || this.isTracking)
            return;
        try {
            // Request camera permission for real implementation
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;
            }
            this.isTracking = true;
            this.updateStatusIndicator('Active (Demo Mode)', true);
            // Start the tracking loop
            this.startTrackingLoop();
            console.log('[EyeTrack] Demo tracking started');
        }
        catch (error) {
            console.error('[EyeTrack] Failed to start tracking:', error);
            this.showError('Camera permission denied. Using mouse tracking for demo.');
            // Start in demo mode without camera
            this.isTracking = true;
            this.updateStatusIndicator('Demo Mode (No Camera)', true);
            this.startTrackingLoop();
        }
    }
    stopTracking() {
        if (!this.isTracking)
            return;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.isTracking = false;
        this.updateStatusIndicator('Inactive', false);
        if (this.gazeCursor) {
            this.gazeCursor.classList.add('hidden');
        }
        console.log('[EyeTrack] Tracking stopped');
    }
    toggleTracking() {
        if (this.isTracking) {
            this.stopTracking();
        }
        else {
            this.startTracking();
        }
    }
    startTrackingLoop() {
        if (!this.isTracking)
            return;
        // Simulate gaze tracking results using mouse position
        const gazeResult = {
            normPog: [
                (this.mousePosition.x / window.innerWidth) - 0.5,
                (this.mousePosition.y / window.innerHeight) - 0.5
            ],
            gazeState: this.mockEyeState,
            timestamp: Date.now()
        };
        // Update gaze cursor
        this.updateGazeCursor(gazeResult);
        // Process blink detection
        this.blinkDetector.update(gazeResult);
        if (this.settings.debugMode) {
            console.log('[EyeTrack Demo] Gaze:', gazeResult.normPog, 'State:', gazeResult.gazeState);
        }
        // Continue loop
        this.animationFrameId = requestAnimationFrame(() => this.startTrackingLoop());
    }
    updateGazeCursor(gazeResult) {
        if (!this.gazeCursor || !this.settings.showCursor)
            return;
        // Convert normalized coordinates to screen coordinates
        const screenX = (gazeResult.normPog[0] + 0.5) * window.innerWidth;
        const screenY = (gazeResult.normPog[1] + 0.5) * window.innerHeight;
        // Update cursor position
        this.gazeCursor.style.left = screenX + 'px';
        this.gazeCursor.style.top = screenY + 'px';
        this.gazeCursor.classList.remove('hidden');
        // Show blink detection feedback
        if (gazeResult.gazeState === 'closed') {
            this.gazeCursor.classList.add('blink-detected');
        }
        else {
            this.gazeCursor.classList.remove('blink-detected');
        }
    }
    updateStatusIndicator(status, active) {
        if (!this.statusIndicator)
            return;
        const indicator = this.statusIndicator.querySelector('.eyetrack-status-indicator');
        const text = this.statusIndicator.querySelector('span');
        if (indicator) {
            indicator.className = 'eyetrack-status-indicator' + (active ? ' active' : '');
        }
        if (text) {
            text.textContent = `EyeTrack Demo: ${status}`;
        }
    }
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.blinkDetector.setSensitivity(this.settings.blinkSensitivity);
        if (this.gazeCursor) {
            if (this.settings.showCursor && this.isTracking) {
                this.gazeCursor.classList.remove('hidden');
            }
            else {
                this.gazeCursor.classList.add('hidden');
            }
        }
        // Save to storage
        chrome.storage.sync.set({ eyetrackSettings: this.settings });
    }
    startCalibration() {
        this.showCalibrationScreen();
    }
    showCalibrationScreen() {
        const overlay = document.createElement('div');
        overlay.className = 'eyetrack-calibration-overlay';
        overlay.innerHTML = `
            <div class="eyetrack-calibration-instructions">
                <h2>Eye Tracking Calibration</h2>
                <p>This is a demo version. In the full version, you would:</p>
                <p>1. Look at each calibration point that appears</p>
                <p>2. Blink when the point is highlighted</p>
                <p>3. Complete all 9 points for accurate calibration</p>
                <br>
                <p><strong>Demo Controls:</strong></p>
                <p>• Move mouse to simulate gaze</p>
                <p>• Press spacebar twice quickly to simulate double blink</p>
                <button style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Close Demo
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
        // Close on button click or escape
        const closeBtn = overlay.querySelector('button');
        const closeCalibration = () => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };
        closeBtn?.addEventListener('click', closeCalibration);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeCalibration();
            }
        }, { once: true });
    }
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'eyetrack-error';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}
/**
 * Simplified Blink Detection for Demo
 */
class SimpleBlinkDetector {
    constructor(sensitivity = 0.7) {
        this.lastBlinkTime = 0;
        this.blinkCount = 0;
        this.doubleBlinkWindow = 800;
        this.clickCooldown = 500;
        this.sensitivity = sensitivity;
    }
    setSensitivity(sensitivity) {
        this.sensitivity = sensitivity;
    }
    update(gazeResult) {
        // In real implementation, this would analyze eye state changes
        // For demo, we rely on manual spacebar simulation
    }
    handleDoubleBlink() {
        const now = Date.now();
        // Prevent rapid fire clicks
        if (now - this.lastBlinkTime < this.clickCooldown)
            return;
        this.lastBlinkTime = now;
        this.simulateClick();
    }
    simulateClick() {
        // Get element at mouse position (simulating gaze position)
        const element = document.elementFromPoint(window.innerWidth / 2, // Use center for demo, or could use mouse position
        window.innerHeight / 2);
        if (element) {
            console.log('[EyeTrack Demo] Double blink detected - clicking element:', element);
            // Highlight the element briefly
            const originalOutline = element.style.outline;
            element.style.outline = '3px solid #ff00ff';
            // Simulate click
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            element.dispatchEvent(clickEvent);
            // Remove highlight
            setTimeout(() => {
                element.style.outline = originalOutline;
            }, 300);
            // Show notification
            this.showClickNotification();
        }
    }
    showClickNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 255, 0, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 999999;
            animation: fadeInOut 1s ease;
        `;
        notification.textContent = '👀 Click Simulated!';
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 1000);
    }
}
// Initialize the content script when the page loads
if (typeof window !== 'undefined' && window.document) {
    new SimpleEyeTrackContentScript();
}

/******/ })()
;
//# sourceMappingURL=content-script-simple.js.map