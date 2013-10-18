var path = require('path')
var fs = require('fs')
var assert = require('assert')
var streamTo = require('stream-to')

var Wrapper = require('./')

var image = path.join(__dirname, 'ts.jpg')

describe('Duplex Child Process', function () {
  it('should emit a close event', function (done) {
    var proc = new Wrapper().spawn('identify', ['-format', '%m', image])
    proc.on('close', done)
    proc.on('error', done)
  })

  it('should emit a data event', function (done) {
    var proc = new Wrapper().spawn('identify', ['-format', '%m', image])
    proc.once('data', function (chunk) {
      done()
    })
    proc.on('error', done)
  })

  it('should emit an end event', function (done) {
    var proc = new Wrapper().spawn('identify', ['-format', '%m', image])
    proc.on('end', done)
    proc.on('error', done)
  })

  it('should return the correct stdout', function (done) {
    var proc = new Wrapper().spawn('identify', ['-format', '%m', image])

    streamTo.buffer(proc, function (err, buf) {
      assert.ifError(err)
      assert.equal('JPEG', buf.toString('utf8').trim())
      done()
    })
  })

  it('should work with pipes', function (done) {
    var proc1 = new Wrapper().spawn('convert', ['-', 'PNG:-'])
    var proc2 = new Wrapper().spawn('identify', ['-format', '%m', '-'])

    fs.createReadStream(image)
    .on('error', done)
    .pipe(proc1)
    .on('error', done)
    .pipe(proc2)

    streamTo.buffer(proc2, function (err, buf) {
      assert.ifError(err)
      assert.equal('PNG', buf.toString('utf8').trim())
      done()
    })
  })

  it('should cleanup after itself', function (done) {
    var proc = new Wrapper().spawn('convert', ['-version'])
    .on('end', function () {
      setImmediate(function () {
        assert.ok(!proc._process)
        assert.ok(!proc._stdin)
        assert.ok(!proc._stdout)
        assert.ok(!proc._stderr)
        assert.ok(!proc._writer)
        assert.ok(!proc._reader)

        done()
      })
    })
  })

  it('should not emit an error on destroy', function (done) {
    var proc = new Wrapper().spawn('convert', ['-version'])
    .on('close', done)
    .on('error', done)
    .destroy()
  })

  it('should pipe a source stream before spawning', function (done) {
    fs.createReadStream(image)
    .on('error', done)
    .pipe(new Wrapper())
    .spawn('convert', ['-', 'PNG:-'])
    .on('error', done)
    .pipe(new Wrapper())
    .spawn('identify', ['-format', '%m', '-'])
    .on('error', done)
    .on('readable', function () {
      assert.equal('PNG', this.read().toString('utf8').trim())

      done()
    })
  })
})