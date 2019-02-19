const electron = require("electron");
const path = require("path");
const fs = require("fs");

const App = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const Tray = electron.Tray;
const NativeImage = electron.nativeImage;
let ElectronScreen = null;

const PathSeparator = process.platform == "win32" ? "\\" : "/";
const AppDataFolder = (process.env.APPDATA || (process.platform == "darwin" ? process.env.HOME + "Library/Preferences" : process.env.HOME + "/.local/share")) + PathSeparator + "WeatherMap" + PathSeparator;
const ConfigFile = AppDataFolder + "config.json";
const ConfigFileEncoding = "utf-8";
const DefaultLayout = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    screen: 0
};

const argumentRegex = /--(.*?)=(.*)/;

let mainWindow = null;
let parsedArguments = null;
let tray = null;
let layouts = null;
let layout = null;
let layoutIndex = null;

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
    if (displays.length > layout.screen)
        displays = displays.slice(0, layout.screen);

    let lastDisplay = displays.slice(-1)[0];
    let ret = {
        x: (lastDisplay ? lastDisplay.bounds.x : 0) + layout.x,
        y: (lastDisplay ? lastDisplay.bounds.y : 0) + layout.y,
        width: layout.width,
        height: layout.height
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

    let layoutContextMenuItems = [];
    for (let i = 0; i < layouts.length; i++) {
        layoutContextMenuItems.push({
            type: "radio",
            label: "Layout #" + (i + 1) + " (" + layouts[i].name + ")",
            checked: i == layoutIndex,
            click() {
                layoutIndex = i;
                layout = layouts[layoutIndex];
                layoutContextMenuItems.forEach(function (x) {
                    x.checked = false;
                });
                layoutContextMenuItems[i].checked = true;
                Reposition();
            }
        });
    }

    let menuItems = displayContextMenuItems.concat([{ type: "separator" }]);
    if (layoutContextMenuItems.length > 0) {
        menuItems = menuItems
            .concat(layoutContextMenuItems)
            .concat([{ type: "separator" }]);
    }

    const contextMenu = Menu.buildFromTemplate(menuItems.concat([{
            label: "Reload Config",
            click() {
                ReadConfigFile();
                Reposition();
            }
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

function ReadConfigFile() {
    if (!fs.existsSync(AppDataFolder))
        fs.mkdir(AppDataFolder);
    if (!fs.existsSync(ConfigFile))
        fs.writeFileSync(ConfigFile, "{}", ConfigFileEncoding);
    let config = JSON.parse(fs.readFileSync(ConfigFile, ConfigFileEncoding)) || {};

    layouts = config.layouts || [];
    layoutIndex = GetNumericArgument(parsedArguments, "layout-index", config.layoutIndex != null && config.layoutIndex != undefined ? config.layoutIndex : -1);
    for (let i = 0; i < layouts.length; i++)
        layouts[i] = Object.assign(Object.assign({}, DefaultLayout), layouts[i]);

    layout = Object.assign({}, DefaultLayout);
    if (layoutIndex >= 0 && layoutIndex < layouts.length)
        layout = layouts[layoutIndex];

    x = GetNumericArgument(parsedArguments, "x", layout.x);
    y = GetNumericArgument(parsedArguments, "y", layout.y);
    width = GetNumericArgument(parsedArguments, "width", layout.width);
    height = GetNumericArgument(parsedArguments, "height", layout.height);
    screen = GetNumericArgument(parsedArguments, "screen", layout.screen);
}

function CreateWindow() {
    ElectronScreen = electron.screen;

    parsedArguments = process
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

    ReadConfigFile();

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