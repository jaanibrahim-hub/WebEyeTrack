/**
 * EyeTrack Browser Extension - Options Page Script
 */

class EyeTrackOptions {
    constructor() {
        this.settings = {};
        this.defaultSettings = {
            enabled: true,
            showCursor: true,
            blinkSensitivity: 0.7,
            gazeSmoothness: 0.3,
            debugMode: false,
            autoStart: false,
            showNotifications: true,
            cursorSize: 20,
            cursorOpacity: 0.8,
            updateRate: 30,
            enableBlinkClick: true,
            blinkWindow: 800
        };
        
        this.init();
    }

    async init() {
        // Load current settings
        await this.loadSettings();
        
        // Setup tab navigation
        this.setupTabs();
        
        // Setup form controls
        this.setupControls();
        
        // Update UI with current settings
        this.updateUI();
        
        // Check for welcome parameter
        this.checkWelcome();
        
        console.log('[EyeTrack Options] Initialized');
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['eyetrackSettings']);
            this.settings = { ...this.defaultSettings, ...result.eyetrackSettings };
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.settings = { ...this.defaultSettings };
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.sync.set({ eyetrackSettings: this.settings });
            this.showMessage('Settings saved successfully!', 'success');
            
            // Notify background script of settings update
            chrome.runtime.sendMessage({
                action: 'updateSettings',
                settings: this.settings
            });
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showMessage('Failed to save settings. Please try again.', 'error');
        }
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                // Update button states
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update content visibility
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    setupControls() {
        // Checkbox controls
        const checkboxes = {
            'autoStart': 'autoStart',
            'showNotifications': 'showNotifications',
            'debugMode': 'debugMode',
            'showGazeCursor': 'showCursor',
            'enableBlinkClick': 'enableBlinkClick'
        };

        Object.entries(checkboxes).forEach(([id, setting]) => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.settings[setting] = e.target.checked;
                    this.saveSettings();
                });
            }
        });

        // Range controls with value display
        const ranges = {
            'blinkSensitivity': { setting: 'blinkSensitivity', suffix: '' },
            'trackingSmoothness': { setting: 'gazeSmoothness', suffix: '' },
            'cursorSize': { setting: 'cursorSize', suffix: 'px' },
            'cursorOpacity': { setting: 'cursorOpacity', suffix: '' },
            'blinkWindow': { setting: 'blinkWindow', suffix: 'ms' }
        };

        Object.entries(ranges).forEach(([id, config]) => {
            const range = document.getElementById(id);
            const valueDisplay = document.getElementById(id + 'Value');
            
            if (range && valueDisplay) {
                range.addEventListener('input', (e) => {
                    const value = config.setting === 'blinkWindow' ? 
                        parseInt(e.target.value) : 
                        parseFloat(e.target.value);
                    
                    this.settings[config.setting] = value;
                    valueDisplay.textContent = value + config.suffix;
                    this.saveSettings();
                });
            }
        });

        // Select controls
        const updateRateSelect = document.getElementById('updateRate');
        if (updateRateSelect) {
            updateRateSelect.addEventListener('change', (e) => {
                this.settings.updateRate = parseInt(e.target.value);
                this.saveSettings();
            });
        }

        // Button controls
        this.setupButtons();
    }

    setupButtons() {
        // Calibration button
        const calibrateBtn = document.getElementById('startCalibration');
        if (calibrateBtn) {
            calibrateBtn.addEventListener('click', () => {
                this.startCalibration();
            });
        }

        // Clear data button
        const clearDataBtn = document.getElementById('clearData');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }

        // Reset settings button
        const resetBtn = document.getElementById('resetSettings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetToDefaults();
            });
        }

        // Export settings button
        const exportBtn = document.getElementById('exportSettings');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportSettings();
            });
        }

        // Import settings button
        const importBtn = document.getElementById('importSettings');
        const importFile = document.getElementById('importFile');
        
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });
            
            importFile.addEventListener('change', (e) => {
                this.importSettings(e.target.files[0]);
            });
        }
    }

    updateUI() {
        // Update checkboxes
        const checkboxMappings = {
            'autoStart': 'autoStart',
            'showNotifications': 'showNotifications',
            'debugMode': 'debugMode',
            'showGazeCursor': 'showCursor',
            'enableBlinkClick': 'enableBlinkClick'
        };

        Object.entries(checkboxMappings).forEach(([id, setting]) => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.checked = this.settings[setting];
            }
        });

        // Update ranges
        const rangeMappings = {
            'blinkSensitivity': { setting: 'blinkSensitivity', suffix: '' },
            'trackingSmoothness': { setting: 'gazeSmoothness', suffix: '' },
            'cursorSize': { setting: 'cursorSize', suffix: 'px' },
            'cursorOpacity': { setting: 'cursorOpacity', suffix: '' },
            'blinkWindow': { setting: 'blinkWindow', suffix: 'ms' }
        };

        Object.entries(rangeMappings).forEach(([id, config]) => {
            const range = document.getElementById(id);
            const valueDisplay = document.getElementById(id + 'Value');
            
            if (range && valueDisplay) {
                range.value = this.settings[config.setting];
                valueDisplay.textContent = this.settings[config.setting] + config.suffix;
            }
        });

        // Update select
        const updateRateSelect = document.getElementById('updateRate');
        if (updateRateSelect) {
            updateRateSelect.value = this.settings.updateRate;
        }
    }

    async startCalibration() {
        try {
            // Get the current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab && tab.id) {
                // Send calibration request to content script
                await chrome.tabs.sendMessage(tab.id, { action: 'calibrate' });
                
                // Show success message
                this.showMessage('Calibration started. Follow the instructions on the page.', 'success');
                
                // Update calibration status
                const statusElement = document.getElementById('calibrationStatus');
                if (statusElement) {
                    statusElement.innerHTML = `<p>Last calibrated: ${new Date().toLocaleString()}</p>`;
                }
                
                // Store calibration date
                await chrome.storage.sync.set({ 
                    eyetrackLastCalibration: Date.now() 
                });
                
            } else {
                this.showMessage('Please open a tab and try again.', 'error');
            }
            
        } catch (error) {
            console.error('Calibration error:', error);
            this.showMessage('Failed to start calibration. Make sure the extension is active on a tab.', 'error');
        }
    }

    async clearAllData() {
        if (confirm('Are you sure you want to clear all data? This will reset all settings and remove calibration data.')) {
            try {
                await chrome.storage.sync.clear();
                await chrome.storage.local.clear();
                
                this.settings = { ...this.defaultSettings };
                this.updateUI();
                
                this.showMessage('All data cleared successfully!', 'success');
                
            } catch (error) {
                console.error('Failed to clear data:', error);
                this.showMessage('Failed to clear data. Please try again.', 'error');
            }
        }
    }

    resetToDefaults() {
        if (confirm('Reset all settings to defaults?')) {
            this.settings = { ...this.defaultSettings };
            this.updateUI();
            this.saveSettings();
        }
    }

    exportSettings() {
        const dataStr = JSON.stringify(this.settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'eyetrack-settings.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showMessage('Settings exported successfully!', 'success');
    }

    async importSettings(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const importedSettings = JSON.parse(text);
            
            // Validate imported settings
            this.settings = { ...this.defaultSettings, ...importedSettings };
            this.updateUI();
            await this.saveSettings();
            
            this.showMessage('Settings imported successfully!', 'success');
            
        } catch (error) {
            console.error('Import error:', error);
            this.showMessage('Failed to import settings. Please check the file format.', 'error');
        }
    }

    checkWelcome() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('welcome') === 'true') {
            // Show welcome message or tutorial
            this.showMessage('Welcome to EyeTrack Browser! Configure your settings below and start with calibration for the best experience.', 'success');
        }
    }

    showMessage(text, type) {
        // Remove any existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        // Insert at the top of content
        const content = document.querySelector('.content');
        if (content) {
            content.insertBefore(message, content.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 5000);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EyeTrackOptions();
});

// Handle page errors
window.addEventListener('error', (event) => {
    console.error('Options page error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Options page promise rejection:', event.reason);
});