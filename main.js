const {app, BrowserWindow, Menu, MenuItem, dialog, ipcMain} = require('electron')
const url = require('url')
const path = require('path')
const {systemPreferences} = require('electron')

let  win = null;
function createWindow() {
  //win = new BrowserWindow({width: 800, height: 600})
  win = new BrowserWindow({ 
    width: 960, 
    height: 740, 
    webPreferences: { 
         contextIsolation: false,
         enableRemoteModule: true,
         nodeIntegration: true,
    }
  })
  win.loadURL(url.format ({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
  }))
  win.openDevTools() //startup with dev tools open
}

const isMac = process.platform === 'darwin'
if (isMac) {
  systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', true)
  systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', true)
}

let menu = null

const dragClick = (menuItem, browserWindow, event) => {
    win.webContents.send('setDragType', menuItem.id)
}
const penClick = (menuItem, browserWindow, event) => {
    win.webContents.send('setPenColor', menuItem.id)
}
const standardClick = (menuItem, browserWindow, event) => {
    win.webContents.send('doStandard', menuItem.id)
}

const screenshotClick  = (menuItem, browserWindow, event) => {
    win.webContents.send('saveScene', 'screenShot.png');
}

const otsuClick = (menuItem, browserWindow, event) => {
    dialog.showMessageBox(
      win,
      {
        message: "Image segmentation classes:",
        buttons: ["2", "3", "4"],
        defaultId: 1, // bound to buttons array
        cancelId: -1 // bound to buttons array
      })
      .then(result => {
        win.webContents.send('drawOtsu', result.response + 2)
      }
    );
}

const template = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { label: 'About',

        click: () => {
          const response = dialog.showMessageBox({
        type: 'info',
        title: 'About',
        message:
          'NiiVue',
      },);
          },
      },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      { label: 'Add Files' , 
        accelerator: process.platform === 'darwin' ? 'Cmd+A' : 'Ctrl+A',
        click: () => {
            dialog.showOpenDialog( {
                properties: ["openFile", "multiSelections"]
            }).then(result => {
                if (result.canceled === false)
                    win.webContents.send('addFiles', result.filePaths);
            });
          },
      },
      { label: 'Close All Files' , 
        click: () => {
            win.webContents.send('closeAll', 0);
          },
      },
      { label: 'Add Drawing' , 
        accelerator: process.platform === 'darwin' ? 'Cmd+D' : 'Ctrl+D',
        click: () => {
            dialog.showOpenDialog( {
                properties: ["openFile"]
            }).then(result => {
                if (result.canceled === false)
                    win.webContents.send('addDrawing', result.filePaths);
            });
          },
      },
      { label: 'Save Drawing' , 
        accelerator: process.platform === 'darwin' ? 'Cmd+S' : 'Ctrl+S',
        click: () => { 
          win.webContents.send('drawSave', 'draw.nii');
        },
      },
      { label: 'Take Screenshot' , 
        click: screenshotClick,
      },
      {
        label: 'Standard',
        submenu: [
          { label: 'FLAIR' ,
            id: 'FLAIR',
            click: standardClick,
          },
          { label: 'mni152' ,
            id: 'mni152',
            click: standardClick,
          },
          { label: 'CT' ,
            id: 'shear',
            click: standardClick,
          },
          { label: 'CT CBF' ,
            id: 'ct_perfusion',
            click: standardClick,
          },
          { label: 'pCASL' ,
            id: 'pcasl',
            click: standardClick,
          },
          { label: 'Mesh' ,
            id: 'mesh',
            click: standardClick,
          },
          { label: 'Overlay' ,
            id: 'overlay',
            click: standardClick,
          },
        ]
      },
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { label: 'Undo Draw' ,
        accelerator: process.platform === 'darwin' ? 'Cmd+Z' : 'Ctrl+Z',
        click: () => {
            win.webContents.send('drawUndo', 0);
          },
      },
    ]
  },
  // view menu
  {
    label: 'View',
    submenu: [
      { label: 'Axial' , 
        click: () => {
            win.webContents.send('setSliceType', 0);
          },
      },
      { label: 'Coronal' , 
        click: () => {
            win.webContents.send('setSliceType', 1);
          },
      },
      { label: 'Sagittal' , 
        click: () => {
            win.webContents.send('setSliceType', 2);
          },
      },
      { label: 'Render' , 
        click: () => {
            win.webContents.send('setSliceType', 4);
          },
      },
      { label: 'A+C+S+R' , 
        accelerator: 'Alt+M',
        click: () => {
            win.webContents.send('setSliceType', 3);
          },
      },
      { type: 'separator' },
      { label: 'Colorbar' ,
        type: 'checkbox',
         id: 'colorbar',
        checked: false,
        click: () => {
            win.webContents.send('showColorbar', menu.getMenuItemById('colorbar').checked);
          },
      },
      { label: 'Radiological' ,
        type: 'checkbox',
         id: 'radiological',
        checked: false,
        click: () => {
            win.webContents.send('setRadiological', menu.getMenuItemById('radiological').checked);
          },
      },
      { label: 'Render Clip Plane' ,
        type: 'checkbox',
         id: 'clipPlane',
        checked: false,
        click: () => {
            win.webContents.send('setClipPlane', menu.getMenuItemById('clipPlane').checked);
          },
      },
      { label: 'Dark Background' ,
        type: 'checkbox',
         id: 'background',
        checked: true,
        click: () => {
            win.webContents.send('setDarkBackground', menu.getMenuItemById('background').checked);
          },
      },
      { label: 'World Space' ,
        type: 'checkbox',
         id: 'worldSpace',
        checked: false,
        click: () => {
            win.webContents.send('setWorldSpace', menu.getMenuItemById('worldSpace').checked);
          },
      },
      { label: 'Smooth' ,
        type: 'checkbox',
         id: 'smooth',
        checked: true,
        click: () => {
            win.webContents.send('setSmooth', menu.getMenuItemById('smooth').checked);
          },
      },
      { type: 'separator' },
      { label: 'Left' , 
        accelerator: 'Alt+L',
        click: () => {
            win.webContents.send('moveCrosshair', 'L');
          },
      },
      { label: 'Right' , 
        accelerator: 'Alt+R',
        click: () => {
            win.webContents.send('moveCrosshair', 'R');
          },
      },
      { label: 'Posterior' , 
        accelerator: 'Alt+P',
        click: () => {
            win.webContents.send('moveCrosshair', 'P');
          },
      },
      { label: 'Anterior' , 
        accelerator: 'Alt+A',
        click: () => {
            win.webContents.send('moveCrosshair', 'A');
          },
      },
      { label: 'Inferior' , 
        accelerator: 'Alt+I',
        click: () => {
            win.webContents.send('moveCrosshair', 'I');
          },
      },
      { label: 'Superior' , 
        accelerator: 'Alt+S',
        click: () => {
            win.webContents.send('moveCrosshair', 'S');
          },
      },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  //draw Menu
  {
    label: 'Draw',
    submenu: [
      { label: 'Off' ,
        id: 'Off',
        accelerator: 'Alt+0',
        checked: true,
        type: 'radio',
        click: penClick,
      },
      { label: 'Red' ,
        id: 'Red',
        type: 'radio', 
        accelerator: 'Alt+1',
        click: penClick,
      },
      { label: 'Green',
        id: 'Green',
        type: 'radio',
        accelerator: 'Alt+2',
        click: penClick,
      },
      { label: 'Blue',
        id: 'Blue',
        type: 'radio',
        accelerator: 'Alt+3',
        click: penClick,
      },
      { label: 'Erase',
        id: 'Erase',
        type: 'radio',
        accelerator: 'Alt+4',
        click: penClick,
      },
      { label: 'Erase Cluster',
        id: 'EraseCluster',
        type: 'radio',
        accelerator: 'Alt+5',
        click: penClick,
      },
      { type: 'separator' },
      { label: 'Draw Filled' ,
        type: 'checkbox',
         id: 'drawFilled',
        checked: true,
        click: () => {
            win.webContents.send('setDrawFilled', menu.getMenuItemById('drawFilled').checked);
          },
      },
      { label: 'Draw Overwrites Existing' ,
        type: 'checkbox',
         id: 'drawOverwrite',
        checked: true,
        click: () => {
            win.webContents.send('setDrawOverwrite', menu.getMenuItemById('drawOverwrite').checked);
          },
      },
      { label: 'Translucent' ,
        type: 'checkbox',
         id: 'drawTranslucent',
        checked: true,
        click: () => {
            win.webContents.send('setDrawTranslucent', menu.getMenuItemById('drawTranslucent').checked);
          },
      },
      { label: 'Otsu Segmentation' ,
        click: otsuClick,
      },
      { label: 'Grow Cut' , 
        click: () => {
            win.webContents.send('drawGrowCut', 1);
          },
      },
    ]
  },
  //Drag menu
  {
    label: 'Drag',
    submenu: [
      { label: 'Contrast' ,
        type: 'radio',
         id: 'dragContrast',
        checked: true,
        click: dragClick,
      },
      { label: 'Measure' ,
        type: 'radio',
         id: 'dragMeasure',
        checked: false,
        click: dragClick,
      },
      { label: 'Pan' ,
        type: 'radio',
         id: 'dragPan',
        checked: false,
        click: dragClick,
      },
      { label: 'None' ,
        type: 'radio',
         id: 'dragNone',
        checked: false,
        click: dragClick,
      },
    ]
  },
  // Window menu
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ] : [
        { role: 'close' }
      ])
    ]
  },
  //Develop menu
  {
    label: 'Develop',
    submenu: [
      {
        label: 'Code',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://github.com/niivue/niivue')
        }
      },
      {
        label: 'Documentation',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://niivue.github.io/niivue/devdocs/')
        }
      },
      {
        label: 'Tools',
        role: 'toggleDevTools' //openDevTools, closeDevTools
      },
      
    ]
  }
]
menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
app.on('ready', createWindow)


