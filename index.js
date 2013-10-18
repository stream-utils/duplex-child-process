// https://github.com/isaacs/duplex-passthrough/blob/master/dp.js
// https://github.com/joyent/node/blob/master/lib/child_process.js#L583

var spawn = require('child_process').spawn
var Stream = require('stream')
var Duplex = Stream.Duplex
var PassThrough = Stream.PassThrough

require('util').inherits(Wrapper, Duplex)

module.exports = Wrapper

// Convenience method
Wrapper.spawn = function (command, args, options) {
  return new Wrapper().spawn(command, args, options)
}

/*

  Use the constructor to setup/reset the Duplex.
  This does not spawn the child process.

  function Something(options) {
    if (!(this instanceof Something))
      return new Something(options)

    Wrapper.call(this, options)
  }

*/

function Wrapper(options) {
  this._reader = new PassThrough(options)
  this._writer = new PassThrough(options)
  Duplex.call(this, options)

  var onError =
  this._onError =
  this._onError || this.emit.bind(this, 'error')

  this._reader.on('error', onError)
  this._writer.on('error', onError)

  this._readableState = this._reader._readableState
  this._writableState = this._writer._writableState
}

/*

  Execute this when you actually want to spawn the child process.
  Assumes you already did `Wrapper.call(this, options)`.

*/

Wrapper.prototype.spawn = function (command, args, options) {
  var that = this

  this._process = spawn(command, args, options)
  this._stdin = this._process.stdin
  this._stdout = this._process.stdout
  this._stderr = this._process.stderr
  this._writer.pipe(this._stdin)
  this._stdout.pipe(this._reader)
  this.kill = kill

  // We only listen to stderr.
  var stderr = []
  this._stderr.on('data', onStderrData)
  this._process.once('close', onExit)
  this._process.once('error', onError)

  var ex
  var exited
  var killed

  return this

  function onStderrData(chunk) {
    stderr.push(chunk)
  }

  function onExit(code, signal) {
    if (exited)
      return

    exited = true

    if (ex) {
      that.emit('error', ex)
      that.emit('close')
    } else if (code === 0 && signal == null) {
      that.emit('end')
      that.emit('close')
    } else {
      ex = new Error('Command failed: ' + Buffer.concat(stderr).toString('utf8'))
      ex.killed = that._process.killed || killed
      ex.code = code
      ex.signal = signal
      that.emit('error', ex)
      that.emit('close')
    }

    cleanup()
  }

  function onError(err) {
    ex = err
    that._stdout.destroy()
    that._stderr.destroy()
    onExit()
  }

  function kill() {
    that._stdout.destroy()
    that._stderr.destroy()

    killed = true

    try {
      that._process.kill(options.killSignal || 'SIGTERM')
    } catch (e) {
      ex = e
      onExit()
    }
  }

  function cleanup() {
    that._process =
    that._stderr =
    that._stdout =
    that._stdin =
    that._reader =
    that._writer =
    stderr =
    ex =
    exited =
    killed = null

    that.kill = noop
  }
}

// Delegate events to the correct substream
var delegateEvents = {
  readable: '_reader',
  data: '_reader',
  drain: '_writer',
  finish: '_writer'
}

var eventMethods = [
  'on',
  'once',
  'removeListener',
  'removeListeners',
  'listeners'
]

eventMethods.forEach(function (method) {
  var og = Duplex.prototype[method]

  Wrapper.prototype[method] = function (ev, fn) {
    var substream = delegateEvents[ev]
    if (substream)
      return this[substream][method](ev, fn)
    else
      return og.call(this, ev, fn)
  }
})

// Reset the alias
Wrapper.prototype.addListener = Wrapper.prototype.on

// Delegate the other methods
Wrapper.prototype.pipe = function (dest, opts) {
  return this._reader.pipe(dest, opts)
}

Wrapper.prototype.unpipe = function (dest) {
  return this._reader.unpipe(dest)
}

Wrapper.prototype.setEncoding = function (enc) {
  return this._reader.setEncoding(enc)
}

Wrapper.prototype.read = function (size) {
  return this._reader.read(size)
}

Wrapper.prototype.end = function (chunk, enc, cb) {
  return this._writer.end(chunk, enc, cb)
}

Wrapper.prototype.write = function (chunk, enc, cb) {
  return this._writer.write(chunk, enc, cb)
}

Wrapper.prototype.kill =
Wrapper.prototype.noop = noop

function noop() {}