const os = require('os')
const httpServer = require('http').createServer()
const socketio = require('socket.io')(httpServer, {
  cors: { origin: '*' }
})
// const handlers = require('./socketHandlers')
const parser = require('minimist')

class SocketServer {
  constructor(port = 0) {
    this.cliArgs = parser(process.argv, { default: { port: 0 } })
    this.port = this.cliArgs.port === 0 ? port : this.cliArgs.port
    this.io = socketio
  }

  start() {
    let svr = httpServer.listen(this.port)
    this.port = svr.address().port
    this.io.on('connection', this.onConnection)
    process.send = process.send || function () {}
    process.send(
      {
        type: 'port',
        value: this.port
      }
    )
    return this
  }

  onConnection(socket) {
    // for (let handleFunc in handlers) {
    //   handlers[handleFunc](socketio, socket) // must use socketio rather than this.io here
    // }
  }

  quit() {
    this.io.close()
  }

}
module.exports.SocketServer = SocketServer

const socketServer = new SocketServer()
socketServer.start()
