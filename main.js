const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');

// 初始化 electron-store
const electronStore = new Store({
  name: 'auto-build',
  defaults: {
    projects: [],
    deployHistory: [],
  },
});

// 确保只有一个实例运行
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

// 设置用户数据目录为当前目录下的 userData 文件夹
app.setPath('userData', path.join(__dirname, 'userData'));

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    },
    webSecurity: false
  });

  // 加载应用的 index.html 或开发服务器
  // 如果是开发环境（未打包状态），app.isPackaged 为 false
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173/');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // 打开开发者工具
  mainWindow.webContents.openDevTools();
}

// IPC 事件处理
ipcMain.handle('get-projects', () => {
  return electronStore.get('projects', []);
});

ipcMain.handle('add-project', (event, project) => {
  const projects = [...electronStore.get('projects', []), project];
  electronStore.set('projects', projects);
  return projects;
});

ipcMain.handle('save-deploy-history', (event, history) => {
  const deployHistory = [...electronStore.get('deployHistory', []), history];
  electronStore.set('deployHistory', deployHistory);
  return deployHistory;
});

ipcMain.handle('get-deploy-history', (event, projectId) => {
  const deployHistory = electronStore.get('deployHistory', []);
  return deployHistory.filter(item => item.projectId === projectId);
});

// 监听渲染进程的对话框请求
ipcMain.handle('show-open-dialog', async (event, options) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(options);
  return { canceled, filePaths };
});

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，通常会重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', function () {
  // 在 macOS 上，除非用户用 Cmd + Q 明确退出，否则应用及其菜单栏会保持活动状态
  if (process.platform !== 'darwin') app.quit();
});