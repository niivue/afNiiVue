const { BrowserWindow} = require('electron')
let createWindow = function (options = {}) {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    show: true,
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      enableRemoteModule: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      plugins: true,
      contextIsolation: false,
      backgroundThrottling: false,
      experimentalFeatures: true
    }
  })
  let host = options.host || 'localhost'
  let socketServerPort = options.socketServerPort || null
  let fileServerPort = options.fileServerPort || null
  win.setTitle('NiiVue')
  win.webContents.openDevTools()
  let url = `http://${host}:${fileServerPort}/gui/index.html?host=${host}&socketServerPort=${socketServerPort}&fileServerPort=${fileServerPort}`
  console.log(url)
  win.loadURL(url)
  
  //setMenu('FSL')
}
// export creatWindow
module.exports.createWindow = createWindow
