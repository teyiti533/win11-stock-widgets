import { app, BrowserWindow, ipcMain, Menu, nativeImage } from "electron";
import * as path from "path";
import isDev from "electron-is-dev";
import { WidgetStore } from "./store";
import { createDefaultWidget } from "./widget-manager";

let windows: BrowserWindow[] = [];
const store = new WidgetStore();

function createWindow(widgetConfig?: any) {
  const win = new BrowserWindow({
    width: widgetConfig?.width ?? 420,
    height: widgetConfig?.height ?? 300,
    minWidth: 240,
    minHeight: 160,
    frame: false,
    transparent: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    win.loadURL(`file://${path.join(__dirname, "../src/renderer/index.html")}`);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../src/renderer/index.html"));
  }

  // attach config
  win.once("ready-to-show", () => {
    win.webContents.send("widget-init", widgetConfig ?? createDefaultWidget());
  });

  // context menu
  win.webContents.on("context-menu", () => {
    const menu = Menu.buildFromTemplate([
      {
        label: "新建同类 Widget",
        click: () => {
          const newConf = createDefaultWidget();
          const w = createWindow(newConf);
          windows.push(w);
        }
      },
      { type: "separator" },
      { label: "关闭", role: "close" }
    ]);
    menu.popup();
  });

  windows.push(win);
  return win;
}

app.whenReady().then(() => {
  // create initial windows from store
  const configs = store.getAll();
  if (configs.length === 0) {
    createWindow(createDefaultWidget());
  } else {
    configs.forEach((c: any) => createWindow(c));
  }

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  // On macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== "darwin") app.quit();
});

// IPC handlers for saving configuration and spawning new widget
ipcMain.handle("save-widget-config", (_e, conf) => {
  store.save(conf);
  return true;
});

ipcMain.handle("create-widget", (_e, conf) => {
  const w = createWindow(conf);
  return true;
});