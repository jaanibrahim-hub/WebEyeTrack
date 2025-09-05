/**
 * EyeTrack Browser Extension - Background Service Worker
 * Manages extension lifecycle, permissions, and cross-tab communication
 */

interface ExtensionSettings {
  enabled: boolean;
  blinkSensitivity: number;
  gazeSmoothness: number;
  showCursor: boolean;
  debugMode: boolean;
}

class EyeTrackBackgroundService {
  private defaultSettings: ExtensionSettings = {
    enabled: true,
    blinkSensitivity: 0.7,
    gazeSmoothness: 0.3,
    showCursor: true,
    debugMode: false
  };

  constructor() {
    this.init();
  }

  private init(): void {
    console.log('[EyeTrack Background] Service worker starting...');
    
    // Initialize extension on install
    chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
    
    // Handle extension startup
    chrome.runtime.onStartup.addListener(this.handleStartup.bind(this));
    
    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Handle tab updates
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    
    // Handle tab activation
    chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this));
    
    // Handle extension icon click (if popup fails)
    chrome.action.onClicked.addListener(this.handleIconClick.bind(this));
    
    console.log('[EyeTrack Background] Service worker initialized');
  }

  private async handleInstall(details: chrome.runtime.InstalledDetails): Promise<void> {
    console.log('[EyeTrack Background] Extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
      // First time install - setup default settings
      await this.setupDefaultSettings();
      await this.showWelcomeTab();
    } else if (details.reason === 'update') {
      // Extension updated - migrate settings if needed
      await this.migrateSettings();
    }
  }

  private handleStartup(): void {
    console.log('[EyeTrack Background] Browser startup detected');
    // Extension startup logic if needed
  }

  private handleMessage(
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): boolean {
    console.log('[EyeTrack Background] Message received:', request.action, sender);

    switch (request.action) {
      case 'getSettings':
        this.getSettings().then(sendResponse);
        return true; // Indicates async response
        
      case 'updateSettings':
        this.updateSettings(request.settings).then(() => {
          sendResponse({ success: true });
        });
        return true;
        
      case 'checkPermissions':
        this.checkCameraPermissions().then(sendResponse);
        return true;
        
      case 'requestPermissions':
        this.requestCameraPermissions().then(sendResponse);
        return true;
        
      case 'reportError':
        this.handleError(request.error, sender.tab);
        sendResponse({ success: true });
        break;
        
      case 'reportStatus':
        this.updateBadge(request.status, sender.tab);
        sendResponse({ success: true });
        break;
        
      case 'openOptions':
        this.openOptionsPage();
        sendResponse({ success: true });
        break;
        
      default:
        console.warn('[EyeTrack Background] Unknown message action:', request.action);
        sendResponse({ error: 'Unknown action' });
    }
    
    return false;
  }

  private handleTabUpdate(
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ): void {
    // Reset badge when tab navigation completes
    if (changeInfo.status === 'complete' && tab.url) {
      this.updateBadge('inactive', tab);
    }
  }

  private handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo): void {
    // Update extension state when switching tabs
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (chrome.runtime.lastError || !tab.url) return;
      
      // Reset badge for new active tab
      this.updateBadge('inactive', tab);
    });
  }

  private handleIconClick(tab: chrome.tabs.Tab): void {
    console.log('[EyeTrack Background] Extension icon clicked, tab:', tab.id);
    
    // Fallback if popup doesn't open - inject content script manually
    if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/content-script.js']
      }).catch(error => {
        console.error('[EyeTrack Background] Failed to inject content script:', error);
      });
    }
  }

  private async setupDefaultSettings(): Promise<void> {
    try {
      await chrome.storage.sync.set({
        eyetrackSettings: this.defaultSettings,
        eyetrackVersion: '0.1.0',
        eyetrackInstallDate: Date.now()
      });
      console.log('[EyeTrack Background] Default settings initialized');
    } catch (error) {
      console.error('[EyeTrack Background] Failed to setup default settings:', error);
    }
  }

  private async migrateSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['eyetrackSettings', 'eyetrackVersion']);
      
      // Add migration logic here as needed for future versions
      if (!result.eyetrackVersion) {
        // Migrate from old version
        await chrome.storage.sync.set({ eyetrackVersion: '0.1.0' });
      }
      
      console.log('[EyeTrack Background] Settings migration completed');
    } catch (error) {
      console.error('[EyeTrack Background] Failed to migrate settings:', error);
    }
  }

  private async showWelcomeTab(): Promise<void> {
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('options/options.html?welcome=true')
      });
    } catch (error) {
      console.error('[EyeTrack Background] Failed to open welcome tab:', error);
    }
  }

  private async getSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.sync.get(['eyetrackSettings']);
      return result.eyetrackSettings || this.defaultSettings;
    } catch (error) {
      console.error('[EyeTrack Background] Failed to get settings:', error);
      return this.defaultSettings;
    }
  }

  private async updateSettings(newSettings: Partial<ExtensionSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      
      await chrome.storage.sync.set({ eyetrackSettings: updatedSettings });
      
      // Broadcast settings update to all tabs
      this.broadcastSettingsUpdate(updatedSettings);
      
      console.log('[EyeTrack Background] Settings updated:', updatedSettings);
    } catch (error) {
      console.error('[EyeTrack Background] Failed to update settings:', error);
    }
  }

  private async checkCameraPermissions(): Promise<{ granted: boolean }> {
    try {
      const permissions = await chrome.permissions.getAll();
      const hasPermissions = permissions.permissions?.includes('activeTab') || false;
      
      return { granted: hasPermissions };
    } catch (error) {
      console.error('[EyeTrack Background] Failed to check permissions:', error);
      return { granted: false };
    }
  }

  private async requestCameraPermissions(): Promise<{ granted: boolean }> {
    try {
      const granted = await chrome.permissions.request({
        permissions: ['activeTab']
      });
      
      return { granted };
    } catch (error) {
      console.error('[EyeTrack Background] Failed to request permissions:', error);
      return { granted: false };
    }
  }

  private handleError(error: any, tab?: chrome.tabs.Tab): void {
    console.error('[EyeTrack Background] Error reported from content script:', error);
    
    if (tab?.id) {
      // Update badge to show error state
      chrome.action.setBadgeText({ 
        text: '!',
        tabId: tab.id 
      });
      chrome.action.setBadgeBackgroundColor({ 
        color: '#dc3545',
        tabId: tab.id 
      });
    }
  }

  private updateBadge(status: 'active' | 'inactive' | 'error', tab?: chrome.tabs.Tab): void {
    if (!tab?.id) return;
    
    switch (status) {
      case 'active':
        chrome.action.setBadgeText({ text: '●', tabId: tab.id });
        chrome.action.setBadgeBackgroundColor({ color: '#28a745', tabId: tab.id });
        break;
      case 'inactive':
        chrome.action.setBadgeText({ text: '', tabId: tab.id });
        break;
      case 'error':
        chrome.action.setBadgeText({ text: '!', tabId: tab.id });
        chrome.action.setBadgeBackgroundColor({ color: '#dc3545', tabId: tab.id });
        break;
    }
  }

  private async broadcastSettingsUpdate(settings: ExtensionSettings): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      
      for (const tab of tabs) {
        if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateSettings',
            settings: settings
          }).catch(() => {
            // Ignore errors - content script might not be loaded
          });
        }
      }
    } catch (error) {
      console.error('[EyeTrack Background] Failed to broadcast settings:', error);
    }
  }

  private openOptionsPage(): void {
    chrome.runtime.openOptionsPage();
  }
}

// Initialize the background service
new EyeTrackBackgroundService();