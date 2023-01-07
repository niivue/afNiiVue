const { app, BrowserWindow, Menu, MenuItem, dialog, ipcMain } = require('electron')
const url = require('url')
const path = require('path')
const os = require('os')
const fs = require('fs')
const { fork } = require('child_process')
const { systemPreferences } = require('electron')
const { niiVueMenu } = require('./menu')
const { createWindow } = require('./window');
const { SocketServer } = require('./socketServer')

// apply some chromium app switches
app.commandLine.appendSwitch("disable-http-cache")
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors', 'ignore-gpu-blacklist');

class NiiVueApp {
  constructor() {
    this.window = null // holds the reference to the browser window object
    this.app = app // the electron app instance reference
    this.isPrimaryInstance = this.app.requestSingleInstanceLock()
    this.host = 'localhost' // set to localhost for local servers
    this.socketServer = null // reference to web socket server instance
    this.socketServerPort = null // the port for the web socket server
    this.socketClient = null // reference to the web socket client for two way comms
    this.fileServer = null // the reference to the file server subprocess
    this.fileServerPort = null // the port for the file server 
    this.childProcs = [] // holds all references to child subprocesses

    // register the windows closed handler
    this.app.on('window-all-closed', () => {
      this.quit() // call our own quit method
    })

    // register the app quit handler
    this.app.on('quit', () => {
      this.quit() // call our own quit method
    })
  }

  // define out own quit method
  quit() {
    this.quitSocketClient() // shutdown and quit all web socket servers
    // quit all other subprocesses that we stored
    this.childProcs.forEach((child) => {
      child.kill()
    })
    this.app.quit() // finally quit the electron app
  }
  // dereference the socket client
  quitSocketClient() {
    this.socketClient = null
  }

  showWindow() {
    createWindow({
      'host': this.host,
      'webSocketPort': this.socketServerPort,
      'fileServerPort': this.fileServerPort
    })
    console.log('NIIVUE_HOST     ', this.host)
    console.log('NIIVUE_FS_PORT  ', this.fileServerPort)
    console.log('NIIVUE_WS_PORT  ', this.socketServerPort)
  }

  onFileServerPort(port) {
    this.fileServerPort = port
    // only create window when all subprocesses have been established. This is async
    if (
      this.socketServerPort !== null &&
      this.fileServerPort !== null
    ) {
      // if the server dependencies are ready, show the browser window
     this.showWindow() 
    }
  }

  onSocketServerPort(port) {
    this.socketServerPort = port
    // only create window when all subprocesses have been established. This is async
    if (
      this.socketServerPort !== null &&
      this.fileServerPort !== null
    ) {
      // if the server dependencies are ready, show the browser window
     this.showWindow() 
    }
  }

  handleFileServerMessage(message) {
    // msg is expected to be a JSON object (automatically serialized and deserialized by process.send and 'message')
    // if 'port' key is set
    if (message.type === 'port') {
      this.onFileServerPort(message.value)
    }
  }

  handleSocketServerMessage(message) {
    if (message.type === 'port'){
      this.onSocketServerPort(message.value)
    }
  }

  // the start method provisions and launches the app and its dependent subprocesses
  start() {
    // quit if new instance is not primary instance
    if (!this.isPrimaryInstance) {
      this.quit() // immediately quit any app instance that isn't the primary two avoid two NiiVue apps running
    } else {
      this.app.on('second-instance', (event, argv) => {
        // do nothing for now
        return
      })
    }
    // only perform the following steps if the app is being started for the first time
    // and no other app instance is running
    if (this.isPrimaryInstance) {
      // when the electron app is ready
      this.app.on('ready', () => {
        // launch the file server subprocess
        // port=0 will enable the server to choose any free port
        // launch the socket server and store a reference
        this.socketServer = fork(
          path.join(__dirname, 'socketServer.js'),
          [`--port=0`, `--host=${this.host}`],
          { env: {FORK: true} }
        )

        this.fileServer = fork(
          path.join(__dirname, 'fileServer.js'),
          [`--port=0`, `--host=${this.host}`],
          { env: {FORK: true} } // pass the parent env
        )
        
        // add the file server reference to our list of child processes
        this.childProcs.push(this.fileServer)
        this.childProcs.push(this.socketServer)
        // set file server message handler
        this.fileServer.on('message', (message) => {
          this.handleFileServerMessage(message)
        })
        // set socket server message handler 
        this.socketServer.on('message', (message) => {
          this.handleSocketServerMessage(message)
        })
      })
    }
  }
}

const isMac = process.platform === 'darwin'
if (isMac) {
  systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', true)
  systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', true)
}

// set the main applicaiton menu
const appMenu = Menu.buildFromTemplate(niiVueMenu)
Menu.setApplicationMenu(appMenu)

// export app instance for testing needs (TODO: implement tests)
module.exports.NiiVueApp = NiiVueApp
// create an app instance
const niivueApp = new NiiVueApp()
// launch the app
niivueApp.start()
