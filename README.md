# Duplex Child Process [![Build Status](https://travis-ci.org/stream-utils/duplex-child-process.png)](https://travis-ci.org/stream-utils/duplex-child-process)

Spawn a child process as a duplex stream.

```js
var Child_Process = require('duplex-child-process')

var toJPEG = Child_Process.spawn('convert', ['-', 'JPEG:-'])
var getFormat = Child_Process.spawn('identify', ['-format', '%m', '-'])

fs.createReadStream('img.png')
.pipe(toJPEG)
.pipe(getFormat)
.once('readable', function () {
  var format = this.read().toString('utf8')
  assert.equal(format, 'JPEG')
})
```

## API

### Child_Process.spawn(command, [args], [options])

Convenience wrapper for:

```js
new Child_Process().spawn(command, [args], [options])
```

### new Child_Process(options)

Creates a new duplex child process instance.
Does not spawn a new child process yet.
This is separated from `.spawn()` because you may want to use this in your own constructor.


### proc.spawn(command, [args], [options])

This actually spawns the child process.
In your own app, execute this once you've gotten all your arguments.

## License

The MIT License (MIT)

Copyright (c) 2013 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.