'use strict';
const path = require('path');
const {app, BrowserWindow, Tray, Menu, nativeImage, systemPreferences, shell} = require('electron');
/// const {autoUpdater} = require('electron-updater');
const {is} = require('electron-util');
const unhandled = require('electron-unhandled');
//const debug = require('electron-debug');
const contextMenu = require('electron-context-menu');
const config = require('./config.js');
//const menu = require('./menu.js');
const util = require('./util.js');
const API = require('./api.js');

const package_json = require('./package.json');
const VERSION = package_json.version;

let tray;


global.STATUS = {
	playbackInfo: {},
	state: {}
};

unhandled();
//debug();
contextMenu();

// Note: Must match `build.appId` in package.json
app.setAppUserModelId(config.get('appUserModelId'));
app.dock.hide();

// Uncomment this before publishing your first version.
// It's commented out as it throws an error if there are no published versions.
// if (!is.development) {
// 	const FOUR_HOURS = 1000 * 60 * 60 * 4;
// 	setInterval(() => {
// 		autoUpdater.checkForUpdates();
// 	}, FOUR_HOURS);
//
// 	autoUpdater.checkForUpdates();
// }

// Prevent window from being garbage collected
let mainWindow;

const createMainWindow = async () => {
	const win = new BrowserWindow({
		title: app.name,
		show: false,
		width: 600,
		height: 400
	});

	win.on('ready-to-show', () => {
		win.show();
	});

	win.on('closed', () => {
		// Dereference the window
		// For multiple windows store them in an array
		mainWindow = undefined;
	});

	await win.loadFile(path.join(__dirname, 'index.html'));

	return win;
};

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
	app.quit();
}

app.on('second-instance', () => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}

		mainWindow.show();
	}
});

app.on('window-all-closed', () => {
	if (!is.macos) {
		app.quit();
	}
});

app.on('activate', async () => {
	if (!mainWindow) {
		mainWindow = await createMainWindow();
	}
});

(async () => {
	await app.whenReady();
	//Menu.setApplicationMenu(menu);
	//mainWindow = await createMainWindow();

	const icon = nativeImage.createFromDataURL(config.get('icon'));
	tray = new Tray(icon.resize({ width: 24, height: 24 }));

	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'Version: ' + VERSION,
			enabled: false
		},
		{
			label: 'API running on port: ' + config.get('apiPort'),
			enabled: false
		},
		{
			type: 'separator'
		},
		{
			label: 'Allow Remote Control',
			type: 'checkbox',
			checked: config.get('allowControl'),
			click: function () {
				config.set('allowControl', !config.get('allowControl'));
				API.sendControlStatus();
			}
		},
		{
			label: 'Show Notifications',
			type: 'checkbox',
			checked: config.get('showNotifications'),
			click: function () {
				config.set('showNotifications', !config.get('showNotifications'));
			}
		},
		{
			type: 'separator'
		},
		{
			label: 'Request Help/Support',
			click: function() {
				shell.openExternal(config.get('supportUrl'))
			}
		},
		{
			label: 'Quit',
			click: function () {
				app.quit();
			}
		}
	]);

	tray.setToolTip('spotify-controller');
	tray.setContextMenu(contextMenu);

	let allowedEvents = config.get('allowedEvents');
	for (let i = 0; i < allowedEvents.length; i++) {
		systemPreferences.subscribeNotification(allowedEvents[i], (event, userInfo) => {
			util.processNotification(event, userInfo);
		});
	}

	API.start(config.get('apiPort'));
})();
