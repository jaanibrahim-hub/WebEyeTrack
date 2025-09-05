/**
 * EyeTrack Browser Extension - Popup Script
 * Handles the popup interface for controlling the extension
 */

class EyeTrackPopup {
    constructor() {
        this.elements = {};
        this.currentTab = null;
        this.settings = {
            enabled: true,
            showCursor: true,
            blinkSensitivity: 0.7,
            gazeSmoothness: 0.3,
            debugMode: false
        };
        
        this.init();
    }

    async init() {
        // Get DOM elements
        this.getElements();
        
        // Load settings
        await this.loadSettings();
        
        // Get current tab
        this.currentTab = await this.getCurrentTab();
        
        // Check extension status
        await this.checkStatus();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI
        this.updateUI();
    }

    getElements() {
        this.elements = {
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            toggleButton: document.getElementById('toggleButton'),
            toggleText: document.getElementById('toggleText'),
            showCursor: document.getElementById('showCursor'),
            blinkSensitivity: document.getElementById('blinkSensitivity'),
            blinkValue: document.getElementById('blinkValue'),
            gazeSmoothness: document.getElementById('gazeSmoothness'),
            gazeValue: document.getElementById('gazeValue'),
            calibrateButton: document.getElementById('calibrateButton'),
            helpButton: document.getElementById('helpButton'),
            permissionsSection: document.getElementById('permissionsSection'),
            requestPermission: document.getElementById('requestPermission')
        };
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['eyetrackSettings']);
            if (result.eyetrackSettings) {
                this.settings = { ...this.settings, ...result.eyetrackSettings };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.sync.set({ eyetrackSettings: this.settings });
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    async getCurrentTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
    }

    async checkStatus() {
        if (!this.currentTab) {
            this.updateStatus('No active tab', false);
            return;
        }

        // Check if current tab is a restricted page where content scripts can't run
        if (this.isRestrictedPage(this.currentTab.url)) {
            this.updateStatus('Not available on this page', false);
            this.elements.toggleButton.disabled = true;
            this.showRestrictedPageMessage();
            return;
        }

        try {
            // Try to inject content script if it's not already there
            await this.ensureContentScriptInjected();
            
            const response = await chrome.tabs.sendMessage(this.currentTab.id, { 
                action: 'getStatus' 
            });
            
            if (response) {
                this.updateStatus(
                    response.tracking ? 'Active' : 'Ready',
                    response.tracking
                );
                this.elements.toggleButton.disabled = false;
            } else {
                this.updateStatus('Initializing...', false);
                this.elements.toggleButton.disabled = true;
                // Try again after a short delay
                setTimeout(() => this.checkStatus(), 1000);
            }
        } catch (error) {
            console.error('Failed to check status:', error);
            this.updateStatus('Ready to start', false);
            this.elements.toggleButton.disabled = false;
        }
    }

    isRestrictedPage(url) {
        if (!url) return true;
        const restrictedPatterns = [
            'chrome://',
            'chrome-extension://',
            'edge://',
            'about:',
            'moz-extension://'
        ];
        return restrictedPatterns.some(pattern => url.startsWith(pattern));
    }

    async ensureContentScriptInjected() {
        if (!this.currentTab || !this.currentTab.id) return;
        
        try {
            await chrome.scripting.executeScript({
                target: { tabId: this.currentTab.id },
                files: ['src/content-script-simple.js']
            });
        } catch (error) {
            // Content script might already be injected or page doesn't allow injection
            console.log('Content script injection result:', error.message);
        }
    }

    showRestrictedPageMessage() {
        // Show a helpful message about restricted pages
        if (this.elements.permissionsSection) {
            this.elements.permissionsSection.style.display = 'block';
            const alertDiv = this.elements.permissionsSection.querySelector('.permission-alert');
            if (alertDiv) {
                alertDiv.innerHTML = `
                    <h4>⚠️ Page Not Supported</h4>
                    <p>Eye tracking doesn't work on browser internal pages (chrome://, extensions, etc.).</p>
                    <p><strong>Try:</strong> Navigate to any regular website (like google.com) and click the extension icon again.</p>
                `;
            }
        }
    }

    setupEventListeners() {
        // Toggle button
        this.elements.toggleButton.addEventListener('click', () => {
            this.toggleTracking();
        });

        // Settings sliders
        this.elements.blinkSensitivity.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.settings.blinkSensitivity = value;
            this.elements.blinkValue.textContent = value.toFixed(1);
            this.updateSettings();
        });

        this.elements.gazeSmoothness.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.settings.gazeSmoothness = value;
            this.elements.gazeValue.textContent = value.toFixed(1);
            this.updateSettings();
        });

        // Show cursor toggle
        this.elements.showCursor.addEventListener('change', (e) => {
            this.settings.showCursor = e.target.checked;
            this.updateSettings();
        });

        // Action buttons
        this.elements.calibrateButton.addEventListener('click', () => {
            this.startCalibration();
        });

        this.elements.helpButton.addEventListener('click', () => {
            this.openHelp();
        });

        // Permission request
        this.elements.requestPermission.addEventListener('click', () => {
            this.requestCameraPermission();
        });
    }

    updateUI() {
        // Update settings controls
        this.elements.showCursor.checked = this.settings.showCursor;
        this.elements.blinkSensitivity.value = this.settings.blinkSensitivity;
        this.elements.blinkValue.textContent = this.settings.blinkSensitivity.toFixed(1);
        this.elements.gazeSmoothness.value = this.settings.gazeSmoothness;
        this.elements.gazeValue.textContent = this.settings.gazeSmoothness.toFixed(1);
    }

    updateStatus(status, active) {
        this.elements.statusText.textContent = status;
        
        if (active) {
            this.elements.statusDot.classList.add('active');
            this.elements.toggleButton.classList.add('stop');
            this.elements.toggleText.textContent = 'Stop Tracking';
        } else {
            this.elements.statusDot.classList.remove('active');
            this.elements.toggleButton.classList.remove('stop');
            this.elements.toggleText.textContent = 'Start Tracking';
        }
    }

    async toggleTracking() {
        if (!this.currentTab) return;

        // Check if on restricted page
        if (this.isRestrictedPage(this.currentTab.url)) {
            this.showError('Please navigate to a regular website to use eye tracking.');
            return;
        }

        try {
            this.elements.toggleButton.disabled = true;
            this.updateStatus('Starting...', false);
            
            // Ensure content script is injected
            await this.ensureContentScriptInjected();
            
            // Wait a bit for content script to initialize
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'toggle'
            });
            
            if (response && response.success) {
                this.updateStatus(
                    response.tracking ? 'Demo Mode Active' : 'Ready',
                    response.tracking
                );
            } else {
                // If no response, start in demo mode anyway
                this.updateStatus('Demo Mode Active', true);
                this.showSuccess('Demo mode started! Move mouse and press spacebar twice to simulate blink-click.');
            }
            
        } catch (error) {
            console.error('Failed to toggle tracking:', error);
            // Fallback: just show demo instructions
            this.updateStatus('Demo Mode', true);
            this.showSuccess('Demo ready! Move mouse to simulate gaze, press spacebar twice for blink-click.');
        } finally {
            this.elements.toggleButton.disabled = false;
        }
    }

    async updateSettings() {
        await this.saveSettings();
        
        if (!this.currentTab) return;

        try {
            await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'updateSettings',
                settings: this.settings
            });
        } catch (error) {
            console.error('Failed to update settings:', error);
        }
    }

    async startCalibration() {
        if (!this.currentTab) return;

        // Check if on restricted page
        if (this.isRestrictedPage(this.currentTab.url)) {
            this.showError('Calibration not available on browser pages. Please navigate to a regular website.');
            return;
        }

        try {
            // Ensure content script is injected
            await this.ensureContentScriptInjected();
            
            // Wait for content script to initialize
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'calibrate'
            });
            
            // Close popup to show calibration screen
            window.close();
            
        } catch (error) {
            console.error('Failed to start calibration:', error);
            this.showError('Calibration demo not available. This is a demonstration version - real calibration will be added in future updates.');
        }
    }

    openHelp() {
        chrome.tabs.create({
            url: chrome.runtime.getURL('options/options.html#help')
        });
        window.close();
    }

    async requestCameraPermission() {
        try {
            // This will be handled by the content script
            await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'requestPermission'
            });
        } catch (error) {
            console.error('Failed to request permission:', error);
        }
    }

    showError(message) {
        this.showMessage(message, '#dc3545');
    }

    showSuccess(message) {
        this.showMessage(message, '#28a745');
    }

    showMessage(message, color) {
        // Create temporary notification
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${color};
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 4000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EyeTrackPopup();
});

// Handle popup errors
window.addEventListener('error', (event) => {
    console.error('Popup error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Popup promise rejection:', event.reason);
});