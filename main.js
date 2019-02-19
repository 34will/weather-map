const electron = require("electron");
const path = require("path");

const App = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const Tray = electron.Tray;
const NativeImage = electron.nativeImage;
let ElectronScreen = null;

const argumentRegex = /--(.*?)=(.*)/;

let mainWindow = null;
let tray = null;
let x = null;
let y = null;
let width = null;
let height = null;
let screen = null;

function GetNumericArgument(argumentsArray, name, def) {
    def = def || 0;

    const arg = argumentsArray.find(function (argument) {
        return argument[0] == name;
    });
    let res = def;
    if (arg)
        res = parseInt(arg[1]);
    if (isNaN(res))
        res = def;
    return res;
}

function GetBounds() {
    let displays = ElectronScreen.getAllDisplays();
    if (displays.length > screen)
        displays = displays.slice(0, screen);

    let lastDisplay = displays.slice(-1)[0];
    let ret = {
        x: lastDisplay.bounds.x + x,
        y: lastDisplay.bounds.y + y,
        width: width,
        height: height
    };
    return ret;
}

function Reposition() {
    mainWindow.setBounds(GetBounds());
}

function CalculateDisplays() {
    let displays = ElectronScreen.getAllDisplays();
    let displayContextMenuItems = [];
    for (let i = 0; i < displays.length; i++) {
        displayContextMenuItems.push({
            type: "radio",
            label: "Display #" + (i + 1) + " (" + displays[i].bounds.width + "x" + displays[i].bounds.height + ")",
            checked: (i + 1) == screen,
            click() {
                screen = i + 1;
                displayContextMenuItems.forEach(function (x) {
                    x.checked = false;
                });
                displayContextMenuItems[i].checked = true;
                Reposition();
            }
        });
    }

    const contextMenu = Menu.buildFromTemplate(displayContextMenuItems.concat([{
            type: "separator"
        }, {
            label: "Reposition",
            click() {
                Reposition();
            }
        }, {
            label: "Exit",
            click() {
                App.quit();
            }
        }
    ]));
    tray.setContextMenu(contextMenu);
}

function CreateWindow() {
    ElectronScreen = electron.screen;

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

    ElectronScreen.on("display-added", function () {
        CalculateDisplays();
        Reposition();
    });
    ElectronScreen.on("display-removed", function () {
        CalculateDisplays();
        Reposition();
    });
    ElectronScreen.on("display-metrics-changed", function () {
        CalculateDisplays();
        Reposition();
    });

    x = GetNumericArgument(arguments, "x");
    y = GetNumericArgument(arguments, "y");
    width = GetNumericArgument(arguments, "width", 438);
    height = GetNumericArgument(arguments, "height", 444);
    screen = GetNumericArgument(arguments, "screen", 1);

    let bounds = GetBounds();
    mainWindow = new BrowserWindow({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        frame: false,
        resizeable: false,
        skipTaskbar: true,
        minimizable: false
    });

    mainWindow.loadURL("https://earth.nullschool.net/#current/wind/surface/level/patterson=-2.89,54.14,1705");

    mainWindow.on("closed", function () {
        mainWindow = null;
    });

    mainWindow.setMenu(null);
    mainWindow.setIgnoreMouseEvents(true);

    const iconPath = path.join(__dirname, 'Weather Map.ico');
    const icon = NativeImage.createFromPath(iconPath);

    tray = new Tray(icon);
    tray.setToolTip("Weather Map");

    CalculateDisplays();
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