const electron = require("electron");
const path = require("path");

const App = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const Tray = electron.Tray;
const NativeImage = electron.nativeImage;

const argumentRegex = /--(.*?)=(.*)/;

let mainWindow = null;

function GetNumericArgument(arguments, name, def) {
	def = def || 0;
	
	const arg = arguments.find(function (argument) { return argument[0] == name; });
	let res = def;
	if (arg)
		res = parseInt(arg[1]);
	if (isNaN(res))
		res = def;
	return res;
}

function GetBounds(ElectronScreen, x, y, width, height, screen) {
	let displays = ElectronScreen.getAllDisplays();
	console.log(x, y, width, height, screen, displays);
	if (displays.length <= screen)
		displays = displays.slice(0, screen);
	
	let lastDisplay = displays.slice(-1)[0];
	let ret = { x: lastDisplay.bounds.x + x, y: y, width: width, height: height };
	console.log(lastDisplay, ret);
	return ret;
}

function CreateWindow () {
	const ElectronScreen = electron.screen;
	
	const arguments = process
		.argv
		.filter(function (argument) { return argumentRegex.test(argument); })
		.map(function (argument) {
			return argument
				.match(argumentRegex)
				.splice(1);
		});
		
	const x = GetNumericArgument(arguments, "x");
	const y = GetNumericArgument(arguments, "y");
	const width = GetNumericArgument(arguments, "width", 438);
	const height = GetNumericArgument(arguments, "height", 444);
	const screen = GetNumericArgument(arguments, "screen", 1);
	
	let bounds = GetBounds(ElectronScreen, x, y, width, height, screen);
	mainWindow = new BrowserWindow({x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, frame: false, resizeable: false, skipTaskbar: true, minimizable: false});

	mainWindow.loadURL("https://earth.nullschool.net/#current/wind/surface/level/patterson=-2.89,54.14,1705");

	mainWindow.on("closed", function () { mainWindow = null; });
	
	mainWindow.setMenu(null);
	mainWindow.setIgnoreMouseEvents(true);

	const iconPath = path.join(__dirname, 'Weather Map.ico');
	const icon = NativeImage.createFromPath(iconPath);
	let tray = new Tray(icon);
	const contextMenu = Menu.buildFromTemplate([
		{label: "Reposition", click() { mainWindow.setBounds(GetBounds(ElectronScreen, x, y, width, height, screen)); }},
		{label: "Exit", click() { App.quit(); }}
	]);
	tray.setToolTip("Weather Map");
	tray.setContextMenu(contextMenu);
}

App.on("ready", CreateWindow);

App.on("window-all-closed", function () {
  if (process.platform !== "darwin")
    App.quit();
});

App.on("activate", function () {
  if (mainWindow === null)
    CreateWindow();
});
