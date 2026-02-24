const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow() {
    console.log('Creating Electron window...');
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const mainWindow = new BrowserWindow({
        width: Math.min(1440, width),
        height: Math.min(900, height),
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(__dirname, '../public/autoworxlogo.png'),
        title: 'Autoworx System',
        autoHideMenuBar: true,
    });

    // Smooth appearance
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    const startUrl = isDev
        ? 'http://127.0.0.1:3000/admin'
        : 'https://autoworx-system.vercel.app/admin';

    // If you use a full Next server in prod, you'd point to that instead.
    // For now, let's keep it simple for development.
    mainWindow.loadURL(startUrl);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
