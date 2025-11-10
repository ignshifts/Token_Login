// DOM Elements
const tokenInput = document.getElementById('token');
const loginBtn = document.getElementById('login-btn');
const copyTokenBtn = document.getElementById('copy-token-btn');
const toggleVisibilityBtn = document.getElementById('toggle-visibility');
const supportLink = document.getElementById('support-link');
const settingsLink = document.getElementById('settings-link');
const settingsPanel = document.getElementById('settings-panel');
const closeSettingsBtn = document.getElementById('close-settings');
const verifyTokenCheckbox = document.getElementById('verify-token-checkbox');
const statusMessage = document.getElementById('status-message');
const loadingOverlay = document.getElementById('loading-overlay');

let isTokenVisible = false;
let verifyTokenEnabled = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkCurrentTab();
    setupEventListeners();
    loadSettings();
    displayVersion();
});

// Event Listeners
function setupEventListeners() {
    loginBtn.addEventListener('click', handleLogin);
    copyTokenBtn.addEventListener('click', handleCopyToken);
    toggleVisibilityBtn.addEventListener('click', toggleTokenVisibility);
    supportLink.addEventListener('click', openSupportLink);
    settingsLink.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    verifyTokenCheckbox.addEventListener('change', handleVerifyTokenToggle);
    
    const discordLoginBtn = document.getElementById('discord-login-btn');
    if (discordLoginBtn) {
        discordLoginBtn.addEventListener('click', openDiscordLogin);
    }
    
    document.querySelector('.status-close').addEventListener('click', hideStatusMessage);
    
    // Close settings when clicking outside
    settingsPanel.addEventListener('click', (e) => {
        if (e.target === settingsPanel) {
            closeSettings();
        }
    });
    
    tokenInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    tokenInput.addEventListener('input', () => {
        tokenInput.classList.remove('error', 'success');
        hideStatusMessage();
    });
}

// Check current tab and enable/disable copy button
function checkCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        const currentUrl = activeTab.url;
        
        if (currentUrl && currentUrl.includes('discord.com/channels/@me')) {
            enableCopyTokenButton();
        } else if (currentUrl && !currentUrl.includes('discord.com/login')) {
            showStatusMessage('Navigate to discord.com/login to use this extension', 'info');
        }
    });
}

// Enable copy token button
function enableCopyTokenButton() {
    copyTokenBtn.disabled = false;
    copyTokenBtn.classList.add('enabled');
    copyTokenBtn.querySelector('span').textContent = 'Copy Token from Discord';
}

// Handle login
async function handleLogin() {
    const token = tokenInput.value.trim();
    
    if (!token) {
        tokenInput.classList.add('error');
        showStatusMessage('Please enter your Discord token', 'error');
        return;
    }
    
    showLoading(true);
    loginBtn.disabled = true;
    
    try {
        let isValid = false;
        
        if (verifyTokenEnabled) {
            // Use API verification
            isValid = await verifyTokenWithAPI(token);
            if (isValid) {
                tokenInput.classList.add('success');
                showStatusMessage('Token verified with API! Logging in...', 'success');
                saveTokenAndRedirect(token);
            } else {
                tokenInput.classList.add('error');
                showStatusMessage('Invalid token. Please check your Discord token.', 'error');
            }
        } else {
            // Use format validation
            isValid = validateTokenFormat(token);
            if (isValid) {
                tokenInput.classList.add('success');
                showStatusMessage('Token format valid! Logging in...', 'success');
                saveTokenAndRedirect(token);
            } else {
                tokenInput.classList.add('error');
                showStatusMessage('Invalid token format. Please check your Discord token.', 'error');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        tokenInput.classList.add('error');
        showStatusMessage('An error occurred during validation', 'error');
    } finally {
        showLoading(false);
        loginBtn.disabled = false;
    }
}

// Handle copy token from Discord
function handleCopyToken() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        
        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: extractTokenFromDiscord
        }, (results) => {
            if (results && results[0] && results[0].result) {
                const token = results[0].result;
                tokenInput.value = token;
                tokenInput.classList.add('success');
                showStatusMessage('Token copied from Discord!', 'success');
            } else {
                showStatusMessage('Could not extract token. Make sure you\'re logged in to Discord.', 'error');
            }
        });
    });
}

// Function to run in Discord tab to extract token
function extractTokenFromDiscord() {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            const cleanToken = token.replace(/"/g, '');
            navigator.clipboard.writeText(cleanToken);
            return cleanToken;
        }
        
        // webpackChunkdiscord_app
        if (window.webpackChunkdiscord_app) {
            let token = null;
            window.webpackChunkdiscord_app.push([
                [Math.random()],
                {},
                req => {
                    for (const moduleId in req.c) {
                        const module = req.c[moduleId];
                        if (module?.exports?.default?.getToken) {
                            token = module.exports.default.getToken();
                            break;
                        }
                        if (module?.exports?.getToken) {
                            token = module.exports.getToken();
                            break;
                        }
                    }
                }
            ]);
            
            if (token) {
                navigator.clipboard.writeText(token);
                return token;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting token:', error);
        return null;
    }
}

// Toggle token visibility
function toggleTokenVisibility() {
    isTokenVisible = !isTokenVisible;
    tokenInput.type = isTokenVisible ? 'text' : 'password';
    
    const svg = toggleVisibilityBtn.querySelector('svg');
    if (isTokenVisible) {
        svg.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        // Normal eye
        svg.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
}

// Validate token format using multiple methods
function validateTokenFormat(token) {
    // Method 1: Check minimum length (Discord tokens are typically 59+ characters)
    if (token.length < 50) {
        return false;
    }
    
    // Method 2: Check for valid Base64 characters and structure
    // Discord tokens consist of three parts separated by dots: userID.timestamp.hmac
    const parts = token.split('.');
    if (parts.length !== 3) {
        return false;
    }
    
    // Method 3: Validate first part (User ID encoded in Base64)
    try {
        const userIdPart = parts[0];
        // Try to decode the user ID from base64
        const decoded = atob(userIdPart);
        // Check if decoded value is a valid user ID (should be numeric)
        if (!/^\d+$/.test(decoded)) {
            return false;
        }
    } catch (e) {
        return false;
    }
    
    // Method 4: Check second part (timestamp) - should be base64 encoded
    try {
        if (parts[1].length < 5) {
            return false;
        }
    } catch (e) {
        return false;
    }
    
    // Method 5: Check third part (HMAC) - should be base64-like string
    if (parts[2].length < 20) {
        return false;
    }
    
    // Method 6: Overall format check - should only contain valid base64 characters and dots
    if (!/^[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+$/.test(token)) {
        return false;
    }
    
    return true;
}

// Verify token with Discord API
async function verifyTokenWithAPI(token) {
    try {
        const response = await fetch('https://discord.com/api/v10/users/@me', {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

// Save token and redirect
function saveTokenAndRedirect(token) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        
        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: saveTokenToStorage,
            args: [token]
        }, () => {
            console.log('Token saved successfully');
            setTimeout(() => {
                window.close();
            }, 1500);
        });
    });
}

// save token
function saveTokenToStorage(token) {
    localStorage.setItem('token', JSON.stringify(token));
    window.location.replace('https://discord.com/channels/@me');
}

// Open support link
function openSupportLink(e) {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://discord.gg/48qbg6UP9g' });
}

// Open Discord login
function openDiscordLogin() {
    chrome.tabs.create({ url: 'https://discord.com/login' });
}

// Settings functions
function openSettings(e) {
    e.preventDefault();
    settingsPanel.classList.remove('hidden');
}

function closeSettings() {
    settingsPanel.classList.add('hidden');
}

function handleVerifyTokenToggle() {
    verifyTokenEnabled = verifyTokenCheckbox.checked;
    saveSettings();
}

function loadSettings() {
    chrome.storage.sync.get(['verifyTokenEnabled'], (result) => {
        verifyTokenEnabled = result.verifyTokenEnabled || false;
        verifyTokenCheckbox.checked = verifyTokenEnabled;
    });
}

function saveSettings() {
    chrome.storage.sync.set({ verifyTokenEnabled: verifyTokenEnabled });
}


function displayVersion() {
    const manifest = chrome.runtime.getManifest();
    const versionDisplay = document.getElementById('version-display');
    if (versionDisplay && manifest.version) {
        versionDisplay.textContent = `v${manifest.version}`;
    }
}

// Show status message
function showStatusMessage(message, type = 'info') {
    const statusText = statusMessage.querySelector('.status-text');
    statusText.textContent = message;
    
    statusMessage.className = `status-message ${type}`;
    statusMessage.classList.remove('hidden');
    
    // Auto hide after 5 seconds for all messages
    setTimeout(() => {
        hideStatusMessage();
    }, 5000);
}

// Hide status message
function hideStatusMessage() {
    statusMessage.classList.add('hidden');
}

// overlay
function showLoading(show) {
    if (show) {
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

