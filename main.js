const electron = require("electron");
const path = require("path");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const Tray = electron.Tray;
const NativeImage = electron.nativeImage;

let mainWindow = null;
let tray = null;

const argumentRegex = /--(.*?)=(.*)/;

function createWindow () {
	const arguments = process
		.argv
		.filter(function (argument) {
			return argumentRegex.test(argument);
		})
		.map(function (argument) {
			return argument
				.match(argumentRegex)
				.splice(1);
		});
	
	const xArgument = arguments.find(function (argument) {
		return argument[0] == "x";
	});
	let x = 0;
	if (xArgument)
		x = parseInt(xArgument[1]);
	if (isNaN(x))
		x = 0;
	
	const yArgument = arguments.find(function (argument) {
		return argument[0] == "y";
	});
	let y = 0;
	if (yArgument)
		y = parseInt(yArgument[1]);
	if (isNaN(y))
		y = 0;
	
	mainWindow = new BrowserWindow({x: x, y: y, width: 438, height: 444, frame: false, resizeable: false, skipTaskbar: true, minimizable: false});

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
