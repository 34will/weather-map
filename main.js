const electron = require("electron");
const path = require("path");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const Tray = electron.Tray;
const NativeImage = electron.nativeImage;

let mainWindow = null;
let tray = null;

function createWindow () {
	mainWindow = new BrowserWindow({x: 972, y: 245, width: 438, height: 444, frame: false, resizeable: false, skipTaskbar: true, minimizable: false});

	mainWindow.loadURL("https://earth.nullschool.net/#current/wind/surface/level/patterson=-2.89,54.14,1705");

	mainWindow.on("closed", function () {
		mainWindow = null;
	});

	mainWindow.setMenu(null);
	mainWindow.setIgnoreMouseEvents(true);

	const iconPath = path.join(__dirname, 'Weather Map.ico');
	const icon = NativeImage.createFromPath(iconPath);
	tray = new Tray(icon);
	const contextMenu = Menu.buildFromTemplate([
		{label: "Exit", click() { app.quit(); }}
	]);
	tray.setToolTip("Weather Map");
	tray.setContextMenu(contextMenu);
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin")
    app.quit();
});

app.on("activate", function () {
  if (mainWindow === null)
    createWindow();
});
