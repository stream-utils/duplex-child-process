// https://github.com/isaacs/duplex-passthrough/blob/master/dp.js
// https://github.com/joyent/node/blob/master/lib/child_process.js#L583

var spawn = require('child_process').spawn
var Stream = require('stream')
var Duplex = Stream.Duplex
var PassThrough = Stream.PassThrough

require('util').inherits(Child_Process, Duplex)

module.exports = Child_Process

// Convenience method
Child_Process.spawn = function (command, args, options) {
  return new Child_Process().spawn(command, args, options)
}

/*

  Use the constructor to setup/reset the Duplex.
  This does not spawn the child process.

  function Something(options) {
    if (!(this instanceof Something))
      return new Something(options)

    Child_Process.call(this, options)
  }

*/

function Child_Process(options) {
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
  Assumes you already did `Child_Process.call(this, options)`.

*/

Child_Process.prototype.spawn = function (command, args, options) {
  var that = this

  this._process = spawn(command, args, options)
  this._stdin = this._process.stdin
  this._stdout = this._process.stdout
  this._stderr = this._process.stderr
  this._writer.pipe(this._stdin)
  this._stdout.pipe(this._reader, { end: false })
  this.kill = this.destroy = kill

  // listen to stderr.
  var stderr = []
  this._stderr.on('data', onStderrData)
  
  // In some cases ECONNRESET can be emitted by stdin because the process is not interested in any
  // more data but the _writer is still piping. Forget about errors emitted on stdin and stdout
  this._stdin.on('error', noop)
  this._stdout.on('error', noop)
  
  this._stdout.on('end', onStdoutEnd);

  this._process.once('close', onExit)
  this._process.once('error', onError)

  var ex
  var exited
  var killed
  var ended

  return this

  function onStdoutEnd() {
    if (exited && !ended) {
      ended = true;
      that._reader.end(that.emit.bind(that, 'close'));
    }
  }

  function onStderrData(chunk) {
    stderr.push(chunk)
  }

  function onExit(code, signal) {
    if (exited || exited === null)
      return

    exited = true

    if (killed) {

    } else if (ex) {
      // Emit an error
      that.emit('error', ex)
      that.emit('close')
    } else if (code === 0 && signal == null) {
      // All is well
      onStdoutEnd()
    } else {
      // Everything else
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

  function kill(cb) {
    that._stdout.destroy()
    that._stderr.destroy()

    killed = true

    try {
      that._process.kill((options && options.killSignal) || 'SIGTERM')
    } catch (e) {
      ex = e
      onExit()
    }
    cb && cb()
  }

  function cleanup() {
    that._process =
    that._stderr =
    that._stdout =
    that._stdin =
    stderr =
    ex =
    exited =
    killed = null

    that.kill =
    that.destroy = noop
  }
}

var delegateEvents = {
  readable: '_reader',
  data: '_reader',
  end: '_reader',
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

  Child_Process.prototype[method] = function (ev, fn) {
    var substream = delegateEvents[ev]
    if (substream)
      return this[substream][method](ev, fn)
    else
      return og.call(this, ev, fn)
  }
})

// Reset the alias
Child_Process.prototype.addListener = Child_Process.prototype.on

// Delegate the other methods
Child_Process.prototype.pipe = function (dest, opts) {
  return this._reader.pipe(dest, opts)
}

Child_Process.prototype.unpipe = function (dest) {
  return this._reader.unpipe(dest)
}

Child_Process.prototype.setEncoding = function (enc) {
  return this._reader.setEncoding(enc)
}

Child_Process.prototype.read = function (size) {
  return this._reader.read(size)
}

Child_Process.prototype.end = function (chunk, enc, cb) {
  return this._writer.end(chunk, enc, cb)
}

Child_Process.prototype.write = function (chunk, enc, cb) {
  return this._writer.write(chunk, enc, cb)
}

Child_Process.prototype.destroy =
Child_Process.prototype.kill =
Child_Process.prototype.noop = noop

function noop() {}
