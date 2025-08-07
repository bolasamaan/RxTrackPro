const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { app, BrowserWindow, ipcMain } = require('electron');

// Configure logging
log.transports.file.level = 'debug';
autoUpdater.logger = log;

// Configure updater options
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function initialize(mainWindow) {
    // Check for updates
    function checkForUpdates() {
        autoUpdater.checkForUpdates();
    }

    // Start checking for updates
    const sixHours = 6 * 60 * 60 * 1000;
    setInterval(checkForUpdates, sixHours);
    checkForUpdates();

    // Update event handlers
    autoUpdater.on('checking-for-update', () => {
        mainWindow.webContents.send('update-message', 'Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
        mainWindow.webContents.send('update-available', info);
    });

    autoUpdater.on('update-not-available', () => {
        mainWindow.webContents.send('update-not-available');
    });

    autoUpdater.on('error', (err) => {
        log.error('AutoUpdater error:', err);
        mainWindow.webContents.send('update-error', err.message);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        mainWindow.webContents.send('update-progress', progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
        mainWindow.webContents.send('update-downloaded', info);
    });

    // Handle IPC messages from renderer
    ipcMain.on('start-download', () => {
        autoUpdater.downloadUpdate();
    });

    ipcMain.on('install-update', () => {
        autoUpdater.quitAndInstall(false, true);
    });

    ipcMain.on('check-for-updates', () => {
        checkForUpdates();
    });
}

module.exports = { initialize };
