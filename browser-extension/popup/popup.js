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

        try {
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
                this.updateStatus('Not initialized', false);
                this.elements.toggleButton.disabled = true;
            }
        } catch (error) {
            console.error('Failed to check status:', error);
            this.updateStatus('Extension not loaded', false);
            this.elements.toggleButton.disabled = true;
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

        try {
            this.elements.toggleButton.disabled = true;
            
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'toggle'
            });
            
            if (response && response.success) {
                this.updateStatus(
                    response.tracking ? 'Active' : 'Ready',
                    response.tracking
                );
            }
            
        } catch (error) {
            console.error('Failed to toggle tracking:', error);
            this.showError('Failed to toggle tracking. Please refresh the page.');
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

        try {
            await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'calibrate'
            });
            
            // Close popup to show calibration screen
            window.close();
            
        } catch (error) {
            console.error('Failed to start calibration:', error);
            this.showError('Failed to start calibration.');
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
        // Create temporary error notification
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #dc3545;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
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