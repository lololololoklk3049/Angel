class RedProxy {
    constructor() {
        this.proxyEnabled = true;
        this.currentTabs = 1;
        this.activeTab = 'tab1';
        this.tabData = {};
        this.settings = {
            proxyMethod: 'uv',
            encryption: 'none',
            defaultSearch: 'duckduckgo',
            autoProxy: true
        };
        
        this.init();
    }

    init() {
        // Load settings from localStorage
        this.loadSettings();
        
        // Initialize UI elements
        this.initEventListeners();
        this.initFirstTab();
        
        // Update UI based on settings
        this.updateUI();
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('redProxySettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
    }

    saveSettings() {
        localStorage.setItem('redProxySettings', JSON.stringify(this.settings));
    }

    initEventListeners() {
        // Search button
        document.getElementById('searchBtn').addEventListener('click', () => this.handleSearch());
        
        // Search input Enter key
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // Tab buttons
        document.getElementById('addTabBtn').addEventListener('click', () => this.addNewTab());
        document.getElementById('newTabBtn').addEventListener('click', () => this.addNewTab());
        
        // Control buttons
        document.getElementById('ddgBtn').addEventListener('click', () => this.openDuckDuckGo());
        document.getElementById('toggleProxyBtn').addEventListener('click', () => this.toggleProxy());
        document.getElementById('settingsBtn').addEventListener('click', () => this.toggleSettings());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveProxySettings());
        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
        
        // Tab switching and closing
        this.setupTabListeners();
    }

    setupTabListeners() {
        document.addEventListener('click', (e) => {
            // Tab selection
            if (e.target.classList.contains('tab') || e.target.parentElement.classList.contains('tab')) {
                const tab = e.target.classList.contains('tab') ? e.target : e.target.parentElement;
                const tabId = tab.getAttribute('data-tab-id');
                if (tabId) this.switchTab(tabId);
            }
            
            // Tab close button
            if (e.target.classList.contains('tab-close')) {
                e.stopPropagation();
                const tab = e.target.parentElement;
                const tabId = tab.getAttribute('data-tab-id');
                if (tabId) this.closeTab(tabId);
            }
        });
    }

    initFirstTab() {
        this.tabData.tab1 = {
            title: 'New Tab',
            url: 'https://duckduckgo.com',
            history: [],
            currentIndex: -1
        };
    }

    handleSearch() {
        const input = document.getElementById('searchInput').value.trim();
        if (!input) return;
        
        let url = input;
        
        // Check if it's a search term or URL
        if (!this.isValidUrl(input)) {
            url = this.getSearchUrl(input);
        } else if (!url.includes('://')) {
            url = 'https://' + url;
        }
        
        this.navigateTab(this.activeTab, url);
        document.getElementById('searchInput').value = '';
    }

    getSearchUrl(query) {
        const engines = {
            duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
            startpage: `https://www.startpage.com/do/dsearch?query=${encodeURIComponent(query)}`
        };
        
        return engines[this.settings.defaultSearch] || engines.duckduckgo;
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return ['http:', 'https:'].includes(url.protocol);
        } catch (_) {
            return false;
        }
    }

    addNewTab() {
        this.currentTabs++;
        const tabId = `tab${this.currentTabs}`;
        
        // Create tab element
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.setAttribute('data-tab-id', tabId);
        tabElement.innerHTML = `
            <span>New Tab</span>
            <button class="tab-close">&times;</button>
        `;
        
        document.getElementById('tabsList').appendChild(tabElement);
        
        // Create iframe for tab
        const iframe = document.createElement('iframe');
        iframe.className = 'browser-frame';
        iframe.id = `browserFrame${this.currentTabs}`;
        iframe.src = 'https://duckduckgo.com';
        
        // Create tab content container
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        tabContent.id = tabId;
        tabContent.appendChild(iframe);
        
        // Hide current tab content and show new one
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add to DOM
        document.querySelector('.browser-container').appendChild(tabContent);
        tabElement.classList.add('active');
        tabContent.classList.add('active');
        
        // Store tab data
        this.tabData[tabId] = {
            title: 'New Tab',
            url: 'https://duckduckgo.com',
            history: [],
            currentIndex: -1
        };
        
        // Switch to new tab
        this.switchTab(tabId);
    }

    switchTab(tabId) {
        if (!this.tabData[tabId]) return;
        
        // Update active tab
        this.activeTab = tabId;
        
        // Update UI
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        const contentElement = document.getElementById(tabId);
        
        if (tabElement) tabElement.classList.add('active');
        if (contentElement) contentElement.classList.add('active');
        
        // Update search input with current URL
        const currentUrl = this.tabData[tabId]?.url || '';
        document.getElementById('searchInput').value = currentUrl.includes('duckduckgo.com') ? '' : currentUrl;
    }

    closeTab(tabId) {
        // Don't close the last tab
        if (Object.keys(this.tabData).length <= 1) {
            alert('Cannot close the last tab!');
            return;
        }
        
        // Remove from DOM
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        const contentElement = document.getElementById(tabId);
        
        if (tabElement) tabElement.remove();
        if (contentElement) contentElement.remove();
        
        // Remove from data
        delete this.tabData[tabId];
        
        // Switch to another tab
        const remainingTabs = Object.keys(this.tabData);
        if (remainingTabs.length > 0) {
            this.switchTab(remainingTabs[0]);
        }
    }

    navigateTab(tabId, url) {
        if (!this.tabData[tabId]) return;
        
        const iframe = document.getElementById(`browserFrame${tabId.replace('tab', '')}`);
        if (!iframe) return;
        
        // Show loading indicator
        this.showLoading();
        
        // Store in history
        this.tabData[tabId].history.push(url);
        this.tabData[tabId].currentIndex++;
        this.tabData[tabId].url = url;
        
        // Update tab title
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"] span`);
        if (tabElement) {
            tabElement.textContent = new URL(url).hostname || 'Loading...';
        }
        
        // Load URL with or without proxy
        if (this.proxyEnabled) {
            const proxiedUrl = this.applyProxy(url);
            iframe.src = proxiedUrl;
        } else {
            iframe.src = url;
        }
        
        // Handle iframe load/error events
        iframe.onload = () => {
            this.hideLoading();
        };
        
        iframe.onerror = () => {
            this.showError('Failed to load page');
        };
    }

    applyProxy(url) {
        const base64Url = btoa(url);
        
        switch(this.settings.proxyMethod) {
            case 'uv':
                // Ultraviolet style proxy
                return `/proxy/uv/${base64Url}`;
            case 'cors':
                // CORS proxy
                return `https://cors-anywhere.herokuapp.com/${url}`;
            case 'fetch':
                // Fetch-based proxy
                return `/proxy/fetch/${base64Url}`;
            default:
                return url;
        }
    }

    openDuckDuckGo() {
        this.navigateTab(this.activeTab, 'https://duckduckgo.com');
    }

    toggleProxy() {
        this.proxyEnabled = !this.proxyEnabled;
        
        const statusElement = document.getElementById('proxyStatus');
        const statusText = document.getElementById('statusText');
        
        if (this.proxyEnabled) {
            statusElement.className = 'proxy-status status-active';
            statusText.textContent = 'Proxy Active';
        } else {
            statusElement.className = 'proxy-status status-inactive';
            statusText.textContent = 'Proxy Disabled';
        }
        
        // Reload current page with new proxy setting
        const currentUrl = this.tabData[this.activeTab]?.url;
        if (currentUrl) {
            this.navigateTab(this.activeTab, currentUrl);
        }
    }

    toggleSettings() {
        const panel = document.getElementById('settingsPanel');
        panel.classList.toggle('active');
        
        // Update settings UI
        document.getElementById('proxyMethod').value = this.settings.proxyMethod;
        document.getElementById('encryption').value = this.settings.encryption;
        document.getElementById('defaultSearch').value = this.settings.defaultSearch;
        document.getElementById('autoProxy').checked = this.settings.autoProxy;
    }

    saveProxySettings() {
        this.settings = {
            proxyMethod: document.getElementById('proxyMethod').value,
            encryption: document.getElementById('encryption').value,
            defaultSearch: document.getElementById('defaultSearch').value,
            autoProxy: document.getElementById('autoProxy').checked
        };
        
        this.saveSettings();
        alert('Settings saved!');
        
        // Hide settings panel
        document.getElementById('settingsPanel').classList.remove('active');
    }

    resetSettings() {
        this.settings = {
            proxyMethod: 'uv',
            encryption: 'none',
            defaultSearch: 'duckduckgo',
            autoProxy: true
        };
        
        this.saveSettings();
        
        // Update UI
        document.getElementById('proxyMethod').value = this.settings.proxyMethod;
        document.getElementById('encryption').value = this.settings.encryption;
        document.getElementById('defaultSearch').value = this.settings.defaultSearch;
        document.getElementById('autoProxy').checked = this.settings.autoProxy;
        
        alert('Settings reset to defaults!');
    }

    updateUI() {
        // Update proxy status
        const statusElement = document.getElementById('proxyStatus');
        const statusText = document.getElementById('statusText');
        
        if (this.proxyEnabled) {
            statusElement.className = 'proxy-status status-active';
            statusText.textContent = 'Proxy Active';
        } else {
            statusElement.className = 'proxy-status status-inactive';
            statusText.textContent = 'Proxy Disabled';
        }
        
        // Set auto-proxy
        if (this.settings.autoProxy) {
            this.proxyEnabled = true;
        }
    }

    showLoading() {
        document.getElementById('loading').classList.add('active');
        document.getElementById('error').classList.remove('active');
    }

    hideLoading() {
        document.getElementById('loading').classList.remove('active');
    }

    showError(message) {
        document.getElementById('loading').classList.remove('active');
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('error').classList.add('active');
    }

    retry() {
        document.getElementById('error').classList.remove('active');
        const currentUrl = this.tabData[this.activeTab]?.url;
        if (currentUrl) {
            this.navigateTab(this.activeTab, currentUrl);
        }
    }
}

// Initialize Red Proxy when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.redProxy = new RedProxy();
});

// Global retry function for error button
window.retry = () => {
    if (window.redProxy) {
        window.redProxy.retry();
    }
};
