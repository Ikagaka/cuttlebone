(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.NarLoader = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],3:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],4:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":2,"ieee754":6,"isarray":9}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],6:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],7:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],8:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],9:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],10:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
    try {
        cachedSetTimeout = setTimeout;
    } catch (e) {
        cachedSetTimeout = function () {
            throw new Error('setTimeout is not defined');
        }
    }
    try {
        cachedClearTimeout = clearTimeout;
    } catch (e) {
        cachedClearTimeout = function () {
            throw new Error('clearTimeout is not defined');
        }
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],11:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],12:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":11,"_process":10,"inherits":7}],13:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.10.0

/* (C) 2014 Narazaka : Licensed under The MIT License - http://narazaka.net/license/MIT?2014 */

(function() {
  var Encoding, JSZip, NanikaDirectory, NanikaFile, NarDescript, NarLoader, Promise;

  if ((typeof require !== "undefined" && require !== null) && (typeof module !== "undefined" && module !== null)) {
    JSZip = require('jszip');
    Encoding = require('encoding-japanese');
    if (typeof Promise === "undefined" || Promise === null) {
      Promise = require('bluebird');
    }
  } else if (typeof window !== "undefined" && window !== null) {
    JSZip = window.JSZip;
    Encoding = window.Encoding;
    if (Promise == null) {
      Promise = window.Promise;
    }
  }

  NarLoader = (function() {
    function NarLoader() {}

    NarLoader.loadFromBuffer = function(buffer) {
      return NarLoader.unzip(buffer).then(function(dir) {
        return new NanikaDirectory(dir, {
          has_install: true,
          is_root_dir: true
        });
      });
    };

    NarLoader.loadFromURL = function(src) {
      return NarLoader.wget(src, "arraybuffer").then(this.loadFromBuffer);
    };

    NarLoader.loadFromBlob = function(blob) {
      return new Promise(function(resolve, reject) {
        var reader;
        reader = new FileReader();
        reader.onload = function() {
          return resolve(reader.result);
        };
        reader.onerror = function(event) {
          return reject(event.target.error);
        };
        return reader.readAsArrayBuffer(blob);
      }).then(this.loadFromBuffer);
    };

    NarLoader.unzip = function(buffer) {
      var zip;
      zip = new JSZip();
      return zip.loadAsync(buffer).then(function(zip) {
        var pairs, proms;
        pairs = Object.keys(zip.files).map(function(filename) {
          return {
            filename: filename,
            zipped: zip.file(filename)
          };
        }).filter(function(arg) {
          var zipped;
          zipped = arg.zipped;
          return zipped != null;
        });
        proms = pairs.map(function(arg) {
          var filename, zipped;
          filename = arg.filename, zipped = arg.zipped;
          return zipped.async("arraybuffer").then(function(unzipped) {
            return {
              filename: filename,
              unzipped: unzipped
            };
          });
        });
        return Promise.all(proms);
      }).then(function(pairs) {
        var dic;
        dic = pairs.reduce((function(o, arg) {
          var filename, unzipped;
          filename = arg.filename, unzipped = arg.unzipped;
          o[filename] = unzipped;
          return o;
        }), {});
        return dic;
      }).then(function(files) {
        var dir, filePath, path;
        dir = {};
        for (filePath in files) {
          path = filePath.split("\\").join("/");
          dir[path] = new NanikaFile(files[filePath]);
        }
        return dir;
      });
    };

    NarLoader.wget = function(url, type) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var fs, xhr;
          if ((typeof require !== "undefined" && require !== null) && (typeof process !== "undefined" && process !== null) && !process.browser) {
            fs = require('fs');
            return fs.readFile(url, function(error, buffer) {
              var abuffer, i, view;
              if (error) {
                return reject(error);
              } else {
                abuffer = new ArrayBuffer(buffer.length);
                view = new Uint8Array(abuffer);
                i = 0;
                while (i < buffer.length) {
                  view[i] = buffer.readUInt8(i);
                  i++;
                }
                return resolve(abuffer);
              }
            });
          } else {
            xhr = new XMLHttpRequest();
            xhr.addEventListener("load", function() {
              var ref;
              if ((200 <= (ref = xhr.status) && ref < 300)) {
                return resolve(xhr.response);
              } else {
                return reject(xhr.statusText);
              }
            });
            xhr.addEventListener("error", function(err) {
              console.error(err, err.stack, xhr);
              return reject(xhr.statusText);
            });
            xhr.open("GET", url);
            xhr.responseType = type;
            return xhr.send();
          }
        };
      })(this));
    };

    return NarLoader;

  })();

  NanikaFile = (function() {
    function NanikaFile(_buffer) {
      var ref;
      this._buffer = _buffer;
      if (this._buffer.dir || ((ref = this._buffer.options) != null ? ref.dir : void 0)) {
        this._isdir = true;
      }
    }

    NanikaFile.prototype.buffer = function() {
      if (this._buffer.asArrayBuffer != null) {
        return this._buffer = this._buffer.asArrayBuffer();
      } else {
        return this._buffer;
      }
    };

    NanikaFile.prototype.toString = function() {
      return Encoding.codeToString(Encoding.convert(new Uint8Array(this.buffer()), 'UNICODE', 'AUTO'));
    };

    NanikaFile.prototype.valueOf = function() {
      return this.buffer();
    };

    NanikaFile.prototype.isFile = function() {
      return !this._isdir;
    };

    NanikaFile.prototype.isDirectory = function() {
      return this._isdir;
    };

    return NanikaFile;

  })();

  NanikaDirectory = (function() {
    function NanikaDirectory(files, options) {
      var file, path;
      if (files == null) {
        files = {};
      }
      this.files = {};
      for (path in files) {
        file = files[path];
        if (file instanceof NanikaFile) {
          this.files[path] = file;
        } else {
          this.files[path] = new NanikaFile(file);
        }
      }
      this.parse(options);
    }

    NanikaDirectory.prototype.parse = function(arg) {
      var _files, do_throw_descript, has_descript, has_install, is_root_dir, nowarp, ref, wraped;
      ref = arg != null ? arg : {}, has_install = ref.has_install, has_descript = ref.has_descript, do_throw_descript = ref.do_throw_descript, is_root_dir = ref.is_root_dir;
      if (is_root_dir) {
        nowarp = Object.keys(this.files).filter(function(filePath) {
          return /^install\.txt/.exec(filePath);
        });
        wraped = Object.keys(this.files).filter(function(filePath) {
          return /^[^\/]+\/install\.txt/.exec(filePath);
        });
        if (nowarp.length === 0 && wraped.length === 1) {
          _files = {};
          Object.keys(this.files).forEach((function(_this) {
            return function(filePath) {
              return _files[filePath.split("/").slice(1).join("/")] = _this.files[filePath];
            };
          })(this));
          this.files = _files;
        }
      }
      if (this.files["install.txt"] != null) {
        this.install = NarDescript.parse(this.files["install.txt"].toString(), do_throw_descript);
      } else if (has_install) {
        throw "install.txt not found";
      }
      if (this.files["descript.txt"] != null) {
        return this.descript = NarDescript.parse(this.files["descript.txt"].toString(), do_throw_descript);
      } else if (has_descript) {
        throw "descript.txt not found";
      }
    };

    NanikaDirectory.prototype.asArrayBuffer = function() {
      var directory, file, path, ref;
      directory = {};
      ref = this.files;
      for (path in ref) {
        file = ref[path];
        directory[path] = this.files[path].buffer();
      }
      return directory;
    };

    NanikaDirectory.prototype.listChildren = function() {
      var children, path, result;
      children = {};
      for (path in this.files) {
        if (result = path.match(/^([^\/]+)/)) {
          children[result[1]] = true;
        }
      }
      return Object.keys(children);
    };

    NanikaDirectory.prototype.addDirectory = function(dir, options) {
      var directory, file, files, path, ref;
      directory = {};
      ref = this.files;
      for (path in ref) {
        file = ref[path];
        directory[path] = file;
      }
      if (dir instanceof NanikaDirectory) {
        files = dir.files;
      } else {
        files = dir;
      }
      for (path in files) {
        file = files[path];
        directory[path] = file;
      }
      return new NanikaDirectory(directory, options);
    };

    NanikaDirectory.prototype.getDirectory = function(dirpath, options) {
      var directory, dirpathre;
      dirpathre = this.pathToRegExp(dirpath);
      directory = {};
      Object.keys(this.files).filter(function(path) {
        return dirpathre.test(path);
      }).forEach((function(_this) {
        return function(path) {
          return directory[path.replace(dirpathre, "")] = _this.files[path];
        };
      })(this));
      return new NanikaDirectory(directory, options);
    };

    NanikaDirectory.prototype.wrapDirectory = function(dirpath, options) {
      var directory, dirpathcanon;
      dirpathcanon = this.path.canonical(dirpath);
      directory = {};
      Object.keys(this.files).forEach((function(_this) {
        return function(path) {
          return directory[dirpathcanon + '/' + path] = _this.files[path];
        };
      })(this));
      return new NanikaDirectory(directory, options);
    };

    NanikaDirectory.prototype.getElements = function(elempaths, options) {
      var directory, elempath, elempathre, j, len;
      if (!(elempaths instanceof Array)) {
        elempaths = [elempaths];
      }
      directory = {};
      for (j = 0, len = elempaths.length; j < len; j++) {
        elempath = elempaths[j];
        elempathre = this.pathToRegExp(elempath);
        Object.keys(this.files).filter(function(path) {
          return elempathre.test(path);
        }).forEach((function(_this) {
          return function(path) {
            return directory[path] = _this.files[path];
          };
        })(this));
      }
      return new NanikaDirectory(directory, options);
    };

    NanikaDirectory.prototype.removeElements = function(elempaths, options) {
      var directory, elempath, elempathre, file, j, len, path, ref;
      if (!(elempaths instanceof Array)) {
        elempaths = [elempaths];
      }
      directory = {};
      ref = this.files;
      for (path in ref) {
        file = ref[path];
        directory[path] = file;
      }
      for (j = 0, len = elempaths.length; j < len; j++) {
        elempath = elempaths[j];
        elempathre = this.pathToRegExp(elempath);
        Object.keys(directory).filter(function(path) {
          return elempathre.test(path);
        }).forEach(function(path) {
          return delete directory[path];
        });
      }
      return new NanikaDirectory(directory, options);
    };

    NanikaDirectory.prototype.hasElement = function(elempath) {
      var elempathre, path;
      elempathre = this.pathToRegExp(elempath);
      for (path in this.files) {
        if (elempathre.test(path)) {
          return true;
        }
      }
      return false;
    };

    NanikaDirectory.prototype.pathToRegExp = function(path) {
      return new RegExp('^' + this.path.canonical(path).replace(/(\W)/g, '\\$1') + '(?:$|/)');
    };

    NanikaDirectory.prototype.path = {
      canonical: function(path) {
        return path.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/\/?$/, '');
      }
    };

    return NanikaDirectory;

  })();

  NarDescript = (function() {
    function NarDescript() {}

    NarDescript.parse = function(descript_str, do_throw) {
      var descript, descript_line, descript_lines, errors, j, len, result;
      descript_lines = descript_str.replace(/(?:\r\n|\r|\n)/g, "\n").replace(/^\s*\/\/.*$/mg, "").split(/\n/);
      errors = [];
      descript = {};
      for (j = 0, len = descript_lines.length; j < len; j++) {
        descript_line = descript_lines[j];
        if (descript_line.length === 0) {
          continue;
        }
        result = descript_line.match(/^\s*([^,]+?)\s*,\s*(.*?)\s*$/);
        if (!result) {
          errors.push("wrong descript definition : " + descript_line);
          continue;
        }
        descript[result[1]] = result[2];
      }
      if (do_throw) {
        throw new Error(errors.join('\n'));
      }
      descript._errors = errors;
      return descript;
    };

    return NarDescript;

  })();

  if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
    module.exports = {
      NarLoader: NarLoader,
      NanikaFile: NanikaFile,
      NanikaDirectory: NanikaDirectory,
      NarDescript: NarDescript
    };
  } else if (typeof window !== "undefined" && window !== null) {
    window.NarLoader = NarLoader;
    window.NanikaFile = NanikaFile;
    window.NanikaDirectory = NanikaDirectory;
    window.NarDescript = NarDescript;
  }

}).call(this);

}).call(this,require('_process'))
},{"_process":10,"bluebird":14,"encoding-japanese":37,"fs":1,"jszip":50}],14:[function(require,module,exports){
(function (process,global){
/* @preserve
 * The MIT License (MIT)
 * 
 * Copyright (c) 2013-2015 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
/**
 * bluebird build version 3.4.1
 * Features enabled: core, race, call_get, generators, map, nodeify, promisify, props, reduce, settle, some, using, timers, filter, any, each
*/
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Promise=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
function any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return any(promises);
};

Promise.prototype.any = function () {
    return any(this);
};

};

},{}],2:[function(_dereq_,module,exports){
"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var schedule = _dereq_("./schedule");
var Queue = _dereq_("./queue");
var util = _dereq_("./util");

function Async() {
    this._customScheduler = false;
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    this._haveDrainedQueues = false;
    this._trampolineEnabled = true;
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule = schedule;
}

Async.prototype.setScheduler = function(fn) {
    var prev = this._schedule;
    this._schedule = fn;
    this._customScheduler = true;
    return prev;
};

Async.prototype.hasCustomScheduler = function() {
    return this._customScheduler;
};

Async.prototype.enableTrampoline = function() {
    this._trampolineEnabled = true;
};

Async.prototype.disableTrampolineIfNecessary = function() {
    if (util.hasDevTools) {
        this._trampolineEnabled = false;
    }
};

Async.prototype.haveItemsQueued = function () {
    return this._isTickUsed || this._haveDrainedQueues;
};


Async.prototype.fatalError = function(e, isNode) {
    if (isNode) {
        process.stderr.write("Fatal " + (e instanceof Error ? e.stack : e) +
            "\n");
        process.exit(2);
    } else {
        this.throwLater(e);
    }
};

Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
};

function AsyncInvokeLater(fn, receiver, arg) {
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncInvoke(fn, receiver, arg) {
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncSettlePromises(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
}

if (!util.hasDevTools) {
    Async.prototype.invokeLater = AsyncInvokeLater;
    Async.prototype.invoke = AsyncInvoke;
    Async.prototype.settlePromises = AsyncSettlePromises;
} else {
    Async.prototype.invokeLater = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvokeLater.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                setTimeout(function() {
                    fn.call(receiver, arg);
                }, 100);
            });
        }
    };

    Async.prototype.invoke = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvoke.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                fn.call(receiver, arg);
            });
        }
    };

    Async.prototype.settlePromises = function(promise) {
        if (this._trampolineEnabled) {
            AsyncSettlePromises.call(this, promise);
        } else {
            this._schedule(function() {
                promise._settlePromises();
            });
        }
    };
}

Async.prototype.invokeFirst = function (fn, receiver, arg) {
    this._normalQueue.unshift(fn, receiver, arg);
    this._queueTick();
};

Async.prototype._drainQueue = function(queue) {
    while (queue.length() > 0) {
        var fn = queue.shift();
        if (typeof fn !== "function") {
            fn._settlePromises();
            continue;
        }
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
};

Async.prototype._drainQueues = function () {
    this._drainQueue(this._normalQueue);
    this._reset();
    this._haveDrainedQueues = true;
    this._drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = Async;
module.exports.firstLineError = firstLineError;

},{"./queue":26,"./schedule":29,"./util":36}],3:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise, debug) {
var calledBind = false;
var rejectThis = function(_, e) {
    this._reject(e);
};

var targetRejected = function(e, context) {
    context.promiseRejectionQueued = true;
    context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
};

var bindingResolved = function(thisArg, context) {
    if (((this._bitField & 50397184) === 0)) {
        this._resolveCallback(context.target);
    }
};

var bindingRejected = function(e, context) {
    if (!context.promiseRejectionQueued) this._reject(e);
};

Promise.prototype.bind = function (thisArg) {
    if (!calledBind) {
        calledBind = true;
        Promise.prototype._propagateFrom = debug.propagateFromFunction();
        Promise.prototype._boundValue = debug.boundValueFunction();
    }
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 1);
    var target = this._target();
    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        var context = {
            promiseRejectionQueued: false,
            promise: ret,
            target: target,
            bindingPromise: maybePromise
        };
        target._then(INTERNAL, targetRejected, undefined, ret, context);
        maybePromise._then(
            bindingResolved, bindingRejected, undefined, ret, context);
        ret._setOnCancel(maybePromise);
    } else {
        ret._resolveCallback(target);
    }
    return ret;
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj !== undefined) {
        this._bitField = this._bitField | 2097152;
        this._boundTo = obj;
    } else {
        this._bitField = this._bitField & (~2097152);
    }
};

Promise.prototype._isBound = function () {
    return (this._bitField & 2097152) === 2097152;
};

Promise.bind = function (thisArg, value) {
    return Promise.resolve(value).bind(thisArg);
};
};

},{}],4:[function(_dereq_,module,exports){
"use strict";
var old;
if (typeof Promise !== "undefined") old = Promise;
function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
}
var bluebird = _dereq_("./promise")();
bluebird.noConflict = noConflict;
module.exports = bluebird;

},{"./promise":22}],5:[function(_dereq_,module,exports){
"use strict";
var cr = Object.create;
if (cr) {
    var callerCache = cr(null);
    var getterCache = cr(null);
    callerCache[" size"] = getterCache[" size"] = 0;
}

module.exports = function(Promise) {
var util = _dereq_("./util");
var canEvaluate = util.canEvaluate;
var isIdentifier = util.isIdentifier;

var getMethodCaller;
var getGetter;
if (!true) {
var makeMethodCaller = function (methodName) {
    return new Function("ensureMethod", "                                    \n\
        return function(obj) {                                               \n\
            'use strict'                                                     \n\
            var len = this.length;                                           \n\
            ensureMethod(obj, 'methodName');                                 \n\
            switch(len) {                                                    \n\
                case 1: return obj.methodName(this[0]);                      \n\
                case 2: return obj.methodName(this[0], this[1]);             \n\
                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
                case 0: return obj.methodName();                             \n\
                default:                                                     \n\
                    return obj.methodName.apply(obj, this);                  \n\
            }                                                                \n\
        };                                                                   \n\
        ".replace(/methodName/g, methodName))(ensureMethod);
};

var makeGetter = function (propertyName) {
    return new Function("obj", "                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName", propertyName));
};

var getCompiled = function(name, compiler, cache) {
    var ret = cache[name];
    if (typeof ret !== "function") {
        if (!isIdentifier(name)) {
            return null;
        }
        ret = compiler(name);
        cache[name] = ret;
        cache[" size"]++;
        if (cache[" size"] > 512) {
            var keys = Object.keys(cache);
            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
            cache[" size"] = keys.length - 256;
        }
    }
    return ret;
};

getMethodCaller = function(name) {
    return getCompiled(name, makeMethodCaller, callerCache);
};

getGetter = function(name) {
    return getCompiled(name, makeGetter, getterCache);
};
}

function ensureMethod(obj, methodName) {
    var fn;
    if (obj != null) fn = obj[methodName];
    if (typeof fn !== "function") {
        var message = "Object " + util.classString(obj) + " has no method '" +
            util.toString(methodName) + "'";
        throw new Promise.TypeError(message);
    }
    return fn;
}

function caller(obj) {
    var methodName = this.pop();
    var fn = ensureMethod(obj, methodName);
    return fn.apply(obj, this);
}
Promise.prototype.call = function (methodName) {
    var args = [].slice.call(arguments, 1);;
    if (!true) {
        if (canEvaluate) {
            var maybeCaller = getMethodCaller(methodName);
            if (maybeCaller !== null) {
                return this._then(
                    maybeCaller, undefined, undefined, args, undefined);
            }
        }
    }
    args.push(methodName);
    return this._then(caller, undefined, undefined, args, undefined);
};

function namedGetter(obj) {
    return obj[this];
}
function indexedGetter(obj) {
    var index = +this;
    if (index < 0) index = Math.max(0, index + obj.length);
    return obj[index];
}
Promise.prototype.get = function (propertyName) {
    var isIndex = (typeof propertyName === "number");
    var getter;
    if (!isIndex) {
        if (canEvaluate) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
        } else {
            getter = namedGetter;
        }
    } else {
        getter = indexedGetter;
    }
    return this._then(getter, undefined, undefined, propertyName, undefined);
};
};

},{"./util":36}],6:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, PromiseArray, apiRejection, debug) {
var util = _dereq_("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var async = Promise._async;

Promise.prototype["break"] = Promise.prototype.cancel = function() {
    if (!debug.cancellation()) return this._warn("cancellation is disabled");

    var promise = this;
    var child = promise;
    while (promise.isCancellable()) {
        if (!promise._cancelBy(child)) {
            if (child._isFollowing()) {
                child._followee().cancel();
            } else {
                child._cancelBranched();
            }
            break;
        }

        var parent = promise._cancellationParent;
        if (parent == null || !parent.isCancellable()) {
            if (promise._isFollowing()) {
                promise._followee().cancel();
            } else {
                promise._cancelBranched();
            }
            break;
        } else {
            if (promise._isFollowing()) promise._followee().cancel();
            child = promise;
            promise = parent;
        }
    }
};

Promise.prototype._branchHasCancelled = function() {
    this._branchesRemainingToCancel--;
};

Promise.prototype._enoughBranchesHaveCancelled = function() {
    return this._branchesRemainingToCancel === undefined ||
           this._branchesRemainingToCancel <= 0;
};

Promise.prototype._cancelBy = function(canceller) {
    if (canceller === this) {
        this._branchesRemainingToCancel = 0;
        this._invokeOnCancel();
        return true;
    } else {
        this._branchHasCancelled();
        if (this._enoughBranchesHaveCancelled()) {
            this._invokeOnCancel();
            return true;
        }
    }
    return false;
};

Promise.prototype._cancelBranched = function() {
    if (this._enoughBranchesHaveCancelled()) {
        this._cancel();
    }
};

Promise.prototype._cancel = function() {
    if (!this.isCancellable()) return;

    this._setCancelled();
    async.invoke(this._cancelPromises, this, undefined);
};

Promise.prototype._cancelPromises = function() {
    if (this._length() > 0) this._settlePromises();
};

Promise.prototype._unsetOnCancel = function() {
    this._onCancelField = undefined;
};

Promise.prototype.isCancellable = function() {
    return this.isPending() && !this.isCancelled();
};

Promise.prototype._doInvokeOnCancel = function(onCancelCallback, internalOnly) {
    if (util.isArray(onCancelCallback)) {
        for (var i = 0; i < onCancelCallback.length; ++i) {
            this._doInvokeOnCancel(onCancelCallback[i], internalOnly);
        }
    } else if (onCancelCallback !== undefined) {
        if (typeof onCancelCallback === "function") {
            if (!internalOnly) {
                var e = tryCatch(onCancelCallback).call(this._boundValue());
                if (e === errorObj) {
                    this._attachExtraTrace(e.e);
                    async.throwLater(e.e);
                }
            }
        } else {
            onCancelCallback._resultCancelled(this);
        }
    }
};

Promise.prototype._invokeOnCancel = function() {
    var onCancelCallback = this._onCancel();
    this._unsetOnCancel();
    async.invoke(this._doInvokeOnCancel, this, onCancelCallback);
};

Promise.prototype._invokeInternalOnCancel = function() {
    if (this.isCancellable()) {
        this._doInvokeOnCancel(this._onCancel(), true);
        this._unsetOnCancel();
    }
};

Promise.prototype._resultCancelled = function() {
    this.cancel();
};

};

},{"./util":36}],7:[function(_dereq_,module,exports){
"use strict";
module.exports = function(NEXT_FILTER) {
var util = _dereq_("./util");
var getKeys = _dereq_("./es5").keys;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function catchFilter(instances, cb, promise) {
    return function(e) {
        var boundTo = promise._boundValue();
        predicateLoop: for (var i = 0; i < instances.length; ++i) {
            var item = instances[i];

            if (item === Error ||
                (item != null && item.prototype instanceof Error)) {
                if (e instanceof item) {
                    return tryCatch(cb).call(boundTo, e);
                }
            } else if (typeof item === "function") {
                var matchesPredicate = tryCatch(item).call(boundTo, e);
                if (matchesPredicate === errorObj) {
                    return matchesPredicate;
                } else if (matchesPredicate) {
                    return tryCatch(cb).call(boundTo, e);
                }
            } else if (util.isObject(e)) {
                var keys = getKeys(item);
                for (var j = 0; j < keys.length; ++j) {
                    var key = keys[j];
                    if (item[key] != e[key]) {
                        continue predicateLoop;
                    }
                }
                return tryCatch(cb).call(boundTo, e);
            }
        }
        return NEXT_FILTER;
    };
}

return catchFilter;
};

},{"./es5":13,"./util":36}],8:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var longStackTraces = false;
var contextStack = [];

Promise.prototype._promiseCreated = function() {};
Promise.prototype._pushContext = function() {};
Promise.prototype._popContext = function() {return null;};
Promise._peekContext = Promise.prototype._peekContext = function() {};

function Context() {
    this._trace = new Context.CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (this._trace !== undefined) {
        this._trace._promiseCreated = null;
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (this._trace !== undefined) {
        var trace = contextStack.pop();
        var ret = trace._promiseCreated;
        trace._promiseCreated = null;
        return ret;
    }
    return null;
};

function createContext() {
    if (longStackTraces) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}
Context.CapturedTrace = null;
Context.create = createContext;
Context.deactivateLongStackTraces = function() {};
Context.activateLongStackTraces = function() {
    var Promise_pushContext = Promise.prototype._pushContext;
    var Promise_popContext = Promise.prototype._popContext;
    var Promise_PeekContext = Promise._peekContext;
    var Promise_peekContext = Promise.prototype._peekContext;
    var Promise_promiseCreated = Promise.prototype._promiseCreated;
    Context.deactivateLongStackTraces = function() {
        Promise.prototype._pushContext = Promise_pushContext;
        Promise.prototype._popContext = Promise_popContext;
        Promise._peekContext = Promise_PeekContext;
        Promise.prototype._peekContext = Promise_peekContext;
        Promise.prototype._promiseCreated = Promise_promiseCreated;
        longStackTraces = false;
    };
    longStackTraces = true;
    Promise.prototype._pushContext = Context.prototype._pushContext;
    Promise.prototype._popContext = Context.prototype._popContext;
    Promise._peekContext = Promise.prototype._peekContext = peekContext;
    Promise.prototype._promiseCreated = function() {
        var ctx = this._peekContext();
        if (ctx && ctx._promiseCreated == null) ctx._promiseCreated = this;
    };
};
return Context;
};

},{}],9:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, Context) {
var getDomain = Promise._getDomain;
var async = Promise._async;
var Warning = _dereq_("./errors").Warning;
var util = _dereq_("./util");
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;
var bluebirdFramePattern =
    /[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/;
var stackFramePattern = null;
var formatStack = null;
var indentStackFrames = false;
var printWarning;
var debugging = !!(util.env("BLUEBIRD_DEBUG") != 0 &&
                        (true ||
                         util.env("BLUEBIRD_DEBUG") ||
                         util.env("NODE_ENV") === "development"));

var warnings = !!(util.env("BLUEBIRD_WARNINGS") != 0 &&
    (debugging || util.env("BLUEBIRD_WARNINGS")));

var longStackTraces = !!(util.env("BLUEBIRD_LONG_STACK_TRACES") != 0 &&
    (debugging || util.env("BLUEBIRD_LONG_STACK_TRACES")));

var wForgottenReturn = util.env("BLUEBIRD_W_FORGOTTEN_RETURN") != 0 &&
    (warnings || !!util.env("BLUEBIRD_W_FORGOTTEN_RETURN"));

Promise.prototype.suppressUnhandledRejections = function() {
    var target = this._target();
    target._bitField = ((target._bitField & (~1048576)) |
                      524288);
};

Promise.prototype._ensurePossibleRejectionHandled = function () {
    if ((this._bitField & 524288) !== 0) return;
    this._setRejectionIsUnhandled();
    async.invokeLater(this._notifyUnhandledRejection, this, undefined);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    fireRejectionEvent("rejectionHandled",
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._setReturnedNonUndefined = function() {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._returnedNonUndefined = function() {
    return (this._bitField & 268435456) !== 0;
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._settledValue();
        this._setUnhandledRejectionIsNotified();
        fireRejectionEvent("unhandledRejection",
                                      possiblyUnhandledRejection, reason, this);
    }
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | 262144;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~262144);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & 262144) > 0;
};

Promise.prototype._setRejectionIsUnhandled = function () {
    this._bitField = this._bitField | 1048576;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    this._bitField = this._bitField & (~1048576);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    return (this._bitField & 1048576) > 0;
};

Promise.prototype._warn = function(message, shouldUseOwnTrace, promise) {
    return warn(message, shouldUseOwnTrace, promise || this);
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    var domain = getDomain();
    possiblyUnhandledRejection =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

Promise.onUnhandledRejectionHandled = function (fn) {
    var domain = getDomain();
    unhandledRejectionHandled =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

var disableLongStackTraces = function() {};
Promise.longStackTraces = function () {
    if (async.haveItemsQueued() && !config.longStackTraces) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    if (!config.longStackTraces && longStackTracesIsSupported()) {
        var Promise_captureStackTrace = Promise.prototype._captureStackTrace;
        var Promise_attachExtraTrace = Promise.prototype._attachExtraTrace;
        config.longStackTraces = true;
        disableLongStackTraces = function() {
            if (async.haveItemsQueued() && !config.longStackTraces) {
                throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
            }
            Promise.prototype._captureStackTrace = Promise_captureStackTrace;
            Promise.prototype._attachExtraTrace = Promise_attachExtraTrace;
            Context.deactivateLongStackTraces();
            async.enableTrampoline();
            config.longStackTraces = false;
        };
        Promise.prototype._captureStackTrace = longStackTracesCaptureStackTrace;
        Promise.prototype._attachExtraTrace = longStackTracesAttachExtraTrace;
        Context.activateLongStackTraces();
        async.disableTrampolineIfNecessary();
    }
};

Promise.hasLongStackTraces = function () {
    return config.longStackTraces && longStackTracesIsSupported();
};

var fireDomEvent = (function() {
    try {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent("testingtheevent", false, true, {});
        util.global.dispatchEvent(event);
        return function(name, event) {
            var domEvent = document.createEvent("CustomEvent");
            domEvent.initCustomEvent(name.toLowerCase(), false, true, event);
            return !util.global.dispatchEvent(domEvent);
        };
    } catch (e) {}
    return function() {
        return false;
    };
})();

var fireGlobalEvent = (function() {
    if (util.isNode) {
        return function() {
            return process.emit.apply(process, arguments);
        };
    } else {
        if (!util.global) {
            return function() {
                return false;
            };
        }
        return function(name) {
            var methodName = "on" + name.toLowerCase();
            var method = util.global[methodName];
            if (!method) return false;
            method.apply(util.global, [].slice.call(arguments, 1));
            return true;
        };
    }
})();

function generatePromiseLifecycleEventObject(name, promise) {
    return {promise: promise};
}

var eventToObjectGenerator = {
    promiseCreated: generatePromiseLifecycleEventObject,
    promiseFulfilled: generatePromiseLifecycleEventObject,
    promiseRejected: generatePromiseLifecycleEventObject,
    promiseResolved: generatePromiseLifecycleEventObject,
    promiseCancelled: generatePromiseLifecycleEventObject,
    promiseChained: function(name, promise, child) {
        return {promise: promise, child: child};
    },
    warning: function(name, warning) {
        return {warning: warning};
    },
    unhandledRejection: function (name, reason, promise) {
        return {reason: reason, promise: promise};
    },
    rejectionHandled: generatePromiseLifecycleEventObject
};

var activeFireEvent = function (name) {
    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent.apply(null, arguments);
    } catch (e) {
        async.throwLater(e);
        globalEventFired = true;
    }

    var domEventFired = false;
    try {
        domEventFired = fireDomEvent(name,
                    eventToObjectGenerator[name].apply(null, arguments));
    } catch (e) {
        async.throwLater(e);
        domEventFired = true;
    }

    return domEventFired || globalEventFired;
};

Promise.config = function(opts) {
    opts = Object(opts);
    if ("longStackTraces" in opts) {
        if (opts.longStackTraces) {
            Promise.longStackTraces();
        } else if (!opts.longStackTraces && Promise.hasLongStackTraces()) {
            disableLongStackTraces();
        }
    }
    if ("warnings" in opts) {
        var warningsOption = opts.warnings;
        config.warnings = !!warningsOption;
        wForgottenReturn = config.warnings;

        if (util.isObject(warningsOption)) {
            if ("wForgottenReturn" in warningsOption) {
                wForgottenReturn = !!warningsOption.wForgottenReturn;
            }
        }
    }
    if ("cancellation" in opts && opts.cancellation && !config.cancellation) {
        if (async.haveItemsQueued()) {
            throw new Error(
                "cannot enable cancellation after promises are in use");
        }
        Promise.prototype._clearCancellationData =
            cancellationClearCancellationData;
        Promise.prototype._propagateFrom = cancellationPropagateFrom;
        Promise.prototype._onCancel = cancellationOnCancel;
        Promise.prototype._setOnCancel = cancellationSetOnCancel;
        Promise.prototype._attachCancellationCallback =
            cancellationAttachCancellationCallback;
        Promise.prototype._execute = cancellationExecute;
        propagateFromFunction = cancellationPropagateFrom;
        config.cancellation = true;
    }
    if ("monitoring" in opts) {
        if (opts.monitoring && !config.monitoring) {
            config.monitoring = true;
            Promise.prototype._fireEvent = activeFireEvent;
        } else if (!opts.monitoring && config.monitoring) {
            config.monitoring = false;
            Promise.prototype._fireEvent = defaultFireEvent;
        }
    }
};

function defaultFireEvent() { return false; }

Promise.prototype._fireEvent = defaultFireEvent;
Promise.prototype._execute = function(executor, resolve, reject) {
    try {
        executor(resolve, reject);
    } catch (e) {
        return e;
    }
};
Promise.prototype._onCancel = function () {};
Promise.prototype._setOnCancel = function (handler) { ; };
Promise.prototype._attachCancellationCallback = function(onCancel) {
    ;
};
Promise.prototype._captureStackTrace = function () {};
Promise.prototype._attachExtraTrace = function () {};
Promise.prototype._clearCancellationData = function() {};
Promise.prototype._propagateFrom = function (parent, flags) {
    ;
    ;
};

function cancellationExecute(executor, resolve, reject) {
    var promise = this;
    try {
        executor(resolve, reject, function(onCancel) {
            if (typeof onCancel !== "function") {
                throw new TypeError("onCancel must be a function, got: " +
                                    util.toString(onCancel));
            }
            promise._attachCancellationCallback(onCancel);
        });
    } catch (e) {
        return e;
    }
}

function cancellationAttachCancellationCallback(onCancel) {
    if (!this.isCancellable()) return this;

    var previousOnCancel = this._onCancel();
    if (previousOnCancel !== undefined) {
        if (util.isArray(previousOnCancel)) {
            previousOnCancel.push(onCancel);
        } else {
            this._setOnCancel([previousOnCancel, onCancel]);
        }
    } else {
        this._setOnCancel(onCancel);
    }
}

function cancellationOnCancel() {
    return this._onCancelField;
}

function cancellationSetOnCancel(onCancel) {
    this._onCancelField = onCancel;
}

function cancellationClearCancellationData() {
    this._cancellationParent = undefined;
    this._onCancelField = undefined;
}

function cancellationPropagateFrom(parent, flags) {
    if ((flags & 1) !== 0) {
        this._cancellationParent = parent;
        var branchesRemainingToCancel = parent._branchesRemainingToCancel;
        if (branchesRemainingToCancel === undefined) {
            branchesRemainingToCancel = 0;
        }
        parent._branchesRemainingToCancel = branchesRemainingToCancel + 1;
    }
    if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
}

function bindingPropagateFrom(parent, flags) {
    if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
}
var propagateFromFunction = bindingPropagateFrom;

function boundValueFunction() {
    var ret = this._boundTo;
    if (ret !== undefined) {
        if (ret instanceof Promise) {
            if (ret.isFulfilled()) {
                return ret.value();
            } else {
                return undefined;
            }
        }
    }
    return ret;
}

function longStackTracesCaptureStackTrace() {
    this._trace = new CapturedTrace(this._peekContext());
}

function longStackTracesAttachExtraTrace(error, ignoreSelf) {
    if (canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
            var parsed = parseStackAndMessage(error);
            util.notEnumerableProp(error, "stack",
                parsed.message + "\n" + parsed.stack.join("\n"));
            util.notEnumerableProp(error, "__stackCleaned__", true);
        }
    }
}

function checkForgottenReturns(returnValue, promiseCreated, name, promise,
                               parent) {
    if (returnValue === undefined && promiseCreated !== null &&
        wForgottenReturn) {
        if (parent !== undefined && parent._returnedNonUndefined()) return;
        if ((promise._bitField & 65535) === 0) return;

        if (name) name = name + " ";
        var msg = "a promise was created in a " + name +
            "handler but was not returned from it";
        promise._warn(msg, true, promiseCreated);
    }
}

function deprecated(name, replacement) {
    var message = name +
        " is deprecated and will be removed in a future version.";
    if (replacement) message += " Use " + replacement + " instead.";
    return warn(message);
}

function warn(message, shouldUseOwnTrace, promise) {
    if (!config.warnings) return;
    var warning = new Warning(message);
    var ctx;
    if (shouldUseOwnTrace) {
        promise._attachExtraTrace(warning);
    } else if (config.longStackTraces && (ctx = Promise._peekContext())) {
        ctx.attachExtraTrace(warning);
    } else {
        var parsed = parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
    }

    if (!activeFireEvent("warning", warning)) {
        formatAndLogError(warning, "", true);
    }
}

function reconstructStack(message, stacks) {
    for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
    }
    if (i < stacks.length) {
        stacks[i] = stacks[i].join("\n");
    }
    return message + "\n" + stacks.join("\n");
}

function removeDuplicateOrEmptyJumps(stacks) {
    for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
            stacks.splice(i, 1);
            i--;
        }
    }
}

function removeCommonRoots(stacks) {
    var current = stacks[0];
    for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
                commonRootMeetPoint = j;
                break;
            }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
                current.pop();
                currentLastIndex--;
            } else {
                break;
            }
        }
        current = prev;
    }
}

function cleanStack(stack) {
    var ret = [];
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = "    (No stack trace)" === line ||
            stackFramePattern.test(line);
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
                line = "    " + line;
            }
            ret.push(line);
        }
    }
    return ret;
}

function stackFramesAsArray(error) {
    var stack = error.stack.replace(/\s+$/g, "").split("\n");
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
        }
    }
    if (i > 0) {
        stack = stack.slice(i);
    }
    return stack;
}

function parseStackAndMessage(error) {
    var stack = error.stack;
    var message = error.toString();
    stack = typeof stack === "string" && stack.length > 0
                ? stackFramesAsArray(error) : ["    (No stack trace)"];
    return {
        message: message,
        stack: cleanStack(stack)
    };
}

function formatAndLogError(error, title, isSoft) {
    if (typeof console !== "undefined") {
        var message;
        if (util.isObject(error)) {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof printWarning === "function") {
            printWarning(message, isSoft);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
}

function fireRejectionEvent(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    if (name === "unhandledRejection") {
        if (!activeFireEvent(name, reason, promise) && !localEventFired) {
            formatAndLogError(reason, "Unhandled rejection ");
        }
    } else {
        activeFireEvent(name, promise);
    }
}

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj && typeof obj.toString === "function"
            ? obj.toString() : util.toString(obj);
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

function longStackTracesIsSupported() {
    return typeof captureStackTrace === "function";
}

var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}

function setBounds(firstLineError, lastLineError) {
    if (!longStackTracesIsSupported()) return;
    var firstStackLines = firstLineError.stack.split("\n");
    var lastStackLines = lastLineError.stack.split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
}

function CapturedTrace(parent) {
    this._parent = parent;
    this._promisesCreated = 0;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    if (length > 32) this.uncycle();
}
util.inherits(CapturedTrace, Error);
Context.CapturedTrace = CapturedTrace;

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    length = this._length = i;
    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
            if (index > 0) {
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var parsed = parseStackAndMessage(error);
    var message = parsed.message;
    var stacks = [parsed.stack];

    var trace = this;
    while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n")));
        trace = trace._parent;
    }
    removeCommonRoots(stacks);
    removeDuplicateOrEmptyJumps(stacks);
    util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
    util.notEnumerableProp(error, "__stackCleaned__", true);
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit += 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            Error.stackTraceLimit += 6;
            captureStackTrace(receiver, ignoreUntil);
            Error.stackTraceLimit -= 6;
        };
    }
    var err = new Error();

    if (typeof err.stack === "string" &&
        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
        stackFramePattern = /@/;
        formatStack = v8stackFormatter;
        indentStackFrames = true;
        return function captureStackTrace(o) {
            o.stack = new Error().stack;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    if (!("stack" in err) && hasStackAfterThrow &&
        typeof Error.stackTraceLimit === "number") {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            Error.stackTraceLimit += 6;
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
            Error.stackTraceLimit -= 6;
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    return null;

})([]);

if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
    printWarning = function (message) {
        console.warn(message);
    };
    if (util.isNode && process.stderr.isTTY) {
        printWarning = function(message, isSoft) {
            var color = isSoft ? "\u001b[33m" : "\u001b[31m";
            console.warn(color + message + "\u001b[0m\n");
        };
    } else if (!util.isNode && typeof (new Error().stack) === "string") {
        printWarning = function(message, isSoft) {
            console.warn("%c" + message,
                        isSoft ? "color: darkorange" : "color: red");
        };
    }
}

var config = {
    warnings: warnings,
    longStackTraces: false,
    cancellation: false,
    monitoring: false
};

if (longStackTraces) Promise.longStackTraces();

return {
    longStackTraces: function() {
        return config.longStackTraces;
    },
    warnings: function() {
        return config.warnings;
    },
    cancellation: function() {
        return config.cancellation;
    },
    monitoring: function() {
        return config.monitoring;
    },
    propagateFromFunction: function() {
        return propagateFromFunction;
    },
    boundValueFunction: function() {
        return boundValueFunction;
    },
    checkForgottenReturns: checkForgottenReturns,
    setBounds: setBounds,
    warn: warn,
    deprecated: deprecated,
    CapturedTrace: CapturedTrace,
    fireDomEvent: fireDomEvent,
    fireGlobalEvent: fireGlobalEvent
};
};

},{"./errors":12,"./util":36}],10:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function returner() {
    return this.value;
}
function thrower() {
    throw this.reason;
}

Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (value instanceof Promise) value.suppressUnhandledRejections();
    return this._then(
        returner, undefined, undefined, {value: value}, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    return this._then(
        thrower, undefined, undefined, {reason: reason}, undefined);
};

Promise.prototype.catchThrow = function (reason) {
    if (arguments.length <= 1) {
        return this._then(
            undefined, thrower, undefined, {reason: reason}, undefined);
    } else {
        var _reason = arguments[1];
        var handler = function() {throw _reason;};
        return this.caught(reason, handler);
    }
};

Promise.prototype.catchReturn = function (value) {
    if (arguments.length <= 1) {
        if (value instanceof Promise) value.suppressUnhandledRejections();
        return this._then(
            undefined, returner, undefined, {value: value}, undefined);
    } else {
        var _value = arguments[1];
        if (_value instanceof Promise) _value.suppressUnhandledRejections();
        var handler = function() {return _value;};
        return this.caught(value, handler);
    }
};
};

},{}],11:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseReduce = Promise.reduce;
var PromiseAll = Promise.all;

function promiseAllThis() {
    return PromiseAll(this);
}

function PromiseMapSeries(promises, fn) {
    return PromiseReduce(promises, fn, INTERNAL, INTERNAL);
}

Promise.prototype.each = function (fn) {
    return this.mapSeries(fn)
            ._then(promiseAllThis, undefined, undefined, this, undefined);
};

Promise.prototype.mapSeries = function (fn) {
    return PromiseReduce(this, fn, INTERNAL, INTERNAL);
};

Promise.each = function (promises, fn) {
    return PromiseMapSeries(promises, fn)
            ._then(promiseAllThis, undefined, undefined, promises, undefined);
};

Promise.mapSeries = PromiseMapSeries;
};

},{}],12:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5");
var Objectfreeze = es5.freeze;
var util = _dereq_("./util");
var inherits = util.inherits;
var notEnumerableProp = util.notEnumerableProp;

function subError(nameProperty, defaultMessage) {
    function SubError(message) {
        if (!(this instanceof SubError)) return new SubError(message);
        notEnumerableProp(this, "message",
            typeof message === "string" ? message : defaultMessage);
        notEnumerableProp(this, "name", nameProperty);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    inherits(SubError, Error);
    return SubError;
}

var _TypeError, _RangeError;
var Warning = subError("Warning", "warning");
var CancellationError = subError("CancellationError", "cancellation error");
var TimeoutError = subError("TimeoutError", "timeout error");
var AggregateError = subError("AggregateError", "aggregate error");
try {
    _TypeError = TypeError;
    _RangeError = RangeError;
} catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
}

var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
}

es5.defineProperty(AggregateError.prototype, "length", {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
});
AggregateError.prototype["isOperational"] = true;
var level = 0;
AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
            lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
    }
    level--;
    return ret;
};

function OperationalError(message) {
    if (!(this instanceof OperationalError))
        return new OperationalError(message);
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

}
inherits(OperationalError, Error);

var errorTypes = Error["__BluebirdErrorTypes__"];
if (!errorTypes) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        OperationalError: OperationalError,
        RejectionError: OperationalError,
        AggregateError: AggregateError
    });
    es5.defineProperty(Error, "__BluebirdErrorTypes__", {
        value: errorTypes,
        writable: false,
        enumerable: false,
        configurable: false
    });
}

module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError,
    Warning: Warning
};

},{"./es5":13,"./util":36}],13:[function(_dereq_,module,exports){
var isES5 = (function(){
    "use strict";
    return this === undefined;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5,
        propertyIsWritable: function(obj, prop) {
            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return !!(!descriptor || descriptor.writable || descriptor.set);
        }
    };
} else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
        var ret = [];
        for (var key in o) {
            if (has.call(o, key)) {
                ret.push(key);
            }
        }
        return ret;
    };

    var ObjectGetDescriptor = function(o, key) {
        return {value: o[key]};
    };

    var ObjectDefineProperty = function (o, key, desc) {
        o[key] = desc.value;
        return o;
    };

    var ObjectFreeze = function (obj) {
        return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
        try {
            return Object(obj).constructor.prototype;
        }
        catch (e) {
            return proto;
        }
    };

    var ArrayIsArray = function (obj) {
        try {
            return str.call(obj) === "[object Array]";
        }
        catch(e) {
            return false;
        }
    };

    module.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5: isES5,
        propertyIsWritable: function() {
            return true;
        }
    };
}

},{}],14:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseMap = Promise.map;

Promise.prototype.filter = function (fn, options) {
    return PromiseMap(this, fn, options, INTERNAL);
};

Promise.filter = function (promises, fn, options) {
    return PromiseMap(promises, fn, options, INTERNAL);
};
};

},{}],15:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, tryConvertToPromise) {
var util = _dereq_("./util");
var CancellationError = Promise.CancellationError;
var errorObj = util.errorObj;

function PassThroughHandlerContext(promise, type, handler) {
    this.promise = promise;
    this.type = type;
    this.handler = handler;
    this.called = false;
    this.cancelPromise = null;
}

PassThroughHandlerContext.prototype.isFinallyHandler = function() {
    return this.type === 0;
};

function FinallyHandlerCancelReaction(finallyHandler) {
    this.finallyHandler = finallyHandler;
}

FinallyHandlerCancelReaction.prototype._resultCancelled = function() {
    checkCancel(this.finallyHandler);
};

function checkCancel(ctx, reason) {
    if (ctx.cancelPromise != null) {
        if (arguments.length > 1) {
            ctx.cancelPromise._reject(reason);
        } else {
            ctx.cancelPromise._cancel();
        }
        ctx.cancelPromise = null;
        return true;
    }
    return false;
}

function succeed() {
    return finallyHandler.call(this, this.promise._target()._settledValue());
}
function fail(reason) {
    if (checkCancel(this, reason)) return;
    errorObj.e = reason;
    return errorObj;
}
function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    if (!this.called) {
        this.called = true;
        var ret = this.isFinallyHandler()
            ? handler.call(promise._boundValue())
            : handler.call(promise._boundValue(), reasonOrValue);
        if (ret !== undefined) {
            promise._setReturnedNonUndefined();
            var maybePromise = tryConvertToPromise(ret, promise);
            if (maybePromise instanceof Promise) {
                if (this.cancelPromise != null) {
                    if (maybePromise.isCancelled()) {
                        var reason =
                            new CancellationError("late cancellation observer");
                        promise._attachExtraTrace(reason);
                        errorObj.e = reason;
                        return errorObj;
                    } else if (maybePromise.isPending()) {
                        maybePromise._attachCancellationCallback(
                            new FinallyHandlerCancelReaction(this));
                    }
                }
                return maybePromise._then(
                    succeed, fail, undefined, this, undefined);
            }
        }
    }

    if (promise.isRejected()) {
        checkCancel(this);
        errorObj.e = reasonOrValue;
        return errorObj;
    } else {
        checkCancel(this);
        return reasonOrValue;
    }
}

Promise.prototype._passThrough = function(handler, type, success, fail) {
    if (typeof handler !== "function") return this.then();
    return this._then(success,
                      fail,
                      undefined,
                      new PassThroughHandlerContext(this, type, handler),
                      undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThrough(handler,
                             0,
                             finallyHandler,
                             finallyHandler);
};

Promise.prototype.tap = function (handler) {
    return this._passThrough(handler, 1, finallyHandler);
};

return PassThroughHandlerContext;
};

},{"./util":36}],16:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          apiRejection,
                          INTERNAL,
                          tryConvertToPromise,
                          Proxyable,
                          debug) {
var errors = _dereq_("./errors");
var TypeError = errors.TypeError;
var util = _dereq_("./util");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
var yieldHandlers = [];

function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
    for (var i = 0; i < yieldHandlers.length; ++i) {
        traceParent._pushContext();
        var result = tryCatch(yieldHandlers[i])(value);
        traceParent._popContext();
        if (result === errorObj) {
            traceParent._pushContext();
            var ret = Promise.reject(errorObj.e);
            traceParent._popContext();
            return ret;
        }
        var maybePromise = tryConvertToPromise(result, traceParent);
        if (maybePromise instanceof Promise) return maybePromise;
    }
    return null;
}

function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
    if (debug.cancellation()) {
        var internal = new Promise(INTERNAL);
        var _finallyPromise = this._finallyPromise = new Promise(INTERNAL);
        this._promise = internal.lastly(function() {
            return _finallyPromise;
        });
        internal._captureStackTrace();
        internal._setOnCancel(this);
    } else {
        var promise = this._promise = new Promise(INTERNAL);
        promise._captureStackTrace();
    }
    this._stack = stack;
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = undefined;
    this._yieldHandlers = typeof yieldHandler === "function"
        ? [yieldHandler].concat(yieldHandlers)
        : yieldHandlers;
    this._yieldedPromise = null;
    this._cancellationPhase = false;
}
util.inherits(PromiseSpawn, Proxyable);

PromiseSpawn.prototype._isResolved = function() {
    return this._promise === null;
};

PromiseSpawn.prototype._cleanup = function() {
    this._promise = this._generator = null;
    if (debug.cancellation() && this._finallyPromise !== null) {
        this._finallyPromise._fulfill();
        this._finallyPromise = null;
    }
};

PromiseSpawn.prototype._promiseCancelled = function() {
    if (this._isResolved()) return;
    var implementsReturn = typeof this._generator["return"] !== "undefined";

    var result;
    if (!implementsReturn) {
        var reason = new Promise.CancellationError(
            "generator .return() sentinel");
        Promise.coroutine.returnSentinel = reason;
        this._promise._attachExtraTrace(reason);
        this._promise._pushContext();
        result = tryCatch(this._generator["throw"]).call(this._generator,
                                                         reason);
        this._promise._popContext();
    } else {
        this._promise._pushContext();
        result = tryCatch(this._generator["return"]).call(this._generator,
                                                          undefined);
        this._promise._popContext();
    }
    this._cancellationPhase = true;
    this._yieldedPromise = null;
    this._continue(result);
};

PromiseSpawn.prototype._promiseFulfilled = function(value) {
    this._yieldedPromise = null;
    this._promise._pushContext();
    var result = tryCatch(this._generator.next).call(this._generator, value);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._promiseRejected = function(reason) {
    this._yieldedPromise = null;
    this._promise._attachExtraTrace(reason);
    this._promise._pushContext();
    var result = tryCatch(this._generator["throw"])
        .call(this._generator, reason);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._resultCancelled = function() {
    if (this._yieldedPromise instanceof Promise) {
        var promise = this._yieldedPromise;
        this._yieldedPromise = null;
        promise.cancel();
    }
};

PromiseSpawn.prototype.promise = function () {
    return this._promise;
};

PromiseSpawn.prototype._run = function () {
    this._generator = this._generatorFunction.call(this._receiver);
    this._receiver =
        this._generatorFunction = undefined;
    this._promiseFulfilled(undefined);
};

PromiseSpawn.prototype._continue = function (result) {
    var promise = this._promise;
    if (result === errorObj) {
        this._cleanup();
        if (this._cancellationPhase) {
            return promise.cancel();
        } else {
            return promise._rejectCallback(result.e, false);
        }
    }

    var value = result.value;
    if (result.done === true) {
        this._cleanup();
        if (this._cancellationPhase) {
            return promise.cancel();
        } else {
            return promise._resolveCallback(value);
        }
    } else {
        var maybePromise = tryConvertToPromise(value, this._promise);
        if (!(maybePromise instanceof Promise)) {
            maybePromise =
                promiseFromYieldHandler(maybePromise,
                                        this._yieldHandlers,
                                        this._promise);
            if (maybePromise === null) {
                this._promiseRejected(
                    new TypeError(
                        "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a\u000a".replace("%s", value) +
                        "From coroutine:\u000a" +
                        this._stack.split("\n").slice(1, -7).join("\n")
                    )
                );
                return;
            }
        }
        maybePromise = maybePromise._target();
        var bitField = maybePromise._bitField;
        ;
        if (((bitField & 50397184) === 0)) {
            this._yieldedPromise = maybePromise;
            maybePromise._proxy(this, null);
        } else if (((bitField & 33554432) !== 0)) {
            this._promiseFulfilled(maybePromise._value());
        } else if (((bitField & 16777216) !== 0)) {
            this._promiseRejected(maybePromise._reason());
        } else {
            this._promiseCancelled();
        }
    }
};

Promise.coroutine = function (generatorFunction, options) {
    if (typeof generatorFunction !== "function") {
        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var yieldHandler = Object(options).yieldHandler;
    var PromiseSpawn$ = PromiseSpawn;
    var stack = new Error().stack;
    return function () {
        var generator = generatorFunction.apply(this, arguments);
        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
                                      stack);
        var ret = spawn.promise();
        spawn._generator = generator;
        spawn._promiseFulfilled(undefined);
        return ret;
    };
};

Promise.coroutine.addYieldHandler = function(fn) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    yieldHandlers.push(fn);
};

Promise.spawn = function (generatorFunction) {
    debug.deprecated("Promise.spawn()", "Promise.coroutine()");
    if (typeof generatorFunction !== "function") {
        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var spawn = new PromiseSpawn(generatorFunction, this);
    var ret = spawn.promise();
    spawn._run(Promise.spawn);
    return ret;
};
};

},{"./errors":12,"./util":36}],17:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, tryConvertToPromise, INTERNAL) {
var util = _dereq_("./util");
var canEvaluate = util.canEvaluate;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var reject;

if (!true) {
if (canEvaluate) {
    var thenCallback = function(i) {
        return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
    };

    var promiseSetter = function(i) {
        return new Function("promise", "holder", "                           \n\
            'use strict';                                                    \n\
            holder.pIndex = promise;                                         \n\
            ".replace(/Index/g, i));
    };

    var generateHolderClass = function(total) {
        var props = new Array(total);
        for (var i = 0; i < props.length; ++i) {
            props[i] = "this.p" + (i+1);
        }
        var assignment = props.join(" = ") + " = null;";
        var cancellationCode= "var promise;\n" + props.map(function(prop) {
            return "                                                         \n\
                promise = " + prop + ";                                      \n\
                if (promise instanceof Promise) {                            \n\
                    promise.cancel();                                        \n\
                }                                                            \n\
            ";
        }).join("\n");
        var passedArguments = props.join(", ");
        var name = "Holder$" + total;


        var code = "return function(tryCatch, errorObj, Promise) {           \n\
            'use strict';                                                    \n\
            function [TheName](fn) {                                         \n\
                [TheProperties]                                              \n\
                this.fn = fn;                                                \n\
                this.now = 0;                                                \n\
            }                                                                \n\
            [TheName].prototype.checkFulfillment = function(promise) {       \n\
                var now = ++this.now;                                        \n\
                if (now === [TheTotal]) {                                    \n\
                    promise._pushContext();                                  \n\
                    var callback = this.fn;                                  \n\
                    var ret = tryCatch(callback)([ThePassedArguments]);      \n\
                    promise._popContext();                                   \n\
                    if (ret === errorObj) {                                  \n\
                        promise._rejectCallback(ret.e, false);               \n\
                    } else {                                                 \n\
                        promise._resolveCallback(ret);                       \n\
                    }                                                        \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype._resultCancelled = function() {              \n\
                [CancellationCode]                                           \n\
            };                                                               \n\
                                                                             \n\
            return [TheName];                                                \n\
        }(tryCatch, errorObj, Promise);                                      \n\
        ";

        code = code.replace(/\[TheName\]/g, name)
            .replace(/\[TheTotal\]/g, total)
            .replace(/\[ThePassedArguments\]/g, passedArguments)
            .replace(/\[TheProperties\]/g, assignment)
            .replace(/\[CancellationCode\]/g, cancellationCode);

        return new Function("tryCatch", "errorObj", "Promise", code)
                           (tryCatch, errorObj, Promise);
    };

    var holderClasses = [];
    var thenCallbacks = [];
    var promiseSetters = [];

    for (var i = 0; i < 8; ++i) {
        holderClasses.push(generateHolderClass(i + 1));
        thenCallbacks.push(thenCallback(i + 1));
        promiseSetters.push(promiseSetter(i + 1));
    }

    reject = function (reason) {
        this._reject(reason);
    };
}}

Promise.join = function () {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (!true) {
            if (last <= 8 && canEvaluate) {
                var ret = new Promise(INTERNAL);
                ret._captureStackTrace();
                var HolderClass = holderClasses[last - 1];
                var holder = new HolderClass(fn);
                var callbacks = thenCallbacks;

                for (var i = 0; i < last; ++i) {
                    var maybePromise = tryConvertToPromise(arguments[i], ret);
                    if (maybePromise instanceof Promise) {
                        maybePromise = maybePromise._target();
                        var bitField = maybePromise._bitField;
                        ;
                        if (((bitField & 50397184) === 0)) {
                            maybePromise._then(callbacks[i], reject,
                                               undefined, ret, holder);
                            promiseSetters[i](maybePromise, holder);
                        } else if (((bitField & 33554432) !== 0)) {
                            callbacks[i].call(ret,
                                              maybePromise._value(), holder);
                        } else if (((bitField & 16777216) !== 0)) {
                            ret._reject(maybePromise._reason());
                        } else {
                            ret._cancel();
                        }
                    } else {
                        callbacks[i].call(ret, maybePromise, holder);
                    }
                }
                if (!ret._isFateSealed()) {
                    ret._setAsyncGuaranteed();
                    ret._setOnCancel(holder);
                }
                return ret;
            }
        }
    }
    var args = [].slice.call(arguments);;
    if (fn) args.pop();
    var ret = new PromiseArray(args).promise();
    return fn !== undefined ? ret.spread(fn) : ret;
};

};

},{"./util":36}],18:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL,
                          debug) {
var getDomain = Promise._getDomain;
var util = _dereq_("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var EMPTY_ARRAY = [];

function MappingPromiseArray(promises, fn, limit, _filter) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    var domain = getDomain();
    this._callback = domain === null ? fn : domain.bind(fn);
    this._preservedValues = _filter === INTERNAL
        ? new Array(this.length())
        : null;
    this._limit = limit;
    this._inFlight = 0;
    this._queue = limit >= 1 ? [] : EMPTY_ARRAY;
    this._init$(undefined, -2);
}
util.inherits(MappingPromiseArray, PromiseArray);

MappingPromiseArray.prototype._init = function () {};

MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var limit = this._limit;

    if (index < 0) {
        index = (index * -1) - 1;
        values[index] = value;
        if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved()) return true;
        }
    } else {
        if (limit >= 1 && this._inFlight >= limit) {
            values[index] = value;
            this._queue.push(index);
            return false;
        }
        if (preservedValues !== null) preservedValues[index] = value;

        var promise = this._promise;
        var callback = this._callback;
        var receiver = promise._boundValue();
        promise._pushContext();
        var ret = tryCatch(callback).call(receiver, value, index, length);
        var promiseCreated = promise._popContext();
        debug.checkForgottenReturns(
            ret,
            promiseCreated,
            preservedValues !== null ? "Promise.filter" : "Promise.map",
            promise
        );
        if (ret === errorObj) {
            this._reject(ret.e);
            return true;
        }

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            var bitField = maybePromise._bitField;
            ;
            if (((bitField & 50397184) === 0)) {
                if (limit >= 1) this._inFlight++;
                values[index] = maybePromise;
                maybePromise._proxy(this, (index + 1) * -1);
                return false;
            } else if (((bitField & 33554432) !== 0)) {
                ret = maybePromise._value();
            } else if (((bitField & 16777216) !== 0)) {
                this._reject(maybePromise._reason());
                return true;
            } else {
                this._cancel();
                return true;
            }
        }
        values[index] = ret;
    }
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= length) {
        if (preservedValues !== null) {
            this._filter(values, preservedValues);
        } else {
            this._resolve(values);
        }
        return true;
    }
    return false;
};

MappingPromiseArray.prototype._drainQueue = function () {
    var queue = this._queue;
    var limit = this._limit;
    var values = this._values;
    while (queue.length > 0 && this._inFlight < limit) {
        if (this._isResolved()) return;
        var index = queue.pop();
        this._promiseFulfilled(values[index], index);
    }
};

MappingPromiseArray.prototype._filter = function (booleans, values) {
    var len = values.length;
    var ret = new Array(len);
    var j = 0;
    for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
    }
    ret.length = j;
    this._resolve(ret);
};

MappingPromiseArray.prototype.preservedValues = function () {
    return this._preservedValues;
};

function map(promises, fn, options, _filter) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }

    var limit = 0;
    if (options !== undefined) {
        if (typeof options === "object" && options !== null) {
            if (typeof options.concurrency !== "number") {
                return Promise.reject(
                    new TypeError("'concurrency' must be a number but it is " +
                                    util.classString(options.concurrency)));
            }
            limit = options.concurrency;
        } else {
            return Promise.reject(new TypeError(
                            "options argument must be an object but it is " +
                             util.classString(options)));
        }
    }
    limit = typeof limit === "number" &&
        isFinite(limit) && limit >= 1 ? limit : 0;
    return new MappingPromiseArray(promises, fn, limit, _filter).promise();
}

Promise.prototype.map = function (fn, options) {
    return map(this, fn, options, null);
};

Promise.map = function (promises, fn, options, _filter) {
    return map(promises, fn, options, _filter);
};


};

},{"./util":36}],19:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, INTERNAL, tryConvertToPromise, apiRejection, debug) {
var util = _dereq_("./util");
var tryCatch = util.tryCatch;

Promise.method = function (fn) {
    if (typeof fn !== "function") {
        throw new Promise.TypeError("expecting a function but got " + util.classString(fn));
    }
    return function () {
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value = tryCatch(fn).apply(this, arguments);
        var promiseCreated = ret._popContext();
        debug.checkForgottenReturns(
            value, promiseCreated, "Promise.method", ret);
        ret._resolveFromSyncValue(value);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._pushContext();
    var value;
    if (arguments.length > 1) {
        debug.deprecated("calling Promise.try with more than 1 argument");
        var arg = arguments[1];
        var ctx = arguments[2];
        value = util.isArray(arg) ? tryCatch(fn).apply(ctx, arg)
                                  : tryCatch(fn).call(ctx, arg);
    } else {
        value = tryCatch(fn)();
    }
    var promiseCreated = ret._popContext();
    debug.checkForgottenReturns(
        value, promiseCreated, "Promise.try", ret);
    ret._resolveFromSyncValue(value);
    return ret;
};

Promise.prototype._resolveFromSyncValue = function (value) {
    if (value === util.errorObj) {
        this._rejectCallback(value.e, false);
    } else {
        this._resolveCallback(value, true);
    }
};
};

},{"./util":36}],20:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = _dereq_("./errors");
var OperationalError = errors.OperationalError;
var es5 = _dereq_("./es5");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise, multiArgs) {
    return function(err, value) {
        if (promise === null) return;
        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (!multiArgs) {
            promise._fulfill(value);
        } else {
            var args = [].slice.call(arguments, 1);;
            promise._fulfill(args);
        }
        promise = null;
    };
}

module.exports = nodebackForPromise;

},{"./errors":12,"./es5":13,"./util":36}],21:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var util = _dereq_("./util");
var async = Promise._async;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret =
        tryCatch(nodeback).apply(promise._boundValue(), [null].concat(val));
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundValue();
    var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}
function errorAdapter(reason, nodeback) {
    var promise = this;
    if (!reason) {
        var newReason = new Error(reason + "");
        newReason.cause = reason;
        reason = newReason;
    }
    var ret = tryCatch(nodeback).call(promise._boundValue(), reason);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

Promise.prototype.asCallback = Promise.prototype.nodeify = function (nodeback,
                                                                     options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
            adapter = spreadAdapter;
        }
        this._then(
            adapter,
            errorAdapter,
            undefined,
            this,
            nodeback
        );
    }
    return this;
};
};

},{"./util":36}],22:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
};
var reflectHandler = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};
function Proxyable() {}
var UNDEFINED_BINDING = {};
var util = _dereq_("./util");

var getDomain;
if (util.isNode) {
    getDomain = function() {
        var ret = process.domain;
        if (ret === undefined) ret = null;
        return ret;
    };
} else {
    getDomain = function() {
        return null;
    };
}
util.notEnumerableProp(Promise, "_getDomain", getDomain);

var es5 = _dereq_("./es5");
var Async = _dereq_("./async");
var async = new Async();
es5.defineProperty(Promise, "_async", {value: async});
var errors = _dereq_("./errors");
var TypeError = Promise.TypeError = errors.TypeError;
Promise.RangeError = errors.RangeError;
var CancellationError = Promise.CancellationError = errors.CancellationError;
Promise.TimeoutError = errors.TimeoutError;
Promise.OperationalError = errors.OperationalError;
Promise.RejectionError = errors.OperationalError;
Promise.AggregateError = errors.AggregateError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {};
var tryConvertToPromise = _dereq_("./thenables")(Promise, INTERNAL);
var PromiseArray =
    _dereq_("./promise_array")(Promise, INTERNAL,
                               tryConvertToPromise, apiRejection, Proxyable);
var Context = _dereq_("./context")(Promise);
 /*jshint unused:false*/
var createContext = Context.create;
var debug = _dereq_("./debuggability")(Promise, Context);
var CapturedTrace = debug.CapturedTrace;
var PassThroughHandlerContext =
    _dereq_("./finally")(Promise, tryConvertToPromise);
var catchFilter = _dereq_("./catch_filter")(NEXT_FILTER);
var nodebackForPromise = _dereq_("./nodeback");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
function check(self, executor) {
    if (typeof executor !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(executor));
    }
    if (self.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
}

function Promise(executor) {
    this._bitField = 0;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    if (executor !== INTERNAL) {
        check(this, executor);
        this._resolveFromExecutor(executor);
    }
    this._promiseCreated();
    this._fireEvent("promiseCreated", this);
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (util.isObject(item)) {
                catchInstances[j++] = item;
            } else {
                return apiRejection("expecting an object but got " + util.classString(item));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        return this.then(undefined, catchFilter(catchInstances, fn, this));
    }
    return this.then(undefined, fn);
};

Promise.prototype.reflect = function () {
    return this._then(reflectHandler,
        reflectHandler, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject) {
    if (debug.warnings() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, undefined, undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject) {
    var promise =
        this._then(didFulfill, didReject, undefined, undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    return this.all()._then(fn, undefined, undefined, APPLY, undefined);
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    if (arguments.length > 0) {
        this._warn(".all() was passed arguments but it does not take any");
    }
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.getNewLibraryCopy = module.exports;

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = Promise.fromCallback = function(fn) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    var multiArgs = arguments.length > 1 ? !!Object(arguments[1]).multiArgs
                                         : false;
    var result = tryCatch(fn)(nodebackForPromise(ret, multiArgs));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true);
    }
    if (!ret._isFateSealed()) ret._setAsyncGuaranteed();
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._setFulfilled();
        ret._rejectionHandler0 = obj;
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    return async.setScheduler(fn);
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    _,    receiver,
    internalData
) {
    var haveInternalData = internalData !== undefined;
    var promise = haveInternalData ? internalData : new Promise(INTERNAL);
    var target = this._target();
    var bitField = target._bitField;

    if (!haveInternalData) {
        promise._propagateFrom(this, 3);
        promise._captureStackTrace();
        if (receiver === undefined &&
            ((this._bitField & 2097152) !== 0)) {
            if (!((bitField & 50397184) === 0)) {
                receiver = this._boundValue();
            } else {
                receiver = target === this ? undefined : this._boundTo;
            }
        }
        this._fireEvent("promiseChained", this, promise);
    }

    var domain = getDomain();
    if (!((bitField & 50397184) === 0)) {
        var handler, value, settler = target._settlePromiseCtx;
        if (((bitField & 33554432) !== 0)) {
            value = target._rejectionHandler0;
            handler = didFulfill;
        } else if (((bitField & 16777216) !== 0)) {
            value = target._fulfillmentHandler0;
            handler = didReject;
            target._unsetRejectionIsUnhandled();
        } else {
            settler = target._settlePromiseLateCancellationObserver;
            value = new CancellationError("late cancellation observer");
            target._attachExtraTrace(value);
            handler = didReject;
        }

        async.invoke(settler, target, {
            handler: domain === null ? handler
                : (typeof handler === "function" && domain.bind(handler)),
            promise: promise,
            receiver: receiver,
            value: value
        });
    } else {
        target._addCallbacks(didFulfill, didReject, promise, receiver, domain);
    }

    return promise;
};

Promise.prototype._length = function () {
    return this._bitField & 65535;
};

Promise.prototype._isFateSealed = function () {
    return (this._bitField & 117506048) !== 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & 67108864) === 67108864;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & -65536) |
        (len & 65535);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | 33554432;
    this._fireEvent("promiseFulfilled", this);
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | 16777216;
    this._fireEvent("promiseRejected", this);
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | 67108864;
    this._fireEvent("promiseResolved", this);
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | 4194304;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & 4194304) > 0;
};

Promise.prototype._unsetCancelled = function() {
    this._bitField = this._bitField & (~65536);
};

Promise.prototype._setCancelled = function() {
    this._bitField = this._bitField | 65536;
    this._fireEvent("promiseCancelled", this);
};

Promise.prototype._setAsyncGuaranteed = function() {
    if (async.hasCustomScheduler()) return;
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._receiverAt = function (index) {
    var ret = index === 0 ? this._receiver0 : this[
            index * 4 - 4 + 3];
    if (ret === UNDEFINED_BINDING) {
        return undefined;
    } else if (ret === undefined && this._isBound()) {
        return this._boundValue();
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    return this[
            index * 4 - 4 + 2];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    return this[
            index * 4 - 4 + 0];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    return this[
            index * 4 - 4 + 1];
};

Promise.prototype._boundValue = function() {};

Promise.prototype._migrateCallback0 = function (follower) {
    var bitField = follower._bitField;
    var fulfill = follower._fulfillmentHandler0;
    var reject = follower._rejectionHandler0;
    var promise = follower._promise0;
    var receiver = follower._receiverAt(0);
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, promise, receiver, null);
};

Promise.prototype._migrateCallbackAt = function (follower, index) {
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, promise, receiver, null);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    promise,
    receiver,
    domain
) {
    var index = this._length();

    if (index >= 65535 - 4) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        this._receiver0 = receiver;
        if (typeof fulfill === "function") {
            this._fulfillmentHandler0 =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this._rejectionHandler0 =
                domain === null ? reject : domain.bind(reject);
        }
    } else {
        var base = index * 4 - 4;
        this[base + 2] = promise;
        this[base + 3] = receiver;
        if (typeof fulfill === "function") {
            this[base + 0] =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this[base + 1] =
                domain === null ? reject : domain.bind(reject);
        }
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._proxy = function (proxyable, arg) {
    this._addCallbacks(undefined, undefined, arg, proxyable, null);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (((this._bitField & 117506048) !== 0)) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    if (shouldBind) this._propagateFrom(maybePromise, 2);

    var promise = maybePromise._target();

    if (promise === this) {
        this._reject(makeSelfResolutionError());
        return;
    }

    var bitField = promise._bitField;
    if (((bitField & 50397184) === 0)) {
        var len = this._length();
        if (len > 0) promise._migrateCallback0(this);
        for (var i = 1; i < len; ++i) {
            promise._migrateCallbackAt(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
    } else if (((bitField & 33554432) !== 0)) {
        this._fulfill(promise._value());
    } else if (((bitField & 16777216) !== 0)) {
        this._reject(promise._reason());
    } else {
        var reason = new CancellationError("late cancellation observer");
        promise._attachExtraTrace(reason);
        this._reject(reason);
    }
};

Promise.prototype._rejectCallback =
function(reason, synchronous, ignoreNonErrorWarnings) {
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
    if (!hasStack && !ignoreNonErrorWarnings && debug.warnings()) {
        var message = "a promise was rejected with a non-error: " +
            util.classString(reason);
        this._warn(message, true);
    }
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason);
};

Promise.prototype._resolveFromExecutor = function (executor) {
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = this._execute(executor, function(value) {
        promise._resolveCallback(value);
    }, function (reason) {
        promise._rejectCallback(reason, synchronous);
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined) {
        promise._rejectCallback(r, true);
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    var bitField = promise._bitField;
    if (((bitField & 65536) !== 0)) return;
    promise._pushContext();
    var x;
    if (receiver === APPLY) {
        if (!value || typeof value.length !== "number") {
            x = errorObj;
            x.e = new TypeError("cannot .spread() a non-array: " +
                                    util.classString(value));
        } else {
            x = tryCatch(handler).apply(this._boundValue(), value);
        }
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    var promiseCreated = promise._popContext();
    bitField = promise._bitField;
    if (((bitField & 65536) !== 0)) return;

    if (x === NEXT_FILTER) {
        promise._reject(value);
    } else if (x === errorObj) {
        promise._rejectCallback(x.e, false);
    } else {
        debug.checkForgottenReturns(x, promiseCreated, "",  promise, this);
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    this._rejectionHandler0 = promise;
};

Promise.prototype._settlePromise = function(promise, handler, receiver, value) {
    var isPromise = promise instanceof Promise;
    var bitField = this._bitField;
    var asyncGuaranteed = ((bitField & 134217728) !== 0);
    if (((bitField & 65536) !== 0)) {
        if (isPromise) promise._invokeInternalOnCancel();

        if (receiver instanceof PassThroughHandlerContext &&
            receiver.isFinallyHandler()) {
            receiver.cancelPromise = promise;
            if (tryCatch(handler).call(receiver, value) === errorObj) {
                promise._reject(errorObj.e);
            }
        } else if (handler === reflectHandler) {
            promise._fulfill(reflectHandler.call(receiver));
        } else if (receiver instanceof Proxyable) {
            receiver._promiseCancelled(promise);
        } else if (isPromise || promise instanceof PromiseArray) {
            promise._cancel();
        } else {
            receiver.cancel();
        }
    } else if (typeof handler === "function") {
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            if (asyncGuaranteed) promise._setAsyncGuaranteed();
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof Proxyable) {
        if (!receiver._isResolved()) {
            if (((bitField & 33554432) !== 0)) {
                receiver._promiseFulfilled(value, promise);
            } else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (asyncGuaranteed) promise._setAsyncGuaranteed();
        if (((bitField & 33554432) !== 0)) {
            promise._fulfill(value);
        } else {
            promise._reject(value);
        }
    }
};

Promise.prototype._settlePromiseLateCancellationObserver = function(ctx) {
    var handler = ctx.handler;
    var promise = ctx.promise;
    var receiver = ctx.receiver;
    var value = ctx.value;
    if (typeof handler === "function") {
        if (!(promise instanceof Promise)) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (promise instanceof Promise) {
        promise._reject(value);
    }
};

Promise.prototype._settlePromiseCtx = function(ctx) {
    this._settlePromise(ctx.promise, ctx.handler, ctx.receiver, ctx.value);
};

Promise.prototype._settlePromise0 = function(handler, value, bitField) {
    var promise = this._promise0;
    var receiver = this._receiverAt(0);
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settlePromise(promise, handler, receiver, value);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    var base = index * 4 - 4;
    this[base + 2] =
    this[base + 3] =
    this[base + 0] =
    this[base + 1] = undefined;
};

Promise.prototype._fulfill = function (value) {
    var bitField = this._bitField;
    if (((bitField & 117506048) >>> 16)) return;
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._reject(err);
    }
    this._setFulfilled();
    this._rejectionHandler0 = value;

    if ((bitField & 65535) > 0) {
        if (((bitField & 134217728) !== 0)) {
            this._settlePromises();
        } else {
            async.settlePromises(this);
        }
    }
};

Promise.prototype._reject = function (reason) {
    var bitField = this._bitField;
    if (((bitField & 117506048) >>> 16)) return;
    this._setRejected();
    this._fulfillmentHandler0 = reason;

    if (this._isFinal()) {
        return async.fatalError(reason, util.isNode);
    }

    if ((bitField & 65535) > 0) {
        async.settlePromises(this);
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._fulfillPromises = function (len, value) {
    for (var i = 1; i < len; i++) {
        var handler = this._fulfillmentHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, value);
    }
};

Promise.prototype._rejectPromises = function (len, reason) {
    for (var i = 1; i < len; i++) {
        var handler = this._rejectionHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, reason);
    }
};

Promise.prototype._settlePromises = function () {
    var bitField = this._bitField;
    var len = (bitField & 65535);

    if (len > 0) {
        if (((bitField & 16842752) !== 0)) {
            var reason = this._fulfillmentHandler0;
            this._settlePromise0(this._rejectionHandler0, reason, bitField);
            this._rejectPromises(len, reason);
        } else {
            var value = this._rejectionHandler0;
            this._settlePromise0(this._fulfillmentHandler0, value, bitField);
            this._fulfillPromises(len, value);
        }
        this._setLength(0);
    }
    this._clearCancellationData();
};

Promise.prototype._settledValue = function() {
    var bitField = this._bitField;
    if (((bitField & 33554432) !== 0)) {
        return this._rejectionHandler0;
    } else if (((bitField & 16777216) !== 0)) {
        return this._fulfillmentHandler0;
    }
};

function deferResolve(v) {this.promise._resolveCallback(v);}
function deferReject(v) {this.promise._rejectCallback(v, false);}

Promise.defer = Promise.pending = function() {
    debug.deprecated("Promise.defer", "new Promise");
    var promise = new Promise(INTERNAL);
    return {
        promise: promise,
        resolve: deferResolve,
        reject: deferReject
    };
};

util.notEnumerableProp(Promise,
                       "_makeSelfResolutionError",
                       makeSelfResolutionError);

_dereq_("./method")(Promise, INTERNAL, tryConvertToPromise, apiRejection,
    debug);
_dereq_("./bind")(Promise, INTERNAL, tryConvertToPromise, debug);
_dereq_("./cancel")(Promise, PromiseArray, apiRejection, debug);
_dereq_("./direct_resolve")(Promise);
_dereq_("./synchronous_inspection")(Promise);
_dereq_("./join")(
    Promise, PromiseArray, tryConvertToPromise, INTERNAL, debug);
Promise.Promise = Promise;
Promise.version = "3.4.0";
_dereq_('./map.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
_dereq_('./call_get.js')(Promise);
_dereq_('./using.js')(Promise, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug);
_dereq_('./timers.js')(Promise, INTERNAL, debug);
_dereq_('./generators.js')(Promise, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug);
_dereq_('./nodeify.js')(Promise);
_dereq_('./promisify.js')(Promise, INTERNAL);
_dereq_('./props.js')(Promise, PromiseArray, tryConvertToPromise, apiRejection);
_dereq_('./race.js')(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_('./reduce.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
_dereq_('./settle.js')(Promise, PromiseArray, debug);
_dereq_('./some.js')(Promise, PromiseArray, apiRejection);
_dereq_('./filter.js')(Promise, INTERNAL);
_dereq_('./each.js')(Promise, INTERNAL);
_dereq_('./any.js')(Promise);
                                                         
    util.toFastProperties(Promise);                                          
    util.toFastProperties(Promise.prototype);                                
    function fillTypes(value) {                                              
        var p = new Promise(INTERNAL);                                       
        p._fulfillmentHandler0 = value;                                      
        p._rejectionHandler0 = value;                                        
        p._promise0 = value;                                                 
        p._receiver0 = value;                                                
    }                                                                        
    // Complete slack tracking, opt out of field-type tracking and           
    // stabilize map                                                         
    fillTypes({a: 1});                                                       
    fillTypes({b: 2});                                                       
    fillTypes({c: 3});                                                       
    fillTypes(1);                                                            
    fillTypes(function(){});                                                 
    fillTypes(undefined);                                                    
    fillTypes(false);                                                        
    fillTypes(new Promise(INTERNAL));                                        
    debug.setBounds(Async.firstLineError, util.lastLineError);               
    return Promise;                                                          

};

},{"./any.js":1,"./async":2,"./bind":3,"./call_get.js":5,"./cancel":6,"./catch_filter":7,"./context":8,"./debuggability":9,"./direct_resolve":10,"./each.js":11,"./errors":12,"./es5":13,"./filter.js":14,"./finally":15,"./generators.js":16,"./join":17,"./map.js":18,"./method":19,"./nodeback":20,"./nodeify.js":21,"./promise_array":23,"./promisify.js":24,"./props.js":25,"./race.js":27,"./reduce.js":28,"./settle.js":30,"./some.js":31,"./synchronous_inspection":32,"./thenables":33,"./timers.js":34,"./using.js":35,"./util":36}],23:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection, Proxyable) {
var util = _dereq_("./util");
var isArray = util.isArray;

function toResolutionValue(val) {
    switch(val) {
    case -2: return [];
    case -3: return {};
    }
}

function PromiseArray(values) {
    var promise = this._promise = new Promise(INTERNAL);
    if (values instanceof Promise) {
        promise._propagateFrom(values, 3);
    }
    promise._setOnCancel(this);
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, -2);
}
util.inherits(PromiseArray, Proxyable);

PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values = values._target();
        var bitField = values._bitField;
        ;
        this._values = values;

        if (((bitField & 50397184) === 0)) {
            this._promise._setAsyncGuaranteed();
            return values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
        } else if (((bitField & 33554432) !== 0)) {
            values = values._value();
        } else if (((bitField & 16777216) !== 0)) {
            return this._reject(values._reason());
        } else {
            return this._cancel();
        }
    }
    values = util.asArray(values);
    if (values === null) {
        var err = apiRejection(
            "expecting an array or an iterable object but got " + util.classString(values)).reason();
        this._promise._rejectCallback(err, false);
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    this._iterate(values);
};

PromiseArray.prototype._iterate = function(values) {
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var result = this._promise;
    var isResolved = false;
    var bitField = null;
    for (var i = 0; i < len; ++i) {
        var maybePromise = tryConvertToPromise(values[i], result);

        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            bitField = maybePromise._bitField;
        } else {
            bitField = null;
        }

        if (isResolved) {
            if (bitField !== null) {
                maybePromise.suppressUnhandledRejections();
            }
        } else if (bitField !== null) {
            if (((bitField & 50397184) === 0)) {
                maybePromise._proxy(this, i);
                this._values[i] = maybePromise;
            } else if (((bitField & 33554432) !== 0)) {
                isResolved = this._promiseFulfilled(maybePromise._value(), i);
            } else if (((bitField & 16777216) !== 0)) {
                isResolved = this._promiseRejected(maybePromise._reason(), i);
            } else {
                isResolved = this._promiseCancelled(i);
            }
        } else {
            isResolved = this._promiseFulfilled(maybePromise, i);
        }
    }
    if (!isResolved) result._setAsyncGuaranteed();
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype._cancel = function() {
    if (this._isResolved() || !this._promise.isCancellable()) return;
    this._values = null;
    this._promise._cancel();
};

PromiseArray.prototype._reject = function (reason) {
    this._values = null;
    this._promise._rejectCallback(reason, false);
};

PromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
    }
    return false;
};

PromiseArray.prototype._promiseCancelled = function() {
    this._cancel();
    return true;
};

PromiseArray.prototype._promiseRejected = function (reason) {
    this._totalResolved++;
    this._reject(reason);
    return true;
};

PromiseArray.prototype._resultCancelled = function() {
    if (this._isResolved()) return;
    var values = this._values;
    this._cancel();
    if (values instanceof Promise) {
        values.cancel();
    } else {
        for (var i = 0; i < values.length; ++i) {
            if (values[i] instanceof Promise) {
                values[i].cancel();
            }
        }
    }
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};

},{"./util":36}],24:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var THIS = {};
var util = _dereq_("./util");
var nodebackForPromise = _dereq_("./nodeback");
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var TypeError = _dereq_("./errors").TypeError;
var defaultSuffix = "Async";
var defaultPromisified = {__isPromisified__: true};
var noCopyProps = [
    "arity",    "length",
    "name",
    "arguments",
    "caller",
    "callee",
    "prototype",
    "__isPromisified__"
];
var noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$");

var defaultFilter = function(name) {
    return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        name !== "constructor";
};

function propsFilter(key) {
    return !noCopyPropsPattern.test(key);
}

function isPromisified(fn) {
    try {
        return fn.__isPromisified__ === true;
    }
    catch (e) {
        return false;
    }
}

function hasPromisified(obj, key, suffix) {
    var val = util.getDataPropertyOrDefault(obj, key + suffix,
                                            defaultPromisified);
    return val ? isPromisified(val) : false;
}
function checkValid(ret, suffix, suffixRegexp) {
    for (var i = 0; i < ret.length; i += 2) {
        var key = ret[i];
        if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret.length; j += 2) {
                if (ret[j] === keyWithoutAsyncSuffix) {
                    throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/MqrFmX\u000a"
                        .replace("%s", suffix));
                }
            }
        }
    }
}

function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
    var keys = util.inheritedDataKeys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var value = obj[key];
        var passesDefaultFilter = filter === defaultFilter
            ? true : defaultFilter(key, value, obj);
        if (typeof value === "function" &&
            !isPromisified(value) &&
            !hasPromisified(obj, key, suffix) &&
            filter(key, value, obj, passesDefaultFilter)) {
            ret.push(key, value);
        }
    }
    checkValid(ret, suffix, suffixRegexp);
    return ret;
}

var escapeIdentRegex = function(str) {
    return str.replace(/([$])/, "\\$");
};

var makeNodePromisifiedEval;
if (!true) {
var switchCaseArgumentOrder = function(likelyArgumentCount) {
    var ret = [likelyArgumentCount];
    var min = Math.max(0, likelyArgumentCount - 1 - 3);
    for(var i = likelyArgumentCount - 1; i >= min; --i) {
        ret.push(i);
    }
    for(var i = likelyArgumentCount + 1; i <= 3; ++i) {
        ret.push(i);
    }
    return ret;
};

var argumentSequence = function(argumentCount) {
    return util.filledRange(argumentCount, "_arg", "");
};

var parameterDeclaration = function(parameterCount) {
    return util.filledRange(
        Math.max(parameterCount, 3), "_arg", "");
};

var parameterCount = function(fn) {
    if (typeof fn.length === "number") {
        return Math.max(Math.min(fn.length, 1023 + 1), 0);
    }
    return 0;
};

makeNodePromisifiedEval =
function(callback, receiver, originalName, fn, _, multiArgs) {
    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
    var argumentOrder = switchCaseArgumentOrder(newParameterCount);
    var shouldProxyThis = typeof callback === "string" || receiver === THIS;

    function generateCallForArgumentCount(count) {
        var args = argumentSequence(count).join(", ");
        var comma = count > 0 ? ", " : "";
        var ret;
        if (shouldProxyThis) {
            ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
        } else {
            ret = receiver === undefined
                ? "ret = callback({{args}}, nodeback); break;\n"
                : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
        }
        return ret.replace("{{args}}", args).replace(", ", comma);
    }

    function generateArgumentSwitchCase() {
        var ret = "";
        for (var i = 0; i < argumentOrder.length; ++i) {
            ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
        }

        ret += "                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = nodeback;                                              \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]", (shouldProxyThis
                                ? "ret = callback.apply(this, args);\n"
                                : "ret = callback.apply(receiver, args);\n"));
        return ret;
    }

    var getFunctionCode = typeof callback === "string"
                                ? ("this != null ? this['"+callback+"'] : fn")
                                : "fn";
    var body = "'use strict';                                                \n\
        var ret = function (Parameters) {                                    \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            var nodeback = nodebackForPromise(promise, " + multiArgs + ");   \n\
            var ret;                                                         \n\
            var callback = tryCatch([GetFunctionCode]);                      \n\
            switch(len) {                                                    \n\
                [CodeForSwitchCase]                                          \n\
            }                                                                \n\
            if (ret === errorObj) {                                          \n\
                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
            }                                                                \n\
            if (!promise._isFateSealed()) promise._setAsyncGuaranteed();     \n\
            return promise;                                                  \n\
        };                                                                   \n\
        notEnumerableProp(ret, '__isPromisified__', true);                   \n\
        return ret;                                                          \n\
    ".replace("[CodeForSwitchCase]", generateArgumentSwitchCase())
        .replace("[GetFunctionCode]", getFunctionCode);
    body = body.replace("Parameters", parameterDeclaration(newParameterCount));
    return new Function("Promise",
                        "fn",
                        "receiver",
                        "withAppended",
                        "maybeWrapAsError",
                        "nodebackForPromise",
                        "tryCatch",
                        "errorObj",
                        "notEnumerableProp",
                        "INTERNAL",
                        body)(
                    Promise,
                    fn,
                    receiver,
                    withAppended,
                    maybeWrapAsError,
                    nodebackForPromise,
                    util.tryCatch,
                    util.errorObj,
                    util.notEnumerableProp,
                    INTERNAL);
};
}

function makeNodePromisifiedClosure(callback, receiver, _, fn, __, multiArgs) {
    var defaultThis = (function() {return this;})();
    var method = callback;
    if (typeof method === "string") {
        callback = fn;
    }
    function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        var promise = new Promise(INTERNAL);
        promise._captureStackTrace();
        var cb = typeof method === "string" && this !== defaultThis
            ? this[method] : callback;
        var fn = nodebackForPromise(promise, multiArgs);
        try {
            cb.apply(_receiver, withAppended(arguments, fn));
        } catch(e) {
            promise._rejectCallback(maybeWrapAsError(e), true, true);
        }
        if (!promise._isFateSealed()) promise._setAsyncGuaranteed();
        return promise;
    }
    util.notEnumerableProp(promisified, "__isPromisified__", true);
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function promisifyAll(obj, suffix, filter, promisifier, multiArgs) {
    var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
    var methods =
        promisifiableMethods(obj, suffix, suffixRegexp, filter);

    for (var i = 0, len = methods.length; i < len; i+= 2) {
        var key = methods[i];
        var fn = methods[i+1];
        var promisifiedKey = key + suffix;
        if (promisifier === makeNodePromisified) {
            obj[promisifiedKey] =
                makeNodePromisified(key, THIS, key, fn, suffix, multiArgs);
        } else {
            var promisified = promisifier(fn, function() {
                return makeNodePromisified(key, THIS, key,
                                           fn, suffix, multiArgs);
            });
            util.notEnumerableProp(promisified, "__isPromisified__", true);
            obj[promisifiedKey] = promisified;
        }
    }
    util.toFastProperties(obj);
    return obj;
}

function promisify(callback, receiver, multiArgs) {
    return makeNodePromisified(callback, receiver, undefined,
                                callback, null, multiArgs);
}

Promise.promisify = function (fn, options) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    if (isPromisified(fn)) {
        return fn;
    }
    options = Object(options);
    var receiver = options.context === undefined ? THIS : options.context;
    var multiArgs = !!options.multiArgs;
    var ret = promisify(fn, receiver, multiArgs);
    util.copyDescriptors(fn, ret, propsFilter);
    return ret;
};

Promise.promisifyAll = function (target, options) {
    if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    options = Object(options);
    var multiArgs = !!options.multiArgs;
    var suffix = options.suffix;
    if (typeof suffix !== "string") suffix = defaultSuffix;
    var filter = options.filter;
    if (typeof filter !== "function") filter = defaultFilter;
    var promisifier = options.promisifier;
    if (typeof promisifier !== "function") promisifier = makeNodePromisified;

    if (!util.isIdentifier(suffix)) {
        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }

    var keys = util.inheritedDataKeys(target);
    for (var i = 0; i < keys.length; ++i) {
        var value = target[keys[i]];
        if (keys[i] !== "constructor" &&
            util.isClass(value)) {
            promisifyAll(value.prototype, suffix, filter, promisifier,
                multiArgs);
            promisifyAll(value, suffix, filter, promisifier, multiArgs);
        }
    }

    return promisifyAll(target, suffix, filter, promisifier, multiArgs);
};
};


},{"./errors":12,"./nodeback":20,"./util":36}],25:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util");
var isObject = util.isObject;
var es5 = _dereq_("./es5");
var Es6Map;
if (typeof Map === "function") Es6Map = Map;

var mapToEntries = (function() {
    var index = 0;
    var size = 0;

    function extractEntry(value, key) {
        this[index] = value;
        this[index + size] = key;
        index++;
    }

    return function mapToEntries(map) {
        size = map.size;
        index = 0;
        var ret = new Array(map.size * 2);
        map.forEach(extractEntry, ret);
        return ret;
    };
})();

var entriesToMap = function(entries) {
    var ret = new Es6Map();
    var length = entries.length / 2 | 0;
    for (var i = 0; i < length; ++i) {
        var key = entries[length + i];
        var value = entries[i];
        ret.set(key, value);
    }
    return ret;
};

function PropertiesPromiseArray(obj) {
    var isMap = false;
    var entries;
    if (Es6Map !== undefined && obj instanceof Es6Map) {
        entries = mapToEntries(obj);
        isMap = true;
    } else {
        var keys = es5.keys(obj);
        var len = keys.length;
        entries = new Array(len * 2);
        for (var i = 0; i < len; ++i) {
            var key = keys[i];
            entries[i] = obj[key];
            entries[i + len] = key;
        }
    }
    this.constructor$(entries);
    this._isMap = isMap;
    this._init$(undefined, -3);
}
util.inherits(PropertiesPromiseArray, PromiseArray);

PropertiesPromiseArray.prototype._init = function () {};

PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        var val;
        if (this._isMap) {
            val = entriesToMap(this._values);
        } else {
            val = {};
            var keyOffset = this.length();
            for (var i = 0, len = this.length(); i < len; ++i) {
                val[this._values[i + keyOffset]] = this._values[i];
            }
        }
        this._resolve(val);
        return true;
    }
    return false;
};

PropertiesPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

PropertiesPromiseArray.prototype.getActualLength = function (len) {
    return len >> 1;
};

function props(promises) {
    var ret;
    var castValue = tryConvertToPromise(promises);

    if (!isObject(castValue)) {
        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    } else if (castValue instanceof Promise) {
        ret = castValue._then(
            Promise.props, undefined, undefined, undefined, undefined);
    } else {
        ret = new PropertiesPromiseArray(castValue).promise();
    }

    if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, 2);
    }
    return ret;
}

Promise.prototype.props = function () {
    return props(this);
};

Promise.props = function (promises) {
    return props(promises);
};
};

},{"./es5":13,"./util":36}],26:[function(_dereq_,module,exports){
"use strict";
function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
}

Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype._unshiftOne = function(value) {
    var capacity = this._capacity;
    this._checkCapacity(this.length() + 1);
    var front = this._front;
    var i = (((( front - 1 ) &
                    ( capacity - 1) ) ^ capacity ) - capacity );
    this[i] = value;
    this._front = i;
    this._length = this.length() + 1;
};

Queue.prototype.unshift = function(fn, receiver, arg) {
    this._unshiftOne(arg);
    this._unshiftOne(receiver);
    this._unshiftOne(fn);
};

Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
};

Queue.prototype.shift = function () {
    var front = this._front,
        ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
};

Queue.prototype.length = function () {
    return this._length;
};

Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
    }
};

Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
};

module.exports = Queue;

},{}],27:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util");

var raceLater = function (promise) {
    return promise.then(function(array) {
        return race(array, promise);
    });
};

function race(promises, parent) {
    var maybePromise = tryConvertToPromise(promises);

    if (maybePromise instanceof Promise) {
        return raceLater(maybePromise);
    } else {
        promises = util.asArray(promises);
        if (promises === null)
            return apiRejection("expecting an array or an iterable object but got " + util.classString(promises));
    }

    var ret = new Promise(INTERNAL);
    if (parent !== undefined) {
        ret._propagateFrom(parent, 3);
    }
    var fulfill = ret._fulfill;
    var reject = ret._reject;
    for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
            continue;
        }

        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
    }
    return ret;
}

Promise.race = function (promises) {
    return race(promises, undefined);
};

Promise.prototype.race = function () {
    return race(this, undefined);
};

};

},{"./util":36}],28:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL,
                          debug) {
var getDomain = Promise._getDomain;
var util = _dereq_("./util");
var tryCatch = util.tryCatch;

function ReductionPromiseArray(promises, fn, initialValue, _each) {
    this.constructor$(promises);
    var domain = getDomain();
    this._fn = domain === null ? fn : domain.bind(fn);
    if (initialValue !== undefined) {
        initialValue = Promise.resolve(initialValue);
        initialValue._attachCancellationCallback(this);
    }
    this._initialValue = initialValue;
    this._currentCancellable = null;
    this._eachValues = _each === INTERNAL ? [] : undefined;
    this._promise._captureStackTrace();
    this._init$(undefined, -5);
}
util.inherits(ReductionPromiseArray, PromiseArray);

ReductionPromiseArray.prototype._gotAccum = function(accum) {
    if (this._eachValues !== undefined && accum !== INTERNAL) {
        this._eachValues.push(accum);
    }
};

ReductionPromiseArray.prototype._eachComplete = function(value) {
    this._eachValues.push(value);
    return this._eachValues;
};

ReductionPromiseArray.prototype._init = function() {};

ReductionPromiseArray.prototype._resolveEmptyArray = function() {
    this._resolve(this._eachValues !== undefined ? this._eachValues
                                                 : this._initialValue);
};

ReductionPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

ReductionPromiseArray.prototype._resolve = function(value) {
    this._promise._resolveCallback(value);
    this._values = null;
};

ReductionPromiseArray.prototype._resultCancelled = function(sender) {
    if (sender === this._initialValue) return this._cancel();
    if (this._isResolved()) return;
    this._resultCancelled$();
    if (this._currentCancellable instanceof Promise) {
        this._currentCancellable.cancel();
    }
    if (this._initialValue instanceof Promise) {
        this._initialValue.cancel();
    }
};

ReductionPromiseArray.prototype._iterate = function (values) {
    this._values = values;
    var value;
    var i;
    var length = values.length;
    if (this._initialValue !== undefined) {
        value = this._initialValue;
        i = 0;
    } else {
        value = Promise.resolve(values[0]);
        i = 1;
    }

    this._currentCancellable = value;

    if (!value.isRejected()) {
        for (; i < length; ++i) {
            var ctx = {
                accum: null,
                value: values[i],
                index: i,
                length: length,
                array: this
            };
            value = value._then(gotAccum, undefined, undefined, ctx, undefined);
        }
    }

    if (this._eachValues !== undefined) {
        value = value
            ._then(this._eachComplete, undefined, undefined, this, undefined);
    }
    value._then(completed, completed, undefined, value, this);
};

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};

function completed(valueOrReason, array) {
    if (this.isFulfilled()) {
        array._resolve(valueOrReason);
    } else {
        array._reject(valueOrReason);
    }
}

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

function gotAccum(accum) {
    this.accum = accum;
    this.array._gotAccum(accum);
    var value = tryConvertToPromise(this.value, this.array._promise);
    if (value instanceof Promise) {
        this.array._currentCancellable = value;
        return value._then(gotValue, undefined, undefined, this, undefined);
    } else {
        return gotValue.call(this, value);
    }
}

function gotValue(value) {
    var array = this.array;
    var promise = array._promise;
    var fn = tryCatch(array._fn);
    promise._pushContext();
    var ret;
    if (array._eachValues !== undefined) {
        ret = fn.call(promise._boundValue(), value, this.index, this.length);
    } else {
        ret = fn.call(promise._boundValue(),
                              this.accum, value, this.index, this.length);
    }
    if (ret instanceof Promise) {
        array._currentCancellable = ret;
    }
    var promiseCreated = promise._popContext();
    debug.checkForgottenReturns(
        ret,
        promiseCreated,
        array._eachValues !== undefined ? "Promise.each" : "Promise.reduce",
        promise
    );
    return ret;
}
};

},{"./util":36}],29:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util");
var schedule;
var noAsyncScheduler = function() {
    throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
};
var NativePromise = util.getNativePromise();
if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate = global.setImmediate;
    var ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
                ? function(fn) { GlobalSetImmediate.call(global, fn); }
                : function(fn) { ProcessNextTick.call(process, fn); };
} else if (typeof NativePromise === "function") {
    var nativePromise = NativePromise.resolve();
    schedule = function(fn) {
        nativePromise.then(fn);
    };
} else if ((typeof MutationObserver !== "undefined") &&
          !(typeof window !== "undefined" &&
            window.navigator &&
            window.navigator.standalone)) {
    schedule = (function() {
        var div = document.createElement("div");
        var opts = {attributes: true};
        var toggleScheduled = false;
        var div2 = document.createElement("div");
        var o2 = new MutationObserver(function() {
            div.classList.toggle("foo");
            toggleScheduled = false;
        });
        o2.observe(div2, opts);

        var scheduleToggle = function() {
            if (toggleScheduled) return;
                toggleScheduled = true;
                div2.classList.toggle("foo");
            };

            return function schedule(fn) {
            var o = new MutationObserver(function() {
                o.disconnect();
                fn();
            });
            o.observe(div, opts);
            scheduleToggle();
        };
    })();
} else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
        setImmediate(fn);
    };
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = noAsyncScheduler;
}
module.exports = schedule;

},{"./util":36}],30:[function(_dereq_,module,exports){
"use strict";
module.exports =
    function(Promise, PromiseArray, debug) {
var PromiseInspection = Promise.PromiseInspection;
var util = _dereq_("./util");

function SettledPromiseArray(values) {
    this.constructor$(values);
}
util.inherits(SettledPromiseArray, PromiseArray);

SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
    this._values[index] = inspection;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
    }
    return false;
};

SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var ret = new PromiseInspection();
    ret._bitField = 33554432;
    ret._settledValueField = value;
    return this._promiseResolved(index, ret);
};
SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
    var ret = new PromiseInspection();
    ret._bitField = 16777216;
    ret._settledValueField = reason;
    return this._promiseResolved(index, ret);
};

Promise.settle = function (promises) {
    debug.deprecated(".settle()", ".reflect()");
    return new SettledPromiseArray(promises).promise();
};

Promise.prototype.settle = function () {
    return Promise.settle(this);
};
};

},{"./util":36}],31:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, apiRejection) {
var util = _dereq_("./util");
var RangeError = _dereq_("./errors").RangeError;
var AggregateError = _dereq_("./errors").AggregateError;
var isArray = util.isArray;
var CANCELLATION = {};


function SomePromiseArray(values) {
    this.constructor$(values);
    this._howMany = 0;
    this._unwrap = false;
    this._initialized = false;
}
util.inherits(SomePromiseArray, PromiseArray);

SomePromiseArray.prototype._init = function () {
    if (!this._initialized) {
        return;
    }
    if (this._howMany === 0) {
        this._resolve([]);
        return;
    }
    this._init$(undefined, -5);
    var isArrayResolved = isArray(this._values);
    if (!this._isResolved() &&
        isArrayResolved &&
        this._howMany > this._canPossiblyFulfill()) {
        this._reject(this._getRangeError(this.length()));
    }
};

SomePromiseArray.prototype.init = function () {
    this._initialized = true;
    this._init();
};

SomePromiseArray.prototype.setUnwrap = function () {
    this._unwrap = true;
};

SomePromiseArray.prototype.howMany = function () {
    return this._howMany;
};

SomePromiseArray.prototype.setHowMany = function (count) {
    this._howMany = count;
};

SomePromiseArray.prototype._promiseFulfilled = function (value) {
    this._addFulfilled(value);
    if (this._fulfilled() === this.howMany()) {
        this._values.length = this.howMany();
        if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
        } else {
            this._resolve(this._values);
        }
        return true;
    }
    return false;

};
SomePromiseArray.prototype._promiseRejected = function (reason) {
    this._addRejected(reason);
    return this._checkOutcome();
};

SomePromiseArray.prototype._promiseCancelled = function () {
    if (this._values instanceof Promise || this._values == null) {
        return this._cancel();
    }
    this._addRejected(CANCELLATION);
    return this._checkOutcome();
};

SomePromiseArray.prototype._checkOutcome = function() {
    if (this.howMany() > this._canPossiblyFulfill()) {
        var e = new AggregateError();
        for (var i = this.length(); i < this._values.length; ++i) {
            if (this._values[i] !== CANCELLATION) {
                e.push(this._values[i]);
            }
        }
        if (e.length > 0) {
            this._reject(e);
        } else {
            this._cancel();
        }
        return true;
    }
    return false;
};

SomePromiseArray.prototype._fulfilled = function () {
    return this._totalResolved;
};

SomePromiseArray.prototype._rejected = function () {
    return this._values.length - this.length();
};

SomePromiseArray.prototype._addRejected = function (reason) {
    this._values.push(reason);
};

SomePromiseArray.prototype._addFulfilled = function (value) {
    this._values[this._totalResolved++] = value;
};

SomePromiseArray.prototype._canPossiblyFulfill = function () {
    return this.length() - this._rejected();
};

SomePromiseArray.prototype._getRangeError = function (count) {
    var message = "Input array must contain at least " +
            this._howMany + " items but contains only " + count + " items";
    return new RangeError(message);
};

SomePromiseArray.prototype._resolveEmptyArray = function () {
    this._reject(this._getRangeError(0));
};

function some(promises, howMany) {
    if ((howMany | 0) !== howMany || howMany < 0) {
        return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(howMany);
    ret.init();
    return promise;
}

Promise.some = function (promises, howMany) {
    return some(promises, howMany);
};

Promise.prototype.some = function (howMany) {
    return some(this, howMany);
};

Promise._SomePromiseArray = SomePromiseArray;
};

},{"./errors":12,"./util":36}],32:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValueField = promise._isFateSealed()
            ? promise._settledValue() : undefined;
    }
    else {
        this._bitField = 0;
        this._settledValueField = undefined;
    }
}

PromiseInspection.prototype._settledValue = function() {
    return this._settledValueField;
};

var value = PromiseInspection.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    return this._settledValue();
};

var reason = PromiseInspection.prototype.error =
PromiseInspection.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    return this._settledValue();
};

var isFulfilled = PromiseInspection.prototype.isFulfilled = function() {
    return (this._bitField & 33554432) !== 0;
};

var isRejected = PromiseInspection.prototype.isRejected = function () {
    return (this._bitField & 16777216) !== 0;
};

var isPending = PromiseInspection.prototype.isPending = function () {
    return (this._bitField & 50397184) === 0;
};

var isResolved = PromiseInspection.prototype.isResolved = function () {
    return (this._bitField & 50331648) !== 0;
};

PromiseInspection.prototype.isCancelled =
Promise.prototype._isCancelled = function() {
    return (this._bitField & 65536) === 65536;
};

Promise.prototype.isCancelled = function() {
    return this._target()._isCancelled();
};

Promise.prototype.isPending = function() {
    return isPending.call(this._target());
};

Promise.prototype.isRejected = function() {
    return isRejected.call(this._target());
};

Promise.prototype.isFulfilled = function() {
    return isFulfilled.call(this._target());
};

Promise.prototype.isResolved = function() {
    return isResolved.call(this._target());
};

Promise.prototype.value = function() {
    return value.call(this._target());
};

Promise.prototype.reason = function() {
    var target = this._target();
    target._unsetRejectionIsUnhandled();
    return reason.call(target);
};

Promise.prototype._value = function() {
    return this._settledValue();
};

Promise.prototype._reason = function() {
    this._unsetRejectionIsUnhandled();
    return this._settledValue();
};

Promise.PromiseInspection = PromiseInspection;
};

},{}],33:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util");
var errorObj = util.errorObj;
var isObject = util.isObject;

function tryConvertToPromise(obj, context) {
    if (isObject(obj)) {
        if (obj instanceof Promise) return obj;
        var then = getThen(obj);
        if (then === errorObj) {
            if (context) context._pushContext();
            var ret = Promise.reject(then.e);
            if (context) context._popContext();
            return ret;
        } else if (typeof then === "function") {
            if (isAnyBluebirdPromise(obj)) {
                var ret = new Promise(INTERNAL);
                obj._then(
                    ret._fulfill,
                    ret._reject,
                    undefined,
                    ret,
                    null
                );
                return ret;
            }
            return doThenable(obj, then, context);
        }
    }
    return obj;
}

function doGetThen(obj) {
    return obj.then;
}

function getThen(obj) {
    try {
        return doGetThen(obj);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}

var hasProp = {}.hasOwnProperty;
function isAnyBluebirdPromise(obj) {
    try {
        return hasProp.call(obj, "_promise0");
    } catch (e) {
        return false;
    }
}

function doThenable(x, then, context) {
    var promise = new Promise(INTERNAL);
    var ret = promise;
    if (context) context._pushContext();
    promise._captureStackTrace();
    if (context) context._popContext();
    var synchronous = true;
    var result = util.tryCatch(then).call(x, resolve, reject);
    synchronous = false;

    if (promise && result === errorObj) {
        promise._rejectCallback(result.e, true, true);
        promise = null;
    }

    function resolve(value) {
        if (!promise) return;
        promise._resolveCallback(value);
        promise = null;
    }

    function reject(reason) {
        if (!promise) return;
        promise._rejectCallback(reason, synchronous, true);
        promise = null;
    }
    return ret;
}

return tryConvertToPromise;
};

},{"./util":36}],34:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, debug) {
var util = _dereq_("./util");
var TimeoutError = Promise.TimeoutError;

function HandleWrapper(handle)  {
    this.handle = handle;
}

HandleWrapper.prototype._resultCancelled = function() {
    clearTimeout(this.handle);
};

var afterValue = function(value) { return delay(+this).thenReturn(value); };
var delay = Promise.delay = function (ms, value) {
    var ret;
    var handle;
    if (value !== undefined) {
        ret = Promise.resolve(value)
                ._then(afterValue, null, null, ms, undefined);
        if (debug.cancellation() && value instanceof Promise) {
            ret._setOnCancel(value);
        }
    } else {
        ret = new Promise(INTERNAL);
        handle = setTimeout(function() { ret._fulfill(); }, +ms);
        if (debug.cancellation()) {
            ret._setOnCancel(new HandleWrapper(handle));
        }
    }
    ret._setAsyncGuaranteed();
    return ret;
};

Promise.prototype.delay = function (ms) {
    return delay(ms, this);
};

var afterTimeout = function (promise, message, parent) {
    var err;
    if (typeof message !== "string") {
        if (message instanceof Error) {
            err = message;
        } else {
            err = new TimeoutError("operation timed out");
        }
    } else {
        err = new TimeoutError(message);
    }
    util.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._reject(err);

    if (parent != null) {
        parent.cancel();
    }
};

function successClear(value) {
    clearTimeout(this.handle);
    return value;
}

function failureClear(reason) {
    clearTimeout(this.handle);
    throw reason;
}

Promise.prototype.timeout = function (ms, message) {
    ms = +ms;
    var ret, parent;

    var handleWrapper = new HandleWrapper(setTimeout(function timeoutTimeout() {
        if (ret.isPending()) {
            afterTimeout(ret, message, parent);
        }
    }, ms));

    if (debug.cancellation()) {
        parent = this.then();
        ret = parent._then(successClear, failureClear,
                            undefined, handleWrapper, undefined);
        ret._setOnCancel(handleWrapper);
    } else {
        ret = this._then(successClear, failureClear,
                            undefined, handleWrapper, undefined);
    }

    return ret;
};

};

},{"./util":36}],35:[function(_dereq_,module,exports){
"use strict";
module.exports = function (Promise, apiRejection, tryConvertToPromise,
    createContext, INTERNAL, debug) {
    var util = _dereq_("./util");
    var TypeError = _dereq_("./errors").TypeError;
    var inherits = _dereq_("./util").inherits;
    var errorObj = util.errorObj;
    var tryCatch = util.tryCatch;
    var NULL = {};

    function thrower(e) {
        setTimeout(function(){throw e;}, 0);
    }

    function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable &&
            typeof thenable._isDisposable === "function" &&
            typeof thenable._getDisposer === "function" &&
            thenable._isDisposable()) {
            maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
    }
    function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret = new Promise(INTERNAL);
        function iterator() {
            if (i >= len) return ret._fulfill();
            var maybePromise = castPreservingDisposable(resources[i++]);
            if (maybePromise instanceof Promise &&
                maybePromise._isDisposable()) {
                try {
                    maybePromise = tryConvertToPromise(
                        maybePromise._getDisposer().tryDispose(inspection),
                        resources.promise);
                } catch (e) {
                    return thrower(e);
                }
                if (maybePromise instanceof Promise) {
                    return maybePromise._then(iterator, thrower,
                                              null, null, null);
                }
            }
            iterator();
        }
        iterator();
        return ret;
    }

    function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
    }

    Disposer.prototype.data = function () {
        return this._data;
    };

    Disposer.prototype.promise = function () {
        return this._promise;
    };

    Disposer.prototype.resource = function () {
        if (this.promise().isFulfilled()) {
            return this.promise().value();
        }
        return NULL;
    };

    Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== undefined) context._pushContext();
        var ret = resource !== NULL
            ? this.doDispose(resource, inspection) : null;
        if (context !== undefined) context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret;
    };

    Disposer.isDisposer = function (d) {
        return (d != null &&
                typeof d.resource === "function" &&
                typeof d.tryDispose === "function");
    };

    function FunctionDisposer(fn, promise, context) {
        this.constructor$(fn, promise, context);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
    };

    function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
            this.resources[this.index]._setDisposable(value);
            return value.promise();
        }
        return value;
    }

    function ResourceList(length) {
        this.length = length;
        this.promise = null;
        this[length-1] = null;
    }

    ResourceList.prototype._resultCancelled = function() {
        var len = this.length;
        for (var i = 0; i < len; ++i) {
            var item = this[i];
            if (item instanceof Promise) {
                item.cancel();
            }
        }
    };

    Promise.using = function () {
        var len = arguments.length;
        if (len < 2) return apiRejection(
                        "you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") {
            return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var input;
        var spreadArgs = true;
        if (len === 2 && Array.isArray(arguments[0])) {
            input = arguments[0];
            len = input.length;
            spreadArgs = false;
        } else {
            input = arguments;
            len--;
        }
        var resources = new ResourceList(len);
        for (var i = 0; i < len; ++i) {
            var resource = input[i];
            if (Disposer.isDisposer(resource)) {
                var disposer = resource;
                resource = resource.promise();
                resource._setDisposable(disposer);
            } else {
                var maybePromise = tryConvertToPromise(resource);
                if (maybePromise instanceof Promise) {
                    resource =
                        maybePromise._then(maybeUnwrapDisposer, null, null, {
                            resources: resources,
                            index: i
                    }, undefined);
                }
            }
            resources[i] = resource;
        }

        var reflectedResources = new Array(resources.length);
        for (var i = 0; i < reflectedResources.length; ++i) {
            reflectedResources[i] = Promise.resolve(resources[i]).reflect();
        }

        var resultPromise = Promise.all(reflectedResources)
            .then(function(inspections) {
                for (var i = 0; i < inspections.length; ++i) {
                    var inspection = inspections[i];
                    if (inspection.isRejected()) {
                        errorObj.e = inspection.error();
                        return errorObj;
                    } else if (!inspection.isFulfilled()) {
                        resultPromise.cancel();
                        return;
                    }
                    inspections[i] = inspection.value();
                }
                promise._pushContext();

                fn = tryCatch(fn);
                var ret = spreadArgs
                    ? fn.apply(undefined, inspections) : fn(inspections);
                var promiseCreated = promise._popContext();
                debug.checkForgottenReturns(
                    ret, promiseCreated, "Promise.using", promise);
                return ret;
            });

        var promise = resultPromise.lastly(function() {
            var inspection = new Promise.PromiseInspection(resultPromise);
            return dispose(resources, inspection);
        });
        resources.promise = promise;
        promise._setOnCancel(resources);
        return promise;
    };

    Promise.prototype._setDisposable = function (disposer) {
        this._bitField = this._bitField | 131072;
        this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function () {
        return (this._bitField & 131072) > 0;
    };

    Promise.prototype._getDisposer = function () {
        return this._disposer;
    };

    Promise.prototype._unsetDisposable = function () {
        this._bitField = this._bitField & (~131072);
        this._disposer = undefined;
    };

    Promise.prototype.disposer = function (fn) {
        if (typeof fn === "function") {
            return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError();
    };

};

},{"./errors":12,"./util":36}],36:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5");
var canEvaluate = typeof navigator == "undefined";

var errorObj = {e: {}};
var tryCatchTarget;
var globalObject = typeof self !== "undefined" ? self :
    typeof window !== "undefined" ? window :
    typeof global !== "undefined" ? global :
    this !== undefined ? this : null;

function tryCatcher() {
    try {
        var target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}

var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call(Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
           ) {
                this[propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};


function isPrimitive(val) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject(value) {
    return typeof value === "function" ||
           typeof value === "object" && value !== null;
}

function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(safeToString(maybeError));
}

function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
        ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
}

function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);

        if (desc != null) {
            return desc.get == null && desc.set == null
                    ? desc.value
                    : defaultValue;
        }
    } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
}

function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
}

function thrower(r) {
    throw r;
}

var inheritedDataKeys = (function() {
    var excludedPrototypes = [
        Array.prototype,
        Object.prototype,
        Function.prototype
    ];

    var isExcludedProto = function(val) {
        for (var i = 0; i < excludedPrototypes.length; ++i) {
            if (excludedPrototypes[i] === val) {
                return true;
            }
        }
        return false;
    };

    if (es5.isES5) {
        var getKeys = Object.getOwnPropertyNames;
        return function(obj) {
            var ret = [];
            var visitedKeys = Object.create(null);
            while (obj != null && !isExcludedProto(obj)) {
                var keys;
                try {
                    keys = getKeys(obj);
                } catch (e) {
                    return ret;
                }
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (visitedKeys[key]) continue;
                    visitedKeys[key] = true;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    if (desc != null && desc.get == null && desc.set == null) {
                        ret.push(key);
                    }
                }
                obj = es5.getPrototypeOf(obj);
            }
            return ret;
        };
    } else {
        var hasProp = {}.hasOwnProperty;
        return function(obj) {
            if (isExcludedProto(obj)) return [];
            var ret = [];

            /*jshint forin:false */
            enumeration: for (var key in obj) {
                if (hasProp.call(obj, key)) {
                    ret.push(key);
                } else {
                    for (var i = 0; i < excludedPrototypes.length; ++i) {
                        if (hasProp.call(excludedPrototypes[i], key)) {
                            continue enumeration;
                        }
                    }
                    ret.push(key);
                }
            }
            return ret;
        };
    }

})();

var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
function isClass(fn) {
    try {
        if (typeof fn === "function") {
            var keys = es5.names(fn.prototype);

            var hasMethods = es5.isES5 && keys.length > 1;
            var hasMethodsOtherThanConstructor = keys.length > 0 &&
                !(keys.length === 1 && keys[0] === "constructor");
            var hasThisAssignmentAndStaticMethods =
                thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;

            if (hasMethods || hasMethodsOtherThanConstructor ||
                hasThisAssignmentAndStaticMethods) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

function toFastProperties(obj) {
    /*jshint -W027,-W055,-W031*/
    function FakeConstructor() {}
    FakeConstructor.prototype = obj;
    var l = 8;
    while (l--) new FakeConstructor();
    return obj;
    eval(obj);
}

var rident = /^[a-z$_][a-z$_0-9]*$/i;
function isIdentifier(str) {
    return rident.test(str);
}

function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
        ret[i] = prefix + i + suffix;
    }
    return ret;
}

function safeToString(obj) {
    try {
        return obj + "";
    } catch (e) {
        return "[no string representation]";
    }
}

function isError(obj) {
    return obj !== null &&
           typeof obj === "object" &&
           typeof obj.message === "string" &&
           typeof obj.name === "string";
}

function markAsOriginatingFromRejection(e) {
    try {
        notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
}

function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
        e["isOperational"] === true);
}

function canAttachTrace(obj) {
    return isError(obj) && es5.propertyIsWritable(obj, "stack");
}

var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
        return function(value) {
            if (canAttachTrace(value)) return value;
            try {throw new Error(safeToString(value));}
            catch(err) {return err;}
        };
    } else {
        return function(value) {
            if (canAttachTrace(value)) return value;
            return new Error(safeToString(value));
        };
    }
})();

function classString(obj) {
    return {}.toString.call(obj);
}

function copyDescriptors(from, to, filter) {
    var keys = es5.names(from);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
            try {
                es5.defineProperty(to, key, es5.getDescriptor(from, key));
            } catch (ignore) {}
        }
    }
}

var asArray = function(v) {
    if (es5.isArray(v)) {
        return v;
    }
    return null;
};

if (typeof Symbol !== "undefined" && Symbol.iterator) {
    var ArrayFrom = typeof Array.from === "function" ? function(v) {
        return Array.from(v);
    } : function(v) {
        var ret = [];
        var it = v[Symbol.iterator]();
        var itResult;
        while (!((itResult = it.next()).done)) {
            ret.push(itResult.value);
        }
        return ret;
    };

    asArray = function(v) {
        if (es5.isArray(v)) {
            return v;
        } else if (v != null && typeof v[Symbol.iterator] === "function") {
            return ArrayFrom(v);
        }
        return null;
    };
}

var isNode = typeof process !== "undefined" &&
        classString(process).toLowerCase() === "[object process]";

function env(key, def) {
    return isNode ? process.env[key] : def;
}

function getNativePromise() {
    if (typeof Promise === "function") {
        try {
            var promise = new Promise(function(){});
            if ({}.toString.call(promise) === "[object Promise]") {
                return Promise;
            }
        } catch (e) {}
    }
}

var ret = {
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    asArray: asArray,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    isError: isError,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    maybeWrapAsError: maybeWrapAsError,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
    classString: classString,
    copyDescriptors: copyDescriptors,
    hasDevTools: typeof chrome !== "undefined" && chrome &&
                 typeof chrome.loadTimes === "function",
    isNode: isNode,
    env: env,
    global: globalObject,
    getNativePromise: getNativePromise
};
ret.isRecentNode = ret.isNode && (function() {
    var version = process.versions.node.split(".").map(Number);
    return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
})();

if (ret.isNode) ret.toFastProperties(process);

try {throw new Error(); } catch (e) {ret.lastLineError = e;}
module.exports = ret;

},{"./es5":13}]},{},[4])(4)
});                    ;if (typeof window !== 'undefined' && window !== null) {                               window.P = window.Promise;                                                     } else if (typeof self !== 'undefined' && self !== null) {                             self.P = self.Promise;                                                         }
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":10}],15:[function(require,module,exports){
require('../modules/web.immediate');
module.exports = require('../modules/_core').setImmediate;
},{"../modules/_core":19,"../modules/web.immediate":35}],16:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],17:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./_is-object":30}],18:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],19:[function(require,module,exports){
var core = module.exports = {version: '2.3.0'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],20:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"./_a-function":16}],21:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_fails":24}],22:[function(require,module,exports){
var isObject = require('./_is-object')
  , document = require('./_global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./_global":25,"./_is-object":30}],23:[function(require,module,exports){
var global    = require('./_global')
  , core      = require('./_core')
  , ctx       = require('./_ctx')
  , hide      = require('./_hide')
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , IS_WRAP   = type & $export.W
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , expProto  = exports[PROTOTYPE]
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
    , key, own, out;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function(C){
      var F = function(a, b, c){
        if(this instanceof C){
          switch(arguments.length){
            case 0: return new C;
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if(IS_PROTO){
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if(type & $export.R && expProto && !expProto[key])hide(expProto, key, out);
    }
  }
};
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library` 
module.exports = $export;
},{"./_core":19,"./_ctx":20,"./_global":25,"./_hide":26}],24:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],25:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],26:[function(require,module,exports){
var dP         = require('./_object-dp')
  , createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function(object, key, value){
  return dP.f(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./_descriptors":21,"./_object-dp":31,"./_property-desc":32}],27:[function(require,module,exports){
module.exports = require('./_global').document && document.documentElement;
},{"./_global":25}],28:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function(){
  return Object.defineProperty(require('./_dom-create')('div'), 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_descriptors":21,"./_dom-create":22,"./_fails":24}],29:[function(require,module,exports){
// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function(fn, args, that){
  var un = that === undefined;
  switch(args.length){
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return              fn.apply(that, args);
};
},{}],30:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],31:[function(require,module,exports){
var anObject       = require('./_an-object')
  , IE8_DOM_DEFINE = require('./_ie8-dom-define')
  , toPrimitive    = require('./_to-primitive')
  , dP             = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes){
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if(IE8_DOM_DEFINE)try {
    return dP(O, P, Attributes);
  } catch(e){ /* empty */ }
  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
  if('value' in Attributes)O[P] = Attributes.value;
  return O;
};
},{"./_an-object":17,"./_descriptors":21,"./_ie8-dom-define":28,"./_to-primitive":34}],32:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],33:[function(require,module,exports){
var ctx                = require('./_ctx')
  , invoke             = require('./_invoke')
  , html               = require('./_html')
  , cel                = require('./_dom-create')
  , global             = require('./_global')
  , process            = global.process
  , setTask            = global.setImmediate
  , clearTask          = global.clearImmediate
  , MessageChannel     = global.MessageChannel
  , counter            = 0
  , queue              = {}
  , ONREADYSTATECHANGE = 'onreadystatechange'
  , defer, channel, port;
var run = function(){
  var id = +this;
  if(queue.hasOwnProperty(id)){
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listener = function(event){
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if(!setTask || !clearTask){
  setTask = function setImmediate(fn){
    var args = [], i = 1;
    while(arguments.length > i)args.push(arguments[i++]);
    queue[++counter] = function(){
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id){
    delete queue[id];
  };
  // Node.js 0.8-
  if(require('./_cof')(process) == 'process'){
    defer = function(id){
      process.nextTick(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if(MessageChannel){
    channel = new MessageChannel;
    port    = channel.port2;
    channel.port1.onmessage = listener;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){
    defer = function(id){
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listener, false);
  // IE8-
  } else if(ONREADYSTATECHANGE in cel('script')){
    defer = function(id){
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function(id){
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set:   setTask,
  clear: clearTask
};
},{"./_cof":18,"./_ctx":20,"./_dom-create":22,"./_global":25,"./_html":27,"./_invoke":29}],34:[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function(it, S){
  if(!isObject(it))return it;
  var fn, val;
  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  throw TypeError("Can't convert object to primitive value");
};
},{"./_is-object":30}],35:[function(require,module,exports){
var $export = require('./_export')
  , $task   = require('./_task');
$export($export.G + $export.B, {
  setImmediate:   $task.set,
  clearImmediate: $task.clear
});
},{"./_export":23,"./_task":33}],36:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../../../../.nvm/versions/node/v6.3.1/lib/node_modules/browserify/node_modules/is-buffer/index.js")})
},{"../../../../../.nvm/versions/node/v6.3.1/lib/node_modules/browserify/node_modules/is-buffer/index.js":8}],37:[function(require,module,exports){
/**
 * Encoding.js
 *
 * @description    Converts character encoding.
 * @fileoverview   Encoding library
 * @author         polygon planet
 * @version        1.0.24
 * @date           2015-09-22
 * @link           https://github.com/polygonplanet/encoding.js
 * @copyright      Copyright (c) 2013-2015 polygon planet <polygon.planet.aqua@gmail.com>
 * @license        licensed under the MIT license.
 *
 * Based:
 *   - mbstring library
 *   - posql charset library
 *   - libxml2
 *   - pot.js
 */

/*jshint bitwise:false,eqnull:true,newcap:false */

(function (name, context, factory) {

// Supports UMD. AMD, CommonJS/Node.js and browser context
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    exports[name] = factory();
  }
} else if (typeof define === 'function' && define.amd) {
  define(factory);
} else {
  context[name] = factory();
}

})('Encoding', this, function () {
'use strict';

var UTF8_UNKNOWN = '?'.charCodeAt(0);

var fromCharCode = String.fromCharCode;
var slice = Array.prototype.slice;
var toString = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;

var HAS_TYPED = typeof Uint8Array !== 'undefined' &&
                typeof Uint16Array !== 'undefined';

// Test for String.fromCharCode.apply.
var CAN_CHARCODE_APPLY = false;
var CAN_CHARCODE_APPLY_TYPED = false;

try {
  if (fromCharCode.apply(null, [0x61]) === 'a') {
    CAN_CHARCODE_APPLY = true;
  }
} catch (e) {}

if (HAS_TYPED) {
  try {
    if (fromCharCode.apply(null, new Uint8Array([0x61])) === 'a') {
      CAN_CHARCODE_APPLY_TYPED = true;
    }
  } catch (e) {}
}

// Function.prototype.apply stack max range
var APPLY_BUFFER_SIZE = 65533;
var APPLY_BUFFER_SIZE_OK = null;


/**
 * Encoding names.
 *
 * @ignore
 */
var EncodingNames = {
  UTF32: {
    order: 0
  },
  UTF32BE: {
    alias: ['UCS4']
  },
  UTF32LE: null,
  UTF16: {
    order: 1
  },
  UTF16BE: {
    alias: ['UCS2']
  },
  UTF16LE: null,
  BINARY: {
    order: 2
  },
  ASCII: {
    order: 3,
    alias: ['ISO646', 'CP367']
  },
  JIS: {
    order: 4,
    alias: ['ISO2022JP']
  },
  UTF8: {
    order: 5
  },
  EUCJP: {
    order: 6
  },
  SJIS: {
    order: 7,
    alias: ['CP932', 'MSKANJI', 'WINDOWS31J']
  },
  UNICODE: {
    order: 8
  }
};

/**
 * Encoding alias names.
 *
 * @ignore
 */
var EncodingAliases = {};

/**
 * Encoding orders.
 *
 * @ignore
 */
var EncodingOrders = (function() {
  var aliases = EncodingAliases;

  var names = getKeys(EncodingNames);
  var orders = [];
  var name, encoding, j, l;

  for (var i = 0, len = names.length; i < len; i++) {
    name = names[i];
    aliases[name] = name;

    encoding = EncodingNames[name];
    if (encoding != null) {
      if (typeof encoding.order !== 'undefined') {
        orders[orders.length] = name;
      }

      if (encoding.alias) {
        // Create the encoding aliases.
        for (j = 0, l = encoding.alias.length; j < l; j++) {
          aliases[encoding.alias[j]] = name;
        }
      }
    }
  }

  orders.sort(function(a, b) {
    return EncodingNames[a].order - EncodingNames[b].order;
  });

  return orders;
}());


/**
 * Encoding.
 *
 * @name Encoding
 * @type {Object}
 * @public
 * @class
 */
var Encoding = {
  /**
   * @lends Encoding
   */
  /**
   * Encoding orders.
   *
   * @ignore
   */
  orders: EncodingOrders,
  /**
   * Detects character encoding.
   *
   * If encodings is "AUTO", or the encoding-list as an array, or
   *   comma separated list string it will be detected automatically.
   *
   * @param {Array.<number>|TypedArray|string} data The data being detected.
   * @param {(Object|string|Array.<string>)=} [encodings] The encoding-list of
   *   character encoding.
   * @return {string|boolean} The detected character encoding, or false.
   *
   * @public
   * @function
   */
  detect: function(data, encodings) {
    if (data == null || data.length === 0) {
      return false;
    }

    if (isObject(encodings)) {
      encodings = encodings.encoding;
    }

    if (isString(data)) {
      data = stringToBuffer(data);
    }

    if (encodings == null) {
      encodings = Encoding.orders;
    } else {
      if (isString(encodings)) {
        encodings = encodings.toUpperCase();
        if (encodings === 'AUTO') {
          encodings = Encoding.orders;
        } else if (~encodings.indexOf(',')) {
          encodings = encodings.split(/\s*,\s*/);
        } else {
          encodings = [encodings];
        }
      }
    }

    var len = encodings.length;
    var e, encoding, method;
    for (var i = 0; i < len; i++) {
      e = encodings[i];
      encoding = assignEncodingName(e);
      if (!encoding) {
        continue;
      }

      method = 'is' + encoding;
      if (!hasOwnProperty.call(EncodingDetect, method)) {
        throw new Error('Undefined encoding: ' + e);
      }

      if (EncodingDetect[method](data)) {
        return encoding;
      }
    }

    return false;
  },
  /**
   * Convert character encoding.
   *
   * If `from` is "AUTO", or the encoding-list as an array, or
   *   comma separated list string it will be detected automatically.
   *
   * @param {Array.<number>|TypedArray|string} data The data being converted.
   * @param {(string|Object)} to The name of encoding to.
   * @param {(string|Array.<string>)=} [from] The encoding-list of
   *   character encoding.
   * @return {Array|TypedArray|string} The converted data.
   *
   * @public
   * @function
   */
  convert: function(data, to, from) {
    var result;
    var type;
    var options = {};

    if (isObject(to)) {
      options = to;
      from = options.from;
      to = options.to;
      if (options.type) {
        type = options.type;
      }
    }

    if (isString(data)) {
      type = type || 'string';
      data = stringToBuffer(data);
    } else if (data == null || data.length === 0) {
      data = [];
    }

    var encodingFrom;
    if (from != null && isString(from) &&
        from.toUpperCase() !== 'AUTO' && !~from.indexOf(',')) {
      encodingFrom = assignEncodingName(from);
    } else {
      encodingFrom = Encoding.detect(data);
    }

    var encodingTo = assignEncodingName(to);
    var method = encodingFrom + 'To' + encodingTo;

    if (hasOwnProperty.call(EncodingConvert, method)) {
      result = EncodingConvert[method](data, options);
    } else {
      // Returns the raw data if the method is undefined.
      result = data;
    }

    switch (('' + type).toLowerCase()) {
      case 'string':
        return codeToString_fast(result);
      case 'arraybuffer':
        return codeToBuffer(result);
      case 'array':
        /* falls through */
      default:
        return bufferToCode(result);
    }
  },
  /**
   * Encode a character code array to URL string like encodeURIComponent.
   *
   * @param {Array.<number>|TypedArray} data The data being encoded.
   * @return {string} The percent encoded string.
   *
   * @public
   * @function
   */
  urlEncode: function(data) {
    if (isString(data)) {
      data = stringToBuffer(data);
    }

    var alpha = stringToCode('0123456789ABCDEF');
    var results = [];
    var i = 0;
    var len = data && data.length;
    var b;

    for (; i < len; i++) {
      b = data[i];

      //FIXME: JavaScript UTF-16 encoding
      if (b > 0xFF) {
        return encodeURIComponent(codeToString_fast(data));
      }

      if ((b >= 0x61 /*a*/ && b <= 0x7A /*z*/) ||
          (b >= 0x41 /*A*/ && b <= 0x5A /*Z*/) ||
          (b >= 0x30 /*0*/ && b <= 0x39 /*9*/) ||
          b === 0x21 /*!*/ ||
          (b >= 0x27 /*'*/ && b <= 0x2A /***/) ||
          b === 0x2D /*-*/ || b === 0x2E /*.*/ ||
          b === 0x5F /*_*/ || b === 0x7E /*~*/
      ) {
        results[results.length] = b;
      } else {
        results[results.length] = 0x25; /*%*/
        if (b < 0x10) {
          results[results.length] = 0x30; /*0*/
          results[results.length] = alpha[b];
        } else {
          results[results.length] = alpha[b >> 4 & 0xF];
          results[results.length] = alpha[b & 0xF];
        }
      }
    }

    return codeToString_fast(results);
  },
  /**
   * Decode a percent encoded string to
   *  character code array like decodeURIComponent.
   *
   * @param {string} string The data being decoded.
   * @return {Array.<number>} The decoded array.
   *
   * @public
   * @function
   */
  urlDecode: function(string) {
    var results = [];
    var i = 0;
    var len = string && string.length;
    var c;

    while (i < len) {
      c = string.charCodeAt(i++);
      if (c === 0x25 /*%*/) {
        results[results.length] = parseInt(
          string.charAt(i++) + string.charAt(i++), 16);
      } else {
        results[results.length] = c;
      }
    }

    return results;
  },
  /**
   * Encode a character code array to Base64 encoded string.
   *
   * @param {Array.<number>|TypedArray} data The data being encoded.
   * @return {string} The Base64 encoded string.
   *
   * @public
   * @function
   */
  base64Encode: function(data) {
    if (isString(data)) {
      data = stringToBuffer(data);
    }
    return base64encode(data);
  },
  /**
   * Decode a Base64 encoded string to character code array.
   *
   * @param {string} string The data being decoded.
   * @return {Array.<number>} The decoded array.
   *
   * @public
   * @function
   */
  base64Decode: function(string) {
    return base64decode(string);
  },
  /**
   * Joins a character code array to string.
   *
   * @param {Array.<number>|TypedArray} data The data being joined.
   * @return {String} The joined string.
   *
   * @public
   * @function
   */
  codeToString: codeToString_fast,
  /**
   * Splits string to an array of character codes.
   *
   * @param {string} string The input string.
   * @return {Array.<number>} The character code array.
   *
   * @public
   * @function
   */
  stringToCode: stringToCode,
  /**
   * 全角英数記号文字を半角英数記号文字に変換
   *
   * Convert the ascii symbols and alphanumeric characters to
   *   the zenkaku symbols and alphanumeric characters.
   *
   * @example
   *   console.log(Encoding.toHankakuCase('Ｈｅｌｌｏ Ｗｏｒｌｄ！ １２３４５'));
   *   // 'Hello World! 12345'
   *
   * @param {Array.<number>|TypedArray|string} data The input unicode data.
   * @return {Array.<number>|string} The conveted data.
   *
   * @public
   * @function
   */
  toHankakuCase: function(data) {
    var asString = false;
    if (isString(data)) {
      asString = true;
      data = stringToBuffer(data);
    }

    var results = [];
    var len = data && data.length;
    var i = 0;
    var c;

    while (i < len) {
      c = data[i++];
      if (c >= 0xFF01 && c <= 0xFF5E) {
        c -= 0xFEE0;
      }
      results[results.length] = c;
    }

    return asString ? codeToString_fast(results) : results;
  },
  /**
   * 半角英数記号文字を全角英数記号文字に変換
   *
   * Convert to the zenkaku symbols and alphanumeric characters
   *  from the ascii symbols and alphanumeric characters.
   *
   * @example
   *   console.log(Encoding.toZenkakuCase('Hello World! 12345'));
   *   // 'Ｈｅｌｌｏ Ｗｏｒｌｄ！ １２３４５'
   *
   * @param {Array.<number>|TypedArray|string} data The input unicode data.
   * @return {Array.<number>|string} The conveted data.
   *
   * @public
   * @function
   */
  toZenkakuCase: function(data) {
    var asString = false;
    if (isString(data)) {
      asString = true;
      data = stringToBuffer(data);
    }

    var results = [];
    var len = data && data.length;
    var i = 0;
    var c;

    while (i < len) {
      c = data[i++];
      if (c >= 0x21 && c <= 0x7E) {
        c += 0xFEE0;
      }
      results[results.length] = c;
    }

    return asString ? codeToString_fast(results) : results;
  },
  /**
   * 全角カタカナを全角ひらがなに変換
   *
   * Convert to the zenkaku hiragana from the zenkaku katakana.
   *
   * @example
   *   console.log(Encoding.toHiraganaCase('ボポヴァアィイゥウェエォオ'));
   *   // 'ぼぽう゛ぁあぃいぅうぇえぉお'
   *
   * @param {Array.<number>|TypedArray|string} data The input unicode data.
   * @return {Array.<number>|string} The conveted data.
   *
   * @public
   * @function
   */
  toHiraganaCase: function(data) {
    var asString = false;
    if (isString(data)) {
      asString = true;
      data = stringToBuffer(data);
    }

    var results = [];
    var len = data && data.length;
    var i = 0;
    var c;

    while (i < len) {
      c = data[i++];
      if (c >= 0x30A1 && c <= 0x30F6) {
        c -= 0x0060;
      // 「ワ゛」 => 「わ」 + 「゛」
      } else if (c === 0x30F7) {
        results[results.length] = 0x308F;
        c = 0x309B;
      // 「ヲ゛」 => 「を」 + 「゛」
      } else if (c === 0x30FA) {
        results[results.length] = 0x3092;
        c = 0x309B;
      }
      results[results.length] = c;
    }

    return asString ? codeToString_fast(results) : results;
  },
  /**
   * 全角ひらがなを全角カタカナに変換
   *
   * Convert to the zenkaku katakana from the zenkaku hiragana.
   *
   * @example
   *   console.log(Encoding.toKatakanaCase('ぼぽう゛ぁあぃいぅうぇえぉお'));
   *   // 'ボポヴァアィイゥウェエォオ'
   *
   * @param {Array.<number>|TypedArray|string} data The input unicode data.
   * @return {Array.<number>|string} The conveted data.
   *
   * @public
   * @function
   */
  toKatakanaCase: function(data) {
    var asString = false;
    if (isString(data)) {
      asString = true;
      data = stringToBuffer(data);
    }

    var results = [];
    var len = data && data.length;
    var i = 0;
    var c;

    while (i < len) {
      c = data[i++];
      if (c >= 0x3041 && c <= 0x3096) {
        if ((c === 0x308F || // 「わ」 + 「゛」 => 「ワ゛」
             c === 0x3092) && // 「を」 + 「゛」 => 「ヲ゛」
            i < len && data[i] === 0x309B) {
          c = c === 0x308F ? 0x30F7 : 0x30FA;
          i++;
        } else {
          c += 0x0060;
        }
      }
      results[results.length] = c;
    }

    return asString ? codeToString_fast(results) : results;
  },
  /**
   * 全角カタカナを半角ｶﾀｶﾅに変換
   *
   * Convert to the hankaku katakana from the zenkaku katakana.
   *
   * @example
   *   console.log(Encoding.toHankanaCase('ボポヴァアィイゥウェエォオ'));
   *   // 'ﾎﾞﾎﾟｳﾞｧｱｨｲｩｳｪｴｫｵ'
   *
   * @param {Array.<number>|TypedArray|string} data The input unicode data.
   * @return {Array.<number>|string} The conveted data.
   *
   * @public
   * @function
   */
  toHankanaCase: function(data) {
    var asString = false;
    if (isString(data)) {
      asString = true;
      data = stringToBuffer(data);
    }

    var results = [];
    var len = data && data.length;
    var i = 0;
    var c, d, t;

    while (i < len) {
      c = data[i++];

      if (c >= 0x3001 && c <= 0x30FC) {
        t = hankanaCase_table[c];
        if (t !== void 0) {
          results[results.length] = t;
          continue;
        }
      }

      // 「ヴ」, 「ワ」+「゛」, 「ヲ」+「゛」
      if (c === 0x30F4 || c === 0x30F7 || c === 0x30FA) {
        results[results.length] = hankanaCase_sonants[c];
        results[results.length] = 0xFF9E;
        // 「カ」 - 「ド」
      } else if (c >= 0x30AB && c <= 0x30C9) {
        results[results.length] = hankanaCase_table[c - 1];
        results[results.length] = 0xFF9E;
        // 「ハ」 - 「ポ」
      } else if (c >= 0x30CF && c <= 0x30DD) {
        d = c % 3;
        results[results.length] = hankanaCase_table[c - d];
        results[results.length] = hankanaCase_marks[d - 1];
      } else {
        results[results.length] = c;
      }
    }

    return asString ? codeToString_fast(results) : results;
  },
  /**
   * 半角ｶﾀｶﾅを全角カタカナに変換 (濁音含む)
   *
   * Convert to the zenkaku katakana from the hankaku katakana.
   *
   * @example
   *   console.log(Encoding.toZenkanaCase('ﾎﾞﾎﾟｳﾞｧｱｨｲｩｳｪｴｫｵ'));
   *   // 'ボポヴァアィイゥウェエォオ'
   *
   * @param {Array.<number>|TypedArray|string} data The input unicode data.
   * @return {Array.<number>|string} The conveted data.
   *
   * @public
   * @function
   */
  toZenkanaCase: function(data) {
    var asString = false;
    if (isString(data)) {
      asString = true;
      data = stringToBuffer(data);
    }

    var results = [];
    var len = data && data.length;
    var i = 0;
    var c, code, next;

    for (i = 0; i < len; i++) {
      c = data[i];
      // Hankaku katakana
      if (c > 0xFF60 && c < 0xFFA0) {
        code = zenkanaCase_table[c - 0xFF61];
        if (i + 1 < len) {
          next = data[i + 1];
          // 「ﾞ」 + 「ヴ」
          if (next === 0xFF9E && c === 0xFF73) {
            code = 0x30F4;
            i++;
          // 「ﾞ」 + 「ワ゛」
          } else if (next === 0xFF9E && c === 0xFF9C) {
            code = 0x30F7;
            i++;
          // 「ﾞ」 + 「ｦ゛」
          } else if (next === 0xFF9E && c === 0xFF66) {
            code = 0x30FA;
            i++;
            // 「ﾞ」 + 「カ」 - 「コ」 or 「ハ」 - 「ホ」
          } else if (next === 0xFF9E &&
                     ((c > 0xFF75 && c < 0xFF85) ||
                      (c > 0xFF89 && c < 0xFF8F))) {
            code++;
            i++;
            // 「ﾟ」 + 「ハ」 - 「ホ」
          } else if (next === 0xFF9F &&
                     (c > 0xFF89 && c < 0xFF8F)) {
            code += 2;
            i++;
          }
        }
        c = code;
      }
      results[results.length] = c;
    }

    return asString ? codeToString_fast(results) : results;
  },
  /**
   * 全角スペースを半角スペースに変換
   *
   * Convert the em space(U+3000) to the single space(U+0020).
   *
   * @param {Array.<number>|TypedArray|string} data The input unicode data.
   * @return {Array.<number>|string} The conveted data.
   *
   * @public
   * @function
   */
  toHankakuSpace: function(data) {
    if (isString(data)) {
      return data.replace(/\u3000/g, ' ');
    }

    var results = [];
    var len = data && data.length;
    var i = 0;
    var c;

    while (i < len) {
      c = data[i++];
      if (c === 0x3000) {
        c = 0x20;
      }
      results[results.length] = c;
    }

    return results;
  },
  /**
   * 半角スペースを全角スペースに変換
   *
   * Convert the single space(U+0020) to the em space(U+3000).
   *
   * @param {Array.<number>|TypedArray|string} data The input unicode data.
   * @return {Array.<number>|string} The conveted data.
   *
   * @public
   * @function
   */
  toZenkakuSpace: function(data) {
    if (isString(data)) {
      return data.replace(/\u0020/g, '\u3000');
    }

    var results = [];
    var len = data && data.length;
    var i = 0;
    var c;

    while (i < len) {
      c = data[i++];
      if (c === 0x20) {
        c = 0x3000;
      }
      results[results.length] = c;
    }

    return results;
  }
};


/**
 * @private
 * @ignore
 */
var EncodingDetect = {
  isBINARY: isBINARY,
  isASCII: isASCII,
  isJIS: isJIS,
  isEUCJP: isEUCJP,
  isSJIS: isSJIS,
  isUTF8: isUTF8,
  isUTF16: isUTF16,
  isUTF16BE: isUTF16BE,
  isUTF16LE: isUTF16LE,
  isUTF32: isUTF32,
  isUNICODE: isUNICODE
};

/**
 * @private
 * @ignore
 */
var EncodingConvert = {
  // JIS, EUCJP, SJIS
  JISToEUCJP: JISToEUCJP,
  EUCJPToJIS: EUCJPToJIS,
  JISToSJIS: JISToSJIS,
  SJISToJIS: SJISToJIS,
  EUCJPToSJIS: EUCJPToSJIS,
  SJISToEUCJP: SJISToEUCJP,

  // UTF8
  JISToUTF8: JISToUTF8,
  UTF8ToJIS: UTF8ToJIS,
  EUCJPToUTF8: EUCJPToUTF8,
  UTF8ToEUCJP: UTF8ToEUCJP,
  SJISToUTF8: SJISToUTF8,
  UTF8ToSJIS: UTF8ToSJIS,

  // UNICODE
  UNICODEToUTF8: UNICODEToUTF8,
  UTF8ToUNICODE: UTF8ToUNICODE,
  UNICODEToJIS: UNICODEToJIS,
  JISToUNICODE: JISToUNICODE,
  UNICODEToEUCJP: UNICODEToEUCJP,
  EUCJPToUNICODE: EUCJPToUNICODE,
  UNICODEToSJIS: UNICODEToSJIS,
  SJISToUNICODE: SJISToUNICODE,

  // UTF16, UNICODE
  UNICODEToUTF16: UNICODEToUTF16,
  UTF16ToUNICODE: UTF16ToUNICODE,
  UNICODEToUTF16BE: UNICODEToUTF16BE,
  UTF16BEToUNICODE: UTF16BEToUNICODE,
  UNICODEToUTF16LE: UNICODEToUTF16LE,
  UTF16LEToUNICODE: UTF16LEToUNICODE,

  // UTF16, UTF16BE, UTF16LE
  UTF8ToUTF16: UTF8ToUTF16,
  UTF16ToUTF8: UTF16ToUTF8,
  UTF8ToUTF16BE: UTF8ToUTF16BE,
  UTF16BEToUTF8: UTF16BEToUTF8,
  UTF8ToUTF16LE: UTF8ToUTF16LE,
  UTF16LEToUTF8: UTF16LEToUTF8,
  UTF16ToUTF16BE: UTF16ToUTF16BE,
  UTF16BEToUTF16: UTF16BEToUTF16,
  UTF16ToUTF16LE: UTF16ToUTF16LE,
  UTF16LEToUTF16: UTF16LEToUTF16,
  UTF16BEToUTF16LE: UTF16BEToUTF16LE,
  UTF16LEToUTF16BE: UTF16LEToUTF16BE,

  // UTF16, JIS
  JISToUTF16: JISToUTF16,
  UTF16ToJIS: UTF16ToJIS,
  JISToUTF16BE: JISToUTF16BE,
  UTF16BEToJIS: UTF16BEToJIS,
  JISToUTF16LE: JISToUTF16LE,
  UTF16LEToJIS: UTF16LEToJIS,

  // UTF16, EUCJP
  EUCJPToUTF16: EUCJPToUTF16,
  UTF16ToEUCJP: UTF16ToEUCJP,
  EUCJPToUTF16BE: EUCJPToUTF16BE,
  UTF16BEToEUCJP: UTF16BEToEUCJP,
  EUCJPToUTF16LE: EUCJPToUTF16LE,
  UTF16LEToEUCJP: UTF16LEToEUCJP,

  // UTF16, SJIS
  SJISToUTF16: SJISToUTF16,
  UTF16ToSJIS: UTF16ToSJIS,
  SJISToUTF16BE: SJISToUTF16BE,
  UTF16BEToSJIS: UTF16BEToSJIS,
  SJISToUTF16LE: SJISToUTF16LE,
  UTF16LEToSJIS: UTF16LEToSJIS
};


/**
 * Binary (exe, images and so, etc.)
 *
 * Note:
 *   This function is not considered for Unicode
 *
 * @private
 * @ignore
 */
function isBINARY(data) {
  var i = 0;
  var len = data && data.length;
  var c;

  for (; i < len; i++) {
    c = data[i];
    if (c > 0xFF) {
      return false;
    }

    if ((c >= 0x00 && c <= 0x07) || c === 0xFF) {
      return true;
    }
  }

  return false;
}

/**
 * ASCII (ISO-646)
 *
 * @private
 * @ignore
 */
function isASCII(data) {
  var i = 0;
  var len = data && data.length;
  var b;

  for (; i < len; i++) {
    b = data[i];
    if (b > 0xFF ||
        (b >= 0x80 && b <= 0xFF) ||
        b === 0x1B) {
      return false;
    }
  }

  return true;
}

/**
 * ISO-2022-JP (JIS)
 *
 * RFC1468 Japanese Character Encoding for Internet Messages
 * RFC1554 ISO-2022-JP-2: Multilingual Extension of ISO-2022-JP
 * RFC2237 Japanese Character Encoding for Internet Messages
 *
 * @private
 * @ignore
 */
function isJIS(data) {
  var i = 0;
  var len = data && data.length;
  var b, esc1, esc2;

  for (; i < len; i++) {
    b = data[i];
    if (b > 0xFF || (b >= 0x80 && b <= 0xFF)) {
      return false;
    }

    if (b === 0x1B) {
      if (i + 2 >= len) {
        return false;
      }

      esc1 = data[i + 1];
      esc2 = data[i + 2];
      if (esc1 === 0x24) {
        if (esc2 === 0x28 ||  // JIS X 0208-1990/2000/2004
            esc2 === 0x40 ||  // JIS X 0208-1978
            esc2 === 0x42) {  // JIS X 0208-1983
          return true;
        }
      } else if (esc1 === 0x26 && // JIS X 0208-1990
                 esc2 === 0x40) {
        return true;
      } else if (esc1 === 0x28) {
        if (esc2 === 0x42 || // ASCII
            esc2 === 0x49 || // JIS X 0201 Halfwidth Katakana
            esc2 === 0x4A) { // JIS X 0201-1976 Roman set
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * EUC-JP
 *
 * @private
 * @ignore
 */
function isEUCJP(data) {
  var i = 0;
  var len = data && data.length;
  var b;

  for (; i < len; i++) {
    b = data[i];
    if (b < 0x80) {
      continue;
    }

    if (b > 0xFF || b < 0x8E) {
      return false;
    }

    if (b === 0x8E) {
      if (i + 1 >= len) {
        return false;
      }

      b = data[++i];
      if (b < 0xA1 || 0xDF < b) {
        return false;
      }
    } else if (b === 0x8F) {
      if (i + 2 >= len) {
        return false;
      }

      b = data[++i];
      if (b < 0xA2 || 0xED < b) {
        return false;
      }

      b = data[++i];
      if (b < 0xA1 || 0xFE < b) {
        return false;
      }
    } else if (0xA1 <= b && b <= 0xFE) {
      if (i + 1 >= len) {
        return false;
      }

      b = data[++i];
      if (b < 0xA1 || 0xFE < b) {
        return false;
      }
    } else {
      return false;
    }
  }

  return true;
}

/**
 * Shift-JIS (SJIS)
 *
 * @private
 * @ignore
 */
function isSJIS(data) {
  var i = 0;
  var len = data && data.length;
  var b;

  while (i < len && data[i] > 0x80) {
    if (data[i++] > 0xFF) {
      return false;
    }
  }

  for (; i < len; i++) {
    b = data[i];
    if (b <= 0x80 ||
        (0xA1 <= b && b <= 0xDF)) {
      continue;
    }

    if (b === 0xA0 || b > 0xEF || i + 1 >= len) {
      return false;
    }

    b = data[++i];
    if (b < 0x40 || b === 0x7F || b > 0xFC) {
      return false;
    }
  }

  return true;
}

/**
 * UTF-8
 *
 * @private
 * @ignore
 */
function isUTF8(data) {
  var i = 0;
  var len = data && data.length;
  var b;

  for (; i < len; i++) {
    b = data[i];
    if (b > 0xFF) {
      return false;
    }

    if (b === 0x09 || b === 0x0A || b === 0x0D ||
        (b >= 0x20 && b <= 0x7E)) {
      continue;
    }

    if (b >= 0xC2 && b <= 0xDF) {
      if (i + 1 >= len || data[i + 1] < 0x80 || data[i + 1] > 0xBF) {
        return false;
      }
      i++;
    } else if (b === 0xE0) {
      if (i + 2 >= len ||
          data[i + 1] < 0xA0 || data[i + 1] > 0xBF ||
          data[i + 2] < 0x80 || data[i + 2] > 0xBF) {
        return false;
      }
      i += 2;
    } else if ((b >= 0xE1 && b <= 0xEC) ||
                b === 0xEE || b === 0xEF) {
      if (i + 2 >= len ||
          data[i + 1] < 0x80 || data[i + 1] > 0xBF ||
          data[i + 2] < 0x80 || data[i + 2] > 0xBF) {
        return false;
      }
      i += 2;
    } else if (b === 0xED) {
      if (i + 2 >= len ||
          data[i + 1] < 0x80 || data[i + 1] > 0x9F ||
          data[i + 2] < 0x80 || data[i + 2] > 0xBF) {
        return false;
      }
      i += 2;
    } else if (b === 0xF0) {
      if (i + 3 >= len ||
          data[i + 1] < 0x90 || data[i + 1] > 0xBF ||
          data[i + 2] < 0x80 || data[i + 2] > 0xBF ||
          data[i + 3] < 0x80 || data[i + 3] > 0xBF) {
        return false;
      }
      i += 3;
    } else if (b >= 0xF1 && b <= 0xF3) {
      if (i + 3 >= len ||
          data[i + 1] < 0x80 || data[i + 1] > 0xBF ||
          data[i + 2] < 0x80 || data[i + 2] > 0xBF ||
          data[i + 3] < 0x80 || data[i + 3] > 0xBF) {
        return false;
      }
      i += 3;
    } else if (b === 0xF4) {
      if (i + 3 >= len ||
          data[i + 1] < 0x80 || data[i + 1] > 0x8F ||
          data[i + 2] < 0x80 || data[i + 2] > 0xBF ||
          data[i + 3] < 0x80 || data[i + 3] > 0xBF) {
        return false;
      }
      i += 3;
    } else {
      return false;
    }
  }

  return true;
}

/**
 * UTF-16 (LE or BE)
 *
 * RFC2781: UTF-16, an encoding of ISO 10646
 *
 * @link http://www.ietf.org/rfc/rfc2781.txt
 * @private
 * @ignore
 */
function isUTF16(data) {
  var i = 0;
  var len = data && data.length;
  var pos = null;
  var b1, b2, next, prev;

  if (len < 2) {
    if (data[0] > 0xFF) {
      return false;
    }
  } else {
    b1 = data[0];
    b2 = data[1];
    if (b1 === 0xFF && // BOM (little-endian)
        b2 === 0xFE) {
      return true;
    }
    if (b1 === 0xFE && // BOM (big-endian)
        b2 === 0xFF) {
      return true;
    }

    for (; i < len; i++) {
      if (data[i] === 0x00) {
        pos = i;
        break;
      } else if (data[i] > 0xFF) {
        return false;
      }
    }

    if (pos === null) {
      return false; // Non ASCII
    }

    next = data[pos + 1]; // BE
    if (next !== void 0 && next > 0x00 && next < 0x80) {
      return true;
    }

    prev = data[pos - 1]; // LE
    if (prev !== void 0 && prev > 0x00 && prev < 0x80) {
      return true;
    }
  }

  return false;
}

/**
 * UTF-16BE (big-endian)
 *
 * RFC 2781 4.3 Interpreting text labelled as UTF-16
 * Text labelled "UTF-16BE" can always be interpreted as being big-endian
 *  when BOM does not founds (SHOULD)
 *
 * @link http://www.ietf.org/rfc/rfc2781.txt
 * @private
 * @ignore
 */
function isUTF16BE(data) {
  var i = 0;
  var len = data && data.length;
  var pos = null;
  var b1, b2;

  if (len < 2) {
    if (data[0] > 0xFF) {
      return false;
    }
  } else {
    b1 = data[0];
    b2 = data[1];
    if (b1 === 0xFE && // BOM
        b2 === 0xFF) {
      return true;
    }

    for (; i < len; i++) {
      if (data[i] === 0x00) {
        pos = i;
        break;
      } else if (data[i] > 0xFF) {
        return false;
      }
    }

    if (pos === null) {
      return false; // Non ASCII
    }

    if (pos % 2 === 0) {
      return true;
    }
  }

  return false;
}

/**
 * UTF-16LE (little-endian)
 *
 * @see isUTF16BE
 * @private
 * @ignore
 */
function isUTF16LE(data) {
  var i = 0;
  var len = data && data.length;
  var pos = null;
  var b1, b2;

  if (len < 2) {
    if (data[0] > 0xFF) {
      return false;
    }
  } else {
    b1 = data[0];
    b2 = data[1];
    if (b1 === 0xFF && // BOM
        b2 === 0xFE) {
      return true;
    }

    for (; i < len; i++) {
      if (data[i] === 0x00) {
        pos = i;
        break;
      } else if (data[i] > 0xFF) {
        return false;
      }
    }

    if (pos === null) {
      return false; // Non ASCII
    }

    if (pos % 2 !== 0) {
      return true;
    }
  }

  return false;
}

/**
 * UTF-32
 *
 * Unicode 3.2.0: Unicode Standard Annex #19
 *
 * @link http://www.iana.org/assignments/charset-reg/UTF-32
 * @link http://www.unicode.org/reports/tr19/tr19-9.html
 * @private
 * @ignore
 */
function isUTF32(data) {
  var i = 0;
  var len = data && data.length;
  var pos = null;
  var b1, b2, b3, b4;
  var next, prev;

  if (len < 4) {
    for (; i < len; i++) {
      if (data[i] > 0xFF) {
        return false;
      }
    }
  } else {
    b1 = data[0];
    b2 = data[1];
    b3 = data[2];
    b4 = data[3];
    if (b1 === 0x00 && b2 === 0x00 && // BOM (big-endian)
        b3 === 0xFE && b4 === 0xFF) {
      return true;
    }

    if (b1 === 0xFF && b2 === 0xFE && // BOM (little-endian)
        b3 === 0x00 && b4 === 0x00) {
      return true;
    }

    for (; i < len; i++) {
      if (data[i] === 0x00 && data[i + 1] === 0x00 && data[i + 2] === 0x00) {
        pos = i;
        break;
      } else if (data[i] > 0xFF) {
        return false;
      }
    }

    if (pos === null) {
      return false;
    }

    // The byte order should be the big-endian when BOM is not detected.
    next = data[pos + 3];
    if (next !== void 0 && next > 0x00 && next <= 0x7F) {
      // big-endian
      return data[pos + 2] === 0x00 && data[pos + 1] === 0x00;
    }

    prev = data[pos - 1];
    if (prev !== void 0 && prev > 0x00 && prev <= 0x7F) {
      // little-endian
      return data[pos + 1] === 0x00 && data[pos + 2] === 0x00;
    }
  }

  return false;
}

/**
 * JavaScript Unicode array
 *
 * @private
 * @ignore
 */
function isUNICODE(data) {
  var i = 0;
  var len = data && data.length;
  var c;

  for (; i < len; i++) {
    c = data[i];
    if (c < 0 || c > 0x10FFFF) {
      return false;
    }
  }

  return true;
}


/**
 * JIS to SJIS
 *
 * @private
 * @ignore
 */
function JISToSJIS(data) {
  var results = [];
  var index = 0;
  var i = 0;
  var len = data && data.length;
  var b1, b2;

  for (; i < len; i++) {
    // escape sequence
    while (data[i] === 0x1B) {
      if ((data[i + 1] === 0x24 && data[i + 2] === 0x42) ||
          (data[i + 1] === 0x24 && data[i + 2] === 0x40)) {
        index = 1;
      } else if ((data[i + 1] === 0x28 && data[i + 2] === 0x49)) {
        index = 2;
      } else if (data[i + 1] === 0x24 && data[i + 2] === 0x28 &&
                 data[i + 3] === 0x44) {
        index = 3;
        i++;
      } else {
        index = 0;
      }

      i += 3;
      if (data[i] === void 0) {
        return results;
      }
    }

    if (index === 1) {
      b1 = data[i];
      b2 = data[++i];
      if (b1 & 0x01) {
        b1 >>= 1;
        if (b1 < 0x2F) {
          b1 += 0x71;
        } else {
          b1 -= 0x4F;
        }
        if (b2 > 0x5F) {
          b2 += 0x20;
        } else {
          b2 += 0x1F;
        }
      } else {
        b1 >>= 1;
        if (b1 <= 0x2F) {
          b1 += 0x70;
        } else {
          b1 -= 0x50;
        }
        b2 += 0x7E;
      }
      results[results.length] = b1 & 0xFF;
      results[results.length] = b2 & 0xFF;
    } else if (index === 2) {
      results[results.length] = data[i] + 0x80 & 0xFF;
    } else if (index === 3) {
      // Shift_JIS cannot convert JIS X 0212:1990.
      results[results.length] = UTF8_UNKNOWN;
    } else {
      results[results.length] = data[i] & 0xFF;
    }
  }

  return results;
}

/**
 * JIS to EUCJP
 *
 * @private
 * @ignore
 */
function JISToEUCJP(data) {
  var results = [];
  var index = 0;
  var len = data && data.length;
  var i = 0;

  for (; i < len; i++) {

    // escape sequence
    while (data[i] === 0x1B) {
      if ((data[i + 1] === 0x24 && data[i + 2] === 0x42) ||
          (data[i + 1] === 0x24 && data[i + 2] === 0x40)) {
        index = 1;
      } else if ((data[i + 1] === 0x28 && data[i + 2] === 0x49)) {
        index = 2;
      } else if (data[i + 1] === 0x24 && data[i + 2] === 0x28 &&
                 data[i + 3] === 0x44) {
        index = 3;
        i++;
      } else {
        index = 0;
      }

      i += 3;
      if (data[i] === void 0) {
        return results;
      }
    }

    if (index === 1) {
      results[results.length] = data[i] + 0x80 & 0xFF;
      results[results.length] = data[++i] + 0x80 & 0xFF;
    } else if (index === 2) {
      results[results.length] = 0x8E;
      results[results.length] = data[i] + 0x80 & 0xFF;
    } else if (index === 3) {
      results[results.length] = 0x8F;
      results[results.length] = data[i] + 0x80 & 0xFF;
      results[results.length] = data[++i] + 0x80 & 0xFF;
    } else {
      results[results.length] = data[i] & 0xFF;
    }
  }

  return results;
}

/**
 * SJIS to JIS
 *
 * @private
 * @ignore
 */
function SJISToJIS(data) {
  var results = [];
  var index = 0;
  var len = data && data.length;
  var i = 0;
  var b1, b2;

  var esc = [
    0x1B, 0x28, 0x42,
    0x1B, 0x24, 0x42,
    0x1B, 0x28, 0x49
  ];

  for (; i < len; i++) {
    b1 = data[i];
    if (b1 >= 0xA1 && b1 <= 0xDF) {
      if (index !== 2) {
        index = 2;
        results[results.length] = esc[6];
        results[results.length] = esc[7];
        results[results.length] = esc[8];
      }
      results[results.length] = b1 - 0x80 & 0xFF;
    } else if (b1 >= 0x80) {
      if (index !== 1) {
        index = 1;
        results[results.length] = esc[3];
        results[results.length] = esc[4];
        results[results.length] = esc[5];
      }

      b1 <<= 1;
      b2 = data[++i];
      if (b2 < 0x9F) {
        if (b1 < 0x13F) {
          b1 -= 0xE1;
        } else {
          b1 -= 0x61;
        }
        if (b2 > 0x7E) {
          b2 -= 0x20;
        } else {
          b2 -= 0x1F;
        }
      } else {
        if (b1 < 0x13F) {
          b1 -= 0xE0;
        } else {
          b1 -= 0x60;
        }
        b2 -= 0x7E;
      }
      results[results.length] = b1 & 0xFF;
      results[results.length] = b2 & 0xFF;
    } else {
      if (index !== 0) {
        index = 0;
        results[results.length] = esc[0];
        results[results.length] = esc[1];
        results[results.length] = esc[2];
      }
      results[results.length] = b1 & 0xFF;
    }
  }

  if (index !== 0) {
    results[results.length] = esc[0];
    results[results.length] = esc[1];
    results[results.length] = esc[2];
  }

  return results;
}

/**
 * SJIS to EUCJP
 *
 * @private
 * @ignore
 */
function SJISToEUCJP(data) {
  var results = [];
  var len = data && data.length;
  var i = 0;
  var b1, b2;

  for (; i < len; i++) {
    b1 = data[i];
    if (b1 >= 0xA1 && b1 <= 0xDF) {
      results[results.length] = 0x8E;
      results[results.length] = b1;
    } else if (b1 >= 0x81) {
      b2 = data[++i];
      b1 <<= 1;
      if (b2 < 0x9F) {
        if (b1 < 0x13F) {
          b1 -= 0x61;
        } else {
          b1 -= 0xE1;
        }

        if (b2 > 0x7E) {
          b2 += 0x60;
        } else {
          b2 += 0x61;
        }
      } else {
        if (b1 < 0x13F) {
          b1 -= 0x60;
        } else {
          b1 -= 0xE0;
        }
        b2 += 0x02;
      }
      results[results.length] = b1 & 0xFF;
      results[results.length] = b2 & 0xFF;
    } else {
      results[results.length] = b1 & 0xFF;
    }
  }

  return results;
}

/**
 * EUCJP to JIS
 *
 * @private
 * @ignore
 */
function EUCJPToJIS(data) {
  var results = [];
  var index = 0;
  var len = data && data.length;
  var i = 0;
  var b;

  // escape sequence
  var esc = [
    0x1B, 0x28, 0x42,
    0x1B, 0x24, 0x42,
    0x1B, 0x28, 0x49,
    0x1B, 0x24, 0x28, 0x44
  ];

  for (; i < len; i++) {
    b = data[i];
    if (b === 0x8E) {
      if (index !== 2) {
        index = 2;
        results[results.length] = esc[6];
        results[results.length] = esc[7];
        results[results.length] = esc[8];
      }
      results[results.length] = data[++i] - 0x80 & 0xFF;
    } else if (b === 0x8F) {
      if (index !== 3) {
        index = 3;
        results[results.length] = esc[9];
        results[results.length] = esc[10];
        results[results.length] = esc[11];
        results[results.length] = esc[12];
      }
      results[results.length] = data[++i] - 0x80 & 0xFF;
      results[results.length] = data[++i] - 0x80 & 0xFF;
    } else if (b > 0x8E) {
      if (index !== 1) {
        index = 1;
        results[results.length] = esc[3];
        results[results.length] = esc[4];
        results[results.length] = esc[5];
      }
      results[results.length] = b - 0x80 & 0xFF;
      results[results.length] = data[++i] - 0x80 & 0xFF;
    } else {
      if (index !== 0) {
        index = 0;
        results[results.length] = esc[0];
        results[results.length] = esc[1];
        results[results.length] = esc[2];
      }
      results[results.length] = b & 0xFF;
    }
  }

  if (index !== 0) {
    results[results.length] = esc[0];
    results[results.length] = esc[1];
    results[results.length] = esc[2];
  }

  return results;
}

/**
 * EUCJP to SJIS
 *
 * @private
 * @ignore
 */
function EUCJPToSJIS(data) {
  var results = [];
  var len = data && data.length;
  var i = 0;
  var b1, b2;

  for (; i < len; i++) {
    b1 = data[i];
    if (b1 === 0x8F) {
      results[results.length] = UTF8_UNKNOWN;
      i += 2;
    } else if (b1 > 0x8E) {
      b2 = data[++i];
      if (b1 & 0x01) {
        b1 >>= 1;
        if (b1 < 0x6F) {
          b1 += 0x31;
        } else {
          b1 += 0x71;
        }

        if (b2 > 0xDF) {
          b2 -= 0x60;
        } else {
          b2 -= 0x61;
        }
      } else {
        b1 >>= 1;
        if (b1 <= 0x6F) {
          b1 += 0x30;
        } else {
          b1 += 0x70;
        }
        b2 -= 0x02;
      }
      results[results.length] = b1 & 0xFF;
      results[results.length] = b2 & 0xFF;
    } else if (b1 === 0x8E) {
      results[results.length] = data[++i] & 0xFF;
    } else {
      results[results.length] = b1 & 0xFF;
    }
  }

  return results;
}

/**
 * SJIS To UTF-8
 *
 * @private
 * @ignore
 */
function SJISToUTF8(data) {
  init_JIS_TO_UTF8_TABLE();

  var results = [];
  var i = 0;
  var len = data && data.length;
  var b, b1, b2, u2, u3, jis, utf8;

  for (; i < len; i++) {
    b = data[i];
    if (b >= 0xA1 && b <= 0xDF) {
      b2 = b - 0x40;
      u2 = 0xBC | ((b2 >> 6) & 0x03);
      u3 = 0x80 | (b2 & 0x3F);

      results[results.length] = 0xEF;
      results[results.length] = u2 & 0xFF;
      results[results.length] = u3 & 0xFF;
    } else if (b >= 0x80) {
      b1 = b << 1;
      b2 = data[++i];

      if (b2 < 0x9F) {
        if (b1 < 0x13F) {
          b1 -= 0xE1;
        } else {
          b1 -= 0x61;
        }

        if (b2 > 0x7E) {
          b2 -= 0x20;
        } else {
          b2 -= 0x1F;
        }
      } else {
        if (b1 < 0x13F) {
          b1 -= 0xE0;
        } else {
          b1 -= 0x60;
        }
        b2 -= 0x7E;
      }

      b1 &= 0xFF;
      jis = (b1 << 8) + b2;

      utf8 = JIS_TO_UTF8_TABLE[jis];
      if (utf8 === void 0) {
        results[results.length] = UTF8_UNKNOWN;
      } else {
        if (utf8 < 0xFFFF) {
          results[results.length] = utf8 >> 8 & 0xFF;
          results[results.length] = utf8 & 0xFF;
        } else {
          results[results.length] = utf8 >> 16 & 0xFF;
          results[results.length] = utf8 >> 8 & 0xFF;
          results[results.length] = utf8 & 0xFF;
        }
      }
    } else {
      results[results.length] = data[i] & 0xFF;
    }
  }

  return results;
}

/**
 * EUC-JP to UTF-8
 *
 * @private
 * @ignore
 */
function EUCJPToUTF8(data) {
  init_JIS_TO_UTF8_TABLE();

  var results = [];
  var i = 0;
  var len = data && data.length;
  var b, b2, u2, u3, j2, j3, jis, utf8;

  for (; i < len; i++) {
    b = data[i];
    if (b === 0x8E) {
      b2 = data[++i] - 0x40;
      u2 = 0xBC | ((b2 >> 6) & 0x03);
      u3 = 0x80 | (b2 & 0x3F);

      results[results.length] = 0xEF;
      results[results.length] = u2 & 0xFF;
      results[results.length] = u3 & 0xFF;
    } else if (b === 0x8F) {
      j2 = data[++i] - 0x80;
      j3 = data[++i] - 0x80;
      jis = (j2 << 8) + j3;

      utf8 = JISX0212_TO_UTF8_TABLE[jis];
      if (utf8 === void 0) {
        results[results.length] = UTF8_UNKNOWN;
      } else {
        if (utf8 < 0xFFFF) {
          results[results.length] = utf8 >> 8 & 0xFF;
          results[results.length] = utf8 & 0xFF;
        } else {
          results[results.length] = utf8 >> 16 & 0xFF;
          results[results.length] = utf8 >>  8 & 0xFF;
          results[results.length] = utf8 & 0xFF;
        }
      }
    } else if (b >= 0x80) {
      jis = ((b - 0x80) << 8) + (data[++i] - 0x80);

      utf8 = JIS_TO_UTF8_TABLE[jis];
      if (utf8 === void 0) {
        results[results.length] = UTF8_UNKNOWN;
      } else {
        if (utf8 < 0xFFFF) {
          results[results.length] = utf8 >> 8 & 0xFF;
          results[results.length] = utf8 & 0xFF;
        } else {
          results[results.length] = utf8 >> 16 & 0xFF;
          results[results.length] = utf8 >>  8 & 0xFF;
          results[results.length] = utf8 & 0xFF;
        }
      }
    } else {
      results[results.length] = data[i] & 0xFF;
    }
  }

  return results;
}

/**
 * JIS to UTF-8
 *
 * @private
 * @ignore
 */
function JISToUTF8(data) {
  init_JIS_TO_UTF8_TABLE();

  var results = [];
  var index = 0;
  var i = 0;
  var len = data && data.length;
  var b2, u2, u3, jis, utf8;

  for (; i < len; i++) {
    while (data[i] === 0x1B) {
      if ((data[i + 1] === 0x24 && data[i + 2] === 0x42) ||
          (data[i + 1] === 0x24 && data[i + 2] === 0x40)) {
        index = 1;
      } else if (data[i + 1] === 0x28 && data[i + 2] === 0x49) {
        index = 2;
      } else if (data[i + 1] === 0x24 && data[i + 2] === 0x28 &&
                 data[i + 3] === 0x44) {
        index = 3;
        i++;
      } else {
        index = 0;
      }

      i += 3;
      if (data[i] === void 0) {
        return results;
      }
    }

    if (index === 1) {
      jis = (data[i] << 8) + data[++i];

      utf8 = JIS_TO_UTF8_TABLE[jis];
      if (utf8 === void 0) {
        results[results.length] = UTF8_UNKNOWN;
      } else {
        if (utf8 < 0xFFFF) {
          results[results.length] = utf8 >> 8 & 0xFF;
          results[results.length] = utf8 & 0xFF;
        } else {
          results[results.length] = utf8 >> 16 & 0xFF;
          results[results.length] = utf8 >>  8 & 0xFF;
          results[results.length] = utf8 & 0xFF;
        }
      }
    } else if (index === 2) {
      b2 = data[i] + 0x40;
      u2 = 0xBC | ((b2 >> 6) & 0x03);
      u3 = 0x80 | (b2 & 0x3F);

      results[results.length] = 0xEF;
      results[results.length] = u2 & 0xFF;
      results[results.length] = u3 & 0xFF;
    } else if (index === 3) {
      jis = (data[i] << 8) + data[++i];

      utf8 = JISX0212_TO_UTF8_TABLE[jis];
      if (utf8 === void 0) {
        results[results.length] = UTF8_UNKNOWN;
      } else {
        if (utf8 < 0xFFFF) {
          results[results.length] = utf8 >> 8 & 0xFF;
          results[results.length] = utf8 & 0xFF;
        } else {
          results[results.length] = utf8 >> 16 & 0xFF;
          results[results.length] = utf8 >>  8 & 0xFF;
          results[results.length] = utf8 & 0xFF;
        }
      }
    } else {
      results[results.length] = data[i] & 0xFF;
    }
  }

  return results;
}

/**
 * UTF-8 to SJIS
 *
 * @private
 * @ignore
 */
function UTF8ToSJIS(data) {
  var results = [];
  var i = 0;
  var len = data && data.length;
  var b, b1, b2, utf8, jis;

  for (; i < len; i++) {
    b = data[i];
    if (b >= 0x80) {
      if (b <= 0xDF) {
        // 2 bytes.
        utf8 = (b << 8) + data[++i];
      } else {
        // 3 bytes.
        utf8 = (b << 16) +
               (data[++i] << 8) +
               (data[++i] & 0xFF);
      }

      jis = UTF8_TO_JIS_TABLE[utf8];
      if (jis === void 0) {
        results[results.length] = UTF8_UNKNOWN;
      } else {
        if (jis < 0xFF) {
          results[results.length] = jis + 0x80;
        } else {
          if (jis > 0x10000) {
            jis -= 0x10000;
          }

          b1 = jis >> 8;
          b2 = jis & 0xFF;
          if (b1 & 0x01) {
            b1 >>= 1;
            if (b1 < 0x2F) {
              b1 += 0x71;
            } else {
              b1 -= 0x4F;
            }

            if (b2 > 0x5F) {
              b2 += 0x20;
            } else {
              b2 += 0x1F;
            }
          } else {
            b1 >>= 1;
            if (b1 <= 0x2F) {
              b1 += 0x70;
            } else {
              b1 -= 0x50;
            }
            b2 += 0x7E;
          }
          results[results.length] = b1 & 0xFF;
          results[results.length] = b2 & 0xFF;
        }
      }
    } else {
      results[results.length] = data[i] & 0xFF;
    }
  }

  return results;
}

/**
 * UTF-8 to EUC-JP
 *
 * @private
 * @ignore
 */
function UTF8ToEUCJP(data) {
  var results = [];
  var i = 0;
  var len = data && data.length;
  var b, utf8, jis;

  for (; i < len; i++) {
    b = data[i];
    if (b >= 0x80) {
      if (b <= 0xDF) {
        utf8 = (data[i++] << 8) + data[i];
      } else {
        utf8 = (data[i++] << 16) +
               (data[i++] << 8) +
               (data[i] & 0xFF);
      }

      jis = UTF8_TO_JIS_TABLE[utf8];
      if (jis === void 0) {
        jis = UTF8_TO_JISX0212_TABLE[utf8];
        if (jis === void 0) {
          results[results.length] = UTF8_UNKNOWN;
        } else {
          results[results.length] = 0x8F;
          results[results.length] = (jis >> 8) - 0x80 & 0xFF;
          results[results.length] = (jis & 0xFF) - 0x80 & 0xFF;
        }
      } else {
        if (jis > 0x10000) {
          jis -= 0x10000;
        }
        if (jis < 0xFF) {
          results[results.length] = 0x8E;
          results[results.length] = jis - 0x80 & 0xFF;
        } else {
          results[results.length] = (jis >> 8) - 0x80 & 0xFF;
          results[results.length] = (jis & 0xFF) - 0x80 & 0xFF;
        }
      }
    } else {
      results[results.length] = data[i] & 0xFF;
    }
  }

  return results;
}

/**
 * UTF-8 to JIS
 *
 * @private
 * @ignore
 */
function UTF8ToJIS(data) {
  var results = [];
  var index = 0;
  var len = data && data.length;
  var i = 0;
  var b, utf8, jis;
  var esc = [
    0x1B, 0x28, 0x42,
    0x1B, 0x24, 0x42,
    0x1B, 0x28, 0x49,
    0x1B, 0x24, 0x28, 0x44
  ];

  for (; i < len; i++) {
    b = data[i];
    if (b < 0x80) {
      if (index !== 0) {
        index = 0;
        results[results.length] = esc[0];
        results[results.length] = esc[1];
        results[results.length] = esc[2];
      }
      results[results.length] = b & 0xFF;
    } else {
      if (b <= 0xDF) {
        utf8 = (data[i] << 8) + data[++i];
      } else {
        utf8 = (data[i] << 16) + (data[++i] << 8) + data[++i];
      }

      jis = UTF8_TO_JIS_TABLE[utf8];
      if (jis === void 0) {
        jis = UTF8_TO_JISX0212_TABLE[utf8];
        if (jis === void 0) {
          if (index !== 0) {
            index = 0;
            results[results.length] = esc[0];
            results[results.length] = esc[1];
            results[results.length] = esc[2];
          }
          results[results.length] = UTF8_UNKNOWN;
        } else {
          // JIS X 0212:1990
          if (index !== 3) {
            index = 3;
            results[results.length] = esc[9];
            results[results.length] = esc[10];
            results[results.length] = esc[11];
            results[results.length] = esc[12];
          }
          results[results.length] = jis >> 8 & 0xFF;
          results[results.length] = jis & 0xFF;
        }
      } else {
        if (jis > 0x10000) {
          jis -= 0x10000;
        }
        if (jis < 0xFF) {
          // Halfwidth Katakana
          if (index !== 2) {
            index = 2;
            results[results.length] = esc[6];
            results[results.length] = esc[7];
            results[results.length] = esc[8];
          }
          results[results.length] = jis & 0xFF;
        } else {
          if (index !== 1) {
            index = 1;
            results[results.length] = esc[3];
            results[results.length] = esc[4];
            results[results.length] = esc[5];
          }
          results[results.length] = jis >> 8 & 0xFF;
          results[results.length] = jis & 0xFF;
        }
      }
    }
  }

  if (index !== 0) {
    results[results.length] = esc[0];
    results[results.length] = esc[1];
    results[results.length] = esc[2];
  }

  return results;
}

/**
 * UTF-16 (JavaScript Unicode array) to UTF-8
 *
 * @private
 * @ignore
 */
function UNICODEToUTF8(data) {
  var results = [];
  var i = 0;
  var len = data && data.length;
  var c, second;

  for (; i < len; i++) {
    c = data[i];

    // high surrogate
    if (c >= 0xD800 && c <= 0xDBFF && i + 1 < len) {
      second = data[i + 1];
      // low surrogate
      if (second >= 0xDC00 && second <= 0xDFFF) {
        c = (c - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
        i++;
      }
    }

    if (c < 0x80) {
      results[results.length] = c;
    } else if (c < 0x800) {
      results[results.length] = 0xC0 | ((c >> 6) & 0x1F);
      results[results.length] = 0x80 | (c & 0x3F);
    } else if (c < 0x10000) {
      results[results.length] = 0xE0 | ((c >> 12) & 0xF);
      results[results.length] = 0x80 | ((c >> 6) & 0x3F);
      results[results.length] = 0x80 | (c & 0x3F);
    } else if (c < 0x200000) {
      results[results.length] = 0xF0 | ((c >> 18) & 0xF);
      results[results.length] = 0x80 | ((c >> 12) & 0x3F);
      results[results.length] = 0x80 | ((c >> 6) & 0x3F);
      results[results.length] = 0x80 | (c & 0x3F);
    }
  }

  return results;
}

/**
 * UTF-8 to UTF-16 (JavaScript Unicode array)
 *
 * @private
 * @ignore
 */
function UTF8ToUNICODE(data) {
  var results = [];
  var i = 0;
  var len = data && data.length;
  var n, c, c2, c3, c4, code;

  while (i < len) {
    c = data[i++];
    n = c >> 4;
    if (n >= 0 && n <= 7) {
      // 0xxx xxxx
      code = c;
    } else if (n === 12 || n === 13) {
      // 110x xxxx
      // 10xx xxxx
      c2 = data[i++];
      code = ((c & 0x1F) << 6) | (c2 & 0x3F);
    } else if (n === 14) {
      // 1110 xxxx
      // 10xx xxxx
      // 10xx xxxx
      c2 = data[i++];
      c3 = data[i++];
      code = ((c & 0x0F) << 12) |
             ((c2 & 0x3F) << 6) |
              (c3 & 0x3F);
    } else if (n === 15) {
      // 1111 0xxx
      // 10xx xxxx
      // 10xx xxxx
      // 10xx xxxx
      c2 = data[i++];
      c3 = data[i++];
      c4 = data[i++];
      code = ((c & 0x7) << 18)   |
             ((c2 & 0x3F) << 12) |
             ((c3 & 0x3F) << 6)  |
              (c4 & 0x3F);
    }

    if (code <= 0xFFFF) {
      results[results.length] = code;
    } else {
      // Split in surrogate halves
      code -= 0x10000;
      results[results.length] = (code >> 10) + 0xD800; // High surrogate
      results[results.length] = (code % 0x400) + 0xDC00; // Low surrogate
    }
  }

  return results;
}

/**
 * UTF-16 (JavaScript Unicode array) to UTF-16
 *
 * UTF-16BE (big-endian)
 * Note: this function does not prepend the BOM by default.
 *
 * RFC 2781 4.3 Interpreting text labelled as UTF-16
 *   If the first two octets of the text is not 0xFE followed by
 *   0xFF, and is not 0xFF followed by 0xFE, then the text SHOULD be
 *   interpreted as being big-endian.
 *
 * @link https://www.ietf.org/rfc/rfc2781.txt
 * UTF-16, an encoding of ISO 10646
 *
 * @private
 * @ignore
 */
function UNICODEToUTF16(data, options) {
  var results;

  if (options && options.bom) {
    var optBom = options.bom;
    if (!isString(optBom)) {
      optBom = 'BE';
    }

    var bom, utf16;
    if (optBom.charAt(0).toUpperCase() === 'B') {
      // Big-endian
      bom = [0xFE, 0xFF];
      utf16 = UNICODEToUTF16BE(data);
    } else {
      // Little-endian
      bom = [0xFF, 0xFE];
      utf16 = UNICODEToUTF16LE(data);
    }

    results = [];
    results[0] = bom[0];
    results[1] = bom[1];

    for (var i = 0, len = utf16.length; i < len; i++) {
      results[results.length] = utf16[i];
    }
  } else {
    // Without BOM: Convert as BE (SHOULD).
    results = UNICODEToUTF16BE(data);
  }

  return results;
}

/**
 * UTF-16 (JavaScript Unicode array) to UTF-16BE
 *
 * @link https://www.ietf.org/rfc/rfc2781.txt
 * UTF-16, an encoding of ISO 10646
 *
 * @private
 * @ignore
 */
function UNICODEToUTF16BE(data) {
  var results = [];
  var i = 0;
  var len = data && data.length;
  var c;

  while (i < len) {
    c = data[i++];
    if (c <= 0xFF) {
      results[results.length] = 0;
      results[results.length] = c;
    } else if (c <= 0xFFFF) {
      results[results.length] = c >> 8 & 0xFF;
      results[results.length] = c & 0xFF;
    }
  }

  return results;
}

/**
 * UTF-16 (JavaScript Unicode array) to UTF-16LE
 *
 * @link https://www.ietf.org/rfc/rfc2781.txt
 * UTF-16, an encoding of ISO 10646
 *
 * @private
 * @ignore
 */
function UNICODEToUTF16LE(data) {
  var results = [];
  var i = 0;
  var len = data && data.length;
  var c;

  while (i < len) {
    c = data[i++];
    if (c <= 0xFF) {
      results[results.length] = c;
      results[results.length] = 0;
    } else if (c <= 0xFFFF) {
      results[results.length] = c & 0xFF;
      results[results.length] = c >> 8 & 0xFF;
    }
  }

  return results;
}

/**
 * UTF-16BE to UTF-16 (JavaScript Unicode array)
 *
 * @link https://www.ietf.org/rfc/rfc2781.txt
 * UTF-16, an encoding of ISO 10646
 *
 * @private
 * @ignore
 */
function UTF16BEToUNICODE(data) {
  var results = [];
  var i = 0;
  var len = data && data.length;
  var c1, c2;

  if (len >= 2 &&
      ((data[0] === 0xFE && data[1] === 0xFF) ||
       (data[0] === 0xFF && data[1] === 0xFE))
  ) {
    i = 2;
  }

  while (i < len) {
    c1 = data[i++];
    c2 = data[i++];
    if (c1 === 0) {
      results[results.length] = c2;
    } else {
      results[results.length] = ((c1 & 0xFF) << 8) | (c2 & 0xFF);
    }
  }

  return results;
}

/**
 * UTF-16LE to UTF-16 (JavaScript Unicode array)
 *
 * @link https://www.ietf.org/rfc/rfc2781.txt
 * UTF-16, an encoding of ISO 10646
 *
 * @private
 * @ignore
 */
function UTF16LEToUNICODE(data) {
  var results = [];
  var i = 0;
  var len = data && data.length;
  var c1, c2;

  if (len >= 2 &&
      ((data[0] === 0xFE && data[1] === 0xFF) ||
       (data[0] === 0xFF && data[1] === 0xFE))
  ) {
    i = 2;
  }

  while (i < len) {
    c1 = data[i++];
    c2 = data[i++];
    if (c2 === 0) {
      results[results.length] = c1;
    } else {
      results[results.length] = ((c2 & 0xFF) << 8) | (c1 & 0xFF);
    }
  }

  return results;
}

/**
 * UTF-16 to UTF-16 (JavaScript Unicode array)
 *
 * @link https://www.ietf.org/rfc/rfc2781.txt
 * UTF-16, an encoding of ISO 10646
 *
 * @private
 * @ignore
 */
function UTF16ToUNICODE(data) {
  var results = [];
  var i = 0;
  var len = data && data.length;
  var isLE = false;
  var first = true;
  var c1, c2;

  while (i < len) {
    c1 = data[i++];
    c2 = data[i++];

    if (first && i === 2) {
      first = false;
      if (c1 === 0xFE && c2 === 0xFF) {
        isLE = false;
      } else if (c1 === 0xFF && c2 === 0xFE) {
        // Little-endian
        isLE = true;
      } else {
        isLE = isUTF16LE(data);
        i = 0;
      }
      continue;
    }

    if (isLE) {
      if (c2 === 0) {
        results[results.length] = c1;
      } else {
        results[results.length] = ((c2 & 0xFF) << 8) | (c1 & 0xFF);
      }
    } else {
      if (c1 === 0) {
        results[results.length] = c2;
      } else {
        results[results.length] = ((c1 & 0xFF) << 8) | (c2 & 0xFF);
      }
    }
  }

  return results;
}

/**
 * UTF-16 to UTF-16BE
 *
 * @private
 * @ignore
 */
function UTF16ToUTF16BE(data) {
  var results = [];
  var i = 0;
  var len = data && data.length;
  var isLE = false;
  var first = true;
  var c1, c2;

  while (i < len) {
    c1 = data[i++];
    c2 = data[i++];

    if (first && i === 2) {
      first = false;
      if (c1 === 0xFE && c2 === 0xFF) {
        isLE = false;
      } else if (c1 === 0xFF && c2 === 0xFE) {
        // Little-endian
        isLE = true;
      } else {
        isLE = isUTF16LE(data);
        i = 0;
      }
      continue;
    }

    if (isLE) {
      results[results.length] = c2;
      results[results.length] = c1;
    } else {
      results[results.length] = c1;
      results[results.length] = c2;
    }
  }

  return results;
}

/**
 * UTF-16BE to UTF-16
 *
 * @private
 * @ignore
 */
function UTF16BEToUTF16(data, options) {
  var isLE = false;
  var bom;

  if (options && options.bom) {
    var optBom = options.bom;
    if (!isString(optBom)) {
      optBom = 'BE';
    }

    if (optBom.charAt(0).toUpperCase() === 'B') {
      // Big-endian
      bom = [0xFE, 0xFF];
    } else {
      // Little-endian
      bom = [0xFF, 0xFE];
      isLE = true;
    }
  }

  var results = [];
  var len = data && data.length;
  var i = 0;

  if (len >= 2 &&
      ((data[0] === 0xFE && data[1] === 0xFF) ||
       (data[0] === 0xFF && data[1] === 0xFE))
  ) {
    i = 2;
  }

  if (bom) {
    results[0] = bom[0];
    results[1] = bom[1];
  }

  var c1, c2;
  while (i < len) {
    c1 = data[i++];
    c2 = data[i++];

    if (isLE) {
      results[results.length] = c2;
      results[results.length] = c1;
    } else {
      results[results.length] = c1;
      results[results.length] = c2;
    }
  }

  return results;
}

/**
 * UTF-16 to UTF-16LE
 *
 * @private
 * @ignore
 */
function UTF16ToUTF16LE(data) {
  var results = [];
  var i = 0;
  var len = data && data.length;
  var isLE = false;
  var first = true;
  var c1, c2;

  while (i < len) {
    c1 = data[i++];
    c2 = data[i++];

    if (first && i === 2) {
      first = false;
      if (c1 === 0xFE && c2 === 0xFF) {
        isLE = false;
      } else if (c1 === 0xFF && c2 === 0xFE) {
        // Little-endian
        isLE = true;
      } else {
        isLE = isUTF16LE(data);
        i = 0;
      }
      continue;
    }

    if (isLE) {
      results[results.length] = c1;
      results[results.length] = c2;
    } else {
      results[results.length] = c2;
      results[results.length] = c1;
    }
  }

  return results;
}

/**
 * UTF-16LE to UTF-16
 *
 * @private
 * @ignore
 */
function UTF16LEToUTF16(data, options) {
  var isLE = false;
  var bom;

  if (options && options.bom) {
    var optBom = options.bom;
    if (!isString(optBom)) {
      optBom = 'BE';
    }

    if (optBom.charAt(0).toUpperCase() === 'B') {
      // Big-endian
      bom = [0xFE, 0xFF];
    } else {
      // Little-endian
      bom = [0xFF, 0xFE];
      isLE = true;
    }
  }

  var results = [];
  var len = data && data.length;
  var i = 0;

  if (len >= 2 &&
      ((data[0] === 0xFE && data[1] === 0xFF) ||
       (data[0] === 0xFF && data[1] === 0xFE))
  ) {
    i = 2;
  }

  if (bom) {
    results[0] = bom[0];
    results[1] = bom[1];
  }

  var c1, c2;
  while (i < len) {
    c1 = data[i++];
    c2 = data[i++];

    if (isLE) {
      results[results.length] = c1;
      results[results.length] = c2;
    } else {
      results[results.length] = c2;
      results[results.length] = c1;
    }
  }

  return results;
}

/**
 * UTF-16BE to UTF-16LE
 *
 * @private
 * @ignore
 */
function UTF16BEToUTF16LE(data) {
  var results = [];
  var i = 0;
  var len = data && data.length;
  var c1, c2;

  if (len >= 2 &&
      ((data[0] === 0xFE && data[1] === 0xFF) ||
       (data[0] === 0xFF && data[1] === 0xFE))
  ) {
    i = 2;
  }

  while (i < len) {
    c1 = data[i++];
    c2 = data[i++];
    results[results.length] = c2;
    results[results.length] = c1;
  }

  return results;
}

/**
 * UTF-16LE to UTF-16BE
 *
 * @private
 * @ignore
 */
function UTF16LEToUTF16BE(data) {
  return UTF16BEToUTF16LE(data);
}


/**
 * UTF-16 (JavaScript Unicode array) to JIS
 *
 * @private
 * @ignore
 */
function UNICODEToJIS(data) {
  return UTF8ToJIS(UNICODEToUTF8(data));
}

/**
 * JIS to UTF-16 (JavaScript Unicode array)
 *
 * @private
 * @ignore
 */
function JISToUNICODE(data) {
  return UTF8ToUNICODE(JISToUTF8(data));
}

/**
 * UTF-16 (JavaScript Unicode array) to EUCJP
 *
 * @private
 * @ignore
 */
function UNICODEToEUCJP(data) {
  return UTF8ToEUCJP(UNICODEToUTF8(data));
}

/**
 * EUCJP to UTF-16 (JavaScript Unicode array)
 *
 * @private
 * @ignore
 */
function EUCJPToUNICODE(data) {
  return UTF8ToUNICODE(EUCJPToUTF8(data));
}

/**
 * UTF-16 (JavaScript Unicode array) to SJIS
 *
 * @private
 * @ignore
 */
function UNICODEToSJIS(data) {
  return UTF8ToSJIS(UNICODEToUTF8(data));
}

/**
 * SJIS to UTF-16 (JavaScript Unicode array)
 *
 * @private
 * @ignore
 */
function SJISToUNICODE(data) {
  return UTF8ToUNICODE(SJISToUTF8(data));
}

/**
 * UTF-8 to UTF-16
 *
 * @private
 * @ignore
 */
function UTF8ToUTF16(data, options) {
  return UNICODEToUTF16(UTF8ToUNICODE(data), options);
}

/**
 * UTF-16 to UTF-8
 *
 * @private
 * @ignore
 */
function UTF16ToUTF8(data) {
  return UNICODEToUTF8(UTF16ToUNICODE(data));
}

/**
 * UTF-8 to UTF-16BE
 *
 * @private
 * @ignore
 */
function UTF8ToUTF16BE(data) {
  return UNICODEToUTF16BE(UTF8ToUNICODE(data));
}

/**
 * UTF-16BE to UTF-8
 *
 * @private
 * @ignore
 */
function UTF16BEToUTF8(data) {
  return UNICODEToUTF8(UTF16BEToUNICODE(data));
}

/**
 * UTF-8 to UTF-16LE
 *
 * @private
 * @ignore
 */
function UTF8ToUTF16LE(data) {
  return UNICODEToUTF16LE(UTF8ToUNICODE(data));
}

/**
 * UTF-16LE to UTF-8
 *
 * @private
 * @ignore
 */
function UTF16LEToUTF8(data) {
  return UNICODEToUTF8(UTF16LEToUNICODE(data));
}

/**
 * JIS to UTF-16
 *
 * @private
 * @ignore
 */
function JISToUTF16(data, options) {
  return UTF8ToUTF16(JISToUTF8(data), options);
}

/**
 * UTF-16 to JIS
 *
 * @private
 * @ignore
 */
function UTF16ToJIS(data) {
  return UTF8ToJIS(UTF16ToUTF8(data));
}

/**
 * JIS to UTF-16BE
 *
 * @private
 * @ignore
 */
function JISToUTF16BE(data) {
  return UTF8ToUTF16BE(JISToUTF8(data));
}

/**
 * UTF-16BE to JIS
 *
 * @private
 * @ignore
 */
function UTF16BEToJIS(data) {
  return UTF8ToJIS(UTF16BEToUTF8(data));
}

/**
 * JIS to UTF-16LE
 *
 * @private
 * @ignore
 */
function JISToUTF16LE(data) {
  return UTF8ToUTF16LE(JISToUTF8(data));
}

/**
 * UTF-16LE to JIS
 *
 * @private
 * @ignore
 */
function UTF16LEToJIS(data) {
  return UTF8ToJIS(UTF16LEToUTF8(data));
}

/**
 * EUC-JP to UTF-16
 *
 * @private
 * @ignore
 */
function EUCJPToUTF16(data, options) {
  return UTF8ToUTF16(EUCJPToUTF8(data), options);
}

/**
 * UTF-16 to EUC-JP
 *
 * @private
 * @ignore
 */
function UTF16ToEUCJP(data) {
  return UTF8ToEUCJP(UTF16ToUTF8(data));
}

/**
 * EUC-JP to UTF-16BE
 *
 * @private
 * @ignore
 */
function EUCJPToUTF16BE(data) {
  return UTF8ToUTF16BE(EUCJPToUTF8(data));
}

/**
 * UTF-16BE to EUC-JP
 *
 * @private
 * @ignore
 */
function UTF16BEToEUCJP(data) {
  return UTF8ToEUCJP(UTF16BEToUTF8(data));
}

/**
 * EUC-JP to UTF-16LE
 *
 * @private
 * @ignore
 */
function EUCJPToUTF16LE(data) {
  return UTF8ToUTF16LE(EUCJPToUTF8(data));
}

/**
 * UTF-16LE to EUC-JP
 *
 * @private
 * @ignore
 */
function UTF16LEToEUCJP(data) {
  return UTF8ToEUCJP(UTF16LEToUTF8(data));
}

/**
 * SJIS to UTF-16
 *
 * @private
 * @ignore
 */
function SJISToUTF16(data, options) {
  return UTF8ToUTF16(SJISToUTF8(data), options);
}

/**
 * UTF-16 to SJIS
 *
 * @private
 * @ignore
 */
function UTF16ToSJIS(data) {
  return UTF8ToSJIS(UTF16ToUTF8(data));
}

/**
 * SJIS to UTF-16BE
 *
 * @private
 * @ignore
 */
function SJISToUTF16BE(data) {
  return UTF8ToUTF16BE(SJISToUTF8(data));
}

/**
 * UTF-16BE to SJIS
 *
 * @private
 * @ignore
 */
function UTF16BEToSJIS(data) {
  return UTF8ToSJIS(UTF16BEToUTF8(data));
}

/**
 * SJIS to UTF-16LE
 *
 * @private
 * @ignore
 */
function SJISToUTF16LE(data) {
  return UTF8ToUTF16LE(SJISToUTF8(data));
}

/**
 * UTF-16LE to SJIS
 *
 * @private
 * @ignore
 */
function UTF16LEToSJIS(data) {
  return UTF8ToSJIS(UTF16LEToUTF8(data));
}


/**
 * Assign the internal encoding name from the argument encoding name.
 *
 * @private
 * @ignore
 */
function assignEncodingName(target) {
  var name = '';
  var expect = ('' + target).toUpperCase().replace(/[^A-Z0-9]+/g, '');
  var aliasNames = getKeys(EncodingAliases);
  var len = aliasNames.length;
  var hit = 0;
  var encoding, encodingLen, j;

  for (var i = 0; i < len; i++) {
    encoding = aliasNames[i];
    if (encoding === expect) {
      name = encoding;
      break;
    }

    encodingLen = encoding.length;
    for (j = hit; j < encodingLen; j++) {
      if (encoding.slice(0, j) === expect.slice(0, j) ||
          encoding.slice(-j) === expect.slice(-j)) {
        name = encoding;
        hit = j;
      }
    }
  }

  if (hasOwnProperty.call(EncodingAliases, name)) {
    return EncodingAliases[name];
  }

  return name;
}


// Helpers

function isObject(x) {
  var type = typeof x;
  return type === 'function' || type === 'object' && !!x;
}

function isArray(x) {
  return Array.isArray ? Array.isArray(x) :
    toString.call(x) === '[object Array]';
}

function isString(x) {
  return typeof x === 'string' || toString.call(x) === '[object String]';
}


function getKeys(object) {
  if (Object.keys) {
    return Object.keys(object);
  }

  var keys = [];
  for (var key in object) {
    if (hasOwnProperty.call(object, key)) {
      keys[keys.length] = key;
    }
  }

  return keys;
}


function createBuffer(bits, size) {
  if (!HAS_TYPED) {
    return new Array(size);
  }

  switch (bits) {
    case 8: return new Uint8Array(size);
    case 16: return new Uint16Array(size);
  }
}


function stringToBuffer(string) {
  var length = string.length;
  var buffer = createBuffer(16, length);

  for (var i = 0; i < length; i++) {
    buffer[i] = string.charCodeAt(i);
  }

  return buffer;
}


function codeToString_fast(code) {
  if (CAN_CHARCODE_APPLY && CAN_CHARCODE_APPLY_TYPED) {
    var len = code && code.length;
    if (len < APPLY_BUFFER_SIZE) {
      if (APPLY_BUFFER_SIZE_OK) {
        return fromCharCode.apply(null, code);
      }

      if (APPLY_BUFFER_SIZE_OK === null) {
        try {
          var s = fromCharCode.apply(null, code);
          if (len > APPLY_BUFFER_SIZE) {
            APPLY_BUFFER_SIZE_OK = true;
          }
          return s;
        } catch (e) {
          // Ignore RangeError: arguments too large
          APPLY_BUFFER_SIZE_OK = false;
        }
      }
    }
  }

  return codeToString_chunked(code);
}


function codeToString_chunked(code) {
  var string = '';
  var length = code && code.length;
  var i = 0;
  var sub;

  while (i < length) {
    if (code.subarray) {
      sub = code.subarray(i, i + APPLY_BUFFER_SIZE);
    } else {
      sub = code.slice(i, i + APPLY_BUFFER_SIZE);
    }
    i += APPLY_BUFFER_SIZE;

    if (APPLY_BUFFER_SIZE_OK) {
      string += fromCharCode.apply(null, sub);
      continue;
    }

    if (APPLY_BUFFER_SIZE_OK === null) {
      try {
        string += fromCharCode.apply(null, sub);
        if (sub.length > APPLY_BUFFER_SIZE) {
          APPLY_BUFFER_SIZE_OK = true;
        }
        continue;
      } catch (e) {
        APPLY_BUFFER_SIZE_OK = false;
      }
    }

    return codeToString_slow(code);
  }

  return string;
}


function codeToString_slow(code) {
  var string = '';
  var length = code && code.length;

  for (var i = 0; i < length; i++) {
    string += fromCharCode(code[i]);
  }

  return string;
}


function stringToCode(string) {
  var code = [];
  var len = string && string.length;

  for (var i = 0; i < len; i++) {
    code[i] = string.charCodeAt(i);
  }

  return code;
}


function codeToBuffer(code) {
  if (HAS_TYPED) {
    // Use Uint16Array for Unicode codepoint.
    return new Uint16Array(code);
  } else {
    if (isArray(code)) {
      return code;
    }
  }

  var length = code && code.length;
  var buffer = [];

  for (var i = 0; i < length; i++) {
    buffer[i] = code[i];
  }

  return buffer;
}


function bufferToCode(buffer) {
  if (isArray(buffer)) {
    return buffer;
  }

  return slice.call(buffer);
}

// Base64
/* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
 * Version: 1.0
 * LastModified: Dec 25 1999
 * This library is free.  You can redistribute it and/or modify it.
 */
// -- Masanao Izumo Copyright 1999 "free"
// Modified to add support for Binary Array for Encoding.js

var base64EncodeChars = [
  65,  66,  67,  68,  69,  70,  71,  72,  73,  74,  75,  76,  77,
  78,  79,  80,  81,  82,  83,  84,  85,  86,  87,  88,  89,  90,
  97,  98,  99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109,
 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122,
  48,  49,  50,  51,  52,  53,  54,  55,  56,  57,  43,  47
];

var base64DecodeChars = [
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
  52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
  -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
  -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
];

var base64EncodePadding = '='.charCodeAt(0);


function base64encode(data) {
  var out, i, len;
  var c1, c2, c3;

  len = data && data.length;
  i = 0;
  out = [];

  while (i < len) {
    c1 = data[i++];
    if (i == len) {
      out[out.length] = base64EncodeChars[c1 >> 2];
      out[out.length] = base64EncodeChars[(c1 & 0x3) << 4];
      out[out.length] = base64EncodePadding;
      out[out.length] = base64EncodePadding;
      break;
    }

    c2 = data[i++];
    if (i == len) {
      out[out.length] = base64EncodeChars[c1 >> 2];
      out[out.length] = base64EncodeChars[((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4)];
      out[out.length] = base64EncodeChars[(c2 & 0xF) << 2];
      out[out.length] = base64EncodePadding;
      break;
    }

    c3 = data[i++];
    out[out.length] = base64EncodeChars[c1 >> 2];
    out[out.length] = base64EncodeChars[((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4)];
    out[out.length] = base64EncodeChars[((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6)];
    out[out.length] = base64EncodeChars[c3 & 0x3F];
  }

  return codeToString_fast(out);
}


function base64decode(str) {
  var c1, c2, c3, c4;
  var i, len, out;

  len = str && str.length;
  i = 0;
  out = [];

  while (i < len) {
    /* c1 */
    do {
      c1 = base64DecodeChars[str.charCodeAt(i++) & 0xFF];
    } while (i < len && c1 == -1);

    if (c1 == -1) {
      break;
    }

    /* c2 */
    do {
      c2 = base64DecodeChars[str.charCodeAt(i++) & 0xFF];
    } while (i < len && c2 == -1);

    if (c2 == -1) {
      break;
    }

    out[out.length] = (c1 << 2) | ((c2 & 0x30) >> 4);

    /* c3 */
    do {
      c3 = str.charCodeAt(i++) & 0xFF;
      if (c3 == 61) {
        return out;
      }
      c3 = base64DecodeChars[c3];
    } while (i < len && c3 == -1);

    if (c3 == -1) {
      break;
    }

    out[out.length] = ((c2 & 0xF) << 4) | ((c3 & 0x3C) >> 2);

    /* c4 */
    do {
      c4 = str.charCodeAt(i++) & 0xFF;
      if (c4 == 61) {
        return out;
      }
      c4 = base64DecodeChars[c4];
    } while (i < len && c4 == -1);

    if (c4 == -1) {
      break;
    }

    out[out.length] = ((c3 & 0x03) << 6) | c4;
  }

  return out;
}


/**
 * Encoding conversion table for UTF-8 to JIS.
 *
 * @ignore
 */
var UTF8_TO_JIS_TABLE = {
0xEFBDA1:0x21,0xEFBDA2:0x22,0xEFBDA3:0x23,0xEFBDA4:0x24,0xEFBDA5:0x25,
0xEFBDA6:0x26,0xEFBDA7:0x27,0xEFBDA8:0x28,0xEFBDA9:0x29,0xEFBDAA:0x2A,
0xEFBDAB:0x2B,0xEFBDAC:0x2C,0xEFBDAD:0x2D,0xEFBDAE:0x2E,0xEFBDAF:0x2F,
0xEFBDB0:0x30,0xEFBDB1:0x31,0xEFBDB2:0x32,0xEFBDB3:0x33,0xEFBDB4:0x34,
0xEFBDB5:0x35,0xEFBDB6:0x36,0xEFBDB7:0x37,0xEFBDB8:0x38,0xEFBDB9:0x39,
0xEFBDBA:0x3A,0xEFBDBB:0x3B,0xEFBDBC:0x3C,0xEFBDBD:0x3D,0xEFBDBE:0x3E,
0xEFBDBF:0x3F,0xEFBE80:0x40,0xEFBE81:0x41,0xEFBE82:0x42,0xEFBE83:0x43,
0xEFBE84:0x44,0xEFBE85:0x45,0xEFBE86:0x46,0xEFBE87:0x47,0xEFBE88:0x48,
0xEFBE89:0x49,0xEFBE8A:0x4A,0xEFBE8B:0x4B,0xEFBE8C:0x4C,0xEFBE8D:0x4D,
0xEFBE8E:0x4E,0xEFBE8F:0x4F,0xEFBE90:0x50,0xEFBE91:0x51,0xEFBE92:0x52,
0xEFBE93:0x53,0xEFBE94:0x54,0xEFBE95:0x55,0xEFBE96:0x56,0xEFBE97:0x57,
0xEFBE98:0x58,0xEFBE99:0x59,0xEFBE9A:0x5A,0xEFBE9B:0x5B,0xEFBE9C:0x5C,
0xEFBE9D:0x5D,0xEFBE9E:0x5E,0xEFBE9F:0x5F,

0xE291A0:0x2D21,0xE291A1:0x2D22,0xE291A2:0x2D23,0xE291A3:0x2D24,0xE291A4:0x2D25,
0xE291A5:0x2D26,0xE291A6:0x2D27,0xE291A7:0x2D28,0xE291A8:0x2D29,0xE291A9:0x2D2A,
0xE291AA:0x2D2B,0xE291AB:0x2D2C,0xE291AC:0x2D2D,0xE291AD:0x2D2E,0xE291AE:0x2D2F,
0xE291AF:0x2D30,0xE291B0:0x2D31,0xE291B1:0x2D32,0xE291B2:0x2D33,0xE291B3:0x2D34,
0xE285A0:0x2D35,0xE285A1:0x2D36,0xE285A2:0x2D37,0xE285A3:0x2D38,0xE285A4:0x2D39,
0xE285A5:0x2D3A,0xE285A6:0x2D3B,0xE285A7:0x2D3C,0xE285A8:0x2D3D,0xE285A9:0x2D3E,
0xE38D89:0x2D40,0xE38C94:0x2D41,0xE38CA2:0x2D42,0xE38D8D:0x2D43,0xE38C98:0x2D44,
0xE38CA7:0x2D45,0xE38C83:0x2D46,0xE38CB6:0x2D47,0xE38D91:0x2D48,0xE38D97:0x2D49,
0xE38C8D:0x2D4A,0xE38CA6:0x2D4B,0xE38CA3:0x2D4C,0xE38CAB:0x2D4D,0xE38D8A:0x2D4E,
0xE38CBB:0x2D4F,0xE38E9C:0x2D50,0xE38E9D:0x2D51,0xE38E9E:0x2D52,0xE38E8E:0x2D53,
0xE38E8F:0x2D54,0xE38F84:0x2D55,0xE38EA1:0x2D56,0xE38DBB:0x2D5F,0xE3809D:0x2D60,
0xE3809F:0x2D61,0xE28496:0x2D62,0xE38F8D:0x2D63,0xE284A1:0x2D64,0xE38AA4:0x2D65,
0xE38AA5:0x2D66,0xE38AA6:0x2D67,0xE38AA7:0x2D68,0xE38AA8:0x2D69,0xE388B1:0x2D6A,
0xE388B2:0x2D6B,0xE388B9:0x2D6C,0xE38DBE:0x2D6D,0xE38DBD:0x2D6E,0xE38DBC:0x2D6F,
0xE288AE:0x2D73,0xE28891:0x2D74,0xE2889F:0x2D78,0xE28ABF:0x2D79,

0xE38080:0x2121,0xE38081:0x2122,0xE38082:0x2123,0xEFBC8C:0x2124,0xEFBC8E:0x2125,
0xE383BB:0x2126,0xEFBC9A:0x2127,0xEFBC9B:0x2128,0xEFBC9F:0x2129,0xEFBC81:0x212A,
0xE3829B:0x212B,0xE3829C:0x212C,0xC2B4:0x212D,0xEFBD80:0x212E,0xC2A8:0x212F,
0xEFBCBE:0x2130,0xEFBFA3:0x2131,0xEFBCBF:0x2132,0xE383BD:0x2133,0xE383BE:0x2134,
0xE3829D:0x2135,0xE3829E:0x2136,0xE38083:0x2137,0xE4BB9D:0x2138,0xE38085:0x2139,
0xE38086:0x213A,0xE38087:0x213B,0xE383BC:0x213C,0xE28095:0x213D,0xE28090:0x213E,
0xEFBC8F:0x213F,0xEFBCBC:0x2140,0xEFBD9E:0x2141,0xE28096:0x2142,0xEFBD9C:0x2143,
0xE280A6:0x2144,0xE280A5:0x2145,0xE28098:0x2146,0xE28099:0x2147,0xE2809C:0x2148,
0xE2809D:0x2149,0xEFBC88:0x214A,0xEFBC89:0x214B,0xE38094:0x214C,0xE38095:0x214D,
0xEFBCBB:0x214E,0xEFBCBD:0x214F,0xEFBD9B:0x2150,0xEFBD9D:0x2151,0xE38088:0x2152,
0xE38089:0x2153,0xE3808A:0x2154,0xE3808B:0x2155,0xE3808C:0x2156,0xE3808D:0x2157,
0xE3808E:0x2158,0xE3808F:0x2159,0xE38090:0x215A,0xE38091:0x215B,0xEFBC8B:0x215C,
0xEFBC8D:0x215D,0xC2B1:0x215E,0xC397:0x215F,0xC3B7:0x2160,0xEFBC9D:0x2161,
0xE289A0:0x2162,0xEFBC9C:0x2163,0xEFBC9E:0x2164,0xE289A6:0x2165,0xE289A7:0x2166,
0xE2889E:0x2167,0xE288B4:0x2168,0xE29982:0x2169,0xE29980:0x216A,0xC2B0:0x216B,
0xE280B2:0x216C,0xE280B3:0x216D,0xE28483:0x216E,0xEFBFA5:0x216F,0xEFBC84:0x2170,
0xEFBFA0:0x2171,0xEFBFA1:0x2172,0xEFBC85:0x2173,0xEFBC83:0x2174,0xEFBC86:0x2175,
0xEFBC8A:0x2176,0xEFBCA0:0x2177,0xC2A7:0x2178,0xE29886:0x2179,0xE29885:0x217A,
0xE2978B:0x217B,0xE2978F:0x217C,0xE2978E:0x217D,0xE29787:0x217E,0xE29786:0x2221,
0xE296A1:0x2222,0xE296A0:0x2223,0xE296B3:0x2224,0xE296B2:0x2225,0xE296BD:0x2226,
0xE296BC:0x2227,0xE280BB:0x2228,0xE38092:0x2229,0xE28692:0x222A,0xE28690:0x222B,
0xE28691:0x222C,0xE28693:0x222D,0xE38093:0x222E,0xE28888:0x223A,0xE2888B:0x223B,
0xE28A86:0x223C,0xE28A87:0x223D,0xE28A82:0x223E,0xE28A83:0x223F,0xE288AA:0x2240,
0xE288A9:0x2241,0xE288A7:0x224A,0xE288A8:0x224B,0xC2AC:0x224C,0xE28792:0x224D,
0xE28794:0x224E,0xE28880:0x224F,0xE28883:0x2250,0xE288A0:0x225C,0xE28AA5:0x225D,
0xE28C92:0x225E,0xE28882:0x225F,0xE28887:0x2260,0xE289A1:0x2261,0xE28992:0x2262,
0xE289AA:0x2263,0xE289AB:0x2264,0xE2889A:0x2265,0xE288BD:0x2266,0xE2889D:0x2267,
0xE288B5:0x2268,0xE288AB:0x2269,0xE288AC:0x226A,0xE284AB:0x2272,0xE280B0:0x2273,
0xE299AF:0x2274,0xE299AD:0x2275,0xE299AA:0x2276,0xE280A0:0x2277,0xE280A1:0x2278,
0xC2B6:0x2279,0xE297AF:0x227E,0xEFBC90:0x2330,0xEFBC91:0x2331,0xEFBC92:0x2332,
0xEFBC93:0x2333,0xEFBC94:0x2334,0xEFBC95:0x2335,0xEFBC96:0x2336,0xEFBC97:0x2337,
0xEFBC98:0x2338,0xEFBC99:0x2339,0xEFBCA1:0x2341,0xEFBCA2:0x2342,0xEFBCA3:0x2343,
0xEFBCA4:0x2344,0xEFBCA5:0x2345,0xEFBCA6:0x2346,0xEFBCA7:0x2347,0xEFBCA8:0x2348,
0xEFBCA9:0x2349,0xEFBCAA:0x234A,0xEFBCAB:0x234B,0xEFBCAC:0x234C,0xEFBCAD:0x234D,
0xEFBCAE:0x234E,0xEFBCAF:0x234F,0xEFBCB0:0x2350,0xEFBCB1:0x2351,0xEFBCB2:0x2352,
0xEFBCB3:0x2353,0xEFBCB4:0x2354,0xEFBCB5:0x2355,0xEFBCB6:0x2356,0xEFBCB7:0x2357,
0xEFBCB8:0x2358,0xEFBCB9:0x2359,0xEFBCBA:0x235A,0xEFBD81:0x2361,0xEFBD82:0x2362,
0xEFBD83:0x2363,0xEFBD84:0x2364,0xEFBD85:0x2365,0xEFBD86:0x2366,0xEFBD87:0x2367,
0xEFBD88:0x2368,0xEFBD89:0x2369,0xEFBD8A:0x236A,0xEFBD8B:0x236B,0xEFBD8C:0x236C,
0xEFBD8D:0x236D,0xEFBD8E:0x236E,0xEFBD8F:0x236F,0xEFBD90:0x2370,0xEFBD91:0x2371,
0xEFBD92:0x2372,0xEFBD93:0x2373,0xEFBD94:0x2374,0xEFBD95:0x2375,0xEFBD96:0x2376,
0xEFBD97:0x2377,0xEFBD98:0x2378,0xEFBD99:0x2379,0xEFBD9A:0x237A,0xE38181:0x2421,
0xE38182:0x2422,0xE38183:0x2423,0xE38184:0x2424,0xE38185:0x2425,0xE38186:0x2426,
0xE38187:0x2427,0xE38188:0x2428,0xE38189:0x2429,0xE3818A:0x242A,0xE3818B:0x242B,
0xE3818C:0x242C,0xE3818D:0x242D,0xE3818E:0x242E,0xE3818F:0x242F,0xE38190:0x2430,
0xE38191:0x2431,0xE38192:0x2432,0xE38193:0x2433,0xE38194:0x2434,0xE38195:0x2435,
0xE38196:0x2436,0xE38197:0x2437,0xE38198:0x2438,0xE38199:0x2439,0xE3819A:0x243A,
0xE3819B:0x243B,0xE3819C:0x243C,0xE3819D:0x243D,0xE3819E:0x243E,0xE3819F:0x243F,
0xE381A0:0x2440,0xE381A1:0x2441,0xE381A2:0x2442,0xE381A3:0x2443,0xE381A4:0x2444,
0xE381A5:0x2445,0xE381A6:0x2446,0xE381A7:0x2447,0xE381A8:0x2448,0xE381A9:0x2449,
0xE381AA:0x244A,0xE381AB:0x244B,0xE381AC:0x244C,0xE381AD:0x244D,0xE381AE:0x244E,
0xE381AF:0x244F,0xE381B0:0x2450,0xE381B1:0x2451,0xE381B2:0x2452,0xE381B3:0x2453,
0xE381B4:0x2454,0xE381B5:0x2455,0xE381B6:0x2456,0xE381B7:0x2457,0xE381B8:0x2458,
0xE381B9:0x2459,0xE381BA:0x245A,0xE381BB:0x245B,0xE381BC:0x245C,0xE381BD:0x245D,
0xE381BE:0x245E,0xE381BF:0x245F,0xE38280:0x2460,0xE38281:0x2461,0xE38282:0x2462,
0xE38283:0x2463,0xE38284:0x2464,0xE38285:0x2465,0xE38286:0x2466,0xE38287:0x2467,
0xE38288:0x2468,0xE38289:0x2469,0xE3828A:0x246A,0xE3828B:0x246B,0xE3828C:0x246C,
0xE3828D:0x246D,0xE3828E:0x246E,0xE3828F:0x246F,0xE38290:0x2470,0xE38291:0x2471,
0xE38292:0x2472,0xE38293:0x2473,0xE382A1:0x2521,0xE382A2:0x2522,0xE382A3:0x2523,
0xE382A4:0x2524,0xE382A5:0x2525,0xE382A6:0x2526,0xE382A7:0x2527,0xE382A8:0x2528,
0xE382A9:0x2529,0xE382AA:0x252A,0xE382AB:0x252B,0xE382AC:0x252C,0xE382AD:0x252D,
0xE382AE:0x252E,0xE382AF:0x252F,0xE382B0:0x2530,0xE382B1:0x2531,0xE382B2:0x2532,
0xE382B3:0x2533,0xE382B4:0x2534,0xE382B5:0x2535,0xE382B6:0x2536,0xE382B7:0x2537,
0xE382B8:0x2538,0xE382B9:0x2539,0xE382BA:0x253A,0xE382BB:0x253B,0xE382BC:0x253C,
0xE382BD:0x253D,0xE382BE:0x253E,0xE382BF:0x253F,0xE38380:0x2540,0xE38381:0x2541,
0xE38382:0x2542,0xE38383:0x2543,0xE38384:0x2544,0xE38385:0x2545,0xE38386:0x2546,
0xE38387:0x2547,0xE38388:0x2548,0xE38389:0x2549,0xE3838A:0x254A,0xE3838B:0x254B,
0xE3838C:0x254C,0xE3838D:0x254D,0xE3838E:0x254E,0xE3838F:0x254F,0xE38390:0x2550,
0xE38391:0x2551,0xE38392:0x2552,0xE38393:0x2553,0xE38394:0x2554,0xE38395:0x2555,
0xE38396:0x2556,0xE38397:0x2557,0xE38398:0x2558,0xE38399:0x2559,0xE3839A:0x255A,
0xE3839B:0x255B,0xE3839C:0x255C,0xE3839D:0x255D,0xE3839E:0x255E,0xE3839F:0x255F,
0xE383A0:0x2560,0xE383A1:0x2561,0xE383A2:0x2562,0xE383A3:0x2563,0xE383A4:0x2564,
0xE383A5:0x2565,0xE383A6:0x2566,0xE383A7:0x2567,0xE383A8:0x2568,0xE383A9:0x2569,
0xE383AA:0x256A,0xE383AB:0x256B,0xE383AC:0x256C,0xE383AD:0x256D,0xE383AE:0x256E,
0xE383AF:0x256F,0xE383B0:0x2570,0xE383B1:0x2571,0xE383B2:0x2572,0xE383B3:0x2573,
0xE383B4:0x2574,0xE383B5:0x2575,0xE383B6:0x2576,0xCE91:0x2621,0xCE92:0x2622,
0xCE93:0x2623,0xCE94:0x2624,0xCE95:0x2625,0xCE96:0x2626,0xCE97:0x2627,
0xCE98:0x2628,0xCE99:0x2629,0xCE9A:0x262A,0xCE9B:0x262B,0xCE9C:0x262C,
0xCE9D:0x262D,0xCE9E:0x262E,0xCE9F:0x262F,0xCEA0:0x2630,0xCEA1:0x2631,
0xCEA3:0x2632,0xCEA4:0x2633,0xCEA5:0x2634,0xCEA6:0x2635,0xCEA7:0x2636,
0xCEA8:0x2637,0xCEA9:0x2638,0xCEB1:0x2641,0xCEB2:0x2642,0xCEB3:0x2643,
0xCEB4:0x2644,0xCEB5:0x2645,0xCEB6:0x2646,0xCEB7:0x2647,0xCEB8:0x2648,
0xCEB9:0x2649,0xCEBA:0x264A,0xCEBB:0x264B,0xCEBC:0x264C,0xCEBD:0x264D,
0xCEBE:0x264E,0xCEBF:0x264F,0xCF80:0x2650,0xCF81:0x2651,0xCF83:0x2652,
0xCF84:0x2653,0xCF85:0x2654,0xCF86:0x2655,0xCF87:0x2656,0xCF88:0x2657,
0xCF89:0x2658,0xD090:0x2721,0xD091:0x2722,0xD092:0x2723,0xD093:0x2724,
0xD094:0x2725,0xD095:0x2726,0xD081:0x2727,0xD096:0x2728,0xD097:0x2729,
0xD098:0x272A,0xD099:0x272B,0xD09A:0x272C,0xD09B:0x272D,0xD09C:0x272E,
0xD09D:0x272F,0xD09E:0x2730,0xD09F:0x2731,0xD0A0:0x2732,0xD0A1:0x2733,
0xD0A2:0x2734,0xD0A3:0x2735,0xD0A4:0x2736,0xD0A5:0x2737,0xD0A6:0x2738,
0xD0A7:0x2739,0xD0A8:0x273A,0xD0A9:0x273B,0xD0AA:0x273C,0xD0AB:0x273D,
0xD0AC:0x273E,0xD0AD:0x273F,0xD0AE:0x2740,0xD0AF:0x2741,0xD0B0:0x2751,
0xD0B1:0x2752,0xD0B2:0x2753,0xD0B3:0x2754,0xD0B4:0x2755,0xD0B5:0x2756,
0xD191:0x2757,0xD0B6:0x2758,0xD0B7:0x2759,0xD0B8:0x275A,0xD0B9:0x275B,
0xD0BA:0x275C,0xD0BB:0x275D,0xD0BC:0x275E,0xD0BD:0x275F,0xD0BE:0x2760,
0xD0BF:0x2761,0xD180:0x2762,0xD181:0x2763,0xD182:0x2764,0xD183:0x2765,
0xD184:0x2766,0xD185:0x2767,0xD186:0x2768,0xD187:0x2769,0xD188:0x276A,
0xD189:0x276B,0xD18A:0x276C,0xD18B:0x276D,0xD18C:0x276E,0xD18D:0x276F,
0xD18E:0x2770,0xD18F:0x2771,0xE29480:0x2821,0xE29482:0x2822,0xE2948C:0x2823,
0xE29490:0x2824,0xE29498:0x2825,0xE29494:0x2826,0xE2949C:0x2827,0xE294AC:0x2828,
0xE294A4:0x2829,0xE294B4:0x282A,0xE294BC:0x282B,0xE29481:0x282C,0xE29483:0x282D,
0xE2948F:0x282E,0xE29493:0x282F,0xE2949B:0x2830,0xE29497:0x2831,0xE294A3:0x2832,
0xE294B3:0x2833,0xE294AB:0x2834,0xE294BB:0x2835,0xE2958B:0x2836,0xE294A0:0x2837,
0xE294AF:0x2838,0xE294A8:0x2839,0xE294B7:0x283A,0xE294BF:0x283B,0xE2949D:0x283C,
0xE294B0:0x283D,0xE294A5:0x283E,0xE294B8:0x283F,0xE29582:0x2840,0xE4BA9C:0x3021,
0xE59496:0x3022,0xE5A883:0x3023,0xE998BF:0x3024,0xE59380:0x3025,0xE6849B:0x3026,
0xE68CA8:0x3027,0xE5A7B6:0x3028,0xE980A2:0x3029,0xE891B5:0x302A,0xE88C9C:0x302B,
0xE7A990:0x302C,0xE682AA:0x302D,0xE68FA1:0x302E,0xE6B8A5:0x302F,0xE697AD:0x3030,
0xE891A6:0x3031,0xE88AA6:0x3032,0xE9AFB5:0x3033,0xE6A293:0x3034,0xE59CA7:0x3035,
0xE696A1:0x3036,0xE689B1:0x3037,0xE5AE9B:0x3038,0xE5A790:0x3039,0xE899BB:0x303A,
0xE9A3B4:0x303B,0xE7B5A2:0x303C,0xE7B6BE:0x303D,0xE9AE8E:0x303E,0xE68896:0x303F,
0xE7B29F:0x3040,0xE8A2B7:0x3041,0xE5AE89:0x3042,0xE5BAB5:0x3043,0xE68C89:0x3044,
0xE69A97:0x3045,0xE6A188:0x3046,0xE99787:0x3047,0xE99E8D:0x3048,0xE69D8F:0x3049,
0xE4BBA5:0x304A,0xE4BC8A:0x304B,0xE4BD8D:0x304C,0xE4BE9D:0x304D,0xE58189:0x304E,
0xE59BB2:0x304F,0xE5A4B7:0x3050,0xE5A794:0x3051,0xE5A881:0x3052,0xE5B089:0x3053,
0xE6839F:0x3054,0xE6848F:0x3055,0xE685B0:0x3056,0xE69893:0x3057,0xE6A485:0x3058,
0xE782BA:0x3059,0xE7958F:0x305A,0xE795B0:0x305B,0xE7A7BB:0x305C,0xE7B6AD:0x305D,
0xE7B7AF:0x305E,0xE88383:0x305F,0xE8908E:0x3060,0xE8A1A3:0x3061,0xE8AC82:0x3062,
0xE98195:0x3063,0xE981BA:0x3064,0xE58CBB:0x3065,0xE4BA95:0x3066,0xE4BAA5:0x3067,
0xE59F9F:0x3068,0xE882B2:0x3069,0xE98381:0x306A,0xE7A3AF:0x306B,0xE4B880:0x306C,
0xE5A3B1:0x306D,0xE6BAA2:0x306E,0xE980B8:0x306F,0xE7A8B2:0x3070,0xE88CA8:0x3071,
0xE88A8B:0x3072,0xE9B0AF:0x3073,0xE58581:0x3074,0xE58DB0:0x3075,0xE592BD:0x3076,
0xE593A1:0x3077,0xE59BA0:0x3078,0xE5A7BB:0x3079,0xE5BC95:0x307A,0xE9A3B2:0x307B,
0xE6B7AB:0x307C,0xE883A4:0x307D,0xE894AD:0x307E,0xE999A2:0x3121,0xE999B0:0x3122,
0xE99AA0:0x3123,0xE99FBB:0x3124,0xE5908B:0x3125,0xE58FB3:0x3126,0xE5AE87:0x3127,
0xE7838F:0x3128,0xE7BEBD:0x3129,0xE8BF82:0x312A,0xE99BA8:0x312B,0xE58DAF:0x312C,
0xE9B59C:0x312D,0xE7AABA:0x312E,0xE4B891:0x312F,0xE7A293:0x3130,0xE887BC:0x3131,
0xE6B8A6:0x3132,0xE59898:0x3133,0xE59484:0x3134,0xE6AC9D:0x3135,0xE8949A:0x3136,
0xE9B0BB:0x3137,0xE5A7A5:0x3138,0xE58EA9:0x3139,0xE6B5A6:0x313A,0xE7939C:0x313B,
0xE9968F:0x313C,0xE59982:0x313D,0xE4BA91:0x313E,0xE9818B:0x313F,0xE99BB2:0x3140,
0xE88D8F:0x3141,0xE9A48C:0x3142,0xE58FA1:0x3143,0xE596B6:0x3144,0xE5ACB0:0x3145,
0xE5BDB1:0x3146,0xE698A0:0x3147,0xE69BB3:0x3148,0xE6A084:0x3149,0xE6B0B8:0x314A,
0xE6B3B3:0x314B,0xE6B4A9:0x314C,0xE7919B:0x314D,0xE79B88:0x314E,0xE7A98E:0x314F,
0xE9A0B4:0x3150,0xE88BB1:0x3151,0xE8A19B:0x3152,0xE8A9A0:0x3153,0xE98BAD:0x3154,
0xE6B6B2:0x3155,0xE796AB:0x3156,0xE79B8A:0x3157,0xE9A785:0x3158,0xE682A6:0x3159,
0xE8AC81:0x315A,0xE8B68A:0x315B,0xE996B2:0x315C,0xE6A68E:0x315D,0xE58EAD:0x315E,
0xE58686:0x315F,0xE59C92:0x3160,0xE5A0B0:0x3161,0xE5A584:0x3162,0xE5AEB4:0x3163,
0xE5BBB6:0x3164,0xE680A8:0x3165,0xE68EA9:0x3166,0xE68FB4:0x3167,0xE6B2BF:0x3168,
0xE6BC94:0x3169,0xE7828E:0x316A,0xE78494:0x316B,0xE78599:0x316C,0xE78795:0x316D,
0xE78CBF:0x316E,0xE7B881:0x316F,0xE889B6:0x3170,0xE88B91:0x3171,0xE89697:0x3172,
0xE981A0:0x3173,0xE9899B:0x3174,0xE9B49B:0x3175,0xE5A1A9:0x3176,0xE696BC:0x3177,
0xE6B19A:0x3178,0xE794A5:0x3179,0xE587B9:0x317A,0xE5A4AE:0x317B,0xE5A5A5:0x317C,
0xE5BE80:0x317D,0xE5BF9C:0x317E,0xE68ABC:0x3221,0xE697BA:0x3222,0xE6A8AA:0x3223,
0xE6ACA7:0x3224,0xE6AEB4:0x3225,0xE78E8B:0x3226,0xE7BF81:0x3227,0xE8A596:0x3228,
0xE9B4AC:0x3229,0xE9B48E:0x322A,0xE9BB84:0x322B,0xE5B2A1:0x322C,0xE6B296:0x322D,
0xE88DBB:0x322E,0xE58484:0x322F,0xE5B18B:0x3230,0xE686B6:0x3231,0xE88786:0x3232,
0xE6A1B6:0x3233,0xE789A1:0x3234,0xE4B999:0x3235,0xE4BFBA:0x3236,0xE58DB8:0x3237,
0xE681A9:0x3238,0xE6B8A9:0x3239,0xE7A98F:0x323A,0xE99FB3:0x323B,0xE4B88B:0x323C,
0xE58C96:0x323D,0xE4BBAE:0x323E,0xE4BD95:0x323F,0xE4BCBD:0x3240,0xE4BEA1:0x3241,
0xE4BDB3:0x3242,0xE58AA0:0x3243,0xE58FAF:0x3244,0xE59889:0x3245,0xE5A48F:0x3246,
0xE5AB81:0x3247,0xE5AEB6:0x3248,0xE5AFA1:0x3249,0xE7A791:0x324A,0xE69A87:0x324B,
0xE69E9C:0x324C,0xE69EB6:0x324D,0xE6AD8C:0x324E,0xE6B2B3:0x324F,0xE781AB:0x3250,
0xE78F82:0x3251,0xE7A68D:0x3252,0xE7A6BE:0x3253,0xE7A8BC:0x3254,0xE7AE87:0x3255,
0xE88AB1:0x3256,0xE88B9B:0x3257,0xE88C84:0x3258,0xE88DB7:0x3259,0xE88FAF:0x325A,
0xE88F93:0x325B,0xE89DA6:0x325C,0xE8AAB2:0x325D,0xE598A9:0x325E,0xE8B2A8:0x325F,
0xE8BFA6:0x3260,0xE9818E:0x3261,0xE99C9E:0x3262,0xE89A8A:0x3263,0xE4BF84:0x3264,
0xE5B3A8:0x3265,0xE68891:0x3266,0xE78999:0x3267,0xE794BB:0x3268,0xE887A5:0x3269,
0xE88ABD:0x326A,0xE89BBE:0x326B,0xE8B380:0x326C,0xE99B85:0x326D,0xE9A493:0x326E,
0xE9A795:0x326F,0xE4BB8B:0x3270,0xE4BC9A:0x3271,0xE8A7A3:0x3272,0xE59B9E:0x3273,
0xE5A18A:0x3274,0xE5A38A:0x3275,0xE5BBBB:0x3276,0xE5BFAB:0x3277,0xE680AA:0x3278,
0xE68294:0x3279,0xE681A2:0x327A,0xE68790:0x327B,0xE68892:0x327C,0xE68B90:0x327D,
0xE694B9:0x327E,0xE9AD81:0x3321,0xE699A6:0x3322,0xE6A2B0:0x3323,0xE6B5B7:0x3324,
0xE781B0:0x3325,0xE7958C:0x3326,0xE79A86:0x3327,0xE7B5B5:0x3328,0xE88AA5:0x3329,
0xE89FB9:0x332A,0xE9968B:0x332B,0xE99A8E:0x332C,0xE8B29D:0x332D,0xE587B1:0x332E,
0xE58ABE:0x332F,0xE5A496:0x3330,0xE592B3:0x3331,0xE5AEB3:0x3332,0xE5B496:0x3333,
0xE685A8:0x3334,0xE6A682:0x3335,0xE6B6AF:0x3336,0xE7A28D:0x3337,0xE8938B:0x3338,
0xE8A197:0x3339,0xE8A9B2:0x333A,0xE98EA7:0x333B,0xE9AAB8:0x333C,0xE6B5AC:0x333D,
0xE9A6A8:0x333E,0xE89B99:0x333F,0xE59EA3:0x3340,0xE69FBF:0x3341,0xE89B8E:0x3342,
0xE9888E:0x3343,0xE58A83:0x3344,0xE59A87:0x3345,0xE59084:0x3346,0xE5BB93:0x3347,
0xE68BA1:0x3348,0xE692B9:0x3349,0xE6A0BC:0x334A,0xE6A0B8:0x334B,0xE6AEBB:0x334C,
0xE78DB2:0x334D,0xE7A2BA:0x334E,0xE7A9AB:0x334F,0xE8A69A:0x3350,0xE8A792:0x3351,
0xE8B5AB:0x3352,0xE8BC83:0x3353,0xE983AD:0x3354,0xE996A3:0x3355,0xE99A94:0x3356,
0xE99DA9:0x3357,0xE5ADA6:0x3358,0xE5B2B3:0x3359,0xE6A5BD:0x335A,0xE9A18D:0x335B,
0xE9A18E:0x335C,0xE68E9B:0x335D,0xE7ACA0:0x335E,0xE6A8AB:0x335F,0xE6A9BF:0x3360,
0xE6A2B6:0x3361,0xE9B08D:0x3362,0xE6BD9F:0x3363,0xE589B2:0x3364,0xE5969D:0x3365,
0xE681B0:0x3366,0xE68BAC:0x3367,0xE6B4BB:0x3368,0xE6B887:0x3369,0xE6BB91:0x336A,
0xE8919B:0x336B,0xE8A490:0x336C,0xE8BD84:0x336D,0xE4B894:0x336E,0xE9B0B9:0x336F,
0xE58FB6:0x3370,0xE6A49B:0x3371,0xE6A8BA:0x3372,0xE99E84:0x3373,0xE6A0AA:0x3374,
0xE5859C:0x3375,0xE7AB83:0x3376,0xE892B2:0x3377,0xE9879C:0x3378,0xE98E8C:0x3379,
0xE5999B:0x337A,0xE9B4A8:0x337B,0xE6A0A2:0x337C,0xE88C85:0x337D,0xE890B1:0x337E,
0xE7B2A5:0x3421,0xE58888:0x3422,0xE88B85:0x3423,0xE793A6:0x3424,0xE4B9BE:0x3425,
0xE4BE83:0x3426,0xE586A0:0x3427,0xE5AF92:0x3428,0xE5888A:0x3429,0xE58B98:0x342A,
0xE58BA7:0x342B,0xE5B7BB:0x342C,0xE5969A:0x342D,0xE5A0AA:0x342E,0xE5A7A6:0x342F,
0xE5AE8C:0x3430,0xE5AE98:0x3431,0xE5AF9B:0x3432,0xE5B9B2:0x3433,0xE5B9B9:0x3434,
0xE682A3:0x3435,0xE6849F:0x3436,0xE685A3:0x3437,0xE686BE:0x3438,0xE68F9B:0x3439,
0xE695A2:0x343A,0xE69F91:0x343B,0xE6A193:0x343C,0xE6A3BA:0x343D,0xE6ACBE:0x343E,
0xE6AD93:0x343F,0xE6B197:0x3440,0xE6BCA2:0x3441,0xE6BE97:0x3442,0xE6BD85:0x3443,
0xE792B0:0x3444,0xE79498:0x3445,0xE79BA3:0x3446,0xE79C8B:0x3447,0xE7ABBF:0x3448,
0xE7AEA1:0x3449,0xE7B0A1:0x344A,0xE7B7A9:0x344B,0xE7BCB6:0x344C,0xE7BFB0:0x344D,
0xE8829D:0x344E,0xE889A6:0x344F,0xE88E9E:0x3450,0xE8A6B3:0x3451,0xE8AB8C:0x3452,
0xE8B2AB:0x3453,0xE98284:0x3454,0xE99191:0x3455,0xE99693:0x3456,0xE99691:0x3457,
0xE996A2:0x3458,0xE999A5:0x3459,0xE99F93:0x345A,0xE9A4A8:0x345B,0xE88898:0x345C,
0xE4B8B8:0x345D,0xE590AB:0x345E,0xE5B2B8:0x345F,0xE5B78C:0x3460,0xE78EA9:0x3461,
0xE7998C:0x3462,0xE79CBC:0x3463,0xE5B2A9:0x3464,0xE7BFAB:0x3465,0xE8B48B:0x3466,
0xE99B81:0x3467,0xE9A091:0x3468,0xE9A194:0x3469,0xE9A198:0x346A,0xE4BC81:0x346B,
0xE4BC8E:0x346C,0xE58DB1:0x346D,0xE5969C:0x346E,0xE599A8:0x346F,0xE59FBA:0x3470,
0xE5A587:0x3471,0xE5AC89:0x3472,0xE5AF84:0x3473,0xE5B290:0x3474,0xE5B88C:0x3475,
0xE5B9BE:0x3476,0xE5BF8C:0x3477,0xE68FAE:0x3478,0xE69CBA:0x3479,0xE69797:0x347A,
0xE697A2:0x347B,0xE69C9F:0x347C,0xE6A38B:0x347D,0xE6A384:0x347E,0xE6A99F:0x3521,
0xE5B8B0:0x3522,0xE6AF85:0x3523,0xE6B097:0x3524,0xE6B1BD:0x3525,0xE795BF:0x3526,
0xE7A588:0x3527,0xE5ADA3:0x3528,0xE7A880:0x3529,0xE7B480:0x352A,0xE5BEBD:0x352B,
0xE8A68F:0x352C,0xE8A898:0x352D,0xE8B2B4:0x352E,0xE8B5B7:0x352F,0xE8BB8C:0x3530,
0xE8BC9D:0x3531,0xE9A3A2:0x3532,0xE9A88E:0x3533,0xE9ACBC:0x3534,0xE4BA80:0x3535,
0xE581BD:0x3536,0xE58480:0x3537,0xE5A693:0x3538,0xE5AE9C:0x3539,0xE688AF:0x353A,
0xE68A80:0x353B,0xE693AC:0x353C,0xE6ACBA:0x353D,0xE78AA0:0x353E,0xE79691:0x353F,
0xE7A587:0x3540,0xE7BEA9:0x3541,0xE89FBB:0x3542,0xE8AABC:0x3543,0xE8ADB0:0x3544,
0xE68EAC:0x3545,0xE88F8A:0x3546,0xE99EA0:0x3547,0xE59089:0x3548,0xE59083:0x3549,
0xE596AB:0x354A,0xE6A194:0x354B,0xE6A998:0x354C,0xE8A9B0:0x354D,0xE7A0A7:0x354E,
0xE69DB5:0x354F,0xE9BB8D:0x3550,0xE58DB4:0x3551,0xE5AEA2:0x3552,0xE8849A:0x3553,
0xE89990:0x3554,0xE98086:0x3555,0xE4B898:0x3556,0xE4B985:0x3557,0xE4BB87:0x3558,
0xE4BC91:0x3559,0xE58F8A:0x355A,0xE590B8:0x355B,0xE5AEAE:0x355C,0xE5BC93:0x355D,
0xE680A5:0x355E,0xE69591:0x355F,0xE69CBD:0x3560,0xE6B182:0x3561,0xE6B1B2:0x3562,
0xE6B3A3:0x3563,0xE781B8:0x3564,0xE79083:0x3565,0xE7A9B6:0x3566,0xE7AAAE:0x3567,
0xE7AC88:0x3568,0xE7B49A:0x3569,0xE7B3BE:0x356A,0xE7B5A6:0x356B,0xE697A7:0x356C,
0xE7899B:0x356D,0xE58EBB:0x356E,0xE5B185:0x356F,0xE5B7A8:0x3570,0xE68B92:0x3571,
0xE68BA0:0x3572,0xE68C99:0x3573,0xE6B8A0:0x3574,0xE8999A:0x3575,0xE8A8B1:0x3576,
0xE8B79D:0x3577,0xE98BB8:0x3578,0xE6BC81:0x3579,0xE7A6A6:0x357A,0xE9AD9A:0x357B,
0xE4BAA8:0x357C,0xE4BAAB:0x357D,0xE4BAAC:0x357E,0xE4BE9B:0x3621,0xE4BEA0:0x3622,
0xE58391:0x3623,0xE58587:0x3624,0xE7ABB6:0x3625,0xE585B1:0x3626,0xE587B6:0x3627,
0xE58D94:0x3628,0xE58CA1:0x3629,0xE58DBF:0x362A,0xE58FAB:0x362B,0xE596AC:0x362C,
0xE5A283:0x362D,0xE5B3A1:0x362E,0xE5BCB7:0x362F,0xE5BD8A:0x3630,0xE680AF:0x3631,
0xE68190:0x3632,0xE681AD:0x3633,0xE68C9F:0x3634,0xE69599:0x3635,0xE6A98B:0x3636,
0xE6B381:0x3637,0xE78B82:0x3638,0xE78BAD:0x3639,0xE79FAF:0x363A,0xE883B8:0x363B,
0xE88485:0x363C,0xE88888:0x363D,0xE8958E:0x363E,0xE983B7:0x363F,0xE98FA1:0x3640,
0xE99FBF:0x3641,0xE9A597:0x3642,0xE9A99A:0x3643,0xE4BBB0:0x3644,0xE5879D:0x3645,
0xE5B0AD:0x3646,0xE69A81:0x3647,0xE6A5AD:0x3648,0xE5B180:0x3649,0xE69BB2:0x364A,
0xE6A5B5:0x364B,0xE78E89:0x364C,0xE6A190:0x364D,0xE7B281:0x364E,0xE58385:0x364F,
0xE58BA4:0x3650,0xE59D87:0x3651,0xE5B7BE:0x3652,0xE98CA6:0x3653,0xE696A4:0x3654,
0xE6ACA3:0x3655,0xE6ACBD:0x3656,0xE790B4:0x3657,0xE7A681:0x3658,0xE7A6BD:0x3659,
0xE7AD8B:0x365A,0xE7B78A:0x365B,0xE88AB9:0x365C,0xE88F8C:0x365D,0xE8A1BF:0x365E,
0xE8A59F:0x365F,0xE8ACB9:0x3660,0xE8BF91:0x3661,0xE98791:0x3662,0xE5909F:0x3663,
0xE98A80:0x3664,0xE4B99D:0x3665,0xE580B6:0x3666,0xE58FA5:0x3667,0xE58CBA:0x3668,
0xE78B97:0x3669,0xE78E96:0x366A,0xE79FA9:0x366B,0xE88BA6:0x366C,0xE8BAAF:0x366D,
0xE9A786:0x366E,0xE9A788:0x366F,0xE9A792:0x3670,0xE585B7:0x3671,0xE6849A:0x3672,
0xE8999E:0x3673,0xE596B0:0x3674,0xE7A9BA:0x3675,0xE581B6:0x3676,0xE5AF93:0x3677,
0xE98187:0x3678,0xE99A85:0x3679,0xE4B8B2:0x367A,0xE6AB9B:0x367B,0xE987A7:0x367C,
0xE5B191:0x367D,0xE5B188:0x367E,0xE68E98:0x3721,0xE7AA9F:0x3722,0xE6B293:0x3723,
0xE99DB4:0x3724,0xE8BDA1:0x3725,0xE7AAAA:0x3726,0xE7868A:0x3727,0xE99A88:0x3728,
0xE7B282:0x3729,0xE6A097:0x372A,0xE7B9B0:0x372B,0xE6A191:0x372C,0xE98DAC:0x372D,
0xE58BB2:0x372E,0xE5909B:0x372F,0xE896AB:0x3730,0xE8A893:0x3731,0xE7BEA4:0x3732,
0xE8BB8D:0x3733,0xE983A1:0x3734,0xE58DA6:0x3735,0xE8A288:0x3736,0xE7A581:0x3737,
0xE4BF82:0x3738,0xE582BE:0x3739,0xE58891:0x373A,0xE58584:0x373B,0xE59593:0x373C,
0xE59CAD:0x373D,0xE78FAA:0x373E,0xE59E8B:0x373F,0xE5A591:0x3740,0xE5BDA2:0x3741,
0xE5BE84:0x3742,0xE681B5:0x3743,0xE685B6:0x3744,0xE685A7:0x3745,0xE686A9:0x3746,
0xE68EB2:0x3747,0xE690BA:0x3748,0xE695AC:0x3749,0xE699AF:0x374A,0xE6A182:0x374B,
0xE6B893:0x374C,0xE795A6:0x374D,0xE7A8BD:0x374E,0xE7B3BB:0x374F,0xE7B58C:0x3750,
0xE7B699:0x3751,0xE7B98B:0x3752,0xE7BDAB:0x3753,0xE88C8E:0x3754,0xE88D8A:0x3755,
0xE89B8D:0x3756,0xE8A888:0x3757,0xE8A9A3:0x3758,0xE8ADA6:0x3759,0xE8BBBD:0x375A,
0xE9A09A:0x375B,0xE9B68F:0x375C,0xE88AB8:0x375D,0xE8BF8E:0x375E,0xE9AFA8:0x375F,
0xE58A87:0x3760,0xE6889F:0x3761,0xE69283:0x3762,0xE6BF80:0x3763,0xE99A99:0x3764,
0xE6A181:0x3765,0xE58291:0x3766,0xE6ACA0:0x3767,0xE6B1BA:0x3768,0xE6BD94:0x3769,
0xE7A9B4:0x376A,0xE7B590:0x376B,0xE8A180:0x376C,0xE8A8A3:0x376D,0xE69C88:0x376E,
0xE4BBB6:0x376F,0xE580B9:0x3770,0xE580A6:0x3771,0xE581A5:0x3772,0xE585BC:0x3773,
0xE588B8:0x3774,0xE589A3:0x3775,0xE596A7:0x3776,0xE59C8F:0x3777,0xE5A085:0x3778,
0xE5AB8C:0x3779,0xE5BBBA:0x377A,0xE686B2:0x377B,0xE687B8:0x377C,0xE68BB3:0x377D,
0xE68DB2:0x377E,0xE6A49C:0x3821,0xE6A8A9:0x3822,0xE789BD:0x3823,0xE78AAC:0x3824,
0xE78CAE:0x3825,0xE7A094:0x3826,0xE7A1AF:0x3827,0xE7B5B9:0x3828,0xE79C8C:0x3829,
0xE882A9:0x382A,0xE8A68B:0x382B,0xE8AC99:0x382C,0xE8B3A2:0x382D,0xE8BB92:0x382E,
0xE981A3:0x382F,0xE98DB5:0x3830,0xE999BA:0x3831,0xE9A195:0x3832,0xE9A893:0x3833,
0xE9B9B8:0x3834,0xE58583:0x3835,0xE58E9F:0x3836,0xE58EB3:0x3837,0xE5B9BB:0x3838,
0xE5BCA6:0x3839,0xE6B89B:0x383A,0xE6BA90:0x383B,0xE78E84:0x383C,0xE78FBE:0x383D,
0xE7B583:0x383E,0xE888B7:0x383F,0xE8A880:0x3840,0xE8ABBA:0x3841,0xE99990:0x3842,
0xE4B98E:0x3843,0xE5808B:0x3844,0xE58FA4:0x3845,0xE591BC:0x3846,0xE59BBA:0x3847,
0xE5A791:0x3848,0xE5ADA4:0x3849,0xE5B7B1:0x384A,0xE5BAAB:0x384B,0xE5BCA7:0x384C,
0xE688B8:0x384D,0xE69585:0x384E,0xE69EAF:0x384F,0xE6B996:0x3850,0xE78B90:0x3851,
0xE7B38A:0x3852,0xE8A2B4:0x3853,0xE882A1:0x3854,0xE883A1:0x3855,0xE88FB0:0x3856,
0xE8998E:0x3857,0xE8AA87:0x3858,0xE8B7A8:0x3859,0xE988B7:0x385A,0xE99B87:0x385B,
0xE9A1A7:0x385C,0xE9BC93:0x385D,0xE4BA94:0x385E,0xE4BA92:0x385F,0xE4BC8D:0x3860,
0xE58D88:0x3861,0xE59189:0x3862,0xE590BE:0x3863,0xE5A8AF:0x3864,0xE5BE8C:0x3865,
0xE5BEA1:0x3866,0xE6829F:0x3867,0xE6A2A7:0x3868,0xE6AA8E:0x3869,0xE7919A:0x386A,
0xE7A281:0x386B,0xE8AA9E:0x386C,0xE8AAA4:0x386D,0xE8ADB7:0x386E,0xE98690:0x386F,
0xE4B99E:0x3870,0xE9AF89:0x3871,0xE4BAA4:0x3872,0xE4BDBC:0x3873,0xE4BEAF:0x3874,
0xE58099:0x3875,0xE58096:0x3876,0xE58589:0x3877,0xE585AC:0x3878,0xE58A9F:0x3879,
0xE58AB9:0x387A,0xE58BBE:0x387B,0xE58E9A:0x387C,0xE58FA3:0x387D,0xE59091:0x387E,
0xE5908E:0x3921,0xE59689:0x3922,0xE59D91:0x3923,0xE59EA2:0x3924,0xE5A5BD:0x3925,
0xE5AD94:0x3926,0xE5AD9D:0x3927,0xE5AE8F:0x3928,0xE5B7A5:0x3929,0xE5B7A7:0x392A,
0xE5B7B7:0x392B,0xE5B9B8:0x392C,0xE5BA83:0x392D,0xE5BA9A:0x392E,0xE5BAB7:0x392F,
0xE5BC98:0x3930,0xE68192:0x3931,0xE6858C:0x3932,0xE68A97:0x3933,0xE68B98:0x3934,
0xE68EA7:0x3935,0xE694BB:0x3936,0xE69882:0x3937,0xE69983:0x3938,0xE69BB4:0x3939,
0xE69DAD:0x393A,0xE6A0A1:0x393B,0xE6A297:0x393C,0xE6A78B:0x393D,0xE6B19F:0x393E,
0xE6B4AA:0x393F,0xE6B5A9:0x3940,0xE6B8AF:0x3941,0xE6BA9D:0x3942,0xE794B2:0x3943,
0xE79A87:0x3944,0xE7A1AC:0x3945,0xE7A8BF:0x3946,0xE7B3A0:0x3947,0xE7B485:0x3948,
0xE7B498:0x3949,0xE7B59E:0x394A,0xE7B6B1:0x394B,0xE88095:0x394C,0xE88083:0x394D,
0xE882AF:0x394E,0xE882B1:0x394F,0xE88594:0x3950,0xE8868F:0x3951,0xE888AA:0x3952,
0xE88D92:0x3953,0xE8A18C:0x3954,0xE8A1A1:0x3955,0xE8AC9B:0x3956,0xE8B2A2:0x3957,
0xE8B3BC:0x3958,0xE9838A:0x3959,0xE985B5:0x395A,0xE989B1:0x395B,0xE7A0BF:0x395C,
0xE98BBC:0x395D,0xE996A4:0x395E,0xE9998D:0x395F,0xE9A085:0x3960,0xE9A699:0x3961,
0xE9AB98:0x3962,0xE9B4BB:0x3963,0xE5899B:0x3964,0xE58AAB:0x3965,0xE58FB7:0x3966,
0xE59088:0x3967,0xE5A395:0x3968,0xE68BB7:0x3969,0xE6BFA0:0x396A,0xE8B1AA:0x396B,
0xE8BD9F:0x396C,0xE9BAB9:0x396D,0xE5858B:0x396E,0xE588BB:0x396F,0xE5918A:0x3970,
0xE59BBD:0x3971,0xE7A980:0x3972,0xE985B7:0x3973,0xE9B5A0:0x3974,0xE9BB92:0x3975,
0xE78D84:0x3976,0xE6BC89:0x3977,0xE885B0:0x3978,0xE79491:0x3979,0xE5BFBD:0x397A,
0xE6839A:0x397B,0xE9AAA8:0x397C,0xE78B9B:0x397D,0xE8BEBC:0x397E,0xE6ADA4:0x3A21,
0xE9A083:0x3A22,0xE4BB8A:0x3A23,0xE59BB0:0x3A24,0xE59DA4:0x3A25,0xE5A2BE:0x3A26,
0xE5A99A:0x3A27,0xE681A8:0x3A28,0xE68787:0x3A29,0xE6988F:0x3A2A,0xE69886:0x3A2B,
0xE6A0B9:0x3A2C,0xE6A2B1:0x3A2D,0xE6B7B7:0x3A2E,0xE79795:0x3A2F,0xE7B4BA:0x3A30,
0xE889AE:0x3A31,0xE9AD82:0x3A32,0xE4BA9B:0x3A33,0xE4BD90:0x3A34,0xE58F89:0x3A35,
0xE59486:0x3A36,0xE5B5AF:0x3A37,0xE5B7A6:0x3A38,0xE5B7AE:0x3A39,0xE69FBB:0x3A3A,
0xE6B299:0x3A3B,0xE791B3:0x3A3C,0xE7A082:0x3A3D,0xE8A990:0x3A3E,0xE98E96:0x3A3F,
0xE8A39F:0x3A40,0xE59D90:0x3A41,0xE5BAA7:0x3A42,0xE68CAB:0x3A43,0xE582B5:0x3A44,
0xE582AC:0x3A45,0xE5868D:0x3A46,0xE69C80:0x3A47,0xE59389:0x3A48,0xE5A19E:0x3A49,
0xE5A6BB:0x3A4A,0xE5AEB0:0x3A4B,0xE5BDA9:0x3A4C,0xE6898D:0x3A4D,0xE68EA1:0x3A4E,
0xE6A0BD:0x3A4F,0xE6ADB3:0x3A50,0xE6B888:0x3A51,0xE781BD:0x3A52,0xE98787:0x3A53,
0xE78A80:0x3A54,0xE7A095:0x3A55,0xE7A0A6:0x3A56,0xE7A5AD:0x3A57,0xE6968E:0x3A58,
0xE7B4B0:0x3A59,0xE88F9C:0x3A5A,0xE8A381:0x3A5B,0xE8BC89:0x3A5C,0xE99A9B:0x3A5D,
0xE589A4:0x3A5E,0xE59CA8:0x3A5F,0xE69D90:0x3A60,0xE7BDAA:0x3A61,0xE8B2A1:0x3A62,
0xE586B4:0x3A63,0xE59D82:0x3A64,0xE998AA:0x3A65,0xE5A0BA:0x3A66,0xE6A68A:0x3A67,
0xE882B4:0x3A68,0xE592B2:0x3A69,0xE5B48E:0x3A6A,0xE59FBC:0x3A6B,0xE7A295:0x3A6C,
0xE9B7BA:0x3A6D,0xE4BD9C:0x3A6E,0xE5898A:0x3A6F,0xE5928B:0x3A70,0xE690BE:0x3A71,
0xE698A8:0x3A72,0xE69C94:0x3A73,0xE69FB5:0x3A74,0xE7AA84:0x3A75,0xE7AD96:0x3A76,
0xE7B4A2:0x3A77,0xE98CAF:0x3A78,0xE6A19C:0x3A79,0xE9AEAD:0x3A7A,0xE7ACB9:0x3A7B,
0xE58C99:0x3A7C,0xE5868A:0x3A7D,0xE588B7:0x3A7E,0xE5AF9F:0x3B21,0xE68BB6:0x3B22,
0xE692AE:0x3B23,0xE693A6:0x3B24,0xE69CAD:0x3B25,0xE6AEBA:0x3B26,0xE896A9:0x3B27,
0xE99B91:0x3B28,0xE79A90:0x3B29,0xE9AF96:0x3B2A,0xE68D8C:0x3B2B,0xE98C86:0x3B2C,
0xE9AEAB:0x3B2D,0xE79ABF:0x3B2E,0xE69992:0x3B2F,0xE4B889:0x3B30,0xE58298:0x3B31,
0xE58F82:0x3B32,0xE5B1B1:0x3B33,0xE683A8:0x3B34,0xE69292:0x3B35,0xE695A3:0x3B36,
0xE6A19F:0x3B37,0xE787A6:0x3B38,0xE78F8A:0x3B39,0xE794A3:0x3B3A,0xE7AE97:0x3B3B,
0xE7BA82:0x3B3C,0xE89A95:0x3B3D,0xE8AE83:0x3B3E,0xE8B39B:0x3B3F,0xE985B8:0x3B40,
0xE9A490:0x3B41,0xE696AC:0x3B42,0xE69AAB:0x3B43,0xE6AE8B:0x3B44,0xE4BB95:0x3B45,
0xE4BB94:0x3B46,0xE4BCBA:0x3B47,0xE4BDBF:0x3B48,0xE588BA:0x3B49,0xE58FB8:0x3B4A,
0xE58FB2:0x3B4B,0xE597A3:0x3B4C,0xE59B9B:0x3B4D,0xE5A3AB:0x3B4E,0xE5A78B:0x3B4F,
0xE5A789:0x3B50,0xE5A7BF:0x3B51,0xE5AD90:0x3B52,0xE5B18D:0x3B53,0xE5B882:0x3B54,
0xE5B8AB:0x3B55,0xE5BF97:0x3B56,0xE6809D:0x3B57,0xE68C87:0x3B58,0xE694AF:0x3B59,
0xE5AD9C:0x3B5A,0xE696AF:0x3B5B,0xE696BD:0x3B5C,0xE697A8:0x3B5D,0xE69E9D:0x3B5E,
0xE6ADA2:0x3B5F,0xE6ADBB:0x3B60,0xE6B08F:0x3B61,0xE78D85:0x3B62,0xE7A589:0x3B63,
0xE7A781:0x3B64,0xE7B3B8:0x3B65,0xE7B499:0x3B66,0xE7B4AB:0x3B67,0xE882A2:0x3B68,
0xE88482:0x3B69,0xE887B3:0x3B6A,0xE8A696:0x3B6B,0xE8A99E:0x3B6C,0xE8A9A9:0x3B6D,
0xE8A9A6:0x3B6E,0xE8AA8C:0x3B6F,0xE8ABAE:0x3B70,0xE8B387:0x3B71,0xE8B39C:0x3B72,
0xE99B8C:0x3B73,0xE9A3BC:0x3B74,0xE6ADAF:0x3B75,0xE4BA8B:0x3B76,0xE4BCBC:0x3B77,
0xE4BE8D:0x3B78,0xE58590:0x3B79,0xE5AD97:0x3B7A,0xE5AFBA:0x3B7B,0xE68588:0x3B7C,
0xE68C81:0x3B7D,0xE69982:0x3B7E,0xE6ACA1:0x3C21,0xE6BB8B:0x3C22,0xE6B2BB:0x3C23,
0xE788BE:0x3C24,0xE792BD:0x3C25,0xE79794:0x3C26,0xE7A381:0x3C27,0xE7A4BA:0x3C28,
0xE8808C:0x3C29,0xE880B3:0x3C2A,0xE887AA:0x3C2B,0xE89294:0x3C2C,0xE8BE9E:0x3C2D,
0xE6B190:0x3C2E,0xE9B9BF:0x3C2F,0xE5BC8F:0x3C30,0xE8AD98:0x3C31,0xE9B4AB:0x3C32,
0xE7ABBA:0x3C33,0xE8BBB8:0x3C34,0xE5AE8D:0x3C35,0xE99BAB:0x3C36,0xE4B883:0x3C37,
0xE58FB1:0x3C38,0xE59FB7:0x3C39,0xE5A4B1:0x3C3A,0xE5AB89:0x3C3B,0xE5AEA4:0x3C3C,
0xE68289:0x3C3D,0xE6B9BF:0x3C3E,0xE6BC86:0x3C3F,0xE796BE:0x3C40,0xE8B3AA:0x3C41,
0xE5AE9F:0x3C42,0xE89480:0x3C43,0xE7AFA0:0x3C44,0xE581B2:0x3C45,0xE69FB4:0x3C46,
0xE88A9D:0x3C47,0xE5B1A1:0x3C48,0xE8958A:0x3C49,0xE7B89E:0x3C4A,0xE8888E:0x3C4B,
0xE58699:0x3C4C,0xE5B084:0x3C4D,0xE68DA8:0x3C4E,0xE8B5A6:0x3C4F,0xE6969C:0x3C50,
0xE785AE:0x3C51,0xE7A4BE:0x3C52,0xE7B497:0x3C53,0xE88085:0x3C54,0xE8AC9D:0x3C55,
0xE8BB8A:0x3C56,0xE981AE:0x3C57,0xE89B87:0x3C58,0xE982AA:0x3C59,0xE5809F:0x3C5A,
0xE58BBA:0x3C5B,0xE5B0BA:0x3C5C,0xE69D93:0x3C5D,0xE781BC:0x3C5E,0xE788B5:0x3C5F,
0xE9858C:0x3C60,0xE98788:0x3C61,0xE98CAB:0x3C62,0xE88BA5:0x3C63,0xE5AF82:0x3C64,
0xE5BCB1:0x3C65,0xE683B9:0x3C66,0xE4B8BB:0x3C67,0xE58F96:0x3C68,0xE5AE88:0x3C69,
0xE6898B:0x3C6A,0xE69CB1:0x3C6B,0xE6AE8A:0x3C6C,0xE78BA9:0x3C6D,0xE78FA0:0x3C6E,
0xE7A8AE:0x3C6F,0xE885AB:0x3C70,0xE8B6A3:0x3C71,0xE98592:0x3C72,0xE9A696:0x3C73,
0xE58492:0x3C74,0xE58F97:0x3C75,0xE591AA:0x3C76,0xE5AFBF:0x3C77,0xE68E88:0x3C78,
0xE6A8B9:0x3C79,0xE7B6AC:0x3C7A,0xE99C80:0x3C7B,0xE59B9A:0x3C7C,0xE58F8E:0x3C7D,
0xE591A8:0x3C7E,0xE5AE97:0x3D21,0xE5B0B1:0x3D22,0xE5B79E:0x3D23,0xE4BFAE:0x3D24,
0xE68481:0x3D25,0xE68BBE:0x3D26,0xE6B4B2:0x3D27,0xE7A780:0x3D28,0xE7A78B:0x3D29,
0xE7B582:0x3D2A,0xE7B98D:0x3D2B,0xE7BF92:0x3D2C,0xE887AD:0x3D2D,0xE8889F:0x3D2E,
0xE89290:0x3D2F,0xE8A186:0x3D30,0xE8A5B2:0x3D31,0xE8AE90:0x3D32,0xE8B9B4:0x3D33,
0xE8BCAF:0x3D34,0xE980B1:0x3D35,0xE9858B:0x3D36,0xE985AC:0x3D37,0xE99B86:0x3D38,
0xE9869C:0x3D39,0xE4BB80:0x3D3A,0xE4BD8F:0x3D3B,0xE58585:0x3D3C,0xE58D81:0x3D3D,
0xE5BE93:0x3D3E,0xE6888E:0x3D3F,0xE69F94:0x3D40,0xE6B181:0x3D41,0xE6B88B:0x3D42,
0xE78DA3:0x3D43,0xE7B8A6:0x3D44,0xE9878D:0x3D45,0xE98A83:0x3D46,0xE58F94:0x3D47,
0xE5A499:0x3D48,0xE5AEBF:0x3D49,0xE6B791:0x3D4A,0xE7A59D:0x3D4B,0xE7B8AE:0x3D4C,
0xE7B29B:0x3D4D,0xE5A1BE:0x3D4E,0xE7869F:0x3D4F,0xE587BA:0x3D50,0xE8A193:0x3D51,
0xE8BFB0:0x3D52,0xE4BF8A:0x3D53,0xE5B3BB:0x3D54,0xE698A5:0x3D55,0xE79EAC:0x3D56,
0xE7ABA3:0x3D57,0xE8889C:0x3D58,0xE9A7BF:0x3D59,0xE58786:0x3D5A,0xE5BEAA:0x3D5B,
0xE697AC:0x3D5C,0xE6A5AF:0x3D5D,0xE6AE89:0x3D5E,0xE6B7B3:0x3D5F,0xE6BA96:0x3D60,
0xE6BDA4:0x3D61,0xE79BBE:0x3D62,0xE7B494:0x3D63,0xE5B7A1:0x3D64,0xE981B5:0x3D65,
0xE98687:0x3D66,0xE9A086:0x3D67,0xE587A6:0x3D68,0xE5889D:0x3D69,0xE68980:0x3D6A,
0xE69A91:0x3D6B,0xE69B99:0x3D6C,0xE6B89A:0x3D6D,0xE5BAB6:0x3D6E,0xE7B792:0x3D6F,
0xE7BDB2:0x3D70,0xE69BB8:0x3D71,0xE896AF:0x3D72,0xE897B7:0x3D73,0xE8ABB8:0x3D74,
0xE58AA9:0x3D75,0xE58F99:0x3D76,0xE5A5B3:0x3D77,0xE5BA8F:0x3D78,0xE5BE90:0x3D79,
0xE68195:0x3D7A,0xE98BA4:0x3D7B,0xE999A4:0x3D7C,0xE582B7:0x3D7D,0xE5849F:0x3D7E,
0xE58B9D:0x3E21,0xE58CA0:0x3E22,0xE58D87:0x3E23,0xE58FAC:0x3E24,0xE593A8:0x3E25,
0xE59586:0x3E26,0xE594B1:0x3E27,0xE59897:0x3E28,0xE5A5A8:0x3E29,0xE5A6BE:0x3E2A,
0xE5A8BC:0x3E2B,0xE5AEB5:0x3E2C,0xE5B086:0x3E2D,0xE5B08F:0x3E2E,0xE5B091:0x3E2F,
0xE5B09A:0x3E30,0xE5BA84:0x3E31,0xE5BA8A:0x3E32,0xE5BBA0:0x3E33,0xE5BDB0:0x3E34,
0xE689BF:0x3E35,0xE68A84:0x3E36,0xE68B9B:0x3E37,0xE68E8C:0x3E38,0xE68DB7:0x3E39,
0xE69887:0x3E3A,0xE6988C:0x3E3B,0xE698AD:0x3E3C,0xE699B6:0x3E3D,0xE69DBE:0x3E3E,
0xE6A2A2:0x3E3F,0xE6A89F:0x3E40,0xE6A8B5:0x3E41,0xE6B2BC:0x3E42,0xE6B688:0x3E43,
0xE6B889:0x3E44,0xE6B998:0x3E45,0xE784BC:0x3E46,0xE784A6:0x3E47,0xE785A7:0x3E48,
0xE79787:0x3E49,0xE79C81:0x3E4A,0xE7A19D:0x3E4B,0xE7A481:0x3E4C,0xE7A5A5:0x3E4D,
0xE7A7B0:0x3E4E,0xE7ABA0:0x3E4F,0xE7AC91:0x3E50,0xE7B2A7:0x3E51,0xE7B4B9:0x3E52,
0xE88296:0x3E53,0xE88F96:0x3E54,0xE8928B:0x3E55,0xE89589:0x3E56,0xE8A19D:0x3E57,
0xE8A3B3:0x3E58,0xE8A89F:0x3E59,0xE8A8BC:0x3E5A,0xE8A994:0x3E5B,0xE8A9B3:0x3E5C,
0xE8B1A1:0x3E5D,0xE8B39E:0x3E5E,0xE986A4:0x3E5F,0xE989A6:0x3E60,0xE98DBE:0x3E61,
0xE99098:0x3E62,0xE99A9C:0x3E63,0xE99E98:0x3E64,0xE4B88A:0x3E65,0xE4B888:0x3E66,
0xE4B89E:0x3E67,0xE4B997:0x3E68,0xE58697:0x3E69,0xE589B0:0x3E6A,0xE59F8E:0x3E6B,
0xE5A0B4:0x3E6C,0xE5A38C:0x3E6D,0xE5ACA2:0x3E6E,0xE5B8B8:0x3E6F,0xE68385:0x3E70,
0xE693BE:0x3E71,0xE69DA1:0x3E72,0xE69D96:0x3E73,0xE6B584:0x3E74,0xE78AB6:0x3E75,
0xE795B3:0x3E76,0xE7A9A3:0x3E77,0xE892B8:0x3E78,0xE8ADB2:0x3E79,0xE986B8:0x3E7A,
0xE98CA0:0x3E7B,0xE598B1:0x3E7C,0xE59FB4:0x3E7D,0xE9A3BE:0x3E7E,0xE68BAD:0x3F21,
0xE6A48D:0x3F22,0xE6AE96:0x3F23,0xE787AD:0x3F24,0xE7B994:0x3F25,0xE881B7:0x3F26,
0xE889B2:0x3F27,0xE8A7A6:0x3F28,0xE9A39F:0x3F29,0xE89D95:0x3F2A,0xE8BEB1:0x3F2B,
0xE5B0BB:0x3F2C,0xE4BCB8:0x3F2D,0xE4BFA1:0x3F2E,0xE4BEB5:0x3F2F,0xE59487:0x3F30,
0xE5A8A0:0x3F31,0xE5AF9D:0x3F32,0xE5AFA9:0x3F33,0xE5BF83:0x3F34,0xE6858E:0x3F35,
0xE68CAF:0x3F36,0xE696B0:0x3F37,0xE6998B:0x3F38,0xE6A3AE:0x3F39,0xE6A69B:0x3F3A,
0xE6B5B8:0x3F3B,0xE6B7B1:0x3F3C,0xE794B3:0x3F3D,0xE796B9:0x3F3E,0xE79C9F:0x3F3F,
0xE7A59E:0x3F40,0xE7A7A6:0x3F41,0xE7B4B3:0x3F42,0xE887A3:0x3F43,0xE88AAF:0x3F44,
0xE896AA:0x3F45,0xE8A6AA:0x3F46,0xE8A8BA:0x3F47,0xE8BAAB:0x3F48,0xE8BE9B:0x3F49,
0xE980B2:0x3F4A,0xE9879D:0x3F4B,0xE99C87:0x3F4C,0xE4BABA:0x3F4D,0xE4BB81:0x3F4E,
0xE58883:0x3F4F,0xE5A1B5:0x3F50,0xE5A3AC:0x3F51,0xE5B08B:0x3F52,0xE7949A:0x3F53,
0xE5B0BD:0x3F54,0xE8858E:0x3F55,0xE8A88A:0x3F56,0xE8BF85:0x3F57,0xE999A3:0x3F58,
0xE99DAD:0x3F59,0xE7ACA5:0x3F5A,0xE8AB8F:0x3F5B,0xE9A088:0x3F5C,0xE985A2:0x3F5D,
0xE59BB3:0x3F5E,0xE58EA8:0x3F5F,0xE98097:0x3F60,0xE590B9:0x3F61,0xE59E82:0x3F62,
0xE5B8A5:0x3F63,0xE68EA8:0x3F64,0xE6B0B4:0x3F65,0xE7828A:0x3F66,0xE79DA1:0x3F67,
0xE7B28B:0x3F68,0xE7BFA0:0x3F69,0xE8A1B0:0x3F6A,0xE98182:0x3F6B,0xE98594:0x3F6C,
0xE98C90:0x3F6D,0xE98C98:0x3F6E,0xE99A8F:0x3F6F,0xE7919E:0x3F70,0xE9AB84:0x3F71,
0xE5B487:0x3F72,0xE5B5A9:0x3F73,0xE695B0:0x3F74,0xE69EA2:0x3F75,0xE8B6A8:0x3F76,
0xE99B9B:0x3F77,0xE68DAE:0x3F78,0xE69D89:0x3F79,0xE6A499:0x3F7A,0xE88F85:0x3F7B,
0xE9A097:0x3F7C,0xE99B80:0x3F7D,0xE8A3BE:0x3F7E,0xE6BE84:0x4021,0xE691BA:0x4022,
0xE5AFB8:0x4023,0xE4B896:0x4024,0xE780AC:0x4025,0xE7959D:0x4026,0xE698AF:0x4027,
0xE58784:0x4028,0xE588B6:0x4029,0xE58BA2:0x402A,0xE5A793:0x402B,0xE5BE81:0x402C,
0xE680A7:0x402D,0xE68890:0x402E,0xE694BF:0x402F,0xE695B4:0x4030,0xE6989F:0x4031,
0xE699B4:0x4032,0xE6A3B2:0x4033,0xE6A096:0x4034,0xE6ADA3:0x4035,0xE6B885:0x4036,
0xE789B2:0x4037,0xE7949F:0x4038,0xE79B9B:0x4039,0xE7B2BE:0x403A,0xE88196:0x403B,
0xE5A3B0:0x403C,0xE8A3BD:0x403D,0xE8A5BF:0x403E,0xE8AAA0:0x403F,0xE8AA93:0x4040,
0xE8AB8B:0x4041,0xE9809D:0x4042,0xE98692:0x4043,0xE99D92:0x4044,0xE99D99:0x4045,
0xE69689:0x4046,0xE7A88E:0x4047,0xE88486:0x4048,0xE99ABB:0x4049,0xE5B8AD:0x404A,
0xE6839C:0x404B,0xE6889A:0x404C,0xE696A5:0x404D,0xE69894:0x404E,0xE69E90:0x404F,
0xE79FB3:0x4050,0xE7A98D:0x4051,0xE7B18D:0x4052,0xE7B8BE:0x4053,0xE8848A:0x4054,
0xE8B2AC:0x4055,0xE8B5A4:0x4056,0xE8B7A1:0x4057,0xE8B99F:0x4058,0xE7A2A9:0x4059,
0xE58887:0x405A,0xE68B99:0x405B,0xE68EA5:0x405C,0xE69182:0x405D,0xE68A98:0x405E,
0xE8A8AD:0x405F,0xE7AA83:0x4060,0xE7AF80:0x4061,0xE8AAAC:0x4062,0xE99BAA:0x4063,
0xE7B5B6:0x4064,0xE8888C:0x4065,0xE89D89:0x4066,0xE4BB99:0x4067,0xE58588:0x4068,
0xE58D83:0x4069,0xE58DA0:0x406A,0xE5AEA3:0x406B,0xE5B082:0x406C,0xE5B096:0x406D,
0xE5B79D:0x406E,0xE688A6:0x406F,0xE68987:0x4070,0xE692B0:0x4071,0xE6A093:0x4072,
0xE6A0B4:0x4073,0xE6B389:0x4074,0xE6B585:0x4075,0xE6B497:0x4076,0xE69F93:0x4077,
0xE6BD9C:0x4078,0xE7858E:0x4079,0xE785BD:0x407A,0xE6978B:0x407B,0xE7A9BF:0x407C,
0xE7AEAD:0x407D,0xE7B79A:0x407E,0xE7B98A:0x4121,0xE7BEA8:0x4122,0xE885BA:0x4123,
0xE8889B:0x4124,0xE888B9:0x4125,0xE896A6:0x4126,0xE8A9AE:0x4127,0xE8B38E:0x4128,
0xE8B7B5:0x4129,0xE981B8:0x412A,0xE981B7:0x412B,0xE98AAD:0x412C,0xE98A91:0x412D,
0xE99683:0x412E,0xE9AEAE:0x412F,0xE5898D:0x4130,0xE59684:0x4131,0xE6BCB8:0x4132,
0xE784B6:0x4133,0xE585A8:0x4134,0xE7A685:0x4135,0xE7B995:0x4136,0xE886B3:0x4137,
0xE7B38E:0x4138,0xE5998C:0x4139,0xE5A191:0x413A,0xE5B2A8:0x413B,0xE68EAA:0x413C,
0xE69BBE:0x413D,0xE69BBD:0x413E,0xE6A59A:0x413F,0xE78B99:0x4140,0xE7968F:0x4141,
0xE7968E:0x4142,0xE7A48E:0x4143,0xE7A596:0x4144,0xE7A79F:0x4145,0xE7B297:0x4146,
0xE7B4A0:0x4147,0xE7B584:0x4148,0xE89887:0x4149,0xE8A8B4:0x414A,0xE998BB:0x414B,
0xE981A1:0x414C,0xE9BCA0:0x414D,0xE583A7:0x414E,0xE589B5:0x414F,0xE58F8C:0x4150,
0xE58FA2:0x4151,0xE58089:0x4152,0xE596AA:0x4153,0xE5A3AE:0x4154,0xE5A58F:0x4155,
0xE788BD:0x4156,0xE5AE8B:0x4157,0xE5B1A4:0x4158,0xE58C9D:0x4159,0xE683A3:0x415A,
0xE683B3:0x415B,0xE68D9C:0x415C,0xE68E83:0x415D,0xE68CBF:0x415E,0xE68EBB:0x415F,
0xE6938D:0x4160,0xE697A9:0x4161,0xE69BB9:0x4162,0xE5B7A3:0x4163,0xE6A78D:0x4164,
0xE6A7BD:0x4165,0xE6BC95:0x4166,0xE787A5:0x4167,0xE4BA89:0x4168,0xE797A9:0x4169,
0xE79BB8:0x416A,0xE7AA93:0x416B,0xE7B39F:0x416C,0xE7B78F:0x416D,0xE7B69C:0x416E,
0xE881A1:0x416F,0xE88D89:0x4170,0xE88D98:0x4171,0xE891AC:0x4172,0xE892BC:0x4173,
0xE897BB:0x4174,0xE8A385:0x4175,0xE8B5B0:0x4176,0xE98081:0x4177,0xE981AD:0x4178,
0xE98E97:0x4179,0xE99C9C:0x417A,0xE9A892:0x417B,0xE5838F:0x417C,0xE5A297:0x417D,
0xE6868E:0x417E,0xE88793:0x4221,0xE894B5:0x4222,0xE8B488:0x4223,0xE980A0:0x4224,
0xE4BF83:0x4225,0xE581B4:0x4226,0xE58987:0x4227,0xE58DB3:0x4228,0xE681AF:0x4229,
0xE68D89:0x422A,0xE69D9F:0x422B,0xE6B8AC:0x422C,0xE8B6B3:0x422D,0xE9809F:0x422E,
0xE4BF97:0x422F,0xE5B19E:0x4230,0xE8B38A:0x4231,0xE6978F:0x4232,0xE7B69A:0x4233,
0xE58D92:0x4234,0xE8A296:0x4235,0xE585B6:0x4236,0xE68F83:0x4237,0xE5AD98:0x4238,
0xE5ADAB:0x4239,0xE5B08A:0x423A,0xE6908D:0x423B,0xE69D91:0x423C,0xE9819C:0x423D,
0xE4BB96:0x423E,0xE5A49A:0x423F,0xE5A4AA:0x4240,0xE6B1B0:0x4241,0xE8A991:0x4242,
0xE594BE:0x4243,0xE5A095:0x4244,0xE5A6A5:0x4245,0xE683B0:0x4246,0xE68993:0x4247,
0xE69F81:0x4248,0xE888B5:0x4249,0xE6A595:0x424A,0xE99980:0x424B,0xE9A784:0x424C,
0xE9A8A8:0x424D,0xE4BD93:0x424E,0xE5A086:0x424F,0xE5AFBE:0x4250,0xE88090:0x4251,
0xE5B2B1:0x4252,0xE5B8AF:0x4253,0xE5BE85:0x4254,0xE680A0:0x4255,0xE6858B:0x4256,
0xE688B4:0x4257,0xE69BBF:0x4258,0xE6B3B0:0x4259,0xE6BB9E:0x425A,0xE8838E:0x425B,
0xE885BF:0x425C,0xE88B94:0x425D,0xE8A28B:0x425E,0xE8B2B8:0x425F,0xE98080:0x4260,
0xE980AE:0x4261,0xE99A8A:0x4262,0xE9BB9B:0x4263,0xE9AF9B:0x4264,0xE4BBA3:0x4265,
0xE58FB0:0x4266,0xE5A4A7:0x4267,0xE7ACAC:0x4268,0xE9868D:0x4269,0xE9A18C:0x426A,
0xE9B7B9:0x426B,0xE6BB9D:0x426C,0xE780A7:0x426D,0xE58D93:0x426E,0xE59584:0x426F,
0xE5AE85:0x4270,0xE68998:0x4271,0xE68A9E:0x4272,0xE68B93:0x4273,0xE6B2A2:0x4274,
0xE6BFAF:0x4275,0xE790A2:0x4276,0xE8A897:0x4277,0xE990B8:0x4278,0xE6BF81:0x4279,
0xE8ABBE:0x427A,0xE88CB8:0x427B,0xE587A7:0x427C,0xE89BB8:0x427D,0xE58FAA:0x427E,
0xE58FA9:0x4321,0xE4BD86:0x4322,0xE98194:0x4323,0xE8BEB0:0x4324,0xE5A5AA:0x4325,
0xE884B1:0x4326,0xE5B7BD:0x4327,0xE7ABAA:0x4328,0xE8BEBF:0x4329,0xE6A39A:0x432A,
0xE8B0B7:0x432B,0xE78BB8:0x432C,0xE9B188:0x432D,0xE6A8BD:0x432E,0xE8AAB0:0x432F,
0xE4B8B9:0x4330,0xE58D98:0x4331,0xE59886:0x4332,0xE59DA6:0x4333,0xE68B85:0x4334,
0xE68EA2:0x4335,0xE697A6:0x4336,0xE6AD8E:0x4337,0xE6B7A1:0x4338,0xE6B99B:0x4339,
0xE782AD:0x433A,0xE79FAD:0x433B,0xE7ABAF:0x433C,0xE7AEAA:0x433D,0xE7B6BB:0x433E,
0xE880BD:0x433F,0xE88386:0x4340,0xE89B8B:0x4341,0xE8AA95:0x4342,0xE98D9B:0x4343,
0xE59BA3:0x4344,0xE5A387:0x4345,0xE5BCBE:0x4346,0xE696AD:0x4347,0xE69A96:0x4348,
0xE6AA80:0x4349,0xE6AEB5:0x434A,0xE794B7:0x434B,0xE8AB87:0x434C,0xE580A4:0x434D,
0xE79FA5:0x434E,0xE59CB0:0x434F,0xE5BC9B:0x4350,0xE681A5:0x4351,0xE699BA:0x4352,
0xE6B1A0:0x4353,0xE797B4:0x4354,0xE7A89A:0x4355,0xE7BDAE:0x4356,0xE887B4:0x4357,
0xE89C98:0x4358,0xE98185:0x4359,0xE9A6B3:0x435A,0xE7AF89:0x435B,0xE7959C:0x435C,
0xE7ABB9:0x435D,0xE7AD91:0x435E,0xE89384:0x435F,0xE98090:0x4360,0xE7A7A9:0x4361,
0xE7AA92:0x4362,0xE88CB6:0x4363,0xE5ABA1:0x4364,0xE79D80:0x4365,0xE4B8AD:0x4366,
0xE4BBB2:0x4367,0xE5AE99:0x4368,0xE5BFA0:0x4369,0xE68ABD:0x436A,0xE698BC:0x436B,
0xE69FB1:0x436C,0xE6B3A8:0x436D,0xE899AB:0x436E,0xE8A1B7:0x436F,0xE8A8BB:0x4370,
0xE9858E:0x4371,0xE98BB3:0x4372,0xE9A790:0x4373,0xE6A897:0x4374,0xE780A6:0x4375,
0xE78CAA:0x4376,0xE88BA7:0x4377,0xE89197:0x4378,0xE8B2AF:0x4379,0xE4B881:0x437A,
0xE58586:0x437B,0xE5878B:0x437C,0xE5968B:0x437D,0xE5AFB5:0x437E,0xE5B896:0x4421,
0xE5B8B3:0x4422,0xE5BA81:0x4423,0xE5BC94:0x4424,0xE5BCB5:0x4425,0xE5BDAB:0x4426,
0xE5BEB4:0x4427,0xE687B2:0x4428,0xE68C91:0x4429,0xE69AA2:0x442A,0xE69C9D:0x442B,
0xE6BDAE:0x442C,0xE78992:0x442D,0xE794BA:0x442E,0xE79CBA:0x442F,0xE881B4:0x4430,
0xE884B9:0x4431,0xE885B8:0x4432,0xE89DB6:0x4433,0xE8AABF:0x4434,0xE8AB9C:0x4435,
0xE8B685:0x4436,0xE8B7B3:0x4437,0xE98A9A:0x4438,0xE995B7:0x4439,0xE9A082:0x443A,
0xE9B3A5:0x443B,0xE58B85:0x443C,0xE68D97:0x443D,0xE79BB4:0x443E,0xE69C95:0x443F,
0xE6B288:0x4440,0xE78F8D:0x4441,0xE8B383:0x4442,0xE98EAE:0x4443,0xE999B3:0x4444,
0xE6B4A5:0x4445,0xE5A29C:0x4446,0xE6A48E:0x4447,0xE6A78C:0x4448,0xE8BFBD:0x4449,
0xE98E9A:0x444A,0xE7979B:0x444B,0xE9809A:0x444C,0xE5A19A:0x444D,0xE6A082:0x444E,
0xE68EB4:0x444F,0xE6A7BB:0x4450,0xE4BD83:0x4451,0xE6BCAC:0x4452,0xE69F98:0x4453,
0xE8BEBB:0x4454,0xE894A6:0x4455,0xE7B6B4:0x4456,0xE98D94:0x4457,0xE6A4BF:0x4458,
0xE6BDB0:0x4459,0xE59DAA:0x445A,0xE5A3B7:0x445B,0xE5ACAC:0x445C,0xE7B4AC:0x445D,
0xE788AA:0x445E,0xE5908A:0x445F,0xE987A3:0x4460,0xE9B6B4:0x4461,0xE4BAAD:0x4462,
0xE4BD8E:0x4463,0xE5819C:0x4464,0xE581B5:0x4465,0xE58983:0x4466,0xE8B29E:0x4467,
0xE59188:0x4468,0xE5A0A4:0x4469,0xE5AE9A:0x446A,0xE5B89D:0x446B,0xE5BA95:0x446C,
0xE5BAAD:0x446D,0xE5BBB7:0x446E,0xE5BC9F:0x446F,0xE6828C:0x4470,0xE68AB5:0x4471,
0xE68CBA:0x4472,0xE68F90:0x4473,0xE6A2AF:0x4474,0xE6B180:0x4475,0xE7A287:0x4476,
0xE7A68E:0x4477,0xE7A88B:0x4478,0xE7B7A0:0x4479,0xE88987:0x447A,0xE8A882:0x447B,
0xE8ABA6:0x447C,0xE8B984:0x447D,0xE98093:0x447E,0xE982B8:0x4521,0xE984AD:0x4522,
0xE98798:0x4523,0xE9BC8E:0x4524,0xE6B3A5:0x4525,0xE69198:0x4526,0xE693A2:0x4527,
0xE695B5:0x4528,0xE6BBB4:0x4529,0xE79A84:0x452A,0xE7AC9B:0x452B,0xE981A9:0x452C,
0xE98F91:0x452D,0xE6BABA:0x452E,0xE593B2:0x452F,0xE5BEB9:0x4530,0xE692A4:0x4531,
0xE8BD8D:0x4532,0xE8BFAD:0x4533,0xE98984:0x4534,0xE585B8:0x4535,0xE5A1AB:0x4536,
0xE5A4A9:0x4537,0xE5B195:0x4538,0xE5BA97:0x4539,0xE6B7BB:0x453A,0xE7BA8F:0x453B,
0xE7949C:0x453C,0xE8B2BC:0x453D,0xE8BBA2:0x453E,0xE9A19B:0x453F,0xE782B9:0x4540,
0xE4BC9D:0x4541,0xE6AEBF:0x4542,0xE6BEB1:0x4543,0xE794B0:0x4544,0xE99BBB:0x4545,
0xE5858E:0x4546,0xE59090:0x4547,0xE5A0B5:0x4548,0xE5A197:0x4549,0xE5A6AC:0x454A,
0xE5B1A0:0x454B,0xE5BE92:0x454C,0xE69697:0x454D,0xE69D9C:0x454E,0xE6B8A1:0x454F,
0xE799BB:0x4550,0xE88F9F:0x4551,0xE8B3AD:0x4552,0xE98094:0x4553,0xE983BD:0x4554,
0xE98D8D:0x4555,0xE7A0A5:0x4556,0xE7A0BA:0x4557,0xE58AAA:0x4558,0xE5BAA6:0x4559,
0xE59C9F:0x455A,0xE5A5B4:0x455B,0xE68092:0x455C,0xE58092:0x455D,0xE5859A:0x455E,
0xE586AC:0x455F,0xE5878D:0x4560,0xE58880:0x4561,0xE59490:0x4562,0xE5A194:0x4563,
0xE5A198:0x4564,0xE5A597:0x4565,0xE5AE95:0x4566,0xE5B3B6:0x4567,0xE5B68B:0x4568,
0xE682BC:0x4569,0xE68A95:0x456A,0xE690AD:0x456B,0xE69DB1:0x456C,0xE6A183:0x456D,
0xE6A2BC:0x456E,0xE6A39F:0x456F,0xE79B97:0x4570,0xE6B798:0x4571,0xE6B9AF:0x4572,
0xE6B69B:0x4573,0xE781AF:0x4574,0xE78788:0x4575,0xE5BD93:0x4576,0xE79798:0x4577,
0xE7A5B7:0x4578,0xE7AD89:0x4579,0xE7AD94:0x457A,0xE7AD92:0x457B,0xE7B396:0x457C,
0xE7B5B1:0x457D,0xE588B0:0x457E,0xE891A3:0x4621,0xE895A9:0x4622,0xE897A4:0x4623,
0xE8A88E:0x4624,0xE8AC84:0x4625,0xE8B186:0x4626,0xE8B88F:0x4627,0xE98083:0x4628,
0xE9808F:0x4629,0xE99099:0x462A,0xE999B6:0x462B,0xE9A0AD:0x462C,0xE9A8B0:0x462D,
0xE99798:0x462E,0xE5838D:0x462F,0xE58B95:0x4630,0xE5908C:0x4631,0xE5A082:0x4632,
0xE5B08E:0x4633,0xE686A7:0x4634,0xE6929E:0x4635,0xE6B49E:0x4636,0xE79EB3:0x4637,
0xE7ABA5:0x4638,0xE883B4:0x4639,0xE89084:0x463A,0xE98193:0x463B,0xE98A85:0x463C,
0xE5B3A0:0x463D,0xE9B487:0x463E,0xE58CBF:0x463F,0xE5BE97:0x4640,0xE5BEB3:0x4641,
0xE6B69C:0x4642,0xE789B9:0x4643,0xE79DA3:0x4644,0xE7A6BF:0x4645,0xE7AFA4:0x4646,
0xE6AF92:0x4647,0xE78BAC:0x4648,0xE8AAAD:0x4649,0xE6A083:0x464A,0xE6A9A1:0x464B,
0xE587B8:0x464C,0xE7AA81:0x464D,0xE6A4B4:0x464E,0xE5B18A:0x464F,0xE9B3B6:0x4650,
0xE88BAB:0x4651,0xE5AF85:0x4652,0xE98589:0x4653,0xE7809E:0x4654,0xE599B8:0x4655,
0xE5B1AF:0x4656,0xE68387:0x4657,0xE695A6:0x4658,0xE6B28C:0x4659,0xE8B19A:0x465A,
0xE98181:0x465B,0xE9A093:0x465C,0xE59191:0x465D,0xE69B87:0x465E,0xE9888D:0x465F,
0xE5A588:0x4660,0xE982A3:0x4661,0xE58685:0x4662,0xE4B98D:0x4663,0xE587AA:0x4664,
0xE89699:0x4665,0xE8AC8E:0x4666,0xE78198:0x4667,0xE68DBA:0x4668,0xE98D8B:0x4669,
0xE6A5A2:0x466A,0xE9A6B4:0x466B,0xE7B884:0x466C,0xE795B7:0x466D,0xE58D97:0x466E,
0xE6A5A0:0x466F,0xE8BB9F:0x4670,0xE99BA3:0x4671,0xE6B19D:0x4672,0xE4BA8C:0x4673,
0xE5B0BC:0x4674,0xE5BC90:0x4675,0xE8BFA9:0x4676,0xE58C82:0x4677,0xE8B391:0x4678,
0xE88289:0x4679,0xE899B9:0x467A,0xE5BBBF:0x467B,0xE697A5:0x467C,0xE4B9B3:0x467D,
0xE585A5:0x467E,0xE5A682:0x4721,0xE5B0BF:0x4722,0xE99FAE:0x4723,0xE4BBBB:0x4724,
0xE5A68A:0x4725,0xE5BF8D:0x4726,0xE8AA8D:0x4727,0xE6BFA1:0x4728,0xE7A6B0:0x4729,
0xE7A5A2:0x472A,0xE5AFA7:0x472B,0xE891B1:0x472C,0xE78CAB:0x472D,0xE786B1:0x472E,
0xE5B9B4:0x472F,0xE5BFB5:0x4730,0xE68DBB:0x4731,0xE6929A:0x4732,0xE78783:0x4733,
0xE7B298:0x4734,0xE4B983:0x4735,0xE5BBBC:0x4736,0xE4B98B:0x4737,0xE59F9C:0x4738,
0xE59AA2:0x4739,0xE682A9:0x473A,0xE6BF83:0x473B,0xE7B48D:0x473C,0xE883BD:0x473D,
0xE884B3:0x473E,0xE886BF:0x473F,0xE8BEB2:0x4740,0xE8A697:0x4741,0xE89AA4:0x4742,
0xE5B7B4:0x4743,0xE68A8A:0x4744,0xE692AD:0x4745,0xE8A687:0x4746,0xE69DB7:0x4747,
0xE6B3A2:0x4748,0xE6B4BE:0x4749,0xE790B6:0x474A,0xE7A0B4:0x474B,0xE5A986:0x474C,
0xE7BDB5:0x474D,0xE88AAD:0x474E,0xE9A6AC:0x474F,0xE4BFB3:0x4750,0xE5BB83:0x4751,
0xE68B9D:0x4752,0xE68E92:0x4753,0xE69597:0x4754,0xE69DAF:0x4755,0xE79B83:0x4756,
0xE7898C:0x4757,0xE8838C:0x4758,0xE882BA:0x4759,0xE8BCA9:0x475A,0xE9858D:0x475B,
0xE5808D:0x475C,0xE59FB9:0x475D,0xE5AA92:0x475E,0xE6A285:0x475F,0xE6A5B3:0x4760,
0xE785A4:0x4761,0xE78BBD:0x4762,0xE8B2B7:0x4763,0xE5A3B2:0x4764,0xE8B3A0:0x4765,
0xE999AA:0x4766,0xE98099:0x4767,0xE89DBF:0x4768,0xE7A7A4:0x4769,0xE79FA7:0x476A,
0xE890A9:0x476B,0xE4BCAF:0x476C,0xE589A5:0x476D,0xE58D9A:0x476E,0xE68B8D:0x476F,
0xE69F8F:0x4770,0xE6B38A:0x4771,0xE799BD:0x4772,0xE7AE94:0x4773,0xE7B295:0x4774,
0xE888B6:0x4775,0xE89684:0x4776,0xE8BFAB:0x4777,0xE69B9D:0x4778,0xE6BCA0:0x4779,
0xE78886:0x477A,0xE7B89B:0x477B,0xE88EAB:0x477C,0xE9A781:0x477D,0xE9BAA6:0x477E,
0xE587BD:0x4821,0xE7AEB1:0x4822,0xE7A1B2:0x4823,0xE7AEB8:0x4824,0xE88287:0x4825,
0xE7AD88:0x4826,0xE6ABA8:0x4827,0xE5B9A1:0x4828,0xE8828C:0x4829,0xE79591:0x482A,
0xE795A0:0x482B,0xE585AB:0x482C,0xE989A2:0x482D,0xE6BA8C:0x482E,0xE799BA:0x482F,
0xE98697:0x4830,0xE9ABAA:0x4831,0xE4BC90:0x4832,0xE7BDB0:0x4833,0xE68A9C:0x4834,
0xE7AD8F:0x4835,0xE996A5:0x4836,0xE9B3A9:0x4837,0xE599BA:0x4838,0xE5A199:0x4839,
0xE89BA4:0x483A,0xE99ABC:0x483B,0xE4BCB4:0x483C,0xE588A4:0x483D,0xE58D8A:0x483E,
0xE58F8D:0x483F,0xE58F9B:0x4840,0xE5B886:0x4841,0xE690AC:0x4842,0xE69691:0x4843,
0xE69DBF:0x4844,0xE6B0BE:0x4845,0xE6B18E:0x4846,0xE78988:0x4847,0xE78AAF:0x4848,
0xE78FAD:0x4849,0xE79594:0x484A,0xE7B981:0x484B,0xE888AC:0x484C,0xE897A9:0x484D,
0xE8B2A9:0x484E,0xE7AF84:0x484F,0xE98786:0x4850,0xE785A9:0x4851,0xE9A092:0x4852,
0xE9A3AF:0x4853,0xE68CBD:0x4854,0xE699A9:0x4855,0xE795AA:0x4856,0xE79BA4:0x4857,
0xE7A390:0x4858,0xE89583:0x4859,0xE89BAE:0x485A,0xE58CAA:0x485B,0xE58D91:0x485C,
0xE590A6:0x485D,0xE5A683:0x485E,0xE5BA87:0x485F,0xE5BDBC:0x4860,0xE682B2:0x4861,
0xE68989:0x4862,0xE689B9:0x4863,0xE68AAB:0x4864,0xE69690:0x4865,0xE6AF94:0x4866,
0xE6B38C:0x4867,0xE796B2:0x4868,0xE79AAE:0x4869,0xE7A291:0x486A,0xE7A798:0x486B,
0xE7B78B:0x486C,0xE7BDB7:0x486D,0xE882A5:0x486E,0xE8A2AB:0x486F,0xE8AAB9:0x4870,
0xE8B2BB:0x4871,0xE981BF:0x4872,0xE99D9E:0x4873,0xE9A39B:0x4874,0xE6A88B:0x4875,
0xE7B0B8:0x4876,0xE58299:0x4877,0xE5B0BE:0x4878,0xE5BEAE:0x4879,0xE69E87:0x487A,
0xE6AF98:0x487B,0xE790B5:0x487C,0xE79C89:0x487D,0xE7BE8E:0x487E,0xE9BCBB:0x4921,
0xE69F8A:0x4922,0xE7A897:0x4923,0xE58CB9:0x4924,0xE7968B:0x4925,0xE9ABAD:0x4926,
0xE5BDA6:0x4927,0xE8869D:0x4928,0xE88FB1:0x4929,0xE88298:0x492A,0xE5BCBC:0x492B,
0xE5BF85:0x492C,0xE795A2:0x492D,0xE7AD86:0x492E,0xE980BC:0x492F,0xE6A1A7:0x4930,
0xE5A7AB:0x4931,0xE5AA9B:0x4932,0xE7B490:0x4933,0xE799BE:0x4934,0xE8ACAC:0x4935,
0xE4BFB5:0x4936,0xE5BDAA:0x4937,0xE6A899:0x4938,0xE6B0B7:0x4939,0xE6BC82:0x493A,
0xE793A2:0x493B,0xE7A5A8:0x493C,0xE8A1A8:0x493D,0xE8A995:0x493E,0xE8B1B9:0x493F,
0xE5BB9F:0x4940,0xE68F8F:0x4941,0xE79785:0x4942,0xE7A792:0x4943,0xE88B97:0x4944,
0xE98CA8:0x4945,0xE98BB2:0x4946,0xE8929C:0x4947,0xE89BAD:0x4948,0xE9B0AD:0x4949,
0xE59381:0x494A,0xE5BDAC:0x494B,0xE6968C:0x494C,0xE6B59C:0x494D,0xE78095:0x494E,
0xE8B2A7:0x494F,0xE8B393:0x4950,0xE9A0BB:0x4951,0xE6958F:0x4952,0xE793B6:0x4953,
0xE4B88D:0x4954,0xE4BB98:0x4955,0xE59FA0:0x4956,0xE5A4AB:0x4957,0xE5A9A6:0x4958,
0xE5AF8C:0x4959,0xE586A8:0x495A,0xE5B883:0x495B,0xE5BA9C:0x495C,0xE68096:0x495D,
0xE689B6:0x495E,0xE695B7:0x495F,0xE696A7:0x4960,0xE699AE:0x4961,0xE6B5AE:0x4962,
0xE788B6:0x4963,0xE7ACA6:0x4964,0xE88590:0x4965,0xE8869A:0x4966,0xE88A99:0x4967,
0xE8AD9C:0x4968,0xE8B2A0:0x4969,0xE8B3A6:0x496A,0xE8B5B4:0x496B,0xE9989C:0x496C,
0xE99984:0x496D,0xE4BEAE:0x496E,0xE692AB:0x496F,0xE6ADA6:0x4970,0xE8889E:0x4971,
0xE891A1:0x4972,0xE895AA:0x4973,0xE983A8:0x4974,0xE5B081:0x4975,0xE6A593:0x4976,
0xE9A2A8:0x4977,0xE891BA:0x4978,0xE89597:0x4979,0xE4BC8F:0x497A,0xE589AF:0x497B,
0xE5BEA9:0x497C,0xE5B985:0x497D,0xE69C8D:0x497E,0xE7A68F:0x4A21,0xE885B9:0x4A22,
0xE8A487:0x4A23,0xE8A686:0x4A24,0xE6B7B5:0x4A25,0xE5BC97:0x4A26,0xE68995:0x4A27,
0xE6B2B8:0x4A28,0xE4BB8F:0x4A29,0xE789A9:0x4A2A,0xE9AE92:0x4A2B,0xE58886:0x4A2C,
0xE590BB:0x4A2D,0xE599B4:0x4A2E,0xE5A2B3:0x4A2F,0xE686A4:0x4A30,0xE689AE:0x4A31,
0xE7849A:0x4A32,0xE5A5AE:0x4A33,0xE7B289:0x4A34,0xE7B39E:0x4A35,0xE7B49B:0x4A36,
0xE99BB0:0x4A37,0xE69687:0x4A38,0xE8819E:0x4A39,0xE4B899:0x4A3A,0xE4BDB5:0x4A3B,
0xE585B5:0x4A3C,0xE5A180:0x4A3D,0xE5B9A3:0x4A3E,0xE5B9B3:0x4A3F,0xE5BC8A:0x4A40,
0xE69F84:0x4A41,0xE4B8A6:0x4A42,0xE894BD:0x4A43,0xE99689:0x4A44,0xE9999B:0x4A45,
0xE7B1B3:0x4A46,0xE9A081:0x4A47,0xE583BB:0x4A48,0xE5A381:0x4A49,0xE79996:0x4A4A,
0xE7A2A7:0x4A4B,0xE588A5:0x4A4C,0xE79EA5:0x4A4D,0xE89491:0x4A4E,0xE7AE86:0x4A4F,
0xE5818F:0x4A50,0xE5A489:0x4A51,0xE78987:0x4A52,0xE7AF87:0x4A53,0xE7B7A8:0x4A54,
0xE8BEBA:0x4A55,0xE8BF94:0x4A56,0xE9818D:0x4A57,0xE4BEBF:0x4A58,0xE58B89:0x4A59,
0xE5A8A9:0x4A5A,0xE5BC81:0x4A5B,0xE99EAD:0x4A5C,0xE4BF9D:0x4A5D,0xE88897:0x4A5E,
0xE98BAA:0x4A5F,0xE59C83:0x4A60,0xE68D95:0x4A61,0xE6ADA9:0x4A62,0xE794AB:0x4A63,
0xE8A39C:0x4A64,0xE8BC94:0x4A65,0xE7A982:0x4A66,0xE58B9F:0x4A67,0xE5A293:0x4A68,
0xE68595:0x4A69,0xE6888A:0x4A6A,0xE69AAE:0x4A6B,0xE6AF8D:0x4A6C,0xE7B0BF:0x4A6D,
0xE88FA9:0x4A6E,0xE580A3:0x4A6F,0xE4BFB8:0x4A70,0xE58C85:0x4A71,0xE59186:0x4A72,
0xE5A0B1:0x4A73,0xE5A589:0x4A74,0xE5AE9D:0x4A75,0xE5B3B0:0x4A76,0xE5B3AF:0x4A77,
0xE5B4A9:0x4A78,0xE5BA96:0x4A79,0xE68AB1:0x4A7A,0xE68DA7:0x4A7B,0xE694BE:0x4A7C,
0xE696B9:0x4A7D,0xE69C8B:0x4A7E,0xE6B395:0x4B21,0xE6B3A1:0x4B22,0xE783B9:0x4B23,
0xE7A0B2:0x4B24,0xE7B8AB:0x4B25,0xE8839E:0x4B26,0xE88AB3:0x4B27,0xE8908C:0x4B28,
0xE893AC:0x4B29,0xE89C82:0x4B2A,0xE8A492:0x4B2B,0xE8A8AA:0x4B2C,0xE8B18A:0x4B2D,
0xE982A6:0x4B2E,0xE98B92:0x4B2F,0xE9A3BD:0x4B30,0xE9B3B3:0x4B31,0xE9B5AC:0x4B32,
0xE4B98F:0x4B33,0xE4BAA1:0x4B34,0xE5828D:0x4B35,0xE58996:0x4B36,0xE59D8A:0x4B37,
0xE5A6A8:0x4B38,0xE5B8BD:0x4B39,0xE5BF98:0x4B3A,0xE5BF99:0x4B3B,0xE688BF:0x4B3C,
0xE69AB4:0x4B3D,0xE69C9B:0x4B3E,0xE69F90:0x4B3F,0xE6A392:0x4B40,0xE58692:0x4B41,
0xE7B4A1:0x4B42,0xE882AA:0x4B43,0xE886A8:0x4B44,0xE8AC80:0x4B45,0xE8B28C:0x4B46,
0xE8B2BF:0x4B47,0xE989BE:0x4B48,0xE998B2:0x4B49,0xE590A0:0x4B4A,0xE9A0AC:0x4B4B,
0xE58C97:0x4B4C,0xE58395:0x4B4D,0xE58D9C:0x4B4E,0xE5A2A8:0x4B4F,0xE692B2:0x4B50,
0xE69CB4:0x4B51,0xE789A7:0x4B52,0xE79DA6:0x4B53,0xE7A986:0x4B54,0xE987A6:0x4B55,
0xE58B83:0x4B56,0xE6B2A1:0x4B57,0xE6AE86:0x4B58,0xE5A080:0x4B59,0xE5B98C:0x4B5A,
0xE5A594:0x4B5B,0xE69CAC:0x4B5C,0xE7BFBB:0x4B5D,0xE587A1:0x4B5E,0xE79B86:0x4B5F,
0xE691A9:0x4B60,0xE7A3A8:0x4B61,0xE9AD94:0x4B62,0xE9BABB:0x4B63,0xE59F8B:0x4B64,
0xE5A6B9:0x4B65,0xE698A7:0x4B66,0xE69E9A:0x4B67,0xE6AF8E:0x4B68,0xE593A9:0x4B69,
0xE6A799:0x4B6A,0xE5B995:0x4B6B,0xE8869C:0x4B6C,0xE69E95:0x4B6D,0xE9AEAA:0x4B6E,
0xE69FBE:0x4B6F,0xE9B192:0x4B70,0xE6A19D:0x4B71,0xE4BAA6:0x4B72,0xE4BFA3:0x4B73,
0xE58F88:0x4B74,0xE68AB9:0x4B75,0xE69CAB:0x4B76,0xE6B2AB:0x4B77,0xE8BF84:0x4B78,
0xE4BEAD:0x4B79,0xE7B9AD:0x4B7A,0xE9BABF:0x4B7B,0xE4B887:0x4B7C,0xE685A2:0x4B7D,
0xE6BA80:0x4B7E,0xE6BCAB:0x4C21,0xE89493:0x4C22,0xE591B3:0x4C23,0xE69CAA:0x4C24,
0xE9AD85:0x4C25,0xE5B7B3:0x4C26,0xE7AE95:0x4C27,0xE5B2AC:0x4C28,0xE5AF86:0x4C29,
0xE89C9C:0x4C2A,0xE6B98A:0x4C2B,0xE89391:0x4C2C,0xE7A894:0x4C2D,0xE88488:0x4C2E,
0xE5A699:0x4C2F,0xE7B28D:0x4C30,0xE6B091:0x4C31,0xE79CA0:0x4C32,0xE58B99:0x4C33,
0xE5A4A2:0x4C34,0xE784A1:0x4C35,0xE7899F:0x4C36,0xE79F9B:0x4C37,0xE99CA7:0x4C38,
0xE9B5A1:0x4C39,0xE6A48B:0x4C3A,0xE5A9BF:0x4C3B,0xE5A898:0x4C3C,0xE586A5:0x4C3D,
0xE5908D:0x4C3E,0xE591BD:0x4C3F,0xE6988E:0x4C40,0xE79B9F:0x4C41,0xE8BFB7:0x4C42,
0xE98A98:0x4C43,0xE9B3B4:0x4C44,0xE5A7AA:0x4C45,0xE7899D:0x4C46,0xE6BB85:0x4C47,
0xE5858D:0x4C48,0xE6A389:0x4C49,0xE7B6BF:0x4C4A,0xE7B7AC:0x4C4B,0xE99DA2:0x4C4C,
0xE9BABA:0x4C4D,0xE691B8:0x4C4E,0xE6A8A1:0x4C4F,0xE88C82:0x4C50,0xE5A684:0x4C51,
0xE5AD9F:0x4C52,0xE6AF9B:0x4C53,0xE78C9B:0x4C54,0xE79BB2:0x4C55,0xE7B6B2:0x4C56,
0xE88097:0x4C57,0xE89299:0x4C58,0xE584B2:0x4C59,0xE69CA8:0x4C5A,0xE9BB99:0x4C5B,
0xE79BAE:0x4C5C,0xE69DA2:0x4C5D,0xE58BBF:0x4C5E,0xE9A485:0x4C5F,0xE5B0A4:0x4C60,
0xE688BB:0x4C61,0xE7B1BE:0x4C62,0xE8B2B0:0x4C63,0xE5958F:0x4C64,0xE682B6:0x4C65,
0xE7B48B:0x4C66,0xE99680:0x4C67,0xE58C81:0x4C68,0xE4B99F:0x4C69,0xE586B6:0x4C6A,
0xE5A49C:0x4C6B,0xE788BA:0x4C6C,0xE880B6:0x4C6D,0xE9878E:0x4C6E,0xE5BCA5:0x4C6F,
0xE79FA2:0x4C70,0xE58E84:0x4C71,0xE5BDB9:0x4C72,0xE7B484:0x4C73,0xE896AC:0x4C74,
0xE8A8B3:0x4C75,0xE8BA8D:0x4C76,0xE99D96:0x4C77,0xE69FB3:0x4C78,0xE896AE:0x4C79,
0xE99193:0x4C7A,0xE68489:0x4C7B,0xE68488:0x4C7C,0xE6B2B9:0x4C7D,0xE79992:0x4C7E,
0xE8ABAD:0x4D21,0xE8BCB8:0x4D22,0xE594AF:0x4D23,0xE4BD91:0x4D24,0xE584AA:0x4D25,
0xE58B87:0x4D26,0xE58F8B:0x4D27,0xE5AEA5:0x4D28,0xE5B9BD:0x4D29,0xE682A0:0x4D2A,
0xE68682:0x4D2B,0xE68F96:0x4D2C,0xE69C89:0x4D2D,0xE69F9A:0x4D2E,0xE6B9A7:0x4D2F,
0xE6B68C:0x4D30,0xE78CB6:0x4D31,0xE78CB7:0x4D32,0xE794B1:0x4D33,0xE7A590:0x4D34,
0xE8A395:0x4D35,0xE8AA98:0x4D36,0xE9818A:0x4D37,0xE98291:0x4D38,0xE983B5:0x4D39,
0xE99B84:0x4D3A,0xE89E8D:0x4D3B,0xE5A495:0x4D3C,0xE4BA88:0x4D3D,0xE4BD99:0x4D3E,
0xE4B88E:0x4D3F,0xE8AA89:0x4D40,0xE8BCBF:0x4D41,0xE9A090:0x4D42,0xE582AD:0x4D43,
0xE5B9BC:0x4D44,0xE5A696:0x4D45,0xE5AEB9:0x4D46,0xE5BAB8:0x4D47,0xE68F9A:0x4D48,
0xE68FBA:0x4D49,0xE69381:0x4D4A,0xE69B9C:0x4D4B,0xE6A58A:0x4D4C,0xE6A798:0x4D4D,
0xE6B48B:0x4D4E,0xE6BAB6:0x4D4F,0xE78694:0x4D50,0xE794A8:0x4D51,0xE7AAAF:0x4D52,
0xE7BE8A:0x4D53,0xE88080:0x4D54,0xE89189:0x4D55,0xE89389:0x4D56,0xE8A681:0x4D57,
0xE8ACA1:0x4D58,0xE8B88A:0x4D59,0xE981A5:0x4D5A,0xE999BD:0x4D5B,0xE9A48A:0x4D5C,
0xE685BE:0x4D5D,0xE68A91:0x4D5E,0xE6ACB2:0x4D5F,0xE6B283:0x4D60,0xE6B5B4:0x4D61,
0xE7BF8C:0x4D62,0xE7BFBC:0x4D63,0xE6B780:0x4D64,0xE7BE85:0x4D65,0xE89EBA:0x4D66,
0xE8A3B8:0x4D67,0xE69DA5:0x4D68,0xE88EB1:0x4D69,0xE9A0BC:0x4D6A,0xE99BB7:0x4D6B,
0xE6B49B:0x4D6C,0xE7B5A1:0x4D6D,0xE890BD:0x4D6E,0xE985AA:0x4D6F,0xE4B9B1:0x4D70,
0xE58DB5:0x4D71,0xE5B590:0x4D72,0xE6AC84:0x4D73,0xE6BFAB:0x4D74,0xE8978D:0x4D75,
0xE898AD:0x4D76,0xE8A6A7:0x4D77,0xE588A9:0x4D78,0xE5908F:0x4D79,0xE5B1A5:0x4D7A,
0xE69D8E:0x4D7B,0xE6A2A8:0x4D7C,0xE79086:0x4D7D,0xE79283:0x4D7E,0xE797A2:0x4E21,
0xE8A38F:0x4E22,0xE8A3A1:0x4E23,0xE9878C:0x4E24,0xE99BA2:0x4E25,0xE999B8:0x4E26,
0xE5BE8B:0x4E27,0xE78E87:0x4E28,0xE7AB8B:0x4E29,0xE8918E:0x4E2A,0xE68EA0:0x4E2B,
0xE795A5:0x4E2C,0xE58A89:0x4E2D,0xE6B581:0x4E2E,0xE6BA9C:0x4E2F,0xE79089:0x4E30,
0xE79599:0x4E31,0xE7A1AB:0x4E32,0xE7B292:0x4E33,0xE99A86:0x4E34,0xE7AB9C:0x4E35,
0xE9BE8D:0x4E36,0xE4BEB6:0x4E37,0xE685AE:0x4E38,0xE69785:0x4E39,0xE8999C:0x4E3A,
0xE4BA86:0x4E3B,0xE4BAAE:0x4E3C,0xE5839A:0x4E3D,0xE4B8A1:0x4E3E,0xE5878C:0x4E3F,
0xE5AFAE:0x4E40,0xE69699:0x4E41,0xE6A281:0x4E42,0xE6B6BC:0x4E43,0xE78C9F:0x4E44,
0xE79982:0x4E45,0xE79EAD:0x4E46,0xE7A89C:0x4E47,0xE7B3A7:0x4E48,0xE889AF:0x4E49,
0xE8AB92:0x4E4A,0xE981BC:0x4E4B,0xE9878F:0x4E4C,0xE999B5:0x4E4D,0xE9A098:0x4E4E,
0xE58A9B:0x4E4F,0xE7B791:0x4E50,0xE580AB:0x4E51,0xE58E98:0x4E52,0xE69E97:0x4E53,
0xE6B78B:0x4E54,0xE78790:0x4E55,0xE790B3:0x4E56,0xE887A8:0x4E57,0xE8BCAA:0x4E58,
0xE99AA3:0x4E59,0xE9B197:0x4E5A,0xE9BA9F:0x4E5B,0xE791A0:0x4E5C,0xE5A181:0x4E5D,
0xE6B699:0x4E5E,0xE7B4AF:0x4E5F,0xE9A19E:0x4E60,0xE4BBA4:0x4E61,0xE4BCB6:0x4E62,
0xE4BE8B:0x4E63,0xE586B7:0x4E64,0xE58AB1:0x4E65,0xE5B6BA:0x4E66,0xE6809C:0x4E67,
0xE78EB2:0x4E68,0xE7A4BC:0x4E69,0xE88B93:0x4E6A,0xE988B4:0x4E6B,0xE99AB7:0x4E6C,
0xE99BB6:0x4E6D,0xE99C8A:0x4E6E,0xE9BA97:0x4E6F,0xE9BDA2:0x4E70,0xE69AA6:0x4E71,
0xE6ADB4:0x4E72,0xE58897:0x4E73,0xE58AA3:0x4E74,0xE78388:0x4E75,0xE8A382:0x4E76,
0xE5BB89:0x4E77,0xE6818B:0x4E78,0xE68690:0x4E79,0xE6BCA3:0x4E7A,0xE78589:0x4E7B,
0xE7B0BE:0x4E7C,0xE7B7B4:0x4E7D,0xE881AF:0x4E7E,0xE893AE:0x4F21,0xE980A3:0x4F22,
0xE98CAC:0x4F23,0xE59182:0x4F24,0xE9ADAF:0x4F25,0xE6AB93:0x4F26,0xE78289:0x4F27,
0xE8B382:0x4F28,0xE8B7AF:0x4F29,0xE99CB2:0x4F2A,0xE58AB4:0x4F2B,0xE5A981:0x4F2C,
0xE5BB8A:0x4F2D,0xE5BC84:0x4F2E,0xE69C97:0x4F2F,0xE6A5BC:0x4F30,0xE6A694:0x4F31,
0xE6B5AA:0x4F32,0xE6BC8F:0x4F33,0xE789A2:0x4F34,0xE78BBC:0x4F35,0xE7AFAD:0x4F36,
0xE88081:0x4F37,0xE881BE:0x4F38,0xE89D8B:0x4F39,0xE9838E:0x4F3A,0xE585AD:0x4F3B,
0xE9BA93:0x4F3C,0xE7A684:0x4F3D,0xE8828B:0x4F3E,0xE98CB2:0x4F3F,0xE8AB96:0x4F40,
0xE580AD:0x4F41,0xE5928C:0x4F42,0xE8A9B1:0x4F43,0xE6ADAA:0x4F44,0xE8B384:0x4F45,
0xE88487:0x4F46,0xE68391:0x4F47,0xE69EA0:0x4F48,0xE9B7B2:0x4F49,0xE4BA99:0x4F4A,
0xE4BA98:0x4F4B,0xE9B090:0x4F4C,0xE8A9AB:0x4F4D,0xE89781:0x4F4E,0xE895A8:0x4F4F,
0xE6A480:0x4F50,0xE6B9BE:0x4F51,0xE7A297:0x4F52,0xE88595:0x4F53,0xE5BC8C:0x5021,
0xE4B890:0x5022,0xE4B895:0x5023,0xE4B8AA:0x5024,0xE4B8B1:0x5025,0xE4B8B6:0x5026,
0xE4B8BC:0x5027,0xE4B8BF:0x5028,0xE4B982:0x5029,0xE4B996:0x502A,0xE4B998:0x502B,
0xE4BA82:0x502C,0xE4BA85:0x502D,0xE8B1AB:0x502E,0xE4BA8A:0x502F,0xE88892:0x5030,
0xE5BC8D:0x5031,0xE4BA8E:0x5032,0xE4BA9E:0x5033,0xE4BA9F:0x5034,0xE4BAA0:0x5035,
0xE4BAA2:0x5036,0xE4BAB0:0x5037,0xE4BAB3:0x5038,0xE4BAB6:0x5039,0xE4BB8E:0x503A,
0xE4BB8D:0x503B,0xE4BB84:0x503C,0xE4BB86:0x503D,0xE4BB82:0x503E,0xE4BB97:0x503F,
0xE4BB9E:0x5040,0xE4BBAD:0x5041,0xE4BB9F:0x5042,0xE4BBB7:0x5043,0xE4BC89:0x5044,
0xE4BD9A:0x5045,0xE4BCB0:0x5046,0xE4BD9B:0x5047,0xE4BD9D:0x5048,0xE4BD97:0x5049,
0xE4BD87:0x504A,0xE4BDB6:0x504B,0xE4BE88:0x504C,0xE4BE8F:0x504D,0xE4BE98:0x504E,
0xE4BDBB:0x504F,0xE4BDA9:0x5050,0xE4BDB0:0x5051,0xE4BE91:0x5052,0xE4BDAF:0x5053,
0xE4BE86:0x5054,0xE4BE96:0x5055,0xE58498:0x5056,0xE4BF94:0x5057,0xE4BF9F:0x5058,
0xE4BF8E:0x5059,0xE4BF98:0x505A,0xE4BF9B:0x505B,0xE4BF91:0x505C,0xE4BF9A:0x505D,
0xE4BF90:0x505E,0xE4BFA4:0x505F,0xE4BFA5:0x5060,0xE5809A:0x5061,0xE580A8:0x5062,
0xE58094:0x5063,0xE580AA:0x5064,0xE580A5:0x5065,0xE58085:0x5066,0xE4BC9C:0x5067,
0xE4BFB6:0x5068,0xE580A1:0x5069,0xE580A9:0x506A,0xE580AC:0x506B,0xE4BFBE:0x506C,
0xE4BFAF:0x506D,0xE58091:0x506E,0xE58086:0x506F,0xE58183:0x5070,0xE58187:0x5071,
0xE69C83:0x5072,0xE58195:0x5073,0xE58190:0x5074,0xE58188:0x5075,0xE5819A:0x5076,
0xE58196:0x5077,0xE581AC:0x5078,0xE581B8:0x5079,0xE58280:0x507A,0xE5829A:0x507B,
0xE58285:0x507C,0xE582B4:0x507D,0xE582B2:0x507E,0xE58389:0x5121,0xE5838A:0x5122,
0xE582B3:0x5123,0xE58382:0x5124,0xE58396:0x5125,0xE5839E:0x5126,0xE583A5:0x5127,
0xE583AD:0x5128,0xE583A3:0x5129,0xE583AE:0x512A,0xE583B9:0x512B,0xE583B5:0x512C,
0xE58489:0x512D,0xE58481:0x512E,0xE58482:0x512F,0xE58496:0x5130,0xE58495:0x5131,
0xE58494:0x5132,0xE5849A:0x5133,0xE584A1:0x5134,0xE584BA:0x5135,0xE584B7:0x5136,
0xE584BC:0x5137,0xE584BB:0x5138,0xE584BF:0x5139,0xE58580:0x513A,0xE58592:0x513B,
0xE5858C:0x513C,0xE58594:0x513D,0xE585A2:0x513E,0xE7ABB8:0x513F,0xE585A9:0x5140,
0xE585AA:0x5141,0xE585AE:0x5142,0xE58680:0x5143,0xE58682:0x5144,0xE59B98:0x5145,
0xE5868C:0x5146,0xE58689:0x5147,0xE5868F:0x5148,0xE58691:0x5149,0xE58693:0x514A,
0xE58695:0x514B,0xE58696:0x514C,0xE586A4:0x514D,0xE586A6:0x514E,0xE586A2:0x514F,
0xE586A9:0x5150,0xE586AA:0x5151,0xE586AB:0x5152,0xE586B3:0x5153,0xE586B1:0x5154,
0xE586B2:0x5155,0xE586B0:0x5156,0xE586B5:0x5157,0xE586BD:0x5158,0xE58785:0x5159,
0xE58789:0x515A,0xE5879B:0x515B,0xE587A0:0x515C,0xE89995:0x515D,0xE587A9:0x515E,
0xE587AD:0x515F,0xE587B0:0x5160,0xE587B5:0x5161,0xE587BE:0x5162,0xE58884:0x5163,
0xE5888B:0x5164,0xE58894:0x5165,0xE5888E:0x5166,0xE588A7:0x5167,0xE588AA:0x5168,
0xE588AE:0x5169,0xE588B3:0x516A,0xE588B9:0x516B,0xE5898F:0x516C,0xE58984:0x516D,
0xE5898B:0x516E,0xE5898C:0x516F,0xE5899E:0x5170,0xE58994:0x5171,0xE589AA:0x5172,
0xE589B4:0x5173,0xE589A9:0x5174,0xE589B3:0x5175,0xE589BF:0x5176,0xE589BD:0x5177,
0xE58A8D:0x5178,0xE58A94:0x5179,0xE58A92:0x517A,0xE589B1:0x517B,0xE58A88:0x517C,
0xE58A91:0x517D,0xE8BEA8:0x517E,0xE8BEA7:0x5221,0xE58AAC:0x5222,0xE58AAD:0x5223,
0xE58ABC:0x5224,0xE58AB5:0x5225,0xE58B81:0x5226,0xE58B8D:0x5227,0xE58B97:0x5228,
0xE58B9E:0x5229,0xE58BA3:0x522A,0xE58BA6:0x522B,0xE9A3AD:0x522C,0xE58BA0:0x522D,
0xE58BB3:0x522E,0xE58BB5:0x522F,0xE58BB8:0x5230,0xE58BB9:0x5231,0xE58C86:0x5232,
0xE58C88:0x5233,0xE794B8:0x5234,0xE58C8D:0x5235,0xE58C90:0x5236,0xE58C8F:0x5237,
0xE58C95:0x5238,0xE58C9A:0x5239,0xE58CA3:0x523A,0xE58CAF:0x523B,0xE58CB1:0x523C,
0xE58CB3:0x523D,0xE58CB8:0x523E,0xE58D80:0x523F,0xE58D86:0x5240,0xE58D85:0x5241,
0xE4B897:0x5242,0xE58D89:0x5243,0xE58D8D:0x5244,0xE58796:0x5245,0xE58D9E:0x5246,
0xE58DA9:0x5247,0xE58DAE:0x5248,0xE5A498:0x5249,0xE58DBB:0x524A,0xE58DB7:0x524B,
0xE58E82:0x524C,0xE58E96:0x524D,0xE58EA0:0x524E,0xE58EA6:0x524F,0xE58EA5:0x5250,
0xE58EAE:0x5251,0xE58EB0:0x5252,0xE58EB6:0x5253,0xE58F83:0x5254,0xE7B092:0x5255,
0xE99B99:0x5256,0xE58F9F:0x5257,0xE69BBC:0x5258,0xE787AE:0x5259,0xE58FAE:0x525A,
0xE58FA8:0x525B,0xE58FAD:0x525C,0xE58FBA:0x525D,0xE59081:0x525E,0xE590BD:0x525F,
0xE59180:0x5260,0xE590AC:0x5261,0xE590AD:0x5262,0xE590BC:0x5263,0xE590AE:0x5264,
0xE590B6:0x5265,0xE590A9:0x5266,0xE5909D:0x5267,0xE5918E:0x5268,0xE5928F:0x5269,
0xE591B5:0x526A,0xE5928E:0x526B,0xE5919F:0x526C,0xE591B1:0x526D,0xE591B7:0x526E,
0xE591B0:0x526F,0xE59292:0x5270,0xE591BB:0x5271,0xE59280:0x5272,0xE591B6:0x5273,
0xE59284:0x5274,0xE59290:0x5275,0xE59286:0x5276,0xE59387:0x5277,0xE592A2:0x5278,
0xE592B8:0x5279,0xE592A5:0x527A,0xE592AC:0x527B,0xE59384:0x527C,0xE59388:0x527D,
0xE592A8:0x527E,0xE592AB:0x5321,0xE59382:0x5322,0xE592A4:0x5323,0xE592BE:0x5324,
0xE592BC:0x5325,0xE59398:0x5326,0xE593A5:0x5327,0xE593A6:0x5328,0xE5948F:0x5329,
0xE59494:0x532A,0xE593BD:0x532B,0xE593AE:0x532C,0xE593AD:0x532D,0xE593BA:0x532E,
0xE593A2:0x532F,0xE594B9:0x5330,0xE59580:0x5331,0xE595A3:0x5332,0xE5958C:0x5333,
0xE594AE:0x5334,0xE5959C:0x5335,0xE59585:0x5336,0xE59596:0x5337,0xE59597:0x5338,
0xE594B8:0x5339,0xE594B3:0x533A,0xE5959D:0x533B,0xE59699:0x533C,0xE59680:0x533D,
0xE592AF:0x533E,0xE5968A:0x533F,0xE5969F:0x5340,0xE595BB:0x5341,0xE595BE:0x5342,
0xE59698:0x5343,0xE5969E:0x5344,0xE596AE:0x5345,0xE595BC:0x5346,0xE59683:0x5347,
0xE596A9:0x5348,0xE59687:0x5349,0xE596A8:0x534A,0xE5979A:0x534B,0xE59785:0x534C,
0xE5979F:0x534D,0xE59784:0x534E,0xE5979C:0x534F,0xE597A4:0x5350,0xE59794:0x5351,
0xE59894:0x5352,0xE597B7:0x5353,0xE59896:0x5354,0xE597BE:0x5355,0xE597BD:0x5356,
0xE5989B:0x5357,0xE597B9:0x5358,0xE5998E:0x5359,0xE59990:0x535A,0xE7879F:0x535B,
0xE598B4:0x535C,0xE598B6:0x535D,0xE598B2:0x535E,0xE598B8:0x535F,0xE599AB:0x5360,
0xE599A4:0x5361,0xE598AF:0x5362,0xE599AC:0x5363,0xE599AA:0x5364,0xE59A86:0x5365,
0xE59A80:0x5366,0xE59A8A:0x5367,0xE59AA0:0x5368,0xE59A94:0x5369,0xE59A8F:0x536A,
0xE59AA5:0x536B,0xE59AAE:0x536C,0xE59AB6:0x536D,0xE59AB4:0x536E,0xE59B82:0x536F,
0xE59ABC:0x5370,0xE59B81:0x5371,0xE59B83:0x5372,0xE59B80:0x5373,0xE59B88:0x5374,
0xE59B8E:0x5375,0xE59B91:0x5376,0xE59B93:0x5377,0xE59B97:0x5378,0xE59BAE:0x5379,
0xE59BB9:0x537A,0xE59C80:0x537B,0xE59BBF:0x537C,0xE59C84:0x537D,0xE59C89:0x537E,
0xE59C88:0x5421,0xE59C8B:0x5422,0xE59C8D:0x5423,0xE59C93:0x5424,0xE59C98:0x5425,
0xE59C96:0x5426,0xE59787:0x5427,0xE59C9C:0x5428,0xE59CA6:0x5429,0xE59CB7:0x542A,
0xE59CB8:0x542B,0xE59D8E:0x542C,0xE59CBB:0x542D,0xE59D80:0x542E,0xE59D8F:0x542F,
0xE59DA9:0x5430,0xE59F80:0x5431,0xE59E88:0x5432,0xE59DA1:0x5433,0xE59DBF:0x5434,
0xE59E89:0x5435,0xE59E93:0x5436,0xE59EA0:0x5437,0xE59EB3:0x5438,0xE59EA4:0x5439,
0xE59EAA:0x543A,0xE59EB0:0x543B,0xE59F83:0x543C,0xE59F86:0x543D,0xE59F94:0x543E,
0xE59F92:0x543F,0xE59F93:0x5440,0xE5A08A:0x5441,0xE59F96:0x5442,0xE59FA3:0x5443,
0xE5A08B:0x5444,0xE5A099:0x5445,0xE5A09D:0x5446,0xE5A1B2:0x5447,0xE5A0A1:0x5448,
0xE5A1A2:0x5449,0xE5A18B:0x544A,0xE5A1B0:0x544B,0xE6AF80:0x544C,0xE5A192:0x544D,
0xE5A0BD:0x544E,0xE5A1B9:0x544F,0xE5A285:0x5450,0xE5A2B9:0x5451,0xE5A29F:0x5452,
0xE5A2AB:0x5453,0xE5A2BA:0x5454,0xE5A39E:0x5455,0xE5A2BB:0x5456,0xE5A2B8:0x5457,
0xE5A2AE:0x5458,0xE5A385:0x5459,0xE5A393:0x545A,0xE5A391:0x545B,0xE5A397:0x545C,
0xE5A399:0x545D,0xE5A398:0x545E,0xE5A3A5:0x545F,0xE5A39C:0x5460,0xE5A3A4:0x5461,
0xE5A39F:0x5462,0xE5A3AF:0x5463,0xE5A3BA:0x5464,0xE5A3B9:0x5465,0xE5A3BB:0x5466,
0xE5A3BC:0x5467,0xE5A3BD:0x5468,0xE5A482:0x5469,0xE5A48A:0x546A,0xE5A490:0x546B,
0xE5A49B:0x546C,0xE6A2A6:0x546D,0xE5A4A5:0x546E,0xE5A4AC:0x546F,0xE5A4AD:0x5470,
0xE5A4B2:0x5471,0xE5A4B8:0x5472,0xE5A4BE:0x5473,0xE7AB92:0x5474,0xE5A595:0x5475,
0xE5A590:0x5476,0xE5A58E:0x5477,0xE5A59A:0x5478,0xE5A598:0x5479,0xE5A5A2:0x547A,
0xE5A5A0:0x547B,0xE5A5A7:0x547C,0xE5A5AC:0x547D,0xE5A5A9:0x547E,0xE5A5B8:0x5521,
0xE5A681:0x5522,0xE5A69D:0x5523,0xE4BD9E:0x5524,0xE4BEAB:0x5525,0xE5A6A3:0x5526,
0xE5A6B2:0x5527,0xE5A786:0x5528,0xE5A7A8:0x5529,0xE5A79C:0x552A,0xE5A68D:0x552B,
0xE5A799:0x552C,0xE5A79A:0x552D,0xE5A8A5:0x552E,0xE5A89F:0x552F,0xE5A891:0x5530,
0xE5A89C:0x5531,0xE5A889:0x5532,0xE5A89A:0x5533,0xE5A980:0x5534,0xE5A9AC:0x5535,
0xE5A989:0x5536,0xE5A8B5:0x5537,0xE5A8B6:0x5538,0xE5A9A2:0x5539,0xE5A9AA:0x553A,
0xE5AA9A:0x553B,0xE5AABC:0x553C,0xE5AABE:0x553D,0xE5AB8B:0x553E,0xE5AB82:0x553F,
0xE5AABD:0x5540,0xE5ABA3:0x5541,0xE5AB97:0x5542,0xE5ABA6:0x5543,0xE5ABA9:0x5544,
0xE5AB96:0x5545,0xE5ABBA:0x5546,0xE5ABBB:0x5547,0xE5AC8C:0x5548,0xE5AC8B:0x5549,
0xE5AC96:0x554A,0xE5ACB2:0x554B,0xE5AB90:0x554C,0xE5ACAA:0x554D,0xE5ACB6:0x554E,
0xE5ACBE:0x554F,0xE5AD83:0x5550,0xE5AD85:0x5551,0xE5AD80:0x5552,0xE5AD91:0x5553,
0xE5AD95:0x5554,0xE5AD9A:0x5555,0xE5AD9B:0x5556,0xE5ADA5:0x5557,0xE5ADA9:0x5558,
0xE5ADB0:0x5559,0xE5ADB3:0x555A,0xE5ADB5:0x555B,0xE5ADB8:0x555C,0xE69688:0x555D,
0xE5ADBA:0x555E,0xE5AE80:0x555F,0xE5AE83:0x5560,0xE5AEA6:0x5561,0xE5AEB8:0x5562,
0xE5AF83:0x5563,0xE5AF87:0x5564,0xE5AF89:0x5565,0xE5AF94:0x5566,0xE5AF90:0x5567,
0xE5AFA4:0x5568,0xE5AFA6:0x5569,0xE5AFA2:0x556A,0xE5AF9E:0x556B,0xE5AFA5:0x556C,
0xE5AFAB:0x556D,0xE5AFB0:0x556E,0xE5AFB6:0x556F,0xE5AFB3:0x5570,0xE5B085:0x5571,
0xE5B087:0x5572,0xE5B088:0x5573,0xE5B08D:0x5574,0xE5B093:0x5575,0xE5B0A0:0x5576,
0xE5B0A2:0x5577,0xE5B0A8:0x5578,0xE5B0B8:0x5579,0xE5B0B9:0x557A,0xE5B181:0x557B,
0xE5B186:0x557C,0xE5B18E:0x557D,0xE5B193:0x557E,0xE5B190:0x5621,0xE5B18F:0x5622,
0xE5ADB1:0x5623,0xE5B1AC:0x5624,0xE5B1AE:0x5625,0xE4B9A2:0x5626,0xE5B1B6:0x5627,
0xE5B1B9:0x5628,0xE5B28C:0x5629,0xE5B291:0x562A,0xE5B294:0x562B,0xE5A69B:0x562C,
0xE5B2AB:0x562D,0xE5B2BB:0x562E,0xE5B2B6:0x562F,0xE5B2BC:0x5630,0xE5B2B7:0x5631,
0xE5B385:0x5632,0xE5B2BE:0x5633,0xE5B387:0x5634,0xE5B399:0x5635,0xE5B3A9:0x5636,
0xE5B3BD:0x5637,0xE5B3BA:0x5638,0xE5B3AD:0x5639,0xE5B68C:0x563A,0xE5B3AA:0x563B,
0xE5B48B:0x563C,0xE5B495:0x563D,0xE5B497:0x563E,0xE5B59C:0x563F,0xE5B49F:0x5640,
0xE5B49B:0x5641,0xE5B491:0x5642,0xE5B494:0x5643,0xE5B4A2:0x5644,0xE5B49A:0x5645,
0xE5B499:0x5646,0xE5B498:0x5647,0xE5B58C:0x5648,0xE5B592:0x5649,0xE5B58E:0x564A,
0xE5B58B:0x564B,0xE5B5AC:0x564C,0xE5B5B3:0x564D,0xE5B5B6:0x564E,0xE5B687:0x564F,
0xE5B684:0x5650,0xE5B682:0x5651,0xE5B6A2:0x5652,0xE5B69D:0x5653,0xE5B6AC:0x5654,
0xE5B6AE:0x5655,0xE5B6BD:0x5656,0xE5B690:0x5657,0xE5B6B7:0x5658,0xE5B6BC:0x5659,
0xE5B789:0x565A,0xE5B78D:0x565B,0xE5B793:0x565C,0xE5B792:0x565D,0xE5B796:0x565E,
0xE5B79B:0x565F,0xE5B7AB:0x5660,0xE5B7B2:0x5661,0xE5B7B5:0x5662,0xE5B88B:0x5663,
0xE5B89A:0x5664,0xE5B899:0x5665,0xE5B891:0x5666,0xE5B89B:0x5667,0xE5B8B6:0x5668,
0xE5B8B7:0x5669,0xE5B984:0x566A,0xE5B983:0x566B,0xE5B980:0x566C,0xE5B98E:0x566D,
0xE5B997:0x566E,0xE5B994:0x566F,0xE5B99F:0x5670,0xE5B9A2:0x5671,0xE5B9A4:0x5672,
0xE5B987:0x5673,0xE5B9B5:0x5674,0xE5B9B6:0x5675,0xE5B9BA:0x5676,0xE9BABC:0x5677,
0xE5B9BF:0x5678,0xE5BAA0:0x5679,0xE5BB81:0x567A,0xE5BB82:0x567B,0xE5BB88:0x567C,
0xE5BB90:0x567D,0xE5BB8F:0x567E,0xE5BB96:0x5721,0xE5BBA3:0x5722,0xE5BB9D:0x5723,
0xE5BB9A:0x5724,0xE5BB9B:0x5725,0xE5BBA2:0x5726,0xE5BBA1:0x5727,0xE5BBA8:0x5728,
0xE5BBA9:0x5729,0xE5BBAC:0x572A,0xE5BBB1:0x572B,0xE5BBB3:0x572C,0xE5BBB0:0x572D,
0xE5BBB4:0x572E,0xE5BBB8:0x572F,0xE5BBBE:0x5730,0xE5BC83:0x5731,0xE5BC89:0x5732,
0xE5BD9D:0x5733,0xE5BD9C:0x5734,0xE5BC8B:0x5735,0xE5BC91:0x5736,0xE5BC96:0x5737,
0xE5BCA9:0x5738,0xE5BCAD:0x5739,0xE5BCB8:0x573A,0xE5BD81:0x573B,0xE5BD88:0x573C,
0xE5BD8C:0x573D,0xE5BD8E:0x573E,0xE5BCAF:0x573F,0xE5BD91:0x5740,0xE5BD96:0x5741,
0xE5BD97:0x5742,0xE5BD99:0x5743,0xE5BDA1:0x5744,0xE5BDAD:0x5745,0xE5BDB3:0x5746,
0xE5BDB7:0x5747,0xE5BE83:0x5748,0xE5BE82:0x5749,0xE5BDBF:0x574A,0xE5BE8A:0x574B,
0xE5BE88:0x574C,0xE5BE91:0x574D,0xE5BE87:0x574E,0xE5BE9E:0x574F,0xE5BE99:0x5750,
0xE5BE98:0x5751,0xE5BEA0:0x5752,0xE5BEA8:0x5753,0xE5BEAD:0x5754,0xE5BEBC:0x5755,
0xE5BF96:0x5756,0xE5BFBB:0x5757,0xE5BFA4:0x5758,0xE5BFB8:0x5759,0xE5BFB1:0x575A,
0xE5BF9D:0x575B,0xE682B3:0x575C,0xE5BFBF:0x575D,0xE680A1:0x575E,0xE681A0:0x575F,
0xE68099:0x5760,0xE68090:0x5761,0xE680A9:0x5762,0xE6808E:0x5763,0xE680B1:0x5764,
0xE6809B:0x5765,0xE68095:0x5766,0xE680AB:0x5767,0xE680A6:0x5768,0xE6808F:0x5769,
0xE680BA:0x576A,0xE6819A:0x576B,0xE68181:0x576C,0xE681AA:0x576D,0xE681B7:0x576E,
0xE6819F:0x576F,0xE6818A:0x5770,0xE68186:0x5771,0xE6818D:0x5772,0xE681A3:0x5773,
0xE68183:0x5774,0xE681A4:0x5775,0xE68182:0x5776,0xE681AC:0x5777,0xE681AB:0x5778,
0xE68199:0x5779,0xE68281:0x577A,0xE6828D:0x577B,0xE683A7:0x577C,0xE68283:0x577D,
0xE6829A:0x577E,0xE68284:0x5821,0xE6829B:0x5822,0xE68296:0x5823,0xE68297:0x5824,
0xE68292:0x5825,0xE682A7:0x5826,0xE6828B:0x5827,0xE683A1:0x5828,0xE682B8:0x5829,
0xE683A0:0x582A,0xE68393:0x582B,0xE682B4:0x582C,0xE5BFB0:0x582D,0xE682BD:0x582E,
0xE68386:0x582F,0xE682B5:0x5830,0xE68398:0x5831,0xE6858D:0x5832,0xE68495:0x5833,
0xE68486:0x5834,0xE683B6:0x5835,0xE683B7:0x5836,0xE68480:0x5837,0xE683B4:0x5838,
0xE683BA:0x5839,0xE68483:0x583A,0xE684A1:0x583B,0xE683BB:0x583C,0xE683B1:0x583D,
0xE6848D:0x583E,0xE6848E:0x583F,0xE68587:0x5840,0xE684BE:0x5841,0xE684A8:0x5842,
0xE684A7:0x5843,0xE6858A:0x5844,0xE684BF:0x5845,0xE684BC:0x5846,0xE684AC:0x5847,
0xE684B4:0x5848,0xE684BD:0x5849,0xE68582:0x584A,0xE68584:0x584B,0xE685B3:0x584C,
0xE685B7:0x584D,0xE68598:0x584E,0xE68599:0x584F,0xE6859A:0x5850,0xE685AB:0x5851,
0xE685B4:0x5852,0xE685AF:0x5853,0xE685A5:0x5854,0xE685B1:0x5855,0xE6859F:0x5856,
0xE6859D:0x5857,0xE68593:0x5858,0xE685B5:0x5859,0xE68699:0x585A,0xE68696:0x585B,
0xE68687:0x585C,0xE686AC:0x585D,0xE68694:0x585E,0xE6869A:0x585F,0xE6868A:0x5860,
0xE68691:0x5861,0xE686AB:0x5862,0xE686AE:0x5863,0xE6878C:0x5864,0xE6878A:0x5865,
0xE68789:0x5866,0xE687B7:0x5867,0xE68788:0x5868,0xE68783:0x5869,0xE68786:0x586A,
0xE686BA:0x586B,0xE6878B:0x586C,0xE7BDB9:0x586D,0xE6878D:0x586E,0xE687A6:0x586F,
0xE687A3:0x5870,0xE687B6:0x5871,0xE687BA:0x5872,0xE687B4:0x5873,0xE687BF:0x5874,
0xE687BD:0x5875,0xE687BC:0x5876,0xE687BE:0x5877,0xE68880:0x5878,0xE68888:0x5879,
0xE68889:0x587A,0xE6888D:0x587B,0xE6888C:0x587C,0xE68894:0x587D,0xE6889B:0x587E,
0xE6889E:0x5921,0xE688A1:0x5922,0xE688AA:0x5923,0xE688AE:0x5924,0xE688B0:0x5925,
0xE688B2:0x5926,0xE688B3:0x5927,0xE68981:0x5928,0xE6898E:0x5929,0xE6899E:0x592A,
0xE689A3:0x592B,0xE6899B:0x592C,0xE689A0:0x592D,0xE689A8:0x592E,0xE689BC:0x592F,
0xE68A82:0x5930,0xE68A89:0x5931,0xE689BE:0x5932,0xE68A92:0x5933,0xE68A93:0x5934,
0xE68A96:0x5935,0xE68B94:0x5936,0xE68A83:0x5937,0xE68A94:0x5938,0xE68B97:0x5939,
0xE68B91:0x593A,0xE68ABB:0x593B,0xE68B8F:0x593C,0xE68BBF:0x593D,0xE68B86:0x593E,
0xE69394:0x593F,0xE68B88:0x5940,0xE68B9C:0x5941,0xE68B8C:0x5942,0xE68B8A:0x5943,
0xE68B82:0x5944,0xE68B87:0x5945,0xE68A9B:0x5946,0xE68B89:0x5947,0xE68C8C:0x5948,
0xE68BAE:0x5949,0xE68BB1:0x594A,0xE68CA7:0x594B,0xE68C82:0x594C,0xE68C88:0x594D,
0xE68BAF:0x594E,0xE68BB5:0x594F,0xE68D90:0x5950,0xE68CBE:0x5951,0xE68D8D:0x5952,
0xE6909C:0x5953,0xE68D8F:0x5954,0xE68E96:0x5955,0xE68E8E:0x5956,0xE68E80:0x5957,
0xE68EAB:0x5958,0xE68DB6:0x5959,0xE68EA3:0x595A,0xE68E8F:0x595B,0xE68E89:0x595C,
0xE68E9F:0x595D,0xE68EB5:0x595E,0xE68DAB:0x595F,0xE68DA9:0x5960,0xE68EBE:0x5961,
0xE68FA9:0x5962,0xE68F80:0x5963,0xE68F86:0x5964,0xE68FA3:0x5965,0xE68F89:0x5966,
0xE68F92:0x5967,0xE68FB6:0x5968,0xE68F84:0x5969,0xE69096:0x596A,0xE690B4:0x596B,
0xE69086:0x596C,0xE69093:0x596D,0xE690A6:0x596E,0xE690B6:0x596F,0xE6949D:0x5970,
0xE69097:0x5971,0xE690A8:0x5972,0xE6908F:0x5973,0xE691A7:0x5974,0xE691AF:0x5975,
0xE691B6:0x5976,0xE6918E:0x5977,0xE694AA:0x5978,0xE69295:0x5979,0xE69293:0x597A,
0xE692A5:0x597B,0xE692A9:0x597C,0xE69288:0x597D,0xE692BC:0x597E,0xE6939A:0x5A21,
0xE69392:0x5A22,0xE69385:0x5A23,0xE69387:0x5A24,0xE692BB:0x5A25,0xE69398:0x5A26,
0xE69382:0x5A27,0xE693B1:0x5A28,0xE693A7:0x5A29,0xE88889:0x5A2A,0xE693A0:0x5A2B,
0xE693A1:0x5A2C,0xE68AAC:0x5A2D,0xE693A3:0x5A2E,0xE693AF:0x5A2F,0xE694AC:0x5A30,
0xE693B6:0x5A31,0xE693B4:0x5A32,0xE693B2:0x5A33,0xE693BA:0x5A34,0xE69480:0x5A35,
0xE693BD:0x5A36,0xE69498:0x5A37,0xE6949C:0x5A38,0xE69485:0x5A39,0xE694A4:0x5A3A,
0xE694A3:0x5A3B,0xE694AB:0x5A3C,0xE694B4:0x5A3D,0xE694B5:0x5A3E,0xE694B7:0x5A3F,
0xE694B6:0x5A40,0xE694B8:0x5A41,0xE7958B:0x5A42,0xE69588:0x5A43,0xE69596:0x5A44,
0xE69595:0x5A45,0xE6958D:0x5A46,0xE69598:0x5A47,0xE6959E:0x5A48,0xE6959D:0x5A49,
0xE695B2:0x5A4A,0xE695B8:0x5A4B,0xE69682:0x5A4C,0xE69683:0x5A4D,0xE8AE8A:0x5A4E,
0xE6969B:0x5A4F,0xE6969F:0x5A50,0xE696AB:0x5A51,0xE696B7:0x5A52,0xE69783:0x5A53,
0xE69786:0x5A54,0xE69781:0x5A55,0xE69784:0x5A56,0xE6978C:0x5A57,0xE69792:0x5A58,
0xE6979B:0x5A59,0xE69799:0x5A5A,0xE697A0:0x5A5B,0xE697A1:0x5A5C,0xE697B1:0x5A5D,
0xE69DB2:0x5A5E,0xE6988A:0x5A5F,0xE69883:0x5A60,0xE697BB:0x5A61,0xE69DB3:0x5A62,
0xE698B5:0x5A63,0xE698B6:0x5A64,0xE698B4:0x5A65,0xE6989C:0x5A66,0xE6998F:0x5A67,
0xE69984:0x5A68,0xE69989:0x5A69,0xE69981:0x5A6A,0xE6999E:0x5A6B,0xE6999D:0x5A6C,
0xE699A4:0x5A6D,0xE699A7:0x5A6E,0xE699A8:0x5A6F,0xE6999F:0x5A70,0xE699A2:0x5A71,
0xE699B0:0x5A72,0xE69A83:0x5A73,0xE69A88:0x5A74,0xE69A8E:0x5A75,0xE69A89:0x5A76,
0xE69A84:0x5A77,0xE69A98:0x5A78,0xE69A9D:0x5A79,0xE69B81:0x5A7A,0xE69AB9:0x5A7B,
0xE69B89:0x5A7C,0xE69ABE:0x5A7D,0xE69ABC:0x5A7E,0xE69B84:0x5B21,0xE69AB8:0x5B22,
0xE69B96:0x5B23,0xE69B9A:0x5B24,0xE69BA0:0x5B25,0xE698BF:0x5B26,0xE69BA6:0x5B27,
0xE69BA9:0x5B28,0xE69BB0:0x5B29,0xE69BB5:0x5B2A,0xE69BB7:0x5B2B,0xE69C8F:0x5B2C,
0xE69C96:0x5B2D,0xE69C9E:0x5B2E,0xE69CA6:0x5B2F,0xE69CA7:0x5B30,0xE99CB8:0x5B31,
0xE69CAE:0x5B32,0xE69CBF:0x5B33,0xE69CB6:0x5B34,0xE69D81:0x5B35,0xE69CB8:0x5B36,
0xE69CB7:0x5B37,0xE69D86:0x5B38,0xE69D9E:0x5B39,0xE69DA0:0x5B3A,0xE69D99:0x5B3B,
0xE69DA3:0x5B3C,0xE69DA4:0x5B3D,0xE69E89:0x5B3E,0xE69DB0:0x5B3F,0xE69EA9:0x5B40,
0xE69DBC:0x5B41,0xE69DAA:0x5B42,0xE69E8C:0x5B43,0xE69E8B:0x5B44,0xE69EA6:0x5B45,
0xE69EA1:0x5B46,0xE69E85:0x5B47,0xE69EB7:0x5B48,0xE69FAF:0x5B49,0xE69EB4:0x5B4A,
0xE69FAC:0x5B4B,0xE69EB3:0x5B4C,0xE69FA9:0x5B4D,0xE69EB8:0x5B4E,0xE69FA4:0x5B4F,
0xE69F9E:0x5B50,0xE69F9D:0x5B51,0xE69FA2:0x5B52,0xE69FAE:0x5B53,0xE69EB9:0x5B54,
0xE69F8E:0x5B55,0xE69F86:0x5B56,0xE69FA7:0x5B57,0xE6AA9C:0x5B58,0xE6A09E:0x5B59,
0xE6A186:0x5B5A,0xE6A0A9:0x5B5B,0xE6A180:0x5B5C,0xE6A18D:0x5B5D,0xE6A0B2:0x5B5E,
0xE6A18E:0x5B5F,0xE6A2B3:0x5B60,0xE6A0AB:0x5B61,0xE6A199:0x5B62,0xE6A1A3:0x5B63,
0xE6A1B7:0x5B64,0xE6A1BF:0x5B65,0xE6A29F:0x5B66,0xE6A28F:0x5B67,0xE6A2AD:0x5B68,
0xE6A294:0x5B69,0xE6A29D:0x5B6A,0xE6A29B:0x5B6B,0xE6A283:0x5B6C,0xE6AAAE:0x5B6D,
0xE6A2B9:0x5B6E,0xE6A1B4:0x5B6F,0xE6A2B5:0x5B70,0xE6A2A0:0x5B71,0xE6A2BA:0x5B72,
0xE6A48F:0x5B73,0xE6A28D:0x5B74,0xE6A1BE:0x5B75,0xE6A481:0x5B76,0xE6A38A:0x5B77,
0xE6A488:0x5B78,0xE6A398:0x5B79,0xE6A4A2:0x5B7A,0xE6A4A6:0x5B7B,0xE6A3A1:0x5B7C,
0xE6A48C:0x5B7D,0xE6A38D:0x5B7E,0xE6A394:0x5C21,0xE6A3A7:0x5C22,0xE6A395:0x5C23,
0xE6A4B6:0x5C24,0xE6A492:0x5C25,0xE6A484:0x5C26,0xE6A397:0x5C27,0xE6A3A3:0x5C28,
0xE6A4A5:0x5C29,0xE6A3B9:0x5C2A,0xE6A3A0:0x5C2B,0xE6A3AF:0x5C2C,0xE6A4A8:0x5C2D,
0xE6A4AA:0x5C2E,0xE6A49A:0x5C2F,0xE6A4A3:0x5C30,0xE6A4A1:0x5C31,0xE6A386:0x5C32,
0xE6A5B9:0x5C33,0xE6A5B7:0x5C34,0xE6A59C:0x5C35,0xE6A5B8:0x5C36,0xE6A5AB:0x5C37,
0xE6A594:0x5C38,0xE6A5BE:0x5C39,0xE6A5AE:0x5C3A,0xE6A4B9:0x5C3B,0xE6A5B4:0x5C3C,
0xE6A4BD:0x5C3D,0xE6A599:0x5C3E,0xE6A4B0:0x5C3F,0xE6A5A1:0x5C40,0xE6A59E:0x5C41,
0xE6A59D:0x5C42,0xE6A681:0x5C43,0xE6A5AA:0x5C44,0xE6A6B2:0x5C45,0xE6A6AE:0x5C46,
0xE6A790:0x5C47,0xE6A6BF:0x5C48,0xE6A781:0x5C49,0xE6A793:0x5C4A,0xE6A6BE:0x5C4B,
0xE6A78E:0x5C4C,0xE5AFA8:0x5C4D,0xE6A78A:0x5C4E,0xE6A79D:0x5C4F,0xE6A6BB:0x5C50,
0xE6A783:0x5C51,0xE6A6A7:0x5C52,0xE6A8AE:0x5C53,0xE6A691:0x5C54,0xE6A6A0:0x5C55,
0xE6A69C:0x5C56,0xE6A695:0x5C57,0xE6A6B4:0x5C58,0xE6A79E:0x5C59,0xE6A7A8:0x5C5A,
0xE6A882:0x5C5B,0xE6A89B:0x5C5C,0xE6A7BF:0x5C5D,0xE6AC8A:0x5C5E,0xE6A7B9:0x5C5F,
0xE6A7B2:0x5C60,0xE6A7A7:0x5C61,0xE6A885:0x5C62,0xE6A6B1:0x5C63,0xE6A89E:0x5C64,
0xE6A7AD:0x5C65,0xE6A894:0x5C66,0xE6A7AB:0x5C67,0xE6A88A:0x5C68,0xE6A892:0x5C69,
0xE6AB81:0x5C6A,0xE6A8A3:0x5C6B,0xE6A893:0x5C6C,0xE6A984:0x5C6D,0xE6A88C:0x5C6E,
0xE6A9B2:0x5C6F,0xE6A8B6:0x5C70,0xE6A9B8:0x5C71,0xE6A987:0x5C72,0xE6A9A2:0x5C73,
0xE6A999:0x5C74,0xE6A9A6:0x5C75,0xE6A988:0x5C76,0xE6A8B8:0x5C77,0xE6A8A2:0x5C78,
0xE6AA90:0x5C79,0xE6AA8D:0x5C7A,0xE6AAA0:0x5C7B,0xE6AA84:0x5C7C,0xE6AAA2:0x5C7D,
0xE6AAA3:0x5C7E,0xE6AA97:0x5D21,0xE89897:0x5D22,0xE6AABB:0x5D23,0xE6AB83:0x5D24,
0xE6AB82:0x5D25,0xE6AAB8:0x5D26,0xE6AAB3:0x5D27,0xE6AAAC:0x5D28,0xE6AB9E:0x5D29,
0xE6AB91:0x5D2A,0xE6AB9F:0x5D2B,0xE6AAAA:0x5D2C,0xE6AB9A:0x5D2D,0xE6ABAA:0x5D2E,
0xE6ABBB:0x5D2F,0xE6AC85:0x5D30,0xE89896:0x5D31,0xE6ABBA:0x5D32,0xE6AC92:0x5D33,
0xE6AC96:0x5D34,0xE9ACB1:0x5D35,0xE6AC9F:0x5D36,0xE6ACB8:0x5D37,0xE6ACB7:0x5D38,
0xE79B9C:0x5D39,0xE6ACB9:0x5D3A,0xE9A3AE:0x5D3B,0xE6AD87:0x5D3C,0xE6AD83:0x5D3D,
0xE6AD89:0x5D3E,0xE6AD90:0x5D3F,0xE6AD99:0x5D40,0xE6AD94:0x5D41,0xE6AD9B:0x5D42,
0xE6AD9F:0x5D43,0xE6ADA1:0x5D44,0xE6ADB8:0x5D45,0xE6ADB9:0x5D46,0xE6ADBF:0x5D47,
0xE6AE80:0x5D48,0xE6AE84:0x5D49,0xE6AE83:0x5D4A,0xE6AE8D:0x5D4B,0xE6AE98:0x5D4C,
0xE6AE95:0x5D4D,0xE6AE9E:0x5D4E,0xE6AEA4:0x5D4F,0xE6AEAA:0x5D50,0xE6AEAB:0x5D51,
0xE6AEAF:0x5D52,0xE6AEB2:0x5D53,0xE6AEB1:0x5D54,0xE6AEB3:0x5D55,0xE6AEB7:0x5D56,
0xE6AEBC:0x5D57,0xE6AF86:0x5D58,0xE6AF8B:0x5D59,0xE6AF93:0x5D5A,0xE6AF9F:0x5D5B,
0xE6AFAC:0x5D5C,0xE6AFAB:0x5D5D,0xE6AFB3:0x5D5E,0xE6AFAF:0x5D5F,0xE9BABE:0x5D60,
0xE6B088:0x5D61,0xE6B093:0x5D62,0xE6B094:0x5D63,0xE6B09B:0x5D64,0xE6B0A4:0x5D65,
0xE6B0A3:0x5D66,0xE6B19E:0x5D67,0xE6B195:0x5D68,0xE6B1A2:0x5D69,0xE6B1AA:0x5D6A,
0xE6B282:0x5D6B,0xE6B28D:0x5D6C,0xE6B29A:0x5D6D,0xE6B281:0x5D6E,0xE6B29B:0x5D6F,
0xE6B1BE:0x5D70,0xE6B1A8:0x5D71,0xE6B1B3:0x5D72,0xE6B292:0x5D73,0xE6B290:0x5D74,
0xE6B384:0x5D75,0xE6B3B1:0x5D76,0xE6B393:0x5D77,0xE6B2BD:0x5D78,0xE6B397:0x5D79,
0xE6B385:0x5D7A,0xE6B39D:0x5D7B,0xE6B2AE:0x5D7C,0xE6B2B1:0x5D7D,0xE6B2BE:0x5D7E,
0xE6B2BA:0x5E21,0xE6B39B:0x5E22,0xE6B3AF:0x5E23,0xE6B399:0x5E24,0xE6B3AA:0x5E25,
0xE6B49F:0x5E26,0xE8A18D:0x5E27,0xE6B4B6:0x5E28,0xE6B4AB:0x5E29,0xE6B4BD:0x5E2A,
0xE6B4B8:0x5E2B,0xE6B499:0x5E2C,0xE6B4B5:0x5E2D,0xE6B4B3:0x5E2E,0xE6B492:0x5E2F,
0xE6B48C:0x5E30,0xE6B5A3:0x5E31,0xE6B693:0x5E32,0xE6B5A4:0x5E33,0xE6B59A:0x5E34,
0xE6B5B9:0x5E35,0xE6B599:0x5E36,0xE6B68E:0x5E37,0xE6B695:0x5E38,0xE6BFA4:0x5E39,
0xE6B685:0x5E3A,0xE6B7B9:0x5E3B,0xE6B895:0x5E3C,0xE6B88A:0x5E3D,0xE6B6B5:0x5E3E,
0xE6B787:0x5E3F,0xE6B7A6:0x5E40,0xE6B6B8:0x5E41,0xE6B786:0x5E42,0xE6B7AC:0x5E43,
0xE6B79E:0x5E44,0xE6B78C:0x5E45,0xE6B7A8:0x5E46,0xE6B792:0x5E47,0xE6B785:0x5E48,
0xE6B7BA:0x5E49,0xE6B799:0x5E4A,0xE6B7A4:0x5E4B,0xE6B795:0x5E4C,0xE6B7AA:0x5E4D,
0xE6B7AE:0x5E4E,0xE6B8AD:0x5E4F,0xE6B9AE:0x5E50,0xE6B8AE:0x5E51,0xE6B899:0x5E52,
0xE6B9B2:0x5E53,0xE6B99F:0x5E54,0xE6B8BE:0x5E55,0xE6B8A3:0x5E56,0xE6B9AB:0x5E57,
0xE6B8AB:0x5E58,0xE6B9B6:0x5E59,0xE6B98D:0x5E5A,0xE6B89F:0x5E5B,0xE6B983:0x5E5C,
0xE6B8BA:0x5E5D,0xE6B98E:0x5E5E,0xE6B8A4:0x5E5F,0xE6BBBF:0x5E60,0xE6B89D:0x5E61,
0xE6B8B8:0x5E62,0xE6BA82:0x5E63,0xE6BAAA:0x5E64,0xE6BA98:0x5E65,0xE6BB89:0x5E66,
0xE6BAB7:0x5E67,0xE6BB93:0x5E68,0xE6BABD:0x5E69,0xE6BAAF:0x5E6A,0xE6BB84:0x5E6B,
0xE6BAB2:0x5E6C,0xE6BB94:0x5E6D,0xE6BB95:0x5E6E,0xE6BA8F:0x5E6F,0xE6BAA5:0x5E70,
0xE6BB82:0x5E71,0xE6BA9F:0x5E72,0xE6BD81:0x5E73,0xE6BC91:0x5E74,0xE7818C:0x5E75,
0xE6BBAC:0x5E76,0xE6BBB8:0x5E77,0xE6BBBE:0x5E78,0xE6BCBF:0x5E79,0xE6BBB2:0x5E7A,
0xE6BCB1:0x5E7B,0xE6BBAF:0x5E7C,0xE6BCB2:0x5E7D,0xE6BB8C:0x5E7E,0xE6BCBE:0x5F21,
0xE6BC93:0x5F22,0xE6BBB7:0x5F23,0xE6BE86:0x5F24,0xE6BDBA:0x5F25,0xE6BDB8:0x5F26,
0xE6BE81:0x5F27,0xE6BE80:0x5F28,0xE6BDAF:0x5F29,0xE6BD9B:0x5F2A,0xE6BFB3:0x5F2B,
0xE6BDAD:0x5F2C,0xE6BE82:0x5F2D,0xE6BDBC:0x5F2E,0xE6BD98:0x5F2F,0xE6BE8E:0x5F30,
0xE6BE91:0x5F31,0xE6BF82:0x5F32,0xE6BDA6:0x5F33,0xE6BEB3:0x5F34,0xE6BEA3:0x5F35,
0xE6BEA1:0x5F36,0xE6BEA4:0x5F37,0xE6BEB9:0x5F38,0xE6BF86:0x5F39,0xE6BEAA:0x5F3A,
0xE6BF9F:0x5F3B,0xE6BF95:0x5F3C,0xE6BFAC:0x5F3D,0xE6BF94:0x5F3E,0xE6BF98:0x5F3F,
0xE6BFB1:0x5F40,0xE6BFAE:0x5F41,0xE6BF9B:0x5F42,0xE78089:0x5F43,0xE7808B:0x5F44,
0xE6BFBA:0x5F45,0xE78091:0x5F46,0xE78081:0x5F47,0xE7808F:0x5F48,0xE6BFBE:0x5F49,
0xE7809B:0x5F4A,0xE7809A:0x5F4B,0xE6BDB4:0x5F4C,0xE7809D:0x5F4D,0xE78098:0x5F4E,
0xE7809F:0x5F4F,0xE780B0:0x5F50,0xE780BE:0x5F51,0xE780B2:0x5F52,0xE78191:0x5F53,
0xE781A3:0x5F54,0xE78299:0x5F55,0xE78292:0x5F56,0xE782AF:0x5F57,0xE783B1:0x5F58,
0xE782AC:0x5F59,0xE782B8:0x5F5A,0xE782B3:0x5F5B,0xE782AE:0x5F5C,0xE7839F:0x5F5D,
0xE7838B:0x5F5E,0xE7839D:0x5F5F,0xE78399:0x5F60,0xE78489:0x5F61,0xE783BD:0x5F62,
0xE7849C:0x5F63,0xE78499:0x5F64,0xE785A5:0x5F65,0xE78595:0x5F66,0xE78688:0x5F67,
0xE785A6:0x5F68,0xE785A2:0x5F69,0xE7858C:0x5F6A,0xE78596:0x5F6B,0xE785AC:0x5F6C,
0xE7868F:0x5F6D,0xE787BB:0x5F6E,0xE78684:0x5F6F,0xE78695:0x5F70,0xE786A8:0x5F71,
0xE786AC:0x5F72,0xE78797:0x5F73,0xE786B9:0x5F74,0xE786BE:0x5F75,0xE78792:0x5F76,
0xE78789:0x5F77,0xE78794:0x5F78,0xE7878E:0x5F79,0xE787A0:0x5F7A,0xE787AC:0x5F7B,
0xE787A7:0x5F7C,0xE787B5:0x5F7D,0xE787BC:0x5F7E,0xE787B9:0x6021,0xE787BF:0x6022,
0xE7888D:0x6023,0xE78890:0x6024,0xE7889B:0x6025,0xE788A8:0x6026,0xE788AD:0x6027,
0xE788AC:0x6028,0xE788B0:0x6029,0xE788B2:0x602A,0xE788BB:0x602B,0xE788BC:0x602C,
0xE788BF:0x602D,0xE78980:0x602E,0xE78986:0x602F,0xE7898B:0x6030,0xE78998:0x6031,
0xE789B4:0x6032,0xE789BE:0x6033,0xE78A82:0x6034,0xE78A81:0x6035,0xE78A87:0x6036,
0xE78A92:0x6037,0xE78A96:0x6038,0xE78AA2:0x6039,0xE78AA7:0x603A,0xE78AB9:0x603B,
0xE78AB2:0x603C,0xE78B83:0x603D,0xE78B86:0x603E,0xE78B84:0x603F,0xE78B8E:0x6040,
0xE78B92:0x6041,0xE78BA2:0x6042,0xE78BA0:0x6043,0xE78BA1:0x6044,0xE78BB9:0x6045,
0xE78BB7:0x6046,0xE5808F:0x6047,0xE78C97:0x6048,0xE78C8A:0x6049,0xE78C9C:0x604A,
0xE78C96:0x604B,0xE78C9D:0x604C,0xE78CB4:0x604D,0xE78CAF:0x604E,0xE78CA9:0x604F,
0xE78CA5:0x6050,0xE78CBE:0x6051,0xE78D8E:0x6052,0xE78D8F:0x6053,0xE9BB98:0x6054,
0xE78D97:0x6055,0xE78DAA:0x6056,0xE78DA8:0x6057,0xE78DB0:0x6058,0xE78DB8:0x6059,
0xE78DB5:0x605A,0xE78DBB:0x605B,0xE78DBA:0x605C,0xE78F88:0x605D,0xE78EB3:0x605E,
0xE78F8E:0x605F,0xE78EBB:0x6060,0xE78F80:0x6061,0xE78FA5:0x6062,0xE78FAE:0x6063,
0xE78F9E:0x6064,0xE792A2:0x6065,0xE79085:0x6066,0xE791AF:0x6067,0xE790A5:0x6068,
0xE78FB8:0x6069,0xE790B2:0x606A,0xE790BA:0x606B,0xE79195:0x606C,0xE790BF:0x606D,
0xE7919F:0x606E,0xE79199:0x606F,0xE79181:0x6070,0xE7919C:0x6071,0xE791A9:0x6072,
0xE791B0:0x6073,0xE791A3:0x6074,0xE791AA:0x6075,0xE791B6:0x6076,0xE791BE:0x6077,
0xE7928B:0x6078,0xE7929E:0x6079,0xE792A7:0x607A,0xE7938A:0x607B,0xE7938F:0x607C,
0xE79394:0x607D,0xE78FB1:0x607E,0xE793A0:0x6121,0xE793A3:0x6122,0xE793A7:0x6123,
0xE793A9:0x6124,0xE793AE:0x6125,0xE793B2:0x6126,0xE793B0:0x6127,0xE793B1:0x6128,
0xE793B8:0x6129,0xE793B7:0x612A,0xE79484:0x612B,0xE79483:0x612C,0xE79485:0x612D,
0xE7948C:0x612E,0xE7948E:0x612F,0xE7948D:0x6130,0xE79495:0x6131,0xE79493:0x6132,
0xE7949E:0x6133,0xE794A6:0x6134,0xE794AC:0x6135,0xE794BC:0x6136,0xE79584:0x6137,
0xE7958D:0x6138,0xE7958A:0x6139,0xE79589:0x613A,0xE7959B:0x613B,0xE79586:0x613C,
0xE7959A:0x613D,0xE795A9:0x613E,0xE795A4:0x613F,0xE795A7:0x6140,0xE795AB:0x6141,
0xE795AD:0x6142,0xE795B8:0x6143,0xE795B6:0x6144,0xE79686:0x6145,0xE79687:0x6146,
0xE795B4:0x6147,0xE7968A:0x6148,0xE79689:0x6149,0xE79682:0x614A,0xE79694:0x614B,
0xE7969A:0x614C,0xE7969D:0x614D,0xE796A5:0x614E,0xE796A3:0x614F,0xE79782:0x6150,
0xE796B3:0x6151,0xE79783:0x6152,0xE796B5:0x6153,0xE796BD:0x6154,0xE796B8:0x6155,
0xE796BC:0x6156,0xE796B1:0x6157,0xE7978D:0x6158,0xE7978A:0x6159,0xE79792:0x615A,
0xE79799:0x615B,0xE797A3:0x615C,0xE7979E:0x615D,0xE797BE:0x615E,0xE797BF:0x615F,
0xE797BC:0x6160,0xE79881:0x6161,0xE797B0:0x6162,0xE797BA:0x6163,0xE797B2:0x6164,
0xE797B3:0x6165,0xE7988B:0x6166,0xE7988D:0x6167,0xE79889:0x6168,0xE7989F:0x6169,
0xE798A7:0x616A,0xE798A0:0x616B,0xE798A1:0x616C,0xE798A2:0x616D,0xE798A4:0x616E,
0xE798B4:0x616F,0xE798B0:0x6170,0xE798BB:0x6171,0xE79987:0x6172,0xE79988:0x6173,
0xE79986:0x6174,0xE7999C:0x6175,0xE79998:0x6176,0xE799A1:0x6177,0xE799A2:0x6178,
0xE799A8:0x6179,0xE799A9:0x617A,0xE799AA:0x617B,0xE799A7:0x617C,0xE799AC:0x617D,
0xE799B0:0x617E,0xE799B2:0x6221,0xE799B6:0x6222,0xE799B8:0x6223,0xE799BC:0x6224,
0xE79A80:0x6225,0xE79A83:0x6226,0xE79A88:0x6227,0xE79A8B:0x6228,0xE79A8E:0x6229,
0xE79A96:0x622A,0xE79A93:0x622B,0xE79A99:0x622C,0xE79A9A:0x622D,0xE79AB0:0x622E,
0xE79AB4:0x622F,0xE79AB8:0x6230,0xE79AB9:0x6231,0xE79ABA:0x6232,0xE79B82:0x6233,
0xE79B8D:0x6234,0xE79B96:0x6235,0xE79B92:0x6236,0xE79B9E:0x6237,0xE79BA1:0x6238,
0xE79BA5:0x6239,0xE79BA7:0x623A,0xE79BAA:0x623B,0xE898AF:0x623C,0xE79BBB:0x623D,
0xE79C88:0x623E,0xE79C87:0x623F,0xE79C84:0x6240,0xE79CA9:0x6241,0xE79CA4:0x6242,
0xE79C9E:0x6243,0xE79CA5:0x6244,0xE79CA6:0x6245,0xE79C9B:0x6246,0xE79CB7:0x6247,
0xE79CB8:0x6248,0xE79D87:0x6249,0xE79D9A:0x624A,0xE79DA8:0x624B,0xE79DAB:0x624C,
0xE79D9B:0x624D,0xE79DA5:0x624E,0xE79DBF:0x624F,0xE79DBE:0x6250,0xE79DB9:0x6251,
0xE79E8E:0x6252,0xE79E8B:0x6253,0xE79E91:0x6254,0xE79EA0:0x6255,0xE79E9E:0x6256,
0xE79EB0:0x6257,0xE79EB6:0x6258,0xE79EB9:0x6259,0xE79EBF:0x625A,0xE79EBC:0x625B,
0xE79EBD:0x625C,0xE79EBB:0x625D,0xE79F87:0x625E,0xE79F8D:0x625F,0xE79F97:0x6260,
0xE79F9A:0x6261,0xE79F9C:0x6262,0xE79FA3:0x6263,0xE79FAE:0x6264,0xE79FBC:0x6265,
0xE7A08C:0x6266,0xE7A092:0x6267,0xE7A4A6:0x6268,0xE7A0A0:0x6269,0xE7A4AA:0x626A,
0xE7A185:0x626B,0xE7A28E:0x626C,0xE7A1B4:0x626D,0xE7A286:0x626E,0xE7A1BC:0x626F,
0xE7A29A:0x6270,0xE7A28C:0x6271,0xE7A2A3:0x6272,0xE7A2B5:0x6273,0xE7A2AA:0x6274,
0xE7A2AF:0x6275,0xE7A391:0x6276,0xE7A386:0x6277,0xE7A38B:0x6278,0xE7A394:0x6279,
0xE7A2BE:0x627A,0xE7A2BC:0x627B,0xE7A385:0x627C,0xE7A38A:0x627D,0xE7A3AC:0x627E,
0xE7A3A7:0x6321,0xE7A39A:0x6322,0xE7A3BD:0x6323,0xE7A3B4:0x6324,0xE7A487:0x6325,
0xE7A492:0x6326,0xE7A491:0x6327,0xE7A499:0x6328,0xE7A4AC:0x6329,0xE7A4AB:0x632A,
0xE7A580:0x632B,0xE7A5A0:0x632C,0xE7A597:0x632D,0xE7A59F:0x632E,0xE7A59A:0x632F,
0xE7A595:0x6330,0xE7A593:0x6331,0xE7A5BA:0x6332,0xE7A5BF:0x6333,0xE7A68A:0x6334,
0xE7A69D:0x6335,0xE7A6A7:0x6336,0xE9BD8B:0x6337,0xE7A6AA:0x6338,0xE7A6AE:0x6339,
0xE7A6B3:0x633A,0xE7A6B9:0x633B,0xE7A6BA:0x633C,0xE7A789:0x633D,0xE7A795:0x633E,
0xE7A7A7:0x633F,0xE7A7AC:0x6340,0xE7A7A1:0x6341,0xE7A7A3:0x6342,0xE7A888:0x6343,
0xE7A88D:0x6344,0xE7A898:0x6345,0xE7A899:0x6346,0xE7A8A0:0x6347,0xE7A89F:0x6348,
0xE7A680:0x6349,0xE7A8B1:0x634A,0xE7A8BB:0x634B,0xE7A8BE:0x634C,0xE7A8B7:0x634D,
0xE7A983:0x634E,0xE7A997:0x634F,0xE7A989:0x6350,0xE7A9A1:0x6351,0xE7A9A2:0x6352,
0xE7A9A9:0x6353,0xE9BE9D:0x6354,0xE7A9B0:0x6355,0xE7A9B9:0x6356,0xE7A9BD:0x6357,
0xE7AA88:0x6358,0xE7AA97:0x6359,0xE7AA95:0x635A,0xE7AA98:0x635B,0xE7AA96:0x635C,
0xE7AAA9:0x635D,0xE7AB88:0x635E,0xE7AAB0:0x635F,0xE7AAB6:0x6360,0xE7AB85:0x6361,
0xE7AB84:0x6362,0xE7AABF:0x6363,0xE98283:0x6364,0xE7AB87:0x6365,0xE7AB8A:0x6366,
0xE7AB8D:0x6367,0xE7AB8F:0x6368,0xE7AB95:0x6369,0xE7AB93:0x636A,0xE7AB99:0x636B,
0xE7AB9A:0x636C,0xE7AB9D:0x636D,0xE7ABA1:0x636E,0xE7ABA2:0x636F,0xE7ABA6:0x6370,
0xE7ABAD:0x6371,0xE7ABB0:0x6372,0xE7AC82:0x6373,0xE7AC8F:0x6374,0xE7AC8A:0x6375,
0xE7AC86:0x6376,0xE7ACB3:0x6377,0xE7AC98:0x6378,0xE7AC99:0x6379,0xE7AC9E:0x637A,
0xE7ACB5:0x637B,0xE7ACA8:0x637C,0xE7ACB6:0x637D,0xE7AD90:0x637E,0xE7ADBA:0x6421,
0xE7AC84:0x6422,0xE7AD8D:0x6423,0xE7AC8B:0x6424,0xE7AD8C:0x6425,0xE7AD85:0x6426,
0xE7ADB5:0x6427,0xE7ADA5:0x6428,0xE7ADB4:0x6429,0xE7ADA7:0x642A,0xE7ADB0:0x642B,
0xE7ADB1:0x642C,0xE7ADAC:0x642D,0xE7ADAE:0x642E,0xE7AE9D:0x642F,0xE7AE98:0x6430,
0xE7AE9F:0x6431,0xE7AE8D:0x6432,0xE7AE9C:0x6433,0xE7AE9A:0x6434,0xE7AE8B:0x6435,
0xE7AE92:0x6436,0xE7AE8F:0x6437,0xE7AD9D:0x6438,0xE7AE99:0x6439,0xE7AF8B:0x643A,
0xE7AF81:0x643B,0xE7AF8C:0x643C,0xE7AF8F:0x643D,0xE7AEB4:0x643E,0xE7AF86:0x643F,
0xE7AF9D:0x6440,0xE7AFA9:0x6441,0xE7B091:0x6442,0xE7B094:0x6443,0xE7AFA6:0x6444,
0xE7AFA5:0x6445,0xE7B1A0:0x6446,0xE7B080:0x6447,0xE7B087:0x6448,0xE7B093:0x6449,
0xE7AFB3:0x644A,0xE7AFB7:0x644B,0xE7B097:0x644C,0xE7B08D:0x644D,0xE7AFB6:0x644E,
0xE7B0A3:0x644F,0xE7B0A7:0x6450,0xE7B0AA:0x6451,0xE7B09F:0x6452,0xE7B0B7:0x6453,
0xE7B0AB:0x6454,0xE7B0BD:0x6455,0xE7B18C:0x6456,0xE7B183:0x6457,0xE7B194:0x6458,
0xE7B18F:0x6459,0xE7B180:0x645A,0xE7B190:0x645B,0xE7B198:0x645C,0xE7B19F:0x645D,
0xE7B1A4:0x645E,0xE7B196:0x645F,0xE7B1A5:0x6460,0xE7B1AC:0x6461,0xE7B1B5:0x6462,
0xE7B283:0x6463,0xE7B290:0x6464,0xE7B2A4:0x6465,0xE7B2AD:0x6466,0xE7B2A2:0x6467,
0xE7B2AB:0x6468,0xE7B2A1:0x6469,0xE7B2A8:0x646A,0xE7B2B3:0x646B,0xE7B2B2:0x646C,
0xE7B2B1:0x646D,0xE7B2AE:0x646E,0xE7B2B9:0x646F,0xE7B2BD:0x6470,0xE7B380:0x6471,
0xE7B385:0x6472,0xE7B382:0x6473,0xE7B398:0x6474,0xE7B392:0x6475,0xE7B39C:0x6476,
0xE7B3A2:0x6477,0xE9ACBB:0x6478,0xE7B3AF:0x6479,0xE7B3B2:0x647A,0xE7B3B4:0x647B,
0xE7B3B6:0x647C,0xE7B3BA:0x647D,0xE7B486:0x647E,0xE7B482:0x6521,0xE7B49C:0x6522,
0xE7B495:0x6523,0xE7B48A:0x6524,0xE7B585:0x6525,0xE7B58B:0x6526,0xE7B4AE:0x6527,
0xE7B4B2:0x6528,0xE7B4BF:0x6529,0xE7B4B5:0x652A,0xE7B586:0x652B,0xE7B5B3:0x652C,
0xE7B596:0x652D,0xE7B58E:0x652E,0xE7B5B2:0x652F,0xE7B5A8:0x6530,0xE7B5AE:0x6531,
0xE7B58F:0x6532,0xE7B5A3:0x6533,0xE7B693:0x6534,0xE7B689:0x6535,0xE7B59B:0x6536,
0xE7B68F:0x6537,0xE7B5BD:0x6538,0xE7B69B:0x6539,0xE7B6BA:0x653A,0xE7B6AE:0x653B,
0xE7B6A3:0x653C,0xE7B6B5:0x653D,0xE7B787:0x653E,0xE7B6BD:0x653F,0xE7B6AB:0x6540,
0xE7B8BD:0x6541,0xE7B6A2:0x6542,0xE7B6AF:0x6543,0xE7B79C:0x6544,0xE7B6B8:0x6545,
0xE7B69F:0x6546,0xE7B6B0:0x6547,0xE7B798:0x6548,0xE7B79D:0x6549,0xE7B7A4:0x654A,
0xE7B79E:0x654B,0xE7B7BB:0x654C,0xE7B7B2:0x654D,0xE7B7A1:0x654E,0xE7B885:0x654F,
0xE7B88A:0x6550,0xE7B8A3:0x6551,0xE7B8A1:0x6552,0xE7B892:0x6553,0xE7B8B1:0x6554,
0xE7B89F:0x6555,0xE7B889:0x6556,0xE7B88B:0x6557,0xE7B8A2:0x6558,0xE7B986:0x6559,
0xE7B9A6:0x655A,0xE7B8BB:0x655B,0xE7B8B5:0x655C,0xE7B8B9:0x655D,0xE7B983:0x655E,
0xE7B8B7:0x655F,0xE7B8B2:0x6560,0xE7B8BA:0x6561,0xE7B9A7:0x6562,0xE7B99D:0x6563,
0xE7B996:0x6564,0xE7B99E:0x6565,0xE7B999:0x6566,0xE7B99A:0x6567,0xE7B9B9:0x6568,
0xE7B9AA:0x6569,0xE7B9A9:0x656A,0xE7B9BC:0x656B,0xE7B9BB:0x656C,0xE7BA83:0x656D,
0xE7B795:0x656E,0xE7B9BD:0x656F,0xE8BEAE:0x6570,0xE7B9BF:0x6571,0xE7BA88:0x6572,
0xE7BA89:0x6573,0xE7BA8C:0x6574,0xE7BA92:0x6575,0xE7BA90:0x6576,0xE7BA93:0x6577,
0xE7BA94:0x6578,0xE7BA96:0x6579,0xE7BA8E:0x657A,0xE7BA9B:0x657B,0xE7BA9C:0x657C,
0xE7BCB8:0x657D,0xE7BCBA:0x657E,0xE7BD85:0x6621,0xE7BD8C:0x6622,0xE7BD8D:0x6623,
0xE7BD8E:0x6624,0xE7BD90:0x6625,0xE7BD91:0x6626,0xE7BD95:0x6627,0xE7BD94:0x6628,
0xE7BD98:0x6629,0xE7BD9F:0x662A,0xE7BDA0:0x662B,0xE7BDA8:0x662C,0xE7BDA9:0x662D,
0xE7BDA7:0x662E,0xE7BDB8:0x662F,0xE7BE82:0x6630,0xE7BE86:0x6631,0xE7BE83:0x6632,
0xE7BE88:0x6633,0xE7BE87:0x6634,0xE7BE8C:0x6635,0xE7BE94:0x6636,0xE7BE9E:0x6637,
0xE7BE9D:0x6638,0xE7BE9A:0x6639,0xE7BEA3:0x663A,0xE7BEAF:0x663B,0xE7BEB2:0x663C,
0xE7BEB9:0x663D,0xE7BEAE:0x663E,0xE7BEB6:0x663F,0xE7BEB8:0x6640,0xE8ADB1:0x6641,
0xE7BF85:0x6642,0xE7BF86:0x6643,0xE7BF8A:0x6644,0xE7BF95:0x6645,0xE7BF94:0x6646,
0xE7BFA1:0x6647,0xE7BFA6:0x6648,0xE7BFA9:0x6649,0xE7BFB3:0x664A,0xE7BFB9:0x664B,
0xE9A39C:0x664C,0xE88086:0x664D,0xE88084:0x664E,0xE8808B:0x664F,0xE88092:0x6650,
0xE88098:0x6651,0xE88099:0x6652,0xE8809C:0x6653,0xE880A1:0x6654,0xE880A8:0x6655,
0xE880BF:0x6656,0xE880BB:0x6657,0xE8818A:0x6658,0xE88186:0x6659,0xE88192:0x665A,
0xE88198:0x665B,0xE8819A:0x665C,0xE8819F:0x665D,0xE881A2:0x665E,0xE881A8:0x665F,
0xE881B3:0x6660,0xE881B2:0x6661,0xE881B0:0x6662,0xE881B6:0x6663,0xE881B9:0x6664,
0xE881BD:0x6665,0xE881BF:0x6666,0xE88284:0x6667,0xE88286:0x6668,0xE88285:0x6669,
0xE8829B:0x666A,0xE88293:0x666B,0xE8829A:0x666C,0xE882AD:0x666D,0xE58690:0x666E,
0xE882AC:0x666F,0xE8839B:0x6670,0xE883A5:0x6671,0xE88399:0x6672,0xE8839D:0x6673,
0xE88384:0x6674,0xE8839A:0x6675,0xE88396:0x6676,0xE88489:0x6677,0xE883AF:0x6678,
0xE883B1:0x6679,0xE8849B:0x667A,0xE884A9:0x667B,0xE884A3:0x667C,0xE884AF:0x667D,
0xE8858B:0x667E,0xE99A8B:0x6721,0xE88586:0x6722,0xE884BE:0x6723,0xE88593:0x6724,
0xE88591:0x6725,0xE883BC:0x6726,0xE885B1:0x6727,0xE885AE:0x6728,0xE885A5:0x6729,
0xE885A6:0x672A,0xE885B4:0x672B,0xE88683:0x672C,0xE88688:0x672D,0xE8868A:0x672E,
0xE88680:0x672F,0xE88682:0x6730,0xE886A0:0x6731,0xE88695:0x6732,0xE886A4:0x6733,
0xE886A3:0x6734,0xE8859F:0x6735,0xE88693:0x6736,0xE886A9:0x6737,0xE886B0:0x6738,
0xE886B5:0x6739,0xE886BE:0x673A,0xE886B8:0x673B,0xE886BD:0x673C,0xE88780:0x673D,
0xE88782:0x673E,0xE886BA:0x673F,0xE88789:0x6740,0xE8878D:0x6741,0xE88791:0x6742,
0xE88799:0x6743,0xE88798:0x6744,0xE88788:0x6745,0xE8879A:0x6746,0xE8879F:0x6747,
0xE887A0:0x6748,0xE887A7:0x6749,0xE887BA:0x674A,0xE887BB:0x674B,0xE887BE:0x674C,
0xE88881:0x674D,0xE88882:0x674E,0xE88885:0x674F,0xE88887:0x6750,0xE8888A:0x6751,
0xE8888D:0x6752,0xE88890:0x6753,0xE88896:0x6754,0xE888A9:0x6755,0xE888AB:0x6756,
0xE888B8:0x6757,0xE888B3:0x6758,0xE88980:0x6759,0xE88999:0x675A,0xE88998:0x675B,
0xE8899D:0x675C,0xE8899A:0x675D,0xE8899F:0x675E,0xE889A4:0x675F,0xE889A2:0x6760,
0xE889A8:0x6761,0xE889AA:0x6762,0xE889AB:0x6763,0xE888AE:0x6764,0xE889B1:0x6765,
0xE889B7:0x6766,0xE889B8:0x6767,0xE889BE:0x6768,0xE88A8D:0x6769,0xE88A92:0x676A,
0xE88AAB:0x676B,0xE88A9F:0x676C,0xE88ABB:0x676D,0xE88AAC:0x676E,0xE88BA1:0x676F,
0xE88BA3:0x6770,0xE88B9F:0x6771,0xE88B92:0x6772,0xE88BB4:0x6773,0xE88BB3:0x6774,
0xE88BBA:0x6775,0xE88E93:0x6776,0xE88C83:0x6777,0xE88BBB:0x6778,0xE88BB9:0x6779,
0xE88B9E:0x677A,0xE88C86:0x677B,0xE88B9C:0x677C,0xE88C89:0x677D,0xE88B99:0x677E,
0xE88CB5:0x6821,0xE88CB4:0x6822,0xE88C96:0x6823,0xE88CB2:0x6824,0xE88CB1:0x6825,
0xE88D80:0x6826,0xE88CB9:0x6827,0xE88D90:0x6828,0xE88D85:0x6829,0xE88CAF:0x682A,
0xE88CAB:0x682B,0xE88C97:0x682C,0xE88C98:0x682D,0xE88E85:0x682E,0xE88E9A:0x682F,
0xE88EAA:0x6830,0xE88E9F:0x6831,0xE88EA2:0x6832,0xE88E96:0x6833,0xE88CA3:0x6834,
0xE88E8E:0x6835,0xE88E87:0x6836,0xE88E8A:0x6837,0xE88DBC:0x6838,0xE88EB5:0x6839,
0xE88DB3:0x683A,0xE88DB5:0x683B,0xE88EA0:0x683C,0xE88E89:0x683D,0xE88EA8:0x683E,
0xE88FB4:0x683F,0xE89093:0x6840,0xE88FAB:0x6841,0xE88F8E:0x6842,0xE88FBD:0x6843,
0xE89083:0x6844,0xE88F98:0x6845,0xE8908B:0x6846,0xE88F81:0x6847,0xE88FB7:0x6848,
0xE89087:0x6849,0xE88FA0:0x684A,0xE88FB2:0x684B,0xE8908D:0x684C,0xE890A2:0x684D,
0xE890A0:0x684E,0xE88EBD:0x684F,0xE890B8:0x6850,0xE89486:0x6851,0xE88FBB:0x6852,
0xE891AD:0x6853,0xE890AA:0x6854,0xE890BC:0x6855,0xE8959A:0x6856,0xE89284:0x6857,
0xE891B7:0x6858,0xE891AB:0x6859,0xE892AD:0x685A,0xE891AE:0x685B,0xE89282:0x685C,
0xE891A9:0x685D,0xE89186:0x685E,0xE890AC:0x685F,0xE891AF:0x6860,0xE891B9:0x6861,
0xE890B5:0x6862,0xE8938A:0x6863,0xE891A2:0x6864,0xE892B9:0x6865,0xE892BF:0x6866,
0xE8929F:0x6867,0xE89399:0x6868,0xE8938D:0x6869,0xE892BB:0x686A,0xE8939A:0x686B,
0xE89390:0x686C,0xE89381:0x686D,0xE89386:0x686E,0xE89396:0x686F,0xE892A1:0x6870,
0xE894A1:0x6871,0xE893BF:0x6872,0xE893B4:0x6873,0xE89497:0x6874,0xE89498:0x6875,
0xE894AC:0x6876,0xE8949F:0x6877,0xE89495:0x6878,0xE89494:0x6879,0xE893BC:0x687A,
0xE89580:0x687B,0xE895A3:0x687C,0xE89598:0x687D,0xE89588:0x687E,0xE89581:0x6921,
0xE89882:0x6922,0xE8958B:0x6923,0xE89595:0x6924,0xE89680:0x6925,0xE896A4:0x6926,
0xE89688:0x6927,0xE89691:0x6928,0xE8968A:0x6929,0xE896A8:0x692A,0xE895AD:0x692B,
0xE89694:0x692C,0xE8969B:0x692D,0xE897AA:0x692E,0xE89687:0x692F,0xE8969C:0x6930,
0xE895B7:0x6931,0xE895BE:0x6932,0xE89690:0x6933,0xE89789:0x6934,0xE896BA:0x6935,
0xE8978F:0x6936,0xE896B9:0x6937,0xE89790:0x6938,0xE89795:0x6939,0xE8979D:0x693A,
0xE897A5:0x693B,0xE8979C:0x693C,0xE897B9:0x693D,0xE8988A:0x693E,0xE89893:0x693F,
0xE8988B:0x6940,0xE897BE:0x6941,0xE897BA:0x6942,0xE89886:0x6943,0xE898A2:0x6944,
0xE8989A:0x6945,0xE898B0:0x6946,0xE898BF:0x6947,0xE8998D:0x6948,0xE4B995:0x6949,
0xE89994:0x694A,0xE8999F:0x694B,0xE899A7:0x694C,0xE899B1:0x694D,0xE89A93:0x694E,
0xE89AA3:0x694F,0xE89AA9:0x6950,0xE89AAA:0x6951,0xE89A8B:0x6952,0xE89A8C:0x6953,
0xE89AB6:0x6954,0xE89AAF:0x6955,0xE89B84:0x6956,0xE89B86:0x6957,0xE89AB0:0x6958,
0xE89B89:0x6959,0xE8A0A3:0x695A,0xE89AAB:0x695B,0xE89B94:0x695C,0xE89B9E:0x695D,
0xE89BA9:0x695E,0xE89BAC:0x695F,0xE89B9F:0x6960,0xE89B9B:0x6961,0xE89BAF:0x6962,
0xE89C92:0x6963,0xE89C86:0x6964,0xE89C88:0x6965,0xE89C80:0x6966,0xE89C83:0x6967,
0xE89BBB:0x6968,0xE89C91:0x6969,0xE89C89:0x696A,0xE89C8D:0x696B,0xE89BB9:0x696C,
0xE89C8A:0x696D,0xE89CB4:0x696E,0xE89CBF:0x696F,0xE89CB7:0x6970,0xE89CBB:0x6971,
0xE89CA5:0x6972,0xE89CA9:0x6973,0xE89C9A:0x6974,0xE89DA0:0x6975,0xE89D9F:0x6976,
0xE89DB8:0x6977,0xE89D8C:0x6978,0xE89D8E:0x6979,0xE89DB4:0x697A,0xE89D97:0x697B,
0xE89DA8:0x697C,0xE89DAE:0x697D,0xE89D99:0x697E,0xE89D93:0x6A21,0xE89DA3:0x6A22,
0xE89DAA:0x6A23,0xE8A085:0x6A24,0xE89EA2:0x6A25,0xE89E9F:0x6A26,0xE89E82:0x6A27,
0xE89EAF:0x6A28,0xE89F8B:0x6A29,0xE89EBD:0x6A2A,0xE89F80:0x6A2B,0xE89F90:0x6A2C,
0xE99B96:0x6A2D,0xE89EAB:0x6A2E,0xE89F84:0x6A2F,0xE89EB3:0x6A30,0xE89F87:0x6A31,
0xE89F86:0x6A32,0xE89EBB:0x6A33,0xE89FAF:0x6A34,0xE89FB2:0x6A35,0xE89FA0:0x6A36,
0xE8A08F:0x6A37,0xE8A08D:0x6A38,0xE89FBE:0x6A39,0xE89FB6:0x6A3A,0xE89FB7:0x6A3B,
0xE8A08E:0x6A3C,0xE89F92:0x6A3D,0xE8A091:0x6A3E,0xE8A096:0x6A3F,0xE8A095:0x6A40,
0xE8A0A2:0x6A41,0xE8A0A1:0x6A42,0xE8A0B1:0x6A43,0xE8A0B6:0x6A44,0xE8A0B9:0x6A45,
0xE8A0A7:0x6A46,0xE8A0BB:0x6A47,0xE8A184:0x6A48,0xE8A182:0x6A49,0xE8A192:0x6A4A,
0xE8A199:0x6A4B,0xE8A19E:0x6A4C,0xE8A1A2:0x6A4D,0xE8A1AB:0x6A4E,0xE8A281:0x6A4F,
0xE8A1BE:0x6A50,0xE8A29E:0x6A51,0xE8A1B5:0x6A52,0xE8A1BD:0x6A53,0xE8A2B5:0x6A54,
0xE8A1B2:0x6A55,0xE8A282:0x6A56,0xE8A297:0x6A57,0xE8A292:0x6A58,0xE8A2AE:0x6A59,
0xE8A299:0x6A5A,0xE8A2A2:0x6A5B,0xE8A28D:0x6A5C,0xE8A2A4:0x6A5D,0xE8A2B0:0x6A5E,
0xE8A2BF:0x6A5F,0xE8A2B1:0x6A60,0xE8A383:0x6A61,0xE8A384:0x6A62,0xE8A394:0x6A63,
0xE8A398:0x6A64,0xE8A399:0x6A65,0xE8A39D:0x6A66,0xE8A3B9:0x6A67,0xE8A482:0x6A68,
0xE8A3BC:0x6A69,0xE8A3B4:0x6A6A,0xE8A3A8:0x6A6B,0xE8A3B2:0x6A6C,0xE8A484:0x6A6D,
0xE8A48C:0x6A6E,0xE8A48A:0x6A6F,0xE8A493:0x6A70,0xE8A583:0x6A71,0xE8A49E:0x6A72,
0xE8A4A5:0x6A73,0xE8A4AA:0x6A74,0xE8A4AB:0x6A75,0xE8A581:0x6A76,0xE8A584:0x6A77,
0xE8A4BB:0x6A78,0xE8A4B6:0x6A79,0xE8A4B8:0x6A7A,0xE8A58C:0x6A7B,0xE8A49D:0x6A7C,
0xE8A5A0:0x6A7D,0xE8A59E:0x6A7E,0xE8A5A6:0x6B21,0xE8A5A4:0x6B22,0xE8A5AD:0x6B23,
0xE8A5AA:0x6B24,0xE8A5AF:0x6B25,0xE8A5B4:0x6B26,0xE8A5B7:0x6B27,0xE8A5BE:0x6B28,
0xE8A683:0x6B29,0xE8A688:0x6B2A,0xE8A68A:0x6B2B,0xE8A693:0x6B2C,0xE8A698:0x6B2D,
0xE8A6A1:0x6B2E,0xE8A6A9:0x6B2F,0xE8A6A6:0x6B30,0xE8A6AC:0x6B31,0xE8A6AF:0x6B32,
0xE8A6B2:0x6B33,0xE8A6BA:0x6B34,0xE8A6BD:0x6B35,0xE8A6BF:0x6B36,0xE8A780:0x6B37,
0xE8A79A:0x6B38,0xE8A79C:0x6B39,0xE8A79D:0x6B3A,0xE8A7A7:0x6B3B,0xE8A7B4:0x6B3C,
0xE8A7B8:0x6B3D,0xE8A883:0x6B3E,0xE8A896:0x6B3F,0xE8A890:0x6B40,0xE8A88C:0x6B41,
0xE8A89B:0x6B42,0xE8A89D:0x6B43,0xE8A8A5:0x6B44,0xE8A8B6:0x6B45,0xE8A981:0x6B46,
0xE8A99B:0x6B47,0xE8A992:0x6B48,0xE8A986:0x6B49,0xE8A988:0x6B4A,0xE8A9BC:0x6B4B,
0xE8A9AD:0x6B4C,0xE8A9AC:0x6B4D,0xE8A9A2:0x6B4E,0xE8AA85:0x6B4F,0xE8AA82:0x6B50,
0xE8AA84:0x6B51,0xE8AAA8:0x6B52,0xE8AAA1:0x6B53,0xE8AA91:0x6B54,0xE8AAA5:0x6B55,
0xE8AAA6:0x6B56,0xE8AA9A:0x6B57,0xE8AAA3:0x6B58,0xE8AB84:0x6B59,0xE8AB8D:0x6B5A,
0xE8AB82:0x6B5B,0xE8AB9A:0x6B5C,0xE8ABAB:0x6B5D,0xE8ABB3:0x6B5E,0xE8ABA7:0x6B5F,
0xE8ABA4:0x6B60,0xE8ABB1:0x6B61,0xE8AC94:0x6B62,0xE8ABA0:0x6B63,0xE8ABA2:0x6B64,
0xE8ABB7:0x6B65,0xE8AB9E:0x6B66,0xE8AB9B:0x6B67,0xE8AC8C:0x6B68,0xE8AC87:0x6B69,
0xE8AC9A:0x6B6A,0xE8ABA1:0x6B6B,0xE8AC96:0x6B6C,0xE8AC90:0x6B6D,0xE8AC97:0x6B6E,
0xE8ACA0:0x6B6F,0xE8ACB3:0x6B70,0xE99EAB:0x6B71,0xE8ACA6:0x6B72,0xE8ACAB:0x6B73,
0xE8ACBE:0x6B74,0xE8ACA8:0x6B75,0xE8AD81:0x6B76,0xE8AD8C:0x6B77,0xE8AD8F:0x6B78,
0xE8AD8E:0x6B79,0xE8AD89:0x6B7A,0xE8AD96:0x6B7B,0xE8AD9B:0x6B7C,0xE8AD9A:0x6B7D,
0xE8ADAB:0x6B7E,0xE8AD9F:0x6C21,0xE8ADAC:0x6C22,0xE8ADAF:0x6C23,0xE8ADB4:0x6C24,
0xE8ADBD:0x6C25,0xE8AE80:0x6C26,0xE8AE8C:0x6C27,0xE8AE8E:0x6C28,0xE8AE92:0x6C29,
0xE8AE93:0x6C2A,0xE8AE96:0x6C2B,0xE8AE99:0x6C2C,0xE8AE9A:0x6C2D,0xE8B0BA:0x6C2E,
0xE8B181:0x6C2F,0xE8B0BF:0x6C30,0xE8B188:0x6C31,0xE8B18C:0x6C32,0xE8B18E:0x6C33,
0xE8B190:0x6C34,0xE8B195:0x6C35,0xE8B1A2:0x6C36,0xE8B1AC:0x6C37,0xE8B1B8:0x6C38,
0xE8B1BA:0x6C39,0xE8B282:0x6C3A,0xE8B289:0x6C3B,0xE8B285:0x6C3C,0xE8B28A:0x6C3D,
0xE8B28D:0x6C3E,0xE8B28E:0x6C3F,0xE8B294:0x6C40,0xE8B1BC:0x6C41,0xE8B298:0x6C42,
0xE6889D:0x6C43,0xE8B2AD:0x6C44,0xE8B2AA:0x6C45,0xE8B2BD:0x6C46,0xE8B2B2:0x6C47,
0xE8B2B3:0x6C48,0xE8B2AE:0x6C49,0xE8B2B6:0x6C4A,0xE8B388:0x6C4B,0xE8B381:0x6C4C,
0xE8B3A4:0x6C4D,0xE8B3A3:0x6C4E,0xE8B39A:0x6C4F,0xE8B3BD:0x6C50,0xE8B3BA:0x6C51,
0xE8B3BB:0x6C52,0xE8B484:0x6C53,0xE8B485:0x6C54,0xE8B48A:0x6C55,0xE8B487:0x6C56,
0xE8B48F:0x6C57,0xE8B48D:0x6C58,0xE8B490:0x6C59,0xE9BD8E:0x6C5A,0xE8B493:0x6C5B,
0xE8B38D:0x6C5C,0xE8B494:0x6C5D,0xE8B496:0x6C5E,0xE8B5A7:0x6C5F,0xE8B5AD:0x6C60,
0xE8B5B1:0x6C61,0xE8B5B3:0x6C62,0xE8B681:0x6C63,0xE8B699:0x6C64,0xE8B782:0x6C65,
0xE8B6BE:0x6C66,0xE8B6BA:0x6C67,0xE8B78F:0x6C68,0xE8B79A:0x6C69,0xE8B796:0x6C6A,
0xE8B78C:0x6C6B,0xE8B79B:0x6C6C,0xE8B78B:0x6C6D,0xE8B7AA:0x6C6E,0xE8B7AB:0x6C6F,
0xE8B79F:0x6C70,0xE8B7A3:0x6C71,0xE8B7BC:0x6C72,0xE8B888:0x6C73,0xE8B889:0x6C74,
0xE8B7BF:0x6C75,0xE8B89D:0x6C76,0xE8B89E:0x6C77,0xE8B890:0x6C78,0xE8B89F:0x6C79,
0xE8B982:0x6C7A,0xE8B8B5:0x6C7B,0xE8B8B0:0x6C7C,0xE8B8B4:0x6C7D,0xE8B98A:0x6C7E,
0xE8B987:0x6D21,0xE8B989:0x6D22,0xE8B98C:0x6D23,0xE8B990:0x6D24,0xE8B988:0x6D25,
0xE8B999:0x6D26,0xE8B9A4:0x6D27,0xE8B9A0:0x6D28,0xE8B8AA:0x6D29,0xE8B9A3:0x6D2A,
0xE8B995:0x6D2B,0xE8B9B6:0x6D2C,0xE8B9B2:0x6D2D,0xE8B9BC:0x6D2E,0xE8BA81:0x6D2F,
0xE8BA87:0x6D30,0xE8BA85:0x6D31,0xE8BA84:0x6D32,0xE8BA8B:0x6D33,0xE8BA8A:0x6D34,
0xE8BA93:0x6D35,0xE8BA91:0x6D36,0xE8BA94:0x6D37,0xE8BA99:0x6D38,0xE8BAAA:0x6D39,
0xE8BAA1:0x6D3A,0xE8BAAC:0x6D3B,0xE8BAB0:0x6D3C,0xE8BB86:0x6D3D,0xE8BAB1:0x6D3E,
0xE8BABE:0x6D3F,0xE8BB85:0x6D40,0xE8BB88:0x6D41,0xE8BB8B:0x6D42,0xE8BB9B:0x6D43,
0xE8BBA3:0x6D44,0xE8BBBC:0x6D45,0xE8BBBB:0x6D46,0xE8BBAB:0x6D47,0xE8BBBE:0x6D48,
0xE8BC8A:0x6D49,0xE8BC85:0x6D4A,0xE8BC95:0x6D4B,0xE8BC92:0x6D4C,0xE8BC99:0x6D4D,
0xE8BC93:0x6D4E,0xE8BC9C:0x6D4F,0xE8BC9F:0x6D50,0xE8BC9B:0x6D51,0xE8BC8C:0x6D52,
0xE8BCA6:0x6D53,0xE8BCB3:0x6D54,0xE8BCBB:0x6D55,0xE8BCB9:0x6D56,0xE8BD85:0x6D57,
0xE8BD82:0x6D58,0xE8BCBE:0x6D59,0xE8BD8C:0x6D5A,0xE8BD89:0x6D5B,0xE8BD86:0x6D5C,
0xE8BD8E:0x6D5D,0xE8BD97:0x6D5E,0xE8BD9C:0x6D5F,0xE8BDA2:0x6D60,0xE8BDA3:0x6D61,
0xE8BDA4:0x6D62,0xE8BE9C:0x6D63,0xE8BE9F:0x6D64,0xE8BEA3:0x6D65,0xE8BEAD:0x6D66,
0xE8BEAF:0x6D67,0xE8BEB7:0x6D68,0xE8BF9A:0x6D69,0xE8BFA5:0x6D6A,0xE8BFA2:0x6D6B,
0xE8BFAA:0x6D6C,0xE8BFAF:0x6D6D,0xE98287:0x6D6E,0xE8BFB4:0x6D6F,0xE98085:0x6D70,
0xE8BFB9:0x6D71,0xE8BFBA:0x6D72,0xE98091:0x6D73,0xE98095:0x6D74,0xE980A1:0x6D75,
0xE9808D:0x6D76,0xE9809E:0x6D77,0xE98096:0x6D78,0xE9808B:0x6D79,0xE980A7:0x6D7A,
0xE980B6:0x6D7B,0xE980B5:0x6D7C,0xE980B9:0x6D7D,0xE8BFB8:0x6D7E,0xE9818F:0x6E21,
0xE98190:0x6E22,0xE98191:0x6E23,0xE98192:0x6E24,0xE9808E:0x6E25,0xE98189:0x6E26,
0xE980BE:0x6E27,0xE98196:0x6E28,0xE98198:0x6E29,0xE9819E:0x6E2A,0xE981A8:0x6E2B,
0xE981AF:0x6E2C,0xE981B6:0x6E2D,0xE99AA8:0x6E2E,0xE981B2:0x6E2F,0xE98282:0x6E30,
0xE981BD:0x6E31,0xE98281:0x6E32,0xE98280:0x6E33,0xE9828A:0x6E34,0xE98289:0x6E35,
0xE9828F:0x6E36,0xE982A8:0x6E37,0xE982AF:0x6E38,0xE982B1:0x6E39,0xE982B5:0x6E3A,
0xE983A2:0x6E3B,0xE983A4:0x6E3C,0xE68988:0x6E3D,0xE9839B:0x6E3E,0xE98482:0x6E3F,
0xE98492:0x6E40,0xE98499:0x6E41,0xE984B2:0x6E42,0xE984B0:0x6E43,0xE9858A:0x6E44,
0xE98596:0x6E45,0xE98598:0x6E46,0xE985A3:0x6E47,0xE985A5:0x6E48,0xE985A9:0x6E49,
0xE985B3:0x6E4A,0xE985B2:0x6E4B,0xE9868B:0x6E4C,0xE98689:0x6E4D,0xE98682:0x6E4E,
0xE986A2:0x6E4F,0xE986AB:0x6E50,0xE986AF:0x6E51,0xE986AA:0x6E52,0xE986B5:0x6E53,
0xE986B4:0x6E54,0xE986BA:0x6E55,0xE98780:0x6E56,0xE98781:0x6E57,0xE98789:0x6E58,
0xE9878B:0x6E59,0xE98790:0x6E5A,0xE98796:0x6E5B,0xE9879F:0x6E5C,0xE987A1:0x6E5D,
0xE9879B:0x6E5E,0xE987BC:0x6E5F,0xE987B5:0x6E60,0xE987B6:0x6E61,0xE9889E:0x6E62,
0xE987BF:0x6E63,0xE98894:0x6E64,0xE988AC:0x6E65,0xE98895:0x6E66,0xE98891:0x6E67,
0xE9899E:0x6E68,0xE98997:0x6E69,0xE98985:0x6E6A,0xE98989:0x6E6B,0xE989A4:0x6E6C,
0xE98988:0x6E6D,0xE98A95:0x6E6E,0xE988BF:0x6E6F,0xE9898B:0x6E70,0xE98990:0x6E71,
0xE98A9C:0x6E72,0xE98A96:0x6E73,0xE98A93:0x6E74,0xE98A9B:0x6E75,0xE9899A:0x6E76,
0xE98B8F:0x6E77,0xE98AB9:0x6E78,0xE98AB7:0x6E79,0xE98BA9:0x6E7A,0xE98C8F:0x6E7B,
0xE98BBA:0x6E7C,0xE98D84:0x6E7D,0xE98CAE:0x6E7E,0xE98C99:0x6F21,0xE98CA2:0x6F22,
0xE98C9A:0x6F23,0xE98CA3:0x6F24,0xE98CBA:0x6F25,0xE98CB5:0x6F26,0xE98CBB:0x6F27,
0xE98D9C:0x6F28,0xE98DA0:0x6F29,0xE98DBC:0x6F2A,0xE98DAE:0x6F2B,0xE98D96:0x6F2C,
0xE98EB0:0x6F2D,0xE98EAC:0x6F2E,0xE98EAD:0x6F2F,0xE98E94:0x6F30,0xE98EB9:0x6F31,
0xE98F96:0x6F32,0xE98F97:0x6F33,0xE98FA8:0x6F34,0xE98FA5:0x6F35,0xE98F98:0x6F36,
0xE98F83:0x6F37,0xE98F9D:0x6F38,0xE98F90:0x6F39,0xE98F88:0x6F3A,0xE98FA4:0x6F3B,
0xE9909A:0x6F3C,0xE99094:0x6F3D,0xE99093:0x6F3E,0xE99083:0x6F3F,0xE99087:0x6F40,
0xE99090:0x6F41,0xE990B6:0x6F42,0xE990AB:0x6F43,0xE990B5:0x6F44,0xE990A1:0x6F45,
0xE990BA:0x6F46,0xE99181:0x6F47,0xE99192:0x6F48,0xE99184:0x6F49,0xE9919B:0x6F4A,
0xE991A0:0x6F4B,0xE991A2:0x6F4C,0xE9919E:0x6F4D,0xE991AA:0x6F4E,0xE988A9:0x6F4F,
0xE991B0:0x6F50,0xE991B5:0x6F51,0xE991B7:0x6F52,0xE991BD:0x6F53,0xE9919A:0x6F54,
0xE991BC:0x6F55,0xE991BE:0x6F56,0xE99281:0x6F57,0xE991BF:0x6F58,0xE99682:0x6F59,
0xE99687:0x6F5A,0xE9968A:0x6F5B,0xE99694:0x6F5C,0xE99696:0x6F5D,0xE99698:0x6F5E,
0xE99699:0x6F5F,0xE996A0:0x6F60,0xE996A8:0x6F61,0xE996A7:0x6F62,0xE996AD:0x6F63,
0xE996BC:0x6F64,0xE996BB:0x6F65,0xE996B9:0x6F66,0xE996BE:0x6F67,0xE9978A:0x6F68,
0xE6BFB6:0x6F69,0xE99783:0x6F6A,0xE9978D:0x6F6B,0xE9978C:0x6F6C,0xE99795:0x6F6D,
0xE99794:0x6F6E,0xE99796:0x6F6F,0xE9979C:0x6F70,0xE997A1:0x6F71,0xE997A5:0x6F72,
0xE997A2:0x6F73,0xE998A1:0x6F74,0xE998A8:0x6F75,0xE998AE:0x6F76,0xE998AF:0x6F77,
0xE99982:0x6F78,0xE9998C:0x6F79,0xE9998F:0x6F7A,0xE9998B:0x6F7B,0xE999B7:0x6F7C,
0xE9999C:0x6F7D,0xE9999E:0x6F7E,0xE9999D:0x7021,0xE9999F:0x7022,0xE999A6:0x7023,
0xE999B2:0x7024,0xE999AC:0x7025,0xE99A8D:0x7026,0xE99A98:0x7027,0xE99A95:0x7028,
0xE99A97:0x7029,0xE99AAA:0x702A,0xE99AA7:0x702B,0xE99AB1:0x702C,0xE99AB2:0x702D,
0xE99AB0:0x702E,0xE99AB4:0x702F,0xE99AB6:0x7030,0xE99AB8:0x7031,0xE99AB9:0x7032,
0xE99B8E:0x7033,0xE99B8B:0x7034,0xE99B89:0x7035,0xE99B8D:0x7036,0xE8A58D:0x7037,
0xE99B9C:0x7038,0xE99C8D:0x7039,0xE99B95:0x703A,0xE99BB9:0x703B,0xE99C84:0x703C,
0xE99C86:0x703D,0xE99C88:0x703E,0xE99C93:0x703F,0xE99C8E:0x7040,0xE99C91:0x7041,
0xE99C8F:0x7042,0xE99C96:0x7043,0xE99C99:0x7044,0xE99CA4:0x7045,0xE99CAA:0x7046,
0xE99CB0:0x7047,0xE99CB9:0x7048,0xE99CBD:0x7049,0xE99CBE:0x704A,0xE99D84:0x704B,
0xE99D86:0x704C,0xE99D88:0x704D,0xE99D82:0x704E,0xE99D89:0x704F,0xE99D9C:0x7050,
0xE99DA0:0x7051,0xE99DA4:0x7052,0xE99DA6:0x7053,0xE99DA8:0x7054,0xE58B92:0x7055,
0xE99DAB:0x7056,0xE99DB1:0x7057,0xE99DB9:0x7058,0xE99E85:0x7059,0xE99DBC:0x705A,
0xE99E81:0x705B,0xE99DBA:0x705C,0xE99E86:0x705D,0xE99E8B:0x705E,0xE99E8F:0x705F,
0xE99E90:0x7060,0xE99E9C:0x7061,0xE99EA8:0x7062,0xE99EA6:0x7063,0xE99EA3:0x7064,
0xE99EB3:0x7065,0xE99EB4:0x7066,0xE99F83:0x7067,0xE99F86:0x7068,0xE99F88:0x7069,
0xE99F8B:0x706A,0xE99F9C:0x706B,0xE99FAD:0x706C,0xE9BD8F:0x706D,0xE99FB2:0x706E,
0xE7AB9F:0x706F,0xE99FB6:0x7070,0xE99FB5:0x7071,0xE9A08F:0x7072,0xE9A08C:0x7073,
0xE9A0B8:0x7074,0xE9A0A4:0x7075,0xE9A0A1:0x7076,0xE9A0B7:0x7077,0xE9A0BD:0x7078,
0xE9A186:0x7079,0xE9A18F:0x707A,0xE9A18B:0x707B,0xE9A1AB:0x707C,0xE9A1AF:0x707D,
0xE9A1B0:0x707E,0xE9A1B1:0x7121,0xE9A1B4:0x7122,0xE9A1B3:0x7123,0xE9A2AA:0x7124,
0xE9A2AF:0x7125,0xE9A2B1:0x7126,0xE9A2B6:0x7127,0xE9A384:0x7128,0xE9A383:0x7129,
0xE9A386:0x712A,0xE9A3A9:0x712B,0xE9A3AB:0x712C,0xE9A483:0x712D,0xE9A489:0x712E,
0xE9A492:0x712F,0xE9A494:0x7130,0xE9A498:0x7131,0xE9A4A1:0x7132,0xE9A49D:0x7133,
0xE9A49E:0x7134,0xE9A4A4:0x7135,0xE9A4A0:0x7136,0xE9A4AC:0x7137,0xE9A4AE:0x7138,
0xE9A4BD:0x7139,0xE9A4BE:0x713A,0xE9A582:0x713B,0xE9A589:0x713C,0xE9A585:0x713D,
0xE9A590:0x713E,0xE9A58B:0x713F,0xE9A591:0x7140,0xE9A592:0x7141,0xE9A58C:0x7142,
0xE9A595:0x7143,0xE9A697:0x7144,0xE9A698:0x7145,0xE9A6A5:0x7146,0xE9A6AD:0x7147,
0xE9A6AE:0x7148,0xE9A6BC:0x7149,0xE9A79F:0x714A,0xE9A79B:0x714B,0xE9A79D:0x714C,
0xE9A798:0x714D,0xE9A791:0x714E,0xE9A7AD:0x714F,0xE9A7AE:0x7150,0xE9A7B1:0x7151,
0xE9A7B2:0x7152,0xE9A7BB:0x7153,0xE9A7B8:0x7154,0xE9A881:0x7155,0xE9A88F:0x7156,
0xE9A885:0x7157,0xE9A7A2:0x7158,0xE9A899:0x7159,0xE9A8AB:0x715A,0xE9A8B7:0x715B,
0xE9A985:0x715C,0xE9A982:0x715D,0xE9A980:0x715E,0xE9A983:0x715F,0xE9A8BE:0x7160,
0xE9A995:0x7161,0xE9A98D:0x7162,0xE9A99B:0x7163,0xE9A997:0x7164,0xE9A99F:0x7165,
0xE9A9A2:0x7166,0xE9A9A5:0x7167,0xE9A9A4:0x7168,0xE9A9A9:0x7169,0xE9A9AB:0x716A,
0xE9A9AA:0x716B,0xE9AAAD:0x716C,0xE9AAB0:0x716D,0xE9AABC:0x716E,0xE9AB80:0x716F,
0xE9AB8F:0x7170,0xE9AB91:0x7171,0xE9AB93:0x7172,0xE9AB94:0x7173,0xE9AB9E:0x7174,
0xE9AB9F:0x7175,0xE9ABA2:0x7176,0xE9ABA3:0x7177,0xE9ABA6:0x7178,0xE9ABAF:0x7179,
0xE9ABAB:0x717A,0xE9ABAE:0x717B,0xE9ABB4:0x717C,0xE9ABB1:0x717D,0xE9ABB7:0x717E,
0xE9ABBB:0x7221,0xE9AC86:0x7222,0xE9AC98:0x7223,0xE9AC9A:0x7224,0xE9AC9F:0x7225,
0xE9ACA2:0x7226,0xE9ACA3:0x7227,0xE9ACA5:0x7228,0xE9ACA7:0x7229,0xE9ACA8:0x722A,
0xE9ACA9:0x722B,0xE9ACAA:0x722C,0xE9ACAE:0x722D,0xE9ACAF:0x722E,0xE9ACB2:0x722F,
0xE9AD84:0x7230,0xE9AD83:0x7231,0xE9AD8F:0x7232,0xE9AD8D:0x7233,0xE9AD8E:0x7234,
0xE9AD91:0x7235,0xE9AD98:0x7236,0xE9ADB4:0x7237,0xE9AE93:0x7238,0xE9AE83:0x7239,
0xE9AE91:0x723A,0xE9AE96:0x723B,0xE9AE97:0x723C,0xE9AE9F:0x723D,0xE9AEA0:0x723E,
0xE9AEA8:0x723F,0xE9AEB4:0x7240,0xE9AF80:0x7241,0xE9AF8A:0x7242,0xE9AEB9:0x7243,
0xE9AF86:0x7244,0xE9AF8F:0x7245,0xE9AF91:0x7246,0xE9AF92:0x7247,0xE9AFA3:0x7248,
0xE9AFA2:0x7249,0xE9AFA4:0x724A,0xE9AF94:0x724B,0xE9AFA1:0x724C,0xE9B0BA:0x724D,
0xE9AFB2:0x724E,0xE9AFB1:0x724F,0xE9AFB0:0x7250,0xE9B095:0x7251,0xE9B094:0x7252,
0xE9B089:0x7253,0xE9B093:0x7254,0xE9B08C:0x7255,0xE9B086:0x7256,0xE9B088:0x7257,
0xE9B092:0x7258,0xE9B08A:0x7259,0xE9B084:0x725A,0xE9B0AE:0x725B,0xE9B09B:0x725C,
0xE9B0A5:0x725D,0xE9B0A4:0x725E,0xE9B0A1:0x725F,0xE9B0B0:0x7260,0xE9B187:0x7261,
0xE9B0B2:0x7262,0xE9B186:0x7263,0xE9B0BE:0x7264,0xE9B19A:0x7265,0xE9B1A0:0x7266,
0xE9B1A7:0x7267,0xE9B1B6:0x7268,0xE9B1B8:0x7269,0xE9B3A7:0x726A,0xE9B3AC:0x726B,
0xE9B3B0:0x726C,0xE9B489:0x726D,0xE9B488:0x726E,0xE9B3AB:0x726F,0xE9B483:0x7270,
0xE9B486:0x7271,0xE9B4AA:0x7272,0xE9B4A6:0x7273,0xE9B6AF:0x7274,0xE9B4A3:0x7275,
0xE9B49F:0x7276,0xE9B584:0x7277,0xE9B495:0x7278,0xE9B492:0x7279,0xE9B581:0x727A,
0xE9B4BF:0x727B,0xE9B4BE:0x727C,0xE9B586:0x727D,0xE9B588:0x727E,0xE9B59D:0x7321,
0xE9B59E:0x7322,0xE9B5A4:0x7323,0xE9B591:0x7324,0xE9B590:0x7325,0xE9B599:0x7326,
0xE9B5B2:0x7327,0xE9B689:0x7328,0xE9B687:0x7329,0xE9B6AB:0x732A,0xE9B5AF:0x732B,
0xE9B5BA:0x732C,0xE9B69A:0x732D,0xE9B6A4:0x732E,0xE9B6A9:0x732F,0xE9B6B2:0x7330,
0xE9B784:0x7331,0xE9B781:0x7332,0xE9B6BB:0x7333,0xE9B6B8:0x7334,0xE9B6BA:0x7335,
0xE9B786:0x7336,0xE9B78F:0x7337,0xE9B782:0x7338,0xE9B799:0x7339,0xE9B793:0x733A,
0xE9B7B8:0x733B,0xE9B7A6:0x733C,0xE9B7AD:0x733D,0xE9B7AF:0x733E,0xE9B7BD:0x733F,
0xE9B89A:0x7340,0xE9B89B:0x7341,0xE9B89E:0x7342,0xE9B9B5:0x7343,0xE9B9B9:0x7344,
0xE9B9BD:0x7345,0xE9BA81:0x7346,0xE9BA88:0x7347,0xE9BA8B:0x7348,0xE9BA8C:0x7349,
0xE9BA92:0x734A,0xE9BA95:0x734B,0xE9BA91:0x734C,0xE9BA9D:0x734D,0xE9BAA5:0x734E,
0xE9BAA9:0x734F,0xE9BAB8:0x7350,0xE9BAAA:0x7351,0xE9BAAD:0x7352,0xE99DA1:0x7353,
0xE9BB8C:0x7354,0xE9BB8E:0x7355,0xE9BB8F:0x7356,0xE9BB90:0x7357,0xE9BB94:0x7358,
0xE9BB9C:0x7359,0xE9BB9E:0x735A,0xE9BB9D:0x735B,0xE9BBA0:0x735C,0xE9BBA5:0x735D,
0xE9BBA8:0x735E,0xE9BBAF:0x735F,0xE9BBB4:0x7360,0xE9BBB6:0x7361,0xE9BBB7:0x7362,
0xE9BBB9:0x7363,0xE9BBBB:0x7364,0xE9BBBC:0x7365,0xE9BBBD:0x7366,0xE9BC87:0x7367,
0xE9BC88:0x7368,0xE79AB7:0x7369,0xE9BC95:0x736A,0xE9BCA1:0x736B,0xE9BCAC:0x736C,
0xE9BCBE:0x736D,0xE9BD8A:0x736E,0xE9BD92:0x736F,0xE9BD94:0x7370,0xE9BDA3:0x7371,
0xE9BD9F:0x7372,0xE9BDA0:0x7373,0xE9BDA1:0x7374,0xE9BDA6:0x7375,0xE9BDA7:0x7376,
0xE9BDAC:0x7377,0xE9BDAA:0x7378,0xE9BDB7:0x7379,0xE9BDB2:0x737A,0xE9BDB6:0x737B,
0xE9BE95:0x737C,0xE9BE9C:0x737D,0xE9BEA0:0x737E,0xE5A0AF:0x7421,0xE6A787:0x7422,
0xE98199:0x7423,0xE791A4:0x7424,0xE5879C:0x7425,0xE78699:0x7426,

0xE7BA8A:0x7921,0xE8A49C:0x7922,0xE98D88:0x7923,0xE98A88:0x7924,0xE8939C:0x7925,
0xE4BF89:0x7926,0xE782BB:0x7927,0xE698B1:0x7928,0xE6A388:0x7929,0xE98BB9:0x792A,
0xE69BBB:0x792B,0xE5BD85:0x792C,0xE4B8A8:0x792D,0xE4BBA1:0x792E,0xE4BBBC:0x792F,
0xE4BC80:0x7930,0xE4BC83:0x7931,0xE4BCB9:0x7932,0xE4BD96:0x7933,0xE4BE92:0x7934,
0xE4BE8A:0x7935,0xE4BE9A:0x7936,0xE4BE94:0x7937,0xE4BF8D:0x7938,0xE58180:0x7939,
0xE580A2:0x793A,0xE4BFBF:0x793B,0xE5809E:0x793C,0xE58186:0x793D,0xE581B0:0x793E,
0xE58182:0x793F,0xE58294:0x7940,0xE583B4:0x7941,0xE58398:0x7942,0xE5858A:0x7943,
0xE585A4:0x7944,0xE5869D:0x7945,0xE586BE:0x7946,0xE587AC:0x7947,0xE58895:0x7948,
0xE58A9C:0x7949,0xE58AA6:0x794A,0xE58B80:0x794B,0xE58B9B:0x794C,0xE58C80:0x794D,
0xE58C87:0x794E,0xE58CA4:0x794F,0xE58DB2:0x7950,0xE58E93:0x7951,0xE58EB2:0x7952,
0xE58F9D:0x7953,0xEFA88E:0x7954,0xE5929C:0x7955,0xE5928A:0x7956,0xE592A9:0x7957,
0xE593BF:0x7958,0xE59686:0x7959,0xE59D99:0x795A,0xE59DA5:0x795B,0xE59EAC:0x795C,
0xE59F88:0x795D,0xE59F87:0x795E,0xEFA88F:0x795F,0xEFA890:0x7960,0xE5A29E:0x7961,
0xE5A2B2:0x7962,0xE5A48B:0x7963,0xE5A593:0x7964,0xE5A59B:0x7965,0xE5A59D:0x7966,
0xE5A5A3:0x7967,0xE5A6A4:0x7968,0xE5A6BA:0x7969,0xE5AD96:0x796A,0xE5AF80:0x796B,
0xE794AF:0x796C,0xE5AF98:0x796D,0xE5AFAC:0x796E,0xE5B09E:0x796F,0xE5B2A6:0x7970,
0xE5B2BA:0x7971,0xE5B3B5:0x7972,0xE5B4A7:0x7973,0xE5B593:0x7974,0xEFA891:0x7975,
0xE5B582:0x7976,0xE5B5AD:0x7977,0xE5B6B8:0x7978,0xE5B6B9:0x7979,0xE5B790:0x797A,
0xE5BCA1:0x797B,0xE5BCB4:0x797C,0xE5BDA7:0x797D,0xE5BEB7:0x797E,0xE5BF9E:0x7A21,
0xE6819D:0x7A22,0xE68285:0x7A23,0xE6828A:0x7A24,0xE6839E:0x7A25,0xE68395:0x7A26,
0xE684A0:0x7A27,0xE683B2:0x7A28,0xE68491:0x7A29,0xE684B7:0x7A2A,0xE684B0:0x7A2B,
0xE68698:0x7A2C,0xE68893:0x7A2D,0xE68AA6:0x7A2E,0xE68FB5:0x7A2F,0xE691A0:0x7A30,
0xE6929D:0x7A31,0xE6938E:0x7A32,0xE6958E:0x7A33,0xE69880:0x7A34,0xE69895:0x7A35,
0xE698BB:0x7A36,0xE69889:0x7A37,0xE698AE:0x7A38,0xE6989E:0x7A39,0xE698A4:0x7A3A,
0xE699A5:0x7A3B,0xE69997:0x7A3C,0xE69999:0x7A3D,0xEFA892:0x7A3E,0xE699B3:0x7A3F,
0xE69A99:0x7A40,0xE69AA0:0x7A41,0xE69AB2:0x7A42,0xE69ABF:0x7A43,0xE69BBA:0x7A44,
0xE69C8E:0x7A45,0xEFA4A9:0x7A46,0xE69DA6:0x7A47,0xE69EBB:0x7A48,0xE6A192:0x7A49,
0xE69F80:0x7A4A,0xE6A081:0x7A4B,0xE6A184:0x7A4C,0xE6A38F:0x7A4D,0xEFA893:0x7A4E,
0xE6A5A8:0x7A4F,0xEFA894:0x7A50,0xE6A698:0x7A51,0xE6A7A2:0x7A52,0xE6A8B0:0x7A53,
0xE6A9AB:0x7A54,0xE6A986:0x7A55,0xE6A9B3:0x7A56,0xE6A9BE:0x7A57,0xE6ABA2:0x7A58,
0xE6ABA4:0x7A59,0xE6AF96:0x7A5A,0xE6B0BF:0x7A5B,0xE6B19C:0x7A5C,0xE6B286:0x7A5D,
0xE6B1AF:0x7A5E,0xE6B39A:0x7A5F,0xE6B484:0x7A60,0xE6B687:0x7A61,0xE6B5AF:0x7A62,
0xE6B696:0x7A63,0xE6B6AC:0x7A64,0xE6B78F:0x7A65,0xE6B7B8:0x7A66,0xE6B7B2:0x7A67,
0xE6B7BC:0x7A68,0xE6B8B9:0x7A69,0xE6B99C:0x7A6A,0xE6B8A7:0x7A6B,0xE6B8BC:0x7A6C,
0xE6BABF:0x7A6D,0xE6BE88:0x7A6E,0xE6BEB5:0x7A6F,0xE6BFB5:0x7A70,0xE78085:0x7A71,
0xE78087:0x7A72,0xE780A8:0x7A73,0xE78285:0x7A74,0xE782AB:0x7A75,0xE7848F:0x7A76,
0xE78484:0x7A77,0xE7859C:0x7A78,0xE78586:0x7A79,0xE78587:0x7A7A,0xEFA895:0x7A7B,
0xE78781:0x7A7C,0xE787BE:0x7A7D,0xE78AB1:0x7A7E,0xE78ABE:0x7B21,0xE78CA4:0x7B22,
0xEFA896:0x7B23,0xE78DB7:0x7B24,0xE78EBD:0x7B25,0xE78F89:0x7B26,0xE78F96:0x7B27,
0xE78FA3:0x7B28,0xE78F92:0x7B29,0xE79087:0x7B2A,0xE78FB5:0x7B2B,0xE790A6:0x7B2C,
0xE790AA:0x7B2D,0xE790A9:0x7B2E,0xE790AE:0x7B2F,0xE791A2:0x7B30,0xE79289:0x7B31,
0xE7929F:0x7B32,0xE79481:0x7B33,0xE795AF:0x7B34,0xE79A82:0x7B35,0xE79A9C:0x7B36,
0xE79A9E:0x7B37,0xE79A9B:0x7B38,0xE79AA6:0x7B39,0xEFA897:0x7B3A,0xE79D86:0x7B3B,
0xE58AAF:0x7B3C,0xE7A0A1:0x7B3D,0xE7A18E:0x7B3E,0xE7A1A4:0x7B3F,0xE7A1BA:0x7B40,
0xE7A4B0:0x7B41,0xEFA898:0x7B42,0xEFA899:0x7B43,0xEFA89A:0x7B44,0xE7A694:0x7B45,
0xEFA89B:0x7B46,0xE7A69B:0x7B47,0xE7AB91:0x7B48,0xE7ABA7:0x7B49,0xEFA89C:0x7B4A,
0xE7ABAB:0x7B4B,0xE7AE9E:0x7B4C,0xEFA89D:0x7B4D,0xE7B588:0x7B4E,0xE7B59C:0x7B4F,
0xE7B6B7:0x7B50,0xE7B6A0:0x7B51,0xE7B796:0x7B52,0xE7B992:0x7B53,0xE7BD87:0x7B54,
0xE7BEA1:0x7B55,0xEFA89E:0x7B56,0xE88C81:0x7B57,0xE88DA2:0x7B58,0xE88DBF:0x7B59,
0xE88F87:0x7B5A,0xE88FB6:0x7B5B,0xE89188:0x7B5C,0xE892B4:0x7B5D,0xE89593:0x7B5E,
0xE89599:0x7B5F,0xE895AB:0x7B60,0xEFA89F:0x7B61,0xE896B0:0x7B62,0xEFA8A0:0x7B63,
0xEFA8A1:0x7B64,0xE8A087:0x7B65,0xE8A3B5:0x7B66,0xE8A892:0x7B67,0xE8A8B7:0x7B68,
0xE8A9B9:0x7B69,0xE8AAA7:0x7B6A,0xE8AABE:0x7B6B,0xE8AB9F:0x7B6C,0xEFA8A2:0x7B6D,
0xE8ABB6:0x7B6E,0xE8AD93:0x7B6F,0xE8ADBF:0x7B70,0xE8B3B0:0x7B71,0xE8B3B4:0x7B72,
0xE8B492:0x7B73,0xE8B5B6:0x7B74,0xEFA8A3:0x7B75,0xE8BB8F:0x7B76,0xEFA8A4:0x7B77,
0xEFA8A5:0x7B78,0xE981A7:0x7B79,0xE9839E:0x7B7A,0xEFA8A6:0x7B7B,0xE98495:0x7B7C,
0xE984A7:0x7B7D,0xE9879A:0x7B7E,0xE98797:0x7C21,0xE9879E:0x7C22,0xE987AD:0x7C23,
0xE987AE:0x7C24,0xE987A4:0x7C25,0xE987A5:0x7C26,0xE98886:0x7C27,0xE98890:0x7C28,
0xE9888A:0x7C29,0xE988BA:0x7C2A,0xE98980:0x7C2B,0xE988BC:0x7C2C,0xE9898E:0x7C2D,
0xE98999:0x7C2E,0xE98991:0x7C2F,0xE988B9:0x7C30,0xE989A7:0x7C31,0xE98AA7:0x7C32,
0xE989B7:0x7C33,0xE989B8:0x7C34,0xE98BA7:0x7C35,0xE98B97:0x7C36,0xE98B99:0x7C37,
0xE98B90:0x7C38,0xEFA8A7:0x7C39,0xE98B95:0x7C3A,0xE98BA0:0x7C3B,0xE98B93:0x7C3C,
0xE98CA5:0x7C3D,0xE98CA1:0x7C3E,0xE98BBB:0x7C3F,0xEFA8A8:0x7C40,0xE98C9E:0x7C41,
0xE98BBF:0x7C42,0xE98C9D:0x7C43,0xE98C82:0x7C44,0xE98DB0:0x7C45,0xE98D97:0x7C46,
0xE98EA4:0x7C47,0xE98F86:0x7C48,0xE98F9E:0x7C49,0xE98FB8:0x7C4A,0xE990B1:0x7C4B,
0xE99185:0x7C4C,0xE99188:0x7C4D,0xE99692:0x7C4E,0xEFA79C:0x7C4F,0xEFA8A9:0x7C50,
0xE99A9D:0x7C51,0xE99AAF:0x7C52,0xE99CB3:0x7C53,0xE99CBB:0x7C54,0xE99D83:0x7C55,
0xE99D8D:0x7C56,0xE99D8F:0x7C57,0xE99D91:0x7C58,0xE99D95:0x7C59,0xE9A197:0x7C5A,
0xE9A1A5:0x7C5B,0xEFA8AA:0x7C5C,0xEFA8AB:0x7C5D,0xE9A4A7:0x7C5E,0xEFA8AC:0x7C5F,
0xE9A69E:0x7C60,0xE9A98E:0x7C61,0xE9AB99:0x7C62,0xE9AB9C:0x7C63,0xE9ADB5:0x7C64,
0xE9ADB2:0x7C65,0xE9AE8F:0x7C66,0xE9AEB1:0x7C67,0xE9AEBB:0x7C68,0xE9B080:0x7C69,
0xE9B5B0:0x7C6A,0xE9B5AB:0x7C6B,0xEFA8AD:0x7C6C,0xE9B899:0x7C6D,0xE9BB91:0x7C6E,
0xE285B0:0x7C71,0xE285B1:0x7C72,0xE285B2:0x7C73,0xE285B3:0x7C74,0xE285B4:0x7C75,
0xE285B5:0x7C76,0xE285B6:0x7C77,0xE285B7:0x7C78,0xE285B8:0x7C79,0xE285B9:0x7C7A,
0xEFBFA4:0x7C7C,0xEFBC87:0x7C7D,0xEFBC82:0x7C7E,

//FIXME: mojibake
0xE288A5:0x2142,
0xEFBFA2:0x224C,
0xE28892:0x1215D
};

/**
 * The encoding conversion table for UTF-8 to JIS X 0212:1990 (Hojo-Kanji).
 *
 * @ignore
 */
var UTF8_TO_JISX0212_TABLE = {
0xCB98:0x222F,0xCB87:0x2230,0xC2B8:0x2231,0xCB99:0x2232,0xCB9D:0x2233,
0xC2AF:0x2234,0xCB9B:0x2235,0xCB9A:0x2236,0x7E:0x2237,0xCE84:0x2238,
0xCE85:0x2239,0xC2A1:0x2242,0xC2A6:0x2243,0xC2BF:0x2244,0xC2BA:0x226B,
0xC2AA:0x226C,0xC2A9:0x226D,0xC2AE:0x226E,0xE284A2:0x226F,0xC2A4:0x2270,
0xE28496:0x2271,0xCE86:0x2661,0xCE88:0x2662,0xCE89:0x2663,0xCE8A:0x2664,
0xCEAA:0x2665,0xCE8C:0x2667,0xCE8E:0x2669,0xCEAB:0x266A,0xCE8F:0x266C,
0xCEAC:0x2671,0xCEAD:0x2672,0xCEAE:0x2673,0xCEAF:0x2674,0xCF8A:0x2675,
0xCE90:0x2676,0xCF8C:0x2677,0xCF82:0x2678,0xCF8D:0x2679,0xCF8B:0x267A,
0xCEB0:0x267B,0xCF8E:0x267C,0xD082:0x2742,0xD083:0x2743,0xD084:0x2744,
0xD085:0x2745,0xD086:0x2746,0xD087:0x2747,0xD088:0x2748,0xD089:0x2749,
0xD08A:0x274A,0xD08B:0x274B,0xD08C:0x274C,0xD08E:0x274D,0xD08F:0x274E,
0xD192:0x2772,0xD193:0x2773,0xD194:0x2774,0xD195:0x2775,0xD196:0x2776,
0xD197:0x2777,0xD198:0x2778,0xD199:0x2779,0xD19A:0x277A,0xD19B:0x277B,
0xD19C:0x277C,0xD19E:0x277D,0xD19F:0x277E,0xC386:0x2921,0xC490:0x2922,
0xC4A6:0x2924,0xC4B2:0x2926,0xC581:0x2928,0xC4BF:0x2929,0xC58A:0x292B,
0xC398:0x292C,0xC592:0x292D,0xC5A6:0x292F,0xC39E:0x2930,0xC3A6:0x2941,
0xC491:0x2942,0xC3B0:0x2943,0xC4A7:0x2944,0xC4B1:0x2945,0xC4B3:0x2946,
0xC4B8:0x2947,0xC582:0x2948,0xC580:0x2949,0xC589:0x294A,0xC58B:0x294B,
0xC3B8:0x294C,0xC593:0x294D,0xC39F:0x294E,0xC5A7:0x294F,0xC3BE:0x2950,
0xC381:0x2A21,0xC380:0x2A22,0xC384:0x2A23,0xC382:0x2A24,0xC482:0x2A25,
0xC78D:0x2A26,0xC480:0x2A27,0xC484:0x2A28,0xC385:0x2A29,0xC383:0x2A2A,
0xC486:0x2A2B,0xC488:0x2A2C,0xC48C:0x2A2D,0xC387:0x2A2E,0xC48A:0x2A2F,
0xC48E:0x2A30,0xC389:0x2A31,0xC388:0x2A32,0xC38B:0x2A33,0xC38A:0x2A34,
0xC49A:0x2A35,0xC496:0x2A36,0xC492:0x2A37,0xC498:0x2A38,0xC49C:0x2A3A,
0xC49E:0x2A3B,0xC4A2:0x2A3C,0xC4A0:0x2A3D,0xC4A4:0x2A3E,0xC38D:0x2A3F,
0xC38C:0x2A40,0xC38F:0x2A41,0xC38E:0x2A42,0xC78F:0x2A43,0xC4B0:0x2A44,
0xC4AA:0x2A45,0xC4AE:0x2A46,0xC4A8:0x2A47,0xC4B4:0x2A48,0xC4B6:0x2A49,
0xC4B9:0x2A4A,0xC4BD:0x2A4B,0xC4BB:0x2A4C,0xC583:0x2A4D,0xC587:0x2A4E,
0xC585:0x2A4F,0xC391:0x2A50,0xC393:0x2A51,0xC392:0x2A52,0xC396:0x2A53,
0xC394:0x2A54,0xC791:0x2A55,0xC590:0x2A56,0xC58C:0x2A57,0xC395:0x2A58,
0xC594:0x2A59,0xC598:0x2A5A,0xC596:0x2A5B,0xC59A:0x2A5C,0xC59C:0x2A5D,
0xC5A0:0x2A5E,0xC59E:0x2A5F,0xC5A4:0x2A60,0xC5A2:0x2A61,0xC39A:0x2A62,
0xC399:0x2A63,0xC39C:0x2A64,0xC39B:0x2A65,0xC5AC:0x2A66,0xC793:0x2A67,
0xC5B0:0x2A68,0xC5AA:0x2A69,0xC5B2:0x2A6A,0xC5AE:0x2A6B,0xC5A8:0x2A6C,
0xC797:0x2A6D,0xC79B:0x2A6E,0xC799:0x2A6F,0xC795:0x2A70,0xC5B4:0x2A71,
0xC39D:0x2A72,0xC5B8:0x2A73,0xC5B6:0x2A74,0xC5B9:0x2A75,0xC5BD:0x2A76,
0xC5BB:0x2A77,0xC3A1:0x2B21,0xC3A0:0x2B22,0xC3A4:0x2B23,0xC3A2:0x2B24,
0xC483:0x2B25,0xC78E:0x2B26,0xC481:0x2B27,0xC485:0x2B28,0xC3A5:0x2B29,
0xC3A3:0x2B2A,0xC487:0x2B2B,0xC489:0x2B2C,0xC48D:0x2B2D,0xC3A7:0x2B2E,
0xC48B:0x2B2F,0xC48F:0x2B30,0xC3A9:0x2B31,0xC3A8:0x2B32,0xC3AB:0x2B33,
0xC3AA:0x2B34,0xC49B:0x2B35,0xC497:0x2B36,0xC493:0x2B37,0xC499:0x2B38,
0xC7B5:0x2B39,0xC49D:0x2B3A,0xC49F:0x2B3B,0xC4A1:0x2B3D,0xC4A5:0x2B3E,
0xC3AD:0x2B3F,0xC3AC:0x2B40,0xC3AF:0x2B41,0xC3AE:0x2B42,0xC790:0x2B43,
0xC4AB:0x2B45,0xC4AF:0x2B46,0xC4A9:0x2B47,0xC4B5:0x2B48,0xC4B7:0x2B49,
0xC4BA:0x2B4A,0xC4BE:0x2B4B,0xC4BC:0x2B4C,0xC584:0x2B4D,0xC588:0x2B4E,
0xC586:0x2B4F,0xC3B1:0x2B50,0xC3B3:0x2B51,0xC3B2:0x2B52,0xC3B6:0x2B53,
0xC3B4:0x2B54,0xC792:0x2B55,0xC591:0x2B56,0xC58D:0x2B57,0xC3B5:0x2B58,
0xC595:0x2B59,0xC599:0x2B5A,0xC597:0x2B5B,0xC59B:0x2B5C,0xC59D:0x2B5D,
0xC5A1:0x2B5E,0xC59F:0x2B5F,0xC5A5:0x2B60,0xC5A3:0x2B61,0xC3BA:0x2B62,
0xC3B9:0x2B63,0xC3BC:0x2B64,0xC3BB:0x2B65,0xC5AD:0x2B66,0xC794:0x2B67,
0xC5B1:0x2B68,0xC5AB:0x2B69,0xC5B3:0x2B6A,0xC5AF:0x2B6B,0xC5A9:0x2B6C,
0xC798:0x2B6D,0xC79C:0x2B6E,0xC79A:0x2B6F,0xC796:0x2B70,0xC5B5:0x2B71,
0xC3BD:0x2B72,0xC3BF:0x2B73,0xC5B7:0x2B74,0xC5BA:0x2B75,0xC5BE:0x2B76,
0xC5BC:0x2B77,
0xE4B882:0x3021,0xE4B884:0x3022,0xE4B885:0x3023,0xE4B88C:0x3024,
0xE4B892:0x3025,0xE4B89F:0x3026,0xE4B8A3:0x3027,0xE4B8A4:0x3028,0xE4B8A8:0x3029,
0xE4B8AB:0x302A,0xE4B8AE:0x302B,0xE4B8AF:0x302C,0xE4B8B0:0x302D,0xE4B8B5:0x302E,
0xE4B980:0x302F,0xE4B981:0x3030,0xE4B984:0x3031,0xE4B987:0x3032,0xE4B991:0x3033,
0xE4B99A:0x3034,0xE4B99C:0x3035,0xE4B9A3:0x3036,0xE4B9A8:0x3037,0xE4B9A9:0x3038,
0xE4B9B4:0x3039,0xE4B9B5:0x303A,0xE4B9B9:0x303B,0xE4B9BF:0x303C,0xE4BA8D:0x303D,
0xE4BA96:0x303E,0xE4BA97:0x303F,0xE4BA9D:0x3040,0xE4BAAF:0x3041,0xE4BAB9:0x3042,
0xE4BB83:0x3043,0xE4BB90:0x3044,0xE4BB9A:0x3045,0xE4BB9B:0x3046,0xE4BBA0:0x3047,
0xE4BBA1:0x3048,0xE4BBA2:0x3049,0xE4BBA8:0x304A,0xE4BBAF:0x304B,0xE4BBB1:0x304C,
0xE4BBB3:0x304D,0xE4BBB5:0x304E,0xE4BBBD:0x304F,0xE4BBBE:0x3050,0xE4BBBF:0x3051,
0xE4BC80:0x3052,0xE4BC82:0x3053,0xE4BC83:0x3054,0xE4BC88:0x3055,0xE4BC8B:0x3056,
0xE4BC8C:0x3057,0xE4BC92:0x3058,0xE4BC95:0x3059,0xE4BC96:0x305A,0xE4BC97:0x305B,
0xE4BC99:0x305C,0xE4BCAE:0x305D,0xE4BCB1:0x305E,0xE4BDA0:0x305F,0xE4BCB3:0x3060,
0xE4BCB5:0x3061,0xE4BCB7:0x3062,0xE4BCB9:0x3063,0xE4BCBB:0x3064,0xE4BCBE:0x3065,
0xE4BD80:0x3066,0xE4BD82:0x3067,0xE4BD88:0x3068,0xE4BD89:0x3069,0xE4BD8B:0x306A,
0xE4BD8C:0x306B,0xE4BD92:0x306C,0xE4BD94:0x306D,0xE4BD96:0x306E,0xE4BD98:0x306F,
0xE4BD9F:0x3070,0xE4BDA3:0x3071,0xE4BDAA:0x3072,0xE4BDAC:0x3073,0xE4BDAE:0x3074,
0xE4BDB1:0x3075,0xE4BDB7:0x3076,0xE4BDB8:0x3077,0xE4BDB9:0x3078,0xE4BDBA:0x3079,
0xE4BDBD:0x307A,0xE4BDBE:0x307B,0xE4BE81:0x307C,0xE4BE82:0x307D,0xE4BE84:0x307E,
0xE4BE85:0x3121,0xE4BE89:0x3122,0xE4BE8A:0x3123,0xE4BE8C:0x3124,0xE4BE8E:0x3125,
0xE4BE90:0x3126,0xE4BE92:0x3127,0xE4BE93:0x3128,0xE4BE94:0x3129,0xE4BE97:0x312A,
0xE4BE99:0x312B,0xE4BE9A:0x312C,0xE4BE9E:0x312D,0xE4BE9F:0x312E,0xE4BEB2:0x312F,
0xE4BEB7:0x3130,0xE4BEB9:0x3131,0xE4BEBB:0x3132,0xE4BEBC:0x3133,0xE4BEBD:0x3134,
0xE4BEBE:0x3135,0xE4BF80:0x3136,0xE4BF81:0x3137,0xE4BF85:0x3138,0xE4BF86:0x3139,
0xE4BF88:0x313A,0xE4BF89:0x313B,0xE4BF8B:0x313C,0xE4BF8C:0x313D,0xE4BF8D:0x313E,
0xE4BF8F:0x313F,0xE4BF92:0x3140,0xE4BF9C:0x3141,0xE4BFA0:0x3142,0xE4BFA2:0x3143,
0xE4BFB0:0x3144,0xE4BFB2:0x3145,0xE4BFBC:0x3146,0xE4BFBD:0x3147,0xE4BFBF:0x3148,
0xE58080:0x3149,0xE58081:0x314A,0xE58084:0x314B,0xE58087:0x314C,0xE5808A:0x314D,
0xE5808C:0x314E,0xE5808E:0x314F,0xE58090:0x3150,0xE58093:0x3151,0xE58097:0x3152,
0xE58098:0x3153,0xE5809B:0x3154,0xE5809C:0x3155,0xE5809D:0x3156,0xE5809E:0x3157,
0xE580A2:0x3158,0xE580A7:0x3159,0xE580AE:0x315A,0xE580B0:0x315B,0xE580B2:0x315C,
0xE580B3:0x315D,0xE580B5:0x315E,0xE58180:0x315F,0xE58181:0x3160,0xE58182:0x3161,
0xE58185:0x3162,0xE58186:0x3163,0xE5818A:0x3164,0xE5818C:0x3165,0xE5818E:0x3166,
0xE58191:0x3167,0xE58192:0x3168,0xE58193:0x3169,0xE58197:0x316A,0xE58199:0x316B,
0xE5819F:0x316C,0xE581A0:0x316D,0xE581A2:0x316E,0xE581A3:0x316F,0xE581A6:0x3170,
0xE581A7:0x3171,0xE581AA:0x3172,0xE581AD:0x3173,0xE581B0:0x3174,0xE581B1:0x3175,
0xE580BB:0x3176,0xE58281:0x3177,0xE58283:0x3178,0xE58284:0x3179,0xE58286:0x317A,
0xE5828A:0x317B,0xE5828E:0x317C,0xE5828F:0x317D,0xE58290:0x317E,0xE58292:0x3221,
0xE58293:0x3222,0xE58294:0x3223,0xE58296:0x3224,0xE5829B:0x3225,0xE5829C:0x3226,
0xE5829E:0x3227,0xE5829F:0x3228,0xE582A0:0x3229,0xE582A1:0x322A,0xE582A2:0x322B,
0xE582AA:0x322C,0xE582AF:0x322D,0xE582B0:0x322E,0xE582B9:0x322F,0xE582BA:0x3230,
0xE582BD:0x3231,0xE58380:0x3232,0xE58383:0x3233,0xE58384:0x3234,0xE58387:0x3235,
0xE5838C:0x3236,0xE5838E:0x3237,0xE58390:0x3238,0xE58393:0x3239,0xE58394:0x323A,
0xE58398:0x323B,0xE5839C:0x323C,0xE5839D:0x323D,0xE5839F:0x323E,0xE583A2:0x323F,
0xE583A4:0x3240,0xE583A6:0x3241,0xE583A8:0x3242,0xE583A9:0x3243,0xE583AF:0x3244,
0xE583B1:0x3245,0xE583B6:0x3246,0xE583BA:0x3247,0xE583BE:0x3248,0xE58483:0x3249,
0xE58486:0x324A,0xE58487:0x324B,0xE58488:0x324C,0xE5848B:0x324D,0xE5848C:0x324E,
0xE5848D:0x324F,0xE5848E:0x3250,0xE583B2:0x3251,0xE58490:0x3252,0xE58497:0x3253,
0xE58499:0x3254,0xE5849B:0x3255,0xE5849C:0x3256,0xE5849D:0x3257,0xE5849E:0x3258,
0xE584A3:0x3259,0xE584A7:0x325A,0xE584A8:0x325B,0xE584AC:0x325C,0xE584AD:0x325D,
0xE584AF:0x325E,0xE584B1:0x325F,0xE584B3:0x3260,0xE584B4:0x3261,0xE584B5:0x3262,
0xE584B8:0x3263,0xE584B9:0x3264,0xE58582:0x3265,0xE5858A:0x3266,0xE5858F:0x3267,
0xE58593:0x3268,0xE58595:0x3269,0xE58597:0x326A,0xE58598:0x326B,0xE5859F:0x326C,
0xE585A4:0x326D,0xE585A6:0x326E,0xE585BE:0x326F,0xE58683:0x3270,0xE58684:0x3271,
0xE5868B:0x3272,0xE5868E:0x3273,0xE58698:0x3274,0xE5869D:0x3275,0xE586A1:0x3276,
0xE586A3:0x3277,0xE586AD:0x3278,0xE586B8:0x3279,0xE586BA:0x327A,0xE586BC:0x327B,
0xE586BE:0x327C,0xE586BF:0x327D,0xE58782:0x327E,0xE58788:0x3321,0xE5878F:0x3322,
0xE58791:0x3323,0xE58792:0x3324,0xE58793:0x3325,0xE58795:0x3326,0xE58798:0x3327,
0xE5879E:0x3328,0xE587A2:0x3329,0xE587A5:0x332A,0xE587AE:0x332B,0xE587B2:0x332C,
0xE587B3:0x332D,0xE587B4:0x332E,0xE587B7:0x332F,0xE58881:0x3330,0xE58882:0x3331,
0xE58885:0x3332,0xE58892:0x3333,0xE58893:0x3334,0xE58895:0x3335,0xE58896:0x3336,
0xE58898:0x3337,0xE588A2:0x3338,0xE588A8:0x3339,0xE588B1:0x333A,0xE588B2:0x333B,
0xE588B5:0x333C,0xE588BC:0x333D,0xE58985:0x333E,0xE58989:0x333F,0xE58995:0x3340,
0xE58997:0x3341,0xE58998:0x3342,0xE5899A:0x3343,0xE5899C:0x3344,0xE5899F:0x3345,
0xE589A0:0x3346,0xE589A1:0x3347,0xE589A6:0x3348,0xE589AE:0x3349,0xE589B7:0x334A,
0xE589B8:0x334B,0xE589B9:0x334C,0xE58A80:0x334D,0xE58A82:0x334E,0xE58A85:0x334F,
0xE58A8A:0x3350,0xE58A8C:0x3351,0xE58A93:0x3352,0xE58A95:0x3353,0xE58A96:0x3354,
0xE58A97:0x3355,0xE58A98:0x3356,0xE58A9A:0x3357,0xE58A9C:0x3358,0xE58AA4:0x3359,
0xE58AA5:0x335A,0xE58AA6:0x335B,0xE58AA7:0x335C,0xE58AAF:0x335D,0xE58AB0:0x335E,
0xE58AB6:0x335F,0xE58AB7:0x3360,0xE58AB8:0x3361,0xE58ABA:0x3362,0xE58ABB:0x3363,
0xE58ABD:0x3364,0xE58B80:0x3365,0xE58B84:0x3366,0xE58B86:0x3367,0xE58B88:0x3368,
0xE58B8C:0x3369,0xE58B8F:0x336A,0xE58B91:0x336B,0xE58B94:0x336C,0xE58B96:0x336D,
0xE58B9B:0x336E,0xE58B9C:0x336F,0xE58BA1:0x3370,0xE58BA5:0x3371,0xE58BA8:0x3372,
0xE58BA9:0x3373,0xE58BAA:0x3374,0xE58BAC:0x3375,0xE58BB0:0x3376,0xE58BB1:0x3377,
0xE58BB4:0x3378,0xE58BB6:0x3379,0xE58BB7:0x337A,0xE58C80:0x337B,0xE58C83:0x337C,
0xE58C8A:0x337D,0xE58C8B:0x337E,0xE58C8C:0x3421,0xE58C91:0x3422,0xE58C93:0x3423,
0xE58C98:0x3424,0xE58C9B:0x3425,0xE58C9C:0x3426,0xE58C9E:0x3427,0xE58C9F:0x3428,
0xE58CA5:0x3429,0xE58CA7:0x342A,0xE58CA8:0x342B,0xE58CA9:0x342C,0xE58CAB:0x342D,
0xE58CAC:0x342E,0xE58CAD:0x342F,0xE58CB0:0x3430,0xE58CB2:0x3431,0xE58CB5:0x3432,
0xE58CBC:0x3433,0xE58CBD:0x3434,0xE58CBE:0x3435,0xE58D82:0x3436,0xE58D8C:0x3437,
0xE58D8B:0x3438,0xE58D99:0x3439,0xE58D9B:0x343A,0xE58DA1:0x343B,0xE58DA3:0x343C,
0xE58DA5:0x343D,0xE58DAC:0x343E,0xE58DAD:0x343F,0xE58DB2:0x3440,0xE58DB9:0x3441,
0xE58DBE:0x3442,0xE58E83:0x3443,0xE58E87:0x3444,0xE58E88:0x3445,0xE58E8E:0x3446,
0xE58E93:0x3447,0xE58E94:0x3448,0xE58E99:0x3449,0xE58E9D:0x344A,0xE58EA1:0x344B,
0xE58EA4:0x344C,0xE58EAA:0x344D,0xE58EAB:0x344E,0xE58EAF:0x344F,0xE58EB2:0x3450,
0xE58EB4:0x3451,0xE58EB5:0x3452,0xE58EB7:0x3453,0xE58EB8:0x3454,0xE58EBA:0x3455,
0xE58EBD:0x3456,0xE58F80:0x3457,0xE58F85:0x3458,0xE58F8F:0x3459,0xE58F92:0x345A,
0xE58F93:0x345B,0xE58F95:0x345C,0xE58F9A:0x345D,0xE58F9D:0x345E,0xE58F9E:0x345F,
0xE58FA0:0x3460,0xE58FA6:0x3461,0xE58FA7:0x3462,0xE58FB5:0x3463,0xE59082:0x3464,
0xE59093:0x3465,0xE5909A:0x3466,0xE590A1:0x3467,0xE590A7:0x3468,0xE590A8:0x3469,
0xE590AA:0x346A,0xE590AF:0x346B,0xE590B1:0x346C,0xE590B4:0x346D,0xE590B5:0x346E,
0xE59183:0x346F,0xE59184:0x3470,0xE59187:0x3471,0xE5918D:0x3472,0xE5918F:0x3473,
0xE5919E:0x3474,0xE591A2:0x3475,0xE591A4:0x3476,0xE591A6:0x3477,0xE591A7:0x3478,
0xE591A9:0x3479,0xE591AB:0x347A,0xE591AD:0x347B,0xE591AE:0x347C,0xE591B4:0x347D,
0xE591BF:0x347E,0xE59281:0x3521,0xE59283:0x3522,0xE59285:0x3523,0xE59288:0x3524,
0xE59289:0x3525,0xE5928D:0x3526,0xE59291:0x3527,0xE59295:0x3528,0xE59296:0x3529,
0xE5929C:0x352A,0xE5929F:0x352B,0xE592A1:0x352C,0xE592A6:0x352D,0xE592A7:0x352E,
0xE592A9:0x352F,0xE592AA:0x3530,0xE592AD:0x3531,0xE592AE:0x3532,0xE592B1:0x3533,
0xE592B7:0x3534,0xE592B9:0x3535,0xE592BA:0x3536,0xE592BB:0x3537,0xE592BF:0x3538,
0xE59386:0x3539,0xE5938A:0x353A,0xE5938D:0x353B,0xE5938E:0x353C,0xE593A0:0x353D,
0xE593AA:0x353E,0xE593AC:0x353F,0xE593AF:0x3540,0xE593B6:0x3541,0xE593BC:0x3542,
0xE593BE:0x3543,0xE593BF:0x3544,0xE59480:0x3545,0xE59481:0x3546,0xE59485:0x3547,
0xE59488:0x3548,0xE59489:0x3549,0xE5948C:0x354A,0xE5948D:0x354B,0xE5948E:0x354C,
0xE59495:0x354D,0xE594AA:0x354E,0xE594AB:0x354F,0xE594B2:0x3550,0xE594B5:0x3551,
0xE594B6:0x3552,0xE594BB:0x3553,0xE594BC:0x3554,0xE594BD:0x3555,0xE59581:0x3556,
0xE59587:0x3557,0xE59589:0x3558,0xE5958A:0x3559,0xE5958D:0x355A,0xE59590:0x355B,
0xE59591:0x355C,0xE59598:0x355D,0xE5959A:0x355E,0xE5959B:0x355F,0xE5959E:0x3560,
0xE595A0:0x3561,0xE595A1:0x3562,0xE595A4:0x3563,0xE595A6:0x3564,0xE595BF:0x3565,
0xE59681:0x3566,0xE59682:0x3567,0xE59686:0x3568,0xE59688:0x3569,0xE5968E:0x356A,
0xE5968F:0x356B,0xE59691:0x356C,0xE59692:0x356D,0xE59693:0x356E,0xE59694:0x356F,
0xE59697:0x3570,0xE596A3:0x3571,0xE596A4:0x3572,0xE596AD:0x3573,0xE596B2:0x3574,
0xE596BF:0x3575,0xE59781:0x3576,0xE59783:0x3577,0xE59786:0x3578,0xE59789:0x3579,
0xE5978B:0x357A,0xE5978C:0x357B,0xE5978E:0x357C,0xE59791:0x357D,0xE59792:0x357E,
0xE59793:0x3621,0xE59797:0x3622,0xE59798:0x3623,0xE5979B:0x3624,0xE5979E:0x3625,
0xE597A2:0x3626,0xE597A9:0x3627,0xE597B6:0x3628,0xE597BF:0x3629,0xE59885:0x362A,
0xE59888:0x362B,0xE5988A:0x362C,0xE5988D:0x362D,0xE5988E:0x362E,0xE5988F:0x362F,
0xE59890:0x3630,0xE59891:0x3631,0xE59892:0x3632,0xE59899:0x3633,0xE598AC:0x3634,
0xE598B0:0x3635,0xE598B3:0x3636,0xE598B5:0x3637,0xE598B7:0x3638,0xE598B9:0x3639,
0xE598BB:0x363A,0xE598BC:0x363B,0xE598BD:0x363C,0xE598BF:0x363D,0xE59980:0x363E,
0xE59981:0x363F,0xE59983:0x3640,0xE59984:0x3641,0xE59986:0x3642,0xE59989:0x3643,
0xE5998B:0x3644,0xE5998D:0x3645,0xE5998F:0x3646,0xE59994:0x3647,0xE5999E:0x3648,
0xE599A0:0x3649,0xE599A1:0x364A,0xE599A2:0x364B,0xE599A3:0x364C,0xE599A6:0x364D,
0xE599A9:0x364E,0xE599AD:0x364F,0xE599AF:0x3650,0xE599B1:0x3651,0xE599B2:0x3652,
0xE599B5:0x3653,0xE59A84:0x3654,0xE59A85:0x3655,0xE59A88:0x3656,0xE59A8B:0x3657,
0xE59A8C:0x3658,0xE59A95:0x3659,0xE59A99:0x365A,0xE59A9A:0x365B,0xE59A9D:0x365C,
0xE59A9E:0x365D,0xE59A9F:0x365E,0xE59AA6:0x365F,0xE59AA7:0x3660,0xE59AA8:0x3661,
0xE59AA9:0x3662,0xE59AAB:0x3663,0xE59AAC:0x3664,0xE59AAD:0x3665,0xE59AB1:0x3666,
0xE59AB3:0x3667,0xE59AB7:0x3668,0xE59ABE:0x3669,0xE59B85:0x366A,0xE59B89:0x366B,
0xE59B8A:0x366C,0xE59B8B:0x366D,0xE59B8F:0x366E,0xE59B90:0x366F,0xE59B8C:0x3670,
0xE59B8D:0x3671,0xE59B99:0x3672,0xE59B9C:0x3673,0xE59B9D:0x3674,0xE59B9F:0x3675,
0xE59BA1:0x3676,0xE59BA4:0x3677,0xE59BA5:0x3678,0xE59BA6:0x3679,0xE59BA7:0x367A,
0xE59BA8:0x367B,0xE59BB1:0x367C,0xE59BAB:0x367D,0xE59BAD:0x367E,0xE59BB6:0x3721,
0xE59BB7:0x3722,0xE59C81:0x3723,0xE59C82:0x3724,0xE59C87:0x3725,0xE59C8A:0x3726,
0xE59C8C:0x3727,0xE59C91:0x3728,0xE59C95:0x3729,0xE59C9A:0x372A,0xE59C9B:0x372B,
0xE59C9D:0x372C,0xE59CA0:0x372D,0xE59CA2:0x372E,0xE59CA3:0x372F,0xE59CA4:0x3730,
0xE59CA5:0x3731,0xE59CA9:0x3732,0xE59CAA:0x3733,0xE59CAC:0x3734,0xE59CAE:0x3735,
0xE59CAF:0x3736,0xE59CB3:0x3737,0xE59CB4:0x3738,0xE59CBD:0x3739,0xE59CBE:0x373A,
0xE59CBF:0x373B,0xE59D85:0x373C,0xE59D86:0x373D,0xE59D8C:0x373E,0xE59D8D:0x373F,
0xE59D92:0x3740,0xE59DA2:0x3741,0xE59DA5:0x3742,0xE59DA7:0x3743,0xE59DA8:0x3744,
0xE59DAB:0x3745,0xE59DAD:0x3746,0xE59DAE:0x3747,0xE59DAF:0x3748,0xE59DB0:0x3749,
0xE59DB1:0x374A,0xE59DB3:0x374B,0xE59DB4:0x374C,0xE59DB5:0x374D,0xE59DB7:0x374E,
0xE59DB9:0x374F,0xE59DBA:0x3750,0xE59DBB:0x3751,0xE59DBC:0x3752,0xE59DBE:0x3753,
0xE59E81:0x3754,0xE59E83:0x3755,0xE59E8C:0x3756,0xE59E94:0x3757,0xE59E97:0x3758,
0xE59E99:0x3759,0xE59E9A:0x375A,0xE59E9C:0x375B,0xE59E9D:0x375C,0xE59E9E:0x375D,
0xE59E9F:0x375E,0xE59EA1:0x375F,0xE59E95:0x3760,0xE59EA7:0x3761,0xE59EA8:0x3762,
0xE59EA9:0x3763,0xE59EAC:0x3764,0xE59EB8:0x3765,0xE59EBD:0x3766,0xE59F87:0x3767,
0xE59F88:0x3768,0xE59F8C:0x3769,0xE59F8F:0x376A,0xE59F95:0x376B,0xE59F9D:0x376C,
0xE59F9E:0x376D,0xE59FA4:0x376E,0xE59FA6:0x376F,0xE59FA7:0x3770,0xE59FA9:0x3771,
0xE59FAD:0x3772,0xE59FB0:0x3773,0xE59FB5:0x3774,0xE59FB6:0x3775,0xE59FB8:0x3776,
0xE59FBD:0x3777,0xE59FBE:0x3778,0xE59FBF:0x3779,0xE5A083:0x377A,0xE5A084:0x377B,
0xE5A088:0x377C,0xE5A089:0x377D,0xE59FA1:0x377E,0xE5A08C:0x3821,0xE5A08D:0x3822,
0xE5A09B:0x3823,0xE5A09E:0x3824,0xE5A09F:0x3825,0xE5A0A0:0x3826,0xE5A0A6:0x3827,
0xE5A0A7:0x3828,0xE5A0AD:0x3829,0xE5A0B2:0x382A,0xE5A0B9:0x382B,0xE5A0BF:0x382C,
0xE5A189:0x382D,0xE5A18C:0x382E,0xE5A18D:0x382F,0xE5A18F:0x3830,0xE5A190:0x3831,
0xE5A195:0x3832,0xE5A19F:0x3833,0xE5A1A1:0x3834,0xE5A1A4:0x3835,0xE5A1A7:0x3836,
0xE5A1A8:0x3837,0xE5A1B8:0x3838,0xE5A1BC:0x3839,0xE5A1BF:0x383A,0xE5A280:0x383B,
0xE5A281:0x383C,0xE5A287:0x383D,0xE5A288:0x383E,0xE5A289:0x383F,0xE5A28A:0x3840,
0xE5A28C:0x3841,0xE5A28D:0x3842,0xE5A28F:0x3843,0xE5A290:0x3844,0xE5A294:0x3845,
0xE5A296:0x3846,0xE5A29D:0x3847,0xE5A2A0:0x3848,0xE5A2A1:0x3849,0xE5A2A2:0x384A,
0xE5A2A6:0x384B,0xE5A2A9:0x384C,0xE5A2B1:0x384D,0xE5A2B2:0x384E,0xE5A384:0x384F,
0xE5A2BC:0x3850,0xE5A382:0x3851,0xE5A388:0x3852,0xE5A38D:0x3853,0xE5A38E:0x3854,
0xE5A390:0x3855,0xE5A392:0x3856,0xE5A394:0x3857,0xE5A396:0x3858,0xE5A39A:0x3859,
0xE5A39D:0x385A,0xE5A3A1:0x385B,0xE5A3A2:0x385C,0xE5A3A9:0x385D,0xE5A3B3:0x385E,
0xE5A485:0x385F,0xE5A486:0x3860,0xE5A48B:0x3861,0xE5A48C:0x3862,0xE5A492:0x3863,
0xE5A493:0x3864,0xE5A494:0x3865,0xE89981:0x3866,0xE5A49D:0x3867,0xE5A4A1:0x3868,
0xE5A4A3:0x3869,0xE5A4A4:0x386A,0xE5A4A8:0x386B,0xE5A4AF:0x386C,0xE5A4B0:0x386D,
0xE5A4B3:0x386E,0xE5A4B5:0x386F,0xE5A4B6:0x3870,0xE5A4BF:0x3871,0xE5A583:0x3872,
0xE5A586:0x3873,0xE5A592:0x3874,0xE5A593:0x3875,0xE5A599:0x3876,0xE5A59B:0x3877,
0xE5A59D:0x3878,0xE5A59E:0x3879,0xE5A59F:0x387A,0xE5A5A1:0x387B,0xE5A5A3:0x387C,
0xE5A5AB:0x387D,0xE5A5AD:0x387E,0xE5A5AF:0x3921,0xE5A5B2:0x3922,0xE5A5B5:0x3923,
0xE5A5B6:0x3924,0xE5A5B9:0x3925,0xE5A5BB:0x3926,0xE5A5BC:0x3927,0xE5A68B:0x3928,
0xE5A68C:0x3929,0xE5A68E:0x392A,0xE5A692:0x392B,0xE5A695:0x392C,0xE5A697:0x392D,
0xE5A69F:0x392E,0xE5A6A4:0x392F,0xE5A6A7:0x3930,0xE5A6AD:0x3931,0xE5A6AE:0x3932,
0xE5A6AF:0x3933,0xE5A6B0:0x3934,0xE5A6B3:0x3935,0xE5A6B7:0x3936,0xE5A6BA:0x3937,
0xE5A6BC:0x3938,0xE5A781:0x3939,0xE5A783:0x393A,0xE5A784:0x393B,0xE5A788:0x393C,
0xE5A78A:0x393D,0xE5A78D:0x393E,0xE5A792:0x393F,0xE5A79D:0x3940,0xE5A79E:0x3941,
0xE5A79F:0x3942,0xE5A7A3:0x3943,0xE5A7A4:0x3944,0xE5A7A7:0x3945,0xE5A7AE:0x3946,
0xE5A7AF:0x3947,0xE5A7B1:0x3948,0xE5A7B2:0x3949,0xE5A7B4:0x394A,0xE5A7B7:0x394B,
0xE5A880:0x394C,0xE5A884:0x394D,0xE5A88C:0x394E,0xE5A88D:0x394F,0xE5A88E:0x3950,
0xE5A892:0x3951,0xE5A893:0x3952,0xE5A89E:0x3953,0xE5A8A3:0x3954,0xE5A8A4:0x3955,
0xE5A8A7:0x3956,0xE5A8A8:0x3957,0xE5A8AA:0x3958,0xE5A8AD:0x3959,0xE5A8B0:0x395A,
0xE5A984:0x395B,0xE5A985:0x395C,0xE5A987:0x395D,0xE5A988:0x395E,0xE5A98C:0x395F,
0xE5A990:0x3960,0xE5A995:0x3961,0xE5A99E:0x3962,0xE5A9A3:0x3963,0xE5A9A5:0x3964,
0xE5A9A7:0x3965,0xE5A9AD:0x3966,0xE5A9B7:0x3967,0xE5A9BA:0x3968,0xE5A9BB:0x3969,
0xE5A9BE:0x396A,0xE5AA8B:0x396B,0xE5AA90:0x396C,0xE5AA93:0x396D,0xE5AA96:0x396E,
0xE5AA99:0x396F,0xE5AA9C:0x3970,0xE5AA9E:0x3971,0xE5AA9F:0x3972,0xE5AAA0:0x3973,
0xE5AAA2:0x3974,0xE5AAA7:0x3975,0xE5AAAC:0x3976,0xE5AAB1:0x3977,0xE5AAB2:0x3978,
0xE5AAB3:0x3979,0xE5AAB5:0x397A,0xE5AAB8:0x397B,0xE5AABA:0x397C,0xE5AABB:0x397D,
0xE5AABF:0x397E,0xE5AB84:0x3A21,0xE5AB86:0x3A22,0xE5AB88:0x3A23,0xE5AB8F:0x3A24,
0xE5AB9A:0x3A25,0xE5AB9C:0x3A26,0xE5ABA0:0x3A27,0xE5ABA5:0x3A28,0xE5ABAA:0x3A29,
0xE5ABAE:0x3A2A,0xE5ABB5:0x3A2B,0xE5ABB6:0x3A2C,0xE5ABBD:0x3A2D,0xE5AC80:0x3A2E,
0xE5AC81:0x3A2F,0xE5AC88:0x3A30,0xE5AC97:0x3A31,0xE5ACB4:0x3A32,0xE5AC99:0x3A33,
0xE5AC9B:0x3A34,0xE5AC9D:0x3A35,0xE5ACA1:0x3A36,0xE5ACA5:0x3A37,0xE5ACAD:0x3A38,
0xE5ACB8:0x3A39,0xE5AD81:0x3A3A,0xE5AD8B:0x3A3B,0xE5AD8C:0x3A3C,0xE5AD92:0x3A3D,
0xE5AD96:0x3A3E,0xE5AD9E:0x3A3F,0xE5ADA8:0x3A40,0xE5ADAE:0x3A41,0xE5ADAF:0x3A42,
0xE5ADBC:0x3A43,0xE5ADBD:0x3A44,0xE5ADBE:0x3A45,0xE5ADBF:0x3A46,0xE5AE81:0x3A47,
0xE5AE84:0x3A48,0xE5AE86:0x3A49,0xE5AE8A:0x3A4A,0xE5AE8E:0x3A4B,0xE5AE90:0x3A4C,
0xE5AE91:0x3A4D,0xE5AE93:0x3A4E,0xE5AE94:0x3A4F,0xE5AE96:0x3A50,0xE5AEA8:0x3A51,
0xE5AEA9:0x3A52,0xE5AEAC:0x3A53,0xE5AEAD:0x3A54,0xE5AEAF:0x3A55,0xE5AEB1:0x3A56,
0xE5AEB2:0x3A57,0xE5AEB7:0x3A58,0xE5AEBA:0x3A59,0xE5AEBC:0x3A5A,0xE5AF80:0x3A5B,
0xE5AF81:0x3A5C,0xE5AF8D:0x3A5D,0xE5AF8F:0x3A5E,0xE5AF96:0x3A5F,0xE5AF97:0x3A60,
0xE5AF98:0x3A61,0xE5AF99:0x3A62,0xE5AF9A:0x3A63,0xE5AFA0:0x3A64,0xE5AFAF:0x3A65,
0xE5AFB1:0x3A66,0xE5AFB4:0x3A67,0xE5AFBD:0x3A68,0xE5B08C:0x3A69,0xE5B097:0x3A6A,
0xE5B09E:0x3A6B,0xE5B09F:0x3A6C,0xE5B0A3:0x3A6D,0xE5B0A6:0x3A6E,0xE5B0A9:0x3A6F,
0xE5B0AB:0x3A70,0xE5B0AC:0x3A71,0xE5B0AE:0x3A72,0xE5B0B0:0x3A73,0xE5B0B2:0x3A74,
0xE5B0B5:0x3A75,0xE5B0B6:0x3A76,0xE5B199:0x3A77,0xE5B19A:0x3A78,0xE5B19C:0x3A79,
0xE5B1A2:0x3A7A,0xE5B1A3:0x3A7B,0xE5B1A7:0x3A7C,0xE5B1A8:0x3A7D,0xE5B1A9:0x3A7E,
0xE5B1AD:0x3B21,0xE5B1B0:0x3B22,0xE5B1B4:0x3B23,0xE5B1B5:0x3B24,0xE5B1BA:0x3B25,
0xE5B1BB:0x3B26,0xE5B1BC:0x3B27,0xE5B1BD:0x3B28,0xE5B287:0x3B29,0xE5B288:0x3B2A,
0xE5B28A:0x3B2B,0xE5B28F:0x3B2C,0xE5B292:0x3B2D,0xE5B29D:0x3B2E,0xE5B29F:0x3B2F,
0xE5B2A0:0x3B30,0xE5B2A2:0x3B31,0xE5B2A3:0x3B32,0xE5B2A6:0x3B33,0xE5B2AA:0x3B34,
0xE5B2B2:0x3B35,0xE5B2B4:0x3B36,0xE5B2B5:0x3B37,0xE5B2BA:0x3B38,0xE5B389:0x3B39,
0xE5B38B:0x3B3A,0xE5B392:0x3B3B,0xE5B39D:0x3B3C,0xE5B397:0x3B3D,0xE5B3AE:0x3B3E,
0xE5B3B1:0x3B3F,0xE5B3B2:0x3B40,0xE5B3B4:0x3B41,0xE5B481:0x3B42,0xE5B486:0x3B43,
0xE5B48D:0x3B44,0xE5B492:0x3B45,0xE5B4AB:0x3B46,0xE5B4A3:0x3B47,0xE5B4A4:0x3B48,
0xE5B4A6:0x3B49,0xE5B4A7:0x3B4A,0xE5B4B1:0x3B4B,0xE5B4B4:0x3B4C,0xE5B4B9:0x3B4D,
0xE5B4BD:0x3B4E,0xE5B4BF:0x3B4F,0xE5B582:0x3B50,0xE5B583:0x3B51,0xE5B586:0x3B52,
0xE5B588:0x3B53,0xE5B595:0x3B54,0xE5B591:0x3B55,0xE5B599:0x3B56,0xE5B58A:0x3B57,
0xE5B59F:0x3B58,0xE5B5A0:0x3B59,0xE5B5A1:0x3B5A,0xE5B5A2:0x3B5B,0xE5B5A4:0x3B5C,
0xE5B5AA:0x3B5D,0xE5B5AD:0x3B5E,0xE5B5B0:0x3B5F,0xE5B5B9:0x3B60,0xE5B5BA:0x3B61,
0xE5B5BE:0x3B62,0xE5B5BF:0x3B63,0xE5B681:0x3B64,0xE5B683:0x3B65,0xE5B688:0x3B66,
0xE5B68A:0x3B67,0xE5B692:0x3B68,0xE5B693:0x3B69,0xE5B694:0x3B6A,0xE5B695:0x3B6B,
0xE5B699:0x3B6C,0xE5B69B:0x3B6D,0xE5B69F:0x3B6E,0xE5B6A0:0x3B6F,0xE5B6A7:0x3B70,
0xE5B6AB:0x3B71,0xE5B6B0:0x3B72,0xE5B6B4:0x3B73,0xE5B6B8:0x3B74,0xE5B6B9:0x3B75,
0xE5B783:0x3B76,0xE5B787:0x3B77,0xE5B78B:0x3B78,0xE5B790:0x3B79,0xE5B78E:0x3B7A,
0xE5B798:0x3B7B,0xE5B799:0x3B7C,0xE5B7A0:0x3B7D,0xE5B7A4:0x3B7E,0xE5B7A9:0x3C21,
0xE5B7B8:0x3C22,0xE5B7B9:0x3C23,0xE5B880:0x3C24,0xE5B887:0x3C25,0xE5B88D:0x3C26,
0xE5B892:0x3C27,0xE5B894:0x3C28,0xE5B895:0x3C29,0xE5B898:0x3C2A,0xE5B89F:0x3C2B,
0xE5B8A0:0x3C2C,0xE5B8AE:0x3C2D,0xE5B8A8:0x3C2E,0xE5B8B2:0x3C2F,0xE5B8B5:0x3C30,
0xE5B8BE:0x3C31,0xE5B98B:0x3C32,0xE5B990:0x3C33,0xE5B989:0x3C34,0xE5B991:0x3C35,
0xE5B996:0x3C36,0xE5B998:0x3C37,0xE5B99B:0x3C38,0xE5B99C:0x3C39,0xE5B99E:0x3C3A,
0xE5B9A8:0x3C3B,0xE5B9AA:0x3C3C,0xE5B9AB:0x3C3D,0xE5B9AC:0x3C3E,0xE5B9AD:0x3C3F,
0xE5B9AE:0x3C40,0xE5B9B0:0x3C41,0xE5BA80:0x3C42,0xE5BA8B:0x3C43,0xE5BA8E:0x3C44,
0xE5BAA2:0x3C45,0xE5BAA4:0x3C46,0xE5BAA5:0x3C47,0xE5BAA8:0x3C48,0xE5BAAA:0x3C49,
0xE5BAAC:0x3C4A,0xE5BAB1:0x3C4B,0xE5BAB3:0x3C4C,0xE5BABD:0x3C4D,0xE5BABE:0x3C4E,
0xE5BABF:0x3C4F,0xE5BB86:0x3C50,0xE5BB8C:0x3C51,0xE5BB8B:0x3C52,0xE5BB8E:0x3C53,
0xE5BB91:0x3C54,0xE5BB92:0x3C55,0xE5BB94:0x3C56,0xE5BB95:0x3C57,0xE5BB9C:0x3C58,
0xE5BB9E:0x3C59,0xE5BBA5:0x3C5A,0xE5BBAB:0x3C5B,0xE5BC82:0x3C5C,0xE5BC86:0x3C5D,
0xE5BC87:0x3C5E,0xE5BC88:0x3C5F,0xE5BC8E:0x3C60,0xE5BC99:0x3C61,0xE5BC9C:0x3C62,
0xE5BC9D:0x3C63,0xE5BCA1:0x3C64,0xE5BCA2:0x3C65,0xE5BCA3:0x3C66,0xE5BCA4:0x3C67,
0xE5BCA8:0x3C68,0xE5BCAB:0x3C69,0xE5BCAC:0x3C6A,0xE5BCAE:0x3C6B,0xE5BCB0:0x3C6C,
0xE5BCB4:0x3C6D,0xE5BCB6:0x3C6E,0xE5BCBB:0x3C6F,0xE5BCBD:0x3C70,0xE5BCBF:0x3C71,
0xE5BD80:0x3C72,0xE5BD84:0x3C73,0xE5BD85:0x3C74,0xE5BD87:0x3C75,0xE5BD8D:0x3C76,
0xE5BD90:0x3C77,0xE5BD94:0x3C78,0xE5BD98:0x3C79,0xE5BD9B:0x3C7A,0xE5BDA0:0x3C7B,
0xE5BDA3:0x3C7C,0xE5BDA4:0x3C7D,0xE5BDA7:0x3C7E,0xE5BDAF:0x3D21,0xE5BDB2:0x3D22,
0xE5BDB4:0x3D23,0xE5BDB5:0x3D24,0xE5BDB8:0x3D25,0xE5BDBA:0x3D26,0xE5BDBD:0x3D27,
0xE5BDBE:0x3D28,0xE5BE89:0x3D29,0xE5BE8D:0x3D2A,0xE5BE8F:0x3D2B,0xE5BE96:0x3D2C,
0xE5BE9C:0x3D2D,0xE5BE9D:0x3D2E,0xE5BEA2:0x3D2F,0xE5BEA7:0x3D30,0xE5BEAB:0x3D31,
0xE5BEA4:0x3D32,0xE5BEAC:0x3D33,0xE5BEAF:0x3D34,0xE5BEB0:0x3D35,0xE5BEB1:0x3D36,
0xE5BEB8:0x3D37,0xE5BF84:0x3D38,0xE5BF87:0x3D39,0xE5BF88:0x3D3A,0xE5BF89:0x3D3B,
0xE5BF8B:0x3D3C,0xE5BF90:0x3D3D,0xE5BF91:0x3D3E,0xE5BF92:0x3D3F,0xE5BF93:0x3D40,
0xE5BF94:0x3D41,0xE5BF9E:0x3D42,0xE5BFA1:0x3D43,0xE5BFA2:0x3D44,0xE5BFA8:0x3D45,
0xE5BFA9:0x3D46,0xE5BFAA:0x3D47,0xE5BFAC:0x3D48,0xE5BFAD:0x3D49,0xE5BFAE:0x3D4A,
0xE5BFAF:0x3D4B,0xE5BFB2:0x3D4C,0xE5BFB3:0x3D4D,0xE5BFB6:0x3D4E,0xE5BFBA:0x3D4F,
0xE5BFBC:0x3D50,0xE68087:0x3D51,0xE6808A:0x3D52,0xE6808D:0x3D53,0xE68093:0x3D54,
0xE68094:0x3D55,0xE68097:0x3D56,0xE68098:0x3D57,0xE6809A:0x3D58,0xE6809F:0x3D59,
0xE680A4:0x3D5A,0xE680AD:0x3D5B,0xE680B3:0x3D5C,0xE680B5:0x3D5D,0xE68180:0x3D5E,
0xE68187:0x3D5F,0xE68188:0x3D60,0xE68189:0x3D61,0xE6818C:0x3D62,0xE68191:0x3D63,
0xE68194:0x3D64,0xE68196:0x3D65,0xE68197:0x3D66,0xE6819D:0x3D67,0xE681A1:0x3D68,
0xE681A7:0x3D69,0xE681B1:0x3D6A,0xE681BE:0x3D6B,0xE681BF:0x3D6C,0xE68282:0x3D6D,
0xE68286:0x3D6E,0xE68288:0x3D6F,0xE6828A:0x3D70,0xE6828E:0x3D71,0xE68291:0x3D72,
0xE68293:0x3D73,0xE68295:0x3D74,0xE68298:0x3D75,0xE6829D:0x3D76,0xE6829E:0x3D77,
0xE682A2:0x3D78,0xE682A4:0x3D79,0xE682A5:0x3D7A,0xE682A8:0x3D7B,0xE682B0:0x3D7C,
0xE682B1:0x3D7D,0xE682B7:0x3D7E,0xE682BB:0x3E21,0xE682BE:0x3E22,0xE68382:0x3E23,
0xE68384:0x3E24,0xE68388:0x3E25,0xE68389:0x3E26,0xE6838A:0x3E27,0xE6838B:0x3E28,
0xE6838E:0x3E29,0xE6838F:0x3E2A,0xE68394:0x3E2B,0xE68395:0x3E2C,0xE68399:0x3E2D,
0xE6839B:0x3E2E,0xE6839D:0x3E2F,0xE6839E:0x3E30,0xE683A2:0x3E31,0xE683A5:0x3E32,
0xE683B2:0x3E33,0xE683B5:0x3E34,0xE683B8:0x3E35,0xE683BC:0x3E36,0xE683BD:0x3E37,
0xE68482:0x3E38,0xE68487:0x3E39,0xE6848A:0x3E3A,0xE6848C:0x3E3B,0xE68490:0x3E3C,
0xE68491:0x3E3D,0xE68492:0x3E3E,0xE68493:0x3E3F,0xE68494:0x3E40,0xE68496:0x3E41,
0xE68497:0x3E42,0xE68499:0x3E43,0xE6849C:0x3E44,0xE6849E:0x3E45,0xE684A2:0x3E46,
0xE684AA:0x3E47,0xE684AB:0x3E48,0xE684B0:0x3E49,0xE684B1:0x3E4A,0xE684B5:0x3E4B,
0xE684B6:0x3E4C,0xE684B7:0x3E4D,0xE684B9:0x3E4E,0xE68581:0x3E4F,0xE68585:0x3E50,
0xE68586:0x3E51,0xE68589:0x3E52,0xE6859E:0x3E53,0xE685A0:0x3E54,0xE685AC:0x3E55,
0xE685B2:0x3E56,0xE685B8:0x3E57,0xE685BB:0x3E58,0xE685BC:0x3E59,0xE685BF:0x3E5A,
0xE68680:0x3E5B,0xE68681:0x3E5C,0xE68683:0x3E5D,0xE68684:0x3E5E,0xE6868B:0x3E5F,
0xE6868D:0x3E60,0xE68692:0x3E61,0xE68693:0x3E62,0xE68697:0x3E63,0xE68698:0x3E64,
0xE6869C:0x3E65,0xE6869D:0x3E66,0xE6869F:0x3E67,0xE686A0:0x3E68,0xE686A5:0x3E69,
0xE686A8:0x3E6A,0xE686AA:0x3E6B,0xE686AD:0x3E6C,0xE686B8:0x3E6D,0xE686B9:0x3E6E,
0xE686BC:0x3E6F,0xE68780:0x3E70,0xE68781:0x3E71,0xE68782:0x3E72,0xE6878E:0x3E73,
0xE6878F:0x3E74,0xE68795:0x3E75,0xE6879C:0x3E76,0xE6879D:0x3E77,0xE6879E:0x3E78,
0xE6879F:0x3E79,0xE687A1:0x3E7A,0xE687A2:0x3E7B,0xE687A7:0x3E7C,0xE687A9:0x3E7D,
0xE687A5:0x3E7E,0xE687AC:0x3F21,0xE687AD:0x3F22,0xE687AF:0x3F23,0xE68881:0x3F24,
0xE68883:0x3F25,0xE68884:0x3F26,0xE68887:0x3F27,0xE68893:0x3F28,0xE68895:0x3F29,
0xE6889C:0x3F2A,0xE688A0:0x3F2B,0xE688A2:0x3F2C,0xE688A3:0x3F2D,0xE688A7:0x3F2E,
0xE688A9:0x3F2F,0xE688AB:0x3F30,0xE688B9:0x3F31,0xE688BD:0x3F32,0xE68982:0x3F33,
0xE68983:0x3F34,0xE68984:0x3F35,0xE68986:0x3F36,0xE6898C:0x3F37,0xE68990:0x3F38,
0xE68991:0x3F39,0xE68992:0x3F3A,0xE68994:0x3F3B,0xE68996:0x3F3C,0xE6899A:0x3F3D,
0xE6899C:0x3F3E,0xE689A4:0x3F3F,0xE689AD:0x3F40,0xE689AF:0x3F41,0xE689B3:0x3F42,
0xE689BA:0x3F43,0xE689BD:0x3F44,0xE68A8D:0x3F45,0xE68A8E:0x3F46,0xE68A8F:0x3F47,
0xE68A90:0x3F48,0xE68AA6:0x3F49,0xE68AA8:0x3F4A,0xE68AB3:0x3F4B,0xE68AB6:0x3F4C,
0xE68AB7:0x3F4D,0xE68ABA:0x3F4E,0xE68ABE:0x3F4F,0xE68ABF:0x3F50,0xE68B84:0x3F51,
0xE68B8E:0x3F52,0xE68B95:0x3F53,0xE68B96:0x3F54,0xE68B9A:0x3F55,0xE68BAA:0x3F56,
0xE68BB2:0x3F57,0xE68BB4:0x3F58,0xE68BBC:0x3F59,0xE68BBD:0x3F5A,0xE68C83:0x3F5B,
0xE68C84:0x3F5C,0xE68C8A:0x3F5D,0xE68C8B:0x3F5E,0xE68C8D:0x3F5F,0xE68C90:0x3F60,
0xE68C93:0x3F61,0xE68C96:0x3F62,0xE68C98:0x3F63,0xE68CA9:0x3F64,0xE68CAA:0x3F65,
0xE68CAD:0x3F66,0xE68CB5:0x3F67,0xE68CB6:0x3F68,0xE68CB9:0x3F69,0xE68CBC:0x3F6A,
0xE68D81:0x3F6B,0xE68D82:0x3F6C,0xE68D83:0x3F6D,0xE68D84:0x3F6E,0xE68D86:0x3F6F,
0xE68D8A:0x3F70,0xE68D8B:0x3F71,0xE68D8E:0x3F72,0xE68D92:0x3F73,0xE68D93:0x3F74,
0xE68D94:0x3F75,0xE68D98:0x3F76,0xE68D9B:0x3F77,0xE68DA5:0x3F78,0xE68DA6:0x3F79,
0xE68DAC:0x3F7A,0xE68DAD:0x3F7B,0xE68DB1:0x3F7C,0xE68DB4:0x3F7D,0xE68DB5:0x3F7E,
0xE68DB8:0x4021,0xE68DBC:0x4022,0xE68DBD:0x4023,0xE68DBF:0x4024,0xE68E82:0x4025,
0xE68E84:0x4026,0xE68E87:0x4027,0xE68E8A:0x4028,0xE68E90:0x4029,0xE68E94:0x402A,
0xE68E95:0x402B,0xE68E99:0x402C,0xE68E9A:0x402D,0xE68E9E:0x402E,0xE68EA4:0x402F,
0xE68EA6:0x4030,0xE68EAD:0x4031,0xE68EAE:0x4032,0xE68EAF:0x4033,0xE68EBD:0x4034,
0xE68F81:0x4035,0xE68F85:0x4036,0xE68F88:0x4037,0xE68F8E:0x4038,0xE68F91:0x4039,
0xE68F93:0x403A,0xE68F94:0x403B,0xE68F95:0x403C,0xE68F9C:0x403D,0xE68FA0:0x403E,
0xE68FA5:0x403F,0xE68FAA:0x4040,0xE68FAC:0x4041,0xE68FB2:0x4042,0xE68FB3:0x4043,
0xE68FB5:0x4044,0xE68FB8:0x4045,0xE68FB9:0x4046,0xE69089:0x4047,0xE6908A:0x4048,
0xE69090:0x4049,0xE69092:0x404A,0xE69094:0x404B,0xE69098:0x404C,0xE6909E:0x404D,
0xE690A0:0x404E,0xE690A2:0x404F,0xE690A4:0x4050,0xE690A5:0x4051,0xE690A9:0x4052,
0xE690AA:0x4053,0xE690AF:0x4054,0xE690B0:0x4055,0xE690B5:0x4056,0xE690BD:0x4057,
0xE690BF:0x4058,0xE6918B:0x4059,0xE6918F:0x405A,0xE69191:0x405B,0xE69192:0x405C,
0xE69193:0x405D,0xE69194:0x405E,0xE6919A:0x405F,0xE6919B:0x4060,0xE6919C:0x4061,
0xE6919D:0x4062,0xE6919F:0x4063,0xE691A0:0x4064,0xE691A1:0x4065,0xE691A3:0x4066,
0xE691AD:0x4067,0xE691B3:0x4068,0xE691B4:0x4069,0xE691BB:0x406A,0xE691BD:0x406B,
0xE69285:0x406C,0xE69287:0x406D,0xE6928F:0x406E,0xE69290:0x406F,0xE69291:0x4070,
0xE69298:0x4071,0xE69299:0x4072,0xE6929B:0x4073,0xE6929D:0x4074,0xE6929F:0x4075,
0xE692A1:0x4076,0xE692A3:0x4077,0xE692A6:0x4078,0xE692A8:0x4079,0xE692AC:0x407A,
0xE692B3:0x407B,0xE692BD:0x407C,0xE692BE:0x407D,0xE692BF:0x407E,0xE69384:0x4121,
0xE69389:0x4122,0xE6938A:0x4123,0xE6938B:0x4124,0xE6938C:0x4125,0xE6938E:0x4126,
0xE69390:0x4127,0xE69391:0x4128,0xE69395:0x4129,0xE69397:0x412A,0xE693A4:0x412B,
0xE693A5:0x412C,0xE693A9:0x412D,0xE693AA:0x412E,0xE693AD:0x412F,0xE693B0:0x4130,
0xE693B5:0x4131,0xE693B7:0x4132,0xE693BB:0x4133,0xE693BF:0x4134,0xE69481:0x4135,
0xE69484:0x4136,0xE69488:0x4137,0xE69489:0x4138,0xE6948A:0x4139,0xE6948F:0x413A,
0xE69493:0x413B,0xE69494:0x413C,0xE69496:0x413D,0xE69499:0x413E,0xE6949B:0x413F,
0xE6949E:0x4140,0xE6949F:0x4141,0xE694A2:0x4142,0xE694A6:0x4143,0xE694A9:0x4144,
0xE694AE:0x4145,0xE694B1:0x4146,0xE694BA:0x4147,0xE694BC:0x4148,0xE694BD:0x4149,
0xE69583:0x414A,0xE69587:0x414B,0xE69589:0x414C,0xE69590:0x414D,0xE69592:0x414E,
0xE69594:0x414F,0xE6959F:0x4150,0xE695A0:0x4151,0xE695A7:0x4152,0xE695AB:0x4153,
0xE695BA:0x4154,0xE695BD:0x4155,0xE69681:0x4156,0xE69685:0x4157,0xE6968A:0x4158,
0xE69692:0x4159,0xE69695:0x415A,0xE69698:0x415B,0xE6969D:0x415C,0xE696A0:0x415D,
0xE696A3:0x415E,0xE696A6:0x415F,0xE696AE:0x4160,0xE696B2:0x4161,0xE696B3:0x4162,
0xE696B4:0x4163,0xE696BF:0x4164,0xE69782:0x4165,0xE69788:0x4166,0xE69789:0x4167,
0xE6978E:0x4168,0xE69790:0x4169,0xE69794:0x416A,0xE69796:0x416B,0xE69798:0x416C,
0xE6979F:0x416D,0xE697B0:0x416E,0xE697B2:0x416F,0xE697B4:0x4170,0xE697B5:0x4171,
0xE697B9:0x4172,0xE697BE:0x4173,0xE697BF:0x4174,0xE69880:0x4175,0xE69884:0x4176,
0xE69888:0x4177,0xE69889:0x4178,0xE6988D:0x4179,0xE69891:0x417A,0xE69892:0x417B,
0xE69895:0x417C,0xE69896:0x417D,0xE6989D:0x417E,0xE6989E:0x4221,0xE698A1:0x4222,
0xE698A2:0x4223,0xE698A3:0x4224,0xE698A4:0x4225,0xE698A6:0x4226,0xE698A9:0x4227,
0xE698AA:0x4228,0xE698AB:0x4229,0xE698AC:0x422A,0xE698AE:0x422B,0xE698B0:0x422C,
0xE698B1:0x422D,0xE698B3:0x422E,0xE698B9:0x422F,0xE698B7:0x4230,0xE69980:0x4231,
0xE69985:0x4232,0xE69986:0x4233,0xE6998A:0x4234,0xE6998C:0x4235,0xE69991:0x4236,
0xE6998E:0x4237,0xE69997:0x4238,0xE69998:0x4239,0xE69999:0x423A,0xE6999B:0x423B,
0xE6999C:0x423C,0xE699A0:0x423D,0xE699A1:0x423E,0xE69BBB:0x423F,0xE699AA:0x4240,
0xE699AB:0x4241,0xE699AC:0x4242,0xE699BE:0x4243,0xE699B3:0x4244,0xE699B5:0x4245,
0xE699BF:0x4246,0xE699B7:0x4247,0xE699B8:0x4248,0xE699B9:0x4249,0xE699BB:0x424A,
0xE69A80:0x424B,0xE699BC:0x424C,0xE69A8B:0x424D,0xE69A8C:0x424E,0xE69A8D:0x424F,
0xE69A90:0x4250,0xE69A92:0x4251,0xE69A99:0x4252,0xE69A9A:0x4253,0xE69A9B:0x4254,
0xE69A9C:0x4255,0xE69A9F:0x4256,0xE69AA0:0x4257,0xE69AA4:0x4258,0xE69AAD:0x4259,
0xE69AB1:0x425A,0xE69AB2:0x425B,0xE69AB5:0x425C,0xE69ABB:0x425D,0xE69ABF:0x425E,
0xE69B80:0x425F,0xE69B82:0x4260,0xE69B83:0x4261,0xE69B88:0x4262,0xE69B8C:0x4263,
0xE69B8E:0x4264,0xE69B8F:0x4265,0xE69B94:0x4266,0xE69B9B:0x4267,0xE69B9F:0x4268,
0xE69BA8:0x4269,0xE69BAB:0x426A,0xE69BAC:0x426B,0xE69BAE:0x426C,0xE69BBA:0x426D,
0xE69C85:0x426E,0xE69C87:0x426F,0xE69C8E:0x4270,0xE69C93:0x4271,0xE69C99:0x4272,
0xE69C9C:0x4273,0xE69CA0:0x4274,0xE69CA2:0x4275,0xE69CB3:0x4276,0xE69CBE:0x4277,
0xE69D85:0x4278,0xE69D87:0x4279,0xE69D88:0x427A,0xE69D8C:0x427B,0xE69D94:0x427C,
0xE69D95:0x427D,0xE69D9D:0x427E,0xE69DA6:0x4321,0xE69DAC:0x4322,0xE69DAE:0x4323,
0xE69DB4:0x4324,0xE69DB6:0x4325,0xE69DBB:0x4326,0xE69E81:0x4327,0xE69E84:0x4328,
0xE69E8E:0x4329,0xE69E8F:0x432A,0xE69E91:0x432B,0xE69E93:0x432C,0xE69E96:0x432D,
0xE69E98:0x432E,0xE69E99:0x432F,0xE69E9B:0x4330,0xE69EB0:0x4331,0xE69EB1:0x4332,
0xE69EB2:0x4333,0xE69EB5:0x4334,0xE69EBB:0x4335,0xE69EBC:0x4336,0xE69EBD:0x4337,
0xE69FB9:0x4338,0xE69F80:0x4339,0xE69F82:0x433A,0xE69F83:0x433B,0xE69F85:0x433C,
0xE69F88:0x433D,0xE69F89:0x433E,0xE69F92:0x433F,0xE69F97:0x4340,0xE69F99:0x4341,
0xE69F9C:0x4342,0xE69FA1:0x4343,0xE69FA6:0x4344,0xE69FB0:0x4345,0xE69FB2:0x4346,
0xE69FB6:0x4347,0xE69FB7:0x4348,0xE6A192:0x4349,0xE6A094:0x434A,0xE6A099:0x434B,
0xE6A09D:0x434C,0xE6A09F:0x434D,0xE6A0A8:0x434E,0xE6A0A7:0x434F,0xE6A0AC:0x4350,
0xE6A0AD:0x4351,0xE6A0AF:0x4352,0xE6A0B0:0x4353,0xE6A0B1:0x4354,0xE6A0B3:0x4355,
0xE6A0BB:0x4356,0xE6A0BF:0x4357,0xE6A184:0x4358,0xE6A185:0x4359,0xE6A18A:0x435A,
0xE6A18C:0x435B,0xE6A195:0x435C,0xE6A197:0x435D,0xE6A198:0x435E,0xE6A19B:0x435F,
0xE6A1AB:0x4360,0xE6A1AE:0x4361,0xE6A1AF:0x4362,0xE6A1B0:0x4363,0xE6A1B1:0x4364,
0xE6A1B2:0x4365,0xE6A1B5:0x4366,0xE6A1B9:0x4367,0xE6A1BA:0x4368,0xE6A1BB:0x4369,
0xE6A1BC:0x436A,0xE6A282:0x436B,0xE6A284:0x436C,0xE6A286:0x436D,0xE6A288:0x436E,
0xE6A296:0x436F,0xE6A298:0x4370,0xE6A29A:0x4371,0xE6A29C:0x4372,0xE6A2A1:0x4373,
0xE6A2A3:0x4374,0xE6A2A5:0x4375,0xE6A2A9:0x4376,0xE6A2AA:0x4377,0xE6A2AE:0x4378,
0xE6A2B2:0x4379,0xE6A2BB:0x437A,0xE6A385:0x437B,0xE6A388:0x437C,0xE6A38C:0x437D,
0xE6A38F:0x437E,0xE6A390:0x4421,0xE6A391:0x4422,0xE6A393:0x4423,0xE6A396:0x4424,
0xE6A399:0x4425,0xE6A39C:0x4426,0xE6A39D:0x4427,0xE6A3A5:0x4428,0xE6A3A8:0x4429,
0xE6A3AA:0x442A,0xE6A3AB:0x442B,0xE6A3AC:0x442C,0xE6A3AD:0x442D,0xE6A3B0:0x442E,
0xE6A3B1:0x442F,0xE6A3B5:0x4430,0xE6A3B6:0x4431,0xE6A3BB:0x4432,0xE6A3BC:0x4433,
0xE6A3BD:0x4434,0xE6A486:0x4435,0xE6A489:0x4436,0xE6A48A:0x4437,0xE6A490:0x4438,
0xE6A491:0x4439,0xE6A493:0x443A,0xE6A496:0x443B,0xE6A497:0x443C,0xE6A4B1:0x443D,
0xE6A4B3:0x443E,0xE6A4B5:0x443F,0xE6A4B8:0x4440,0xE6A4BB:0x4441,0xE6A582:0x4442,
0xE6A585:0x4443,0xE6A589:0x4444,0xE6A58E:0x4445,0xE6A597:0x4446,0xE6A59B:0x4447,
0xE6A5A3:0x4448,0xE6A5A4:0x4449,0xE6A5A5:0x444A,0xE6A5A6:0x444B,0xE6A5A8:0x444C,
0xE6A5A9:0x444D,0xE6A5AC:0x444E,0xE6A5B0:0x444F,0xE6A5B1:0x4450,0xE6A5B2:0x4451,
0xE6A5BA:0x4452,0xE6A5BB:0x4453,0xE6A5BF:0x4454,0xE6A680:0x4455,0xE6A68D:0x4456,
0xE6A692:0x4457,0xE6A696:0x4458,0xE6A698:0x4459,0xE6A6A1:0x445A,0xE6A6A5:0x445B,
0xE6A6A6:0x445C,0xE6A6A8:0x445D,0xE6A6AB:0x445E,0xE6A6AD:0x445F,0xE6A6AF:0x4460,
0xE6A6B7:0x4461,0xE6A6B8:0x4462,0xE6A6BA:0x4463,0xE6A6BC:0x4464,0xE6A785:0x4465,
0xE6A788:0x4466,0xE6A791:0x4467,0xE6A796:0x4468,0xE6A797:0x4469,0xE6A7A2:0x446A,
0xE6A7A5:0x446B,0xE6A7AE:0x446C,0xE6A7AF:0x446D,0xE6A7B1:0x446E,0xE6A7B3:0x446F,
0xE6A7B5:0x4470,0xE6A7BE:0x4471,0xE6A880:0x4472,0xE6A881:0x4473,0xE6A883:0x4474,
0xE6A88F:0x4475,0xE6A891:0x4476,0xE6A895:0x4477,0xE6A89A:0x4478,0xE6A89D:0x4479,
0xE6A8A0:0x447A,0xE6A8A4:0x447B,0xE6A8A8:0x447C,0xE6A8B0:0x447D,0xE6A8B2:0x447E,
0xE6A8B4:0x4521,0xE6A8B7:0x4522,0xE6A8BB:0x4523,0xE6A8BE:0x4524,0xE6A8BF:0x4525,
0xE6A985:0x4526,0xE6A986:0x4527,0xE6A989:0x4528,0xE6A98A:0x4529,0xE6A98E:0x452A,
0xE6A990:0x452B,0xE6A991:0x452C,0xE6A992:0x452D,0xE6A995:0x452E,0xE6A996:0x452F,
0xE6A99B:0x4530,0xE6A9A4:0x4531,0xE6A9A7:0x4532,0xE6A9AA:0x4533,0xE6A9B1:0x4534,
0xE6A9B3:0x4535,0xE6A9BE:0x4536,0xE6AA81:0x4537,0xE6AA83:0x4538,0xE6AA86:0x4539,
0xE6AA87:0x453A,0xE6AA89:0x453B,0xE6AA8B:0x453C,0xE6AA91:0x453D,0xE6AA9B:0x453E,
0xE6AA9D:0x453F,0xE6AA9E:0x4540,0xE6AA9F:0x4541,0xE6AAA5:0x4542,0xE6AAAB:0x4543,
0xE6AAAF:0x4544,0xE6AAB0:0x4545,0xE6AAB1:0x4546,0xE6AAB4:0x4547,0xE6AABD:0x4548,
0xE6AABE:0x4549,0xE6AABF:0x454A,0xE6AB86:0x454B,0xE6AB89:0x454C,0xE6AB88:0x454D,
0xE6AB8C:0x454E,0xE6AB90:0x454F,0xE6AB94:0x4550,0xE6AB95:0x4551,0xE6AB96:0x4552,
0xE6AB9C:0x4553,0xE6AB9D:0x4554,0xE6ABA4:0x4555,0xE6ABA7:0x4556,0xE6ABAC:0x4557,
0xE6ABB0:0x4558,0xE6ABB1:0x4559,0xE6ABB2:0x455A,0xE6ABBC:0x455B,0xE6ABBD:0x455C,
0xE6AC82:0x455D,0xE6AC83:0x455E,0xE6AC86:0x455F,0xE6AC87:0x4560,0xE6AC89:0x4561,
0xE6AC8F:0x4562,0xE6AC90:0x4563,0xE6AC91:0x4564,0xE6AC97:0x4565,0xE6AC9B:0x4566,
0xE6AC9E:0x4567,0xE6ACA4:0x4568,0xE6ACA8:0x4569,0xE6ACAB:0x456A,0xE6ACAC:0x456B,
0xE6ACAF:0x456C,0xE6ACB5:0x456D,0xE6ACB6:0x456E,0xE6ACBB:0x456F,0xE6ACBF:0x4570,
0xE6AD86:0x4571,0xE6AD8A:0x4572,0xE6AD8D:0x4573,0xE6AD92:0x4574,0xE6AD96:0x4575,
0xE6AD98:0x4576,0xE6AD9D:0x4577,0xE6ADA0:0x4578,0xE6ADA7:0x4579,0xE6ADAB:0x457A,
0xE6ADAE:0x457B,0xE6ADB0:0x457C,0xE6ADB5:0x457D,0xE6ADBD:0x457E,0xE6ADBE:0x4621,
0xE6AE82:0x4622,0xE6AE85:0x4623,0xE6AE97:0x4624,0xE6AE9B:0x4625,0xE6AE9F:0x4626,
0xE6AEA0:0x4627,0xE6AEA2:0x4628,0xE6AEA3:0x4629,0xE6AEA8:0x462A,0xE6AEA9:0x462B,
0xE6AEAC:0x462C,0xE6AEAD:0x462D,0xE6AEAE:0x462E,0xE6AEB0:0x462F,0xE6AEB8:0x4630,
0xE6AEB9:0x4631,0xE6AEBD:0x4632,0xE6AEBE:0x4633,0xE6AF83:0x4634,0xE6AF84:0x4635,
0xE6AF89:0x4636,0xE6AF8C:0x4637,0xE6AF96:0x4638,0xE6AF9A:0x4639,0xE6AFA1:0x463A,
0xE6AFA3:0x463B,0xE6AFA6:0x463C,0xE6AFA7:0x463D,0xE6AFAE:0x463E,0xE6AFB1:0x463F,
0xE6AFB7:0x4640,0xE6AFB9:0x4641,0xE6AFBF:0x4642,0xE6B082:0x4643,0xE6B084:0x4644,
0xE6B085:0x4645,0xE6B089:0x4646,0xE6B08D:0x4647,0xE6B08E:0x4648,0xE6B090:0x4649,
0xE6B092:0x464A,0xE6B099:0x464B,0xE6B09F:0x464C,0xE6B0A6:0x464D,0xE6B0A7:0x464E,
0xE6B0A8:0x464F,0xE6B0AC:0x4650,0xE6B0AE:0x4651,0xE6B0B3:0x4652,0xE6B0B5:0x4653,
0xE6B0B6:0x4654,0xE6B0BA:0x4655,0xE6B0BB:0x4656,0xE6B0BF:0x4657,0xE6B18A:0x4658,
0xE6B18B:0x4659,0xE6B18D:0x465A,0xE6B18F:0x465B,0xE6B192:0x465C,0xE6B194:0x465D,
0xE6B199:0x465E,0xE6B19B:0x465F,0xE6B19C:0x4660,0xE6B1AB:0x4661,0xE6B1AD:0x4662,
0xE6B1AF:0x4663,0xE6B1B4:0x4664,0xE6B1B6:0x4665,0xE6B1B8:0x4666,0xE6B1B9:0x4667,
0xE6B1BB:0x4668,0xE6B285:0x4669,0xE6B286:0x466A,0xE6B287:0x466B,0xE6B289:0x466C,
0xE6B294:0x466D,0xE6B295:0x466E,0xE6B297:0x466F,0xE6B298:0x4670,0xE6B29C:0x4671,
0xE6B29F:0x4672,0xE6B2B0:0x4673,0xE6B2B2:0x4674,0xE6B2B4:0x4675,0xE6B382:0x4676,
0xE6B386:0x4677,0xE6B38D:0x4678,0xE6B38F:0x4679,0xE6B390:0x467A,0xE6B391:0x467B,
0xE6B392:0x467C,0xE6B394:0x467D,0xE6B396:0x467E,0xE6B39A:0x4721,0xE6B39C:0x4722,
0xE6B3A0:0x4723,0xE6B3A7:0x4724,0xE6B3A9:0x4725,0xE6B3AB:0x4726,0xE6B3AC:0x4727,
0xE6B3AE:0x4728,0xE6B3B2:0x4729,0xE6B3B4:0x472A,0xE6B484:0x472B,0xE6B487:0x472C,
0xE6B48A:0x472D,0xE6B48E:0x472E,0xE6B48F:0x472F,0xE6B491:0x4730,0xE6B493:0x4731,
0xE6B49A:0x4732,0xE6B4A6:0x4733,0xE6B4A7:0x4734,0xE6B4A8:0x4735,0xE6B1A7:0x4736,
0xE6B4AE:0x4737,0xE6B4AF:0x4738,0xE6B4B1:0x4739,0xE6B4B9:0x473A,0xE6B4BC:0x473B,
0xE6B4BF:0x473C,0xE6B597:0x473D,0xE6B59E:0x473E,0xE6B59F:0x473F,0xE6B5A1:0x4740,
0xE6B5A5:0x4741,0xE6B5A7:0x4742,0xE6B5AF:0x4743,0xE6B5B0:0x4744,0xE6B5BC:0x4745,
0xE6B682:0x4746,0xE6B687:0x4747,0xE6B691:0x4748,0xE6B692:0x4749,0xE6B694:0x474A,
0xE6B696:0x474B,0xE6B697:0x474C,0xE6B698:0x474D,0xE6B6AA:0x474E,0xE6B6AC:0x474F,
0xE6B6B4:0x4750,0xE6B6B7:0x4751,0xE6B6B9:0x4752,0xE6B6BD:0x4753,0xE6B6BF:0x4754,
0xE6B784:0x4755,0xE6B788:0x4756,0xE6B78A:0x4757,0xE6B78E:0x4758,0xE6B78F:0x4759,
0xE6B796:0x475A,0xE6B79B:0x475B,0xE6B79D:0x475C,0xE6B79F:0x475D,0xE6B7A0:0x475E,
0xE6B7A2:0x475F,0xE6B7A5:0x4760,0xE6B7A9:0x4761,0xE6B7AF:0x4762,0xE6B7B0:0x4763,
0xE6B7B4:0x4764,0xE6B7B6:0x4765,0xE6B7BC:0x4766,0xE6B880:0x4767,0xE6B884:0x4768,
0xE6B89E:0x4769,0xE6B8A2:0x476A,0xE6B8A7:0x476B,0xE6B8B2:0x476C,0xE6B8B6:0x476D,
0xE6B8B9:0x476E,0xE6B8BB:0x476F,0xE6B8BC:0x4770,0xE6B984:0x4771,0xE6B985:0x4772,
0xE6B988:0x4773,0xE6B989:0x4774,0xE6B98B:0x4775,0xE6B98F:0x4776,0xE6B991:0x4777,
0xE6B992:0x4778,0xE6B993:0x4779,0xE6B994:0x477A,0xE6B997:0x477B,0xE6B99C:0x477C,
0xE6B99D:0x477D,0xE6B99E:0x477E,0xE6B9A2:0x4821,0xE6B9A3:0x4822,0xE6B9A8:0x4823,
0xE6B9B3:0x4824,0xE6B9BB:0x4825,0xE6B9BD:0x4826,0xE6BA8D:0x4827,0xE6BA93:0x4828,
0xE6BA99:0x4829,0xE6BAA0:0x482A,0xE6BAA7:0x482B,0xE6BAAD:0x482C,0xE6BAAE:0x482D,
0xE6BAB1:0x482E,0xE6BAB3:0x482F,0xE6BABB:0x4830,0xE6BABF:0x4831,0xE6BB80:0x4832,
0xE6BB81:0x4833,0xE6BB83:0x4834,0xE6BB87:0x4835,0xE6BB88:0x4836,0xE6BB8A:0x4837,
0xE6BB8D:0x4838,0xE6BB8E:0x4839,0xE6BB8F:0x483A,0xE6BBAB:0x483B,0xE6BBAD:0x483C,
0xE6BBAE:0x483D,0xE6BBB9:0x483E,0xE6BBBB:0x483F,0xE6BBBD:0x4840,0xE6BC84:0x4841,
0xE6BC88:0x4842,0xE6BC8A:0x4843,0xE6BC8C:0x4844,0xE6BC8D:0x4845,0xE6BC96:0x4846,
0xE6BC98:0x4847,0xE6BC9A:0x4848,0xE6BC9B:0x4849,0xE6BCA6:0x484A,0xE6BCA9:0x484B,
0xE6BCAA:0x484C,0xE6BCAF:0x484D,0xE6BCB0:0x484E,0xE6BCB3:0x484F,0xE6BCB6:0x4850,
0xE6BCBB:0x4851,0xE6BCBC:0x4852,0xE6BCAD:0x4853,0xE6BD8F:0x4854,0xE6BD91:0x4855,
0xE6BD92:0x4856,0xE6BD93:0x4857,0xE6BD97:0x4858,0xE6BD99:0x4859,0xE6BD9A:0x485A,
0xE6BD9D:0x485B,0xE6BD9E:0x485C,0xE6BDA1:0x485D,0xE6BDA2:0x485E,0xE6BDA8:0x485F,
0xE6BDAC:0x4860,0xE6BDBD:0x4861,0xE6BDBE:0x4862,0xE6BE83:0x4863,0xE6BE87:0x4864,
0xE6BE88:0x4865,0xE6BE8B:0x4866,0xE6BE8C:0x4867,0xE6BE8D:0x4868,0xE6BE90:0x4869,
0xE6BE92:0x486A,0xE6BE93:0x486B,0xE6BE94:0x486C,0xE6BE96:0x486D,0xE6BE9A:0x486E,
0xE6BE9F:0x486F,0xE6BEA0:0x4870,0xE6BEA5:0x4871,0xE6BEA6:0x4872,0xE6BEA7:0x4873,
0xE6BEA8:0x4874,0xE6BEAE:0x4875,0xE6BEAF:0x4876,0xE6BEB0:0x4877,0xE6BEB5:0x4878,
0xE6BEB6:0x4879,0xE6BEBC:0x487A,0xE6BF85:0x487B,0xE6BF87:0x487C,0xE6BF88:0x487D,
0xE6BF8A:0x487E,0xE6BF9A:0x4921,0xE6BF9E:0x4922,0xE6BFA8:0x4923,0xE6BFA9:0x4924,
0xE6BFB0:0x4925,0xE6BFB5:0x4926,0xE6BFB9:0x4927,0xE6BFBC:0x4928,0xE6BFBD:0x4929,
0xE78080:0x492A,0xE78085:0x492B,0xE78086:0x492C,0xE78087:0x492D,0xE7808D:0x492E,
0xE78097:0x492F,0xE780A0:0x4930,0xE780A3:0x4931,0xE780AF:0x4932,0xE780B4:0x4933,
0xE780B7:0x4934,0xE780B9:0x4935,0xE780BC:0x4936,0xE78183:0x4937,0xE78184:0x4938,
0xE78188:0x4939,0xE78189:0x493A,0xE7818A:0x493B,0xE7818B:0x493C,0xE78194:0x493D,
0xE78195:0x493E,0xE7819D:0x493F,0xE7819E:0x4940,0xE7818E:0x4941,0xE781A4:0x4942,
0xE781A5:0x4943,0xE781AC:0x4944,0xE781AE:0x4945,0xE781B5:0x4946,0xE781B6:0x4947,
0xE781BE:0x4948,0xE78281:0x4949,0xE78285:0x494A,0xE78286:0x494B,0xE78294:0x494C,
0xE78295:0x494D,0xE78296:0x494E,0xE78297:0x494F,0xE78298:0x4950,0xE7829B:0x4951,
0xE782A4:0x4952,0xE782AB:0x4953,0xE782B0:0x4954,0xE782B1:0x4955,0xE782B4:0x4956,
0xE782B7:0x4957,0xE7838A:0x4958,0xE78391:0x4959,0xE78393:0x495A,0xE78394:0x495B,
0xE78395:0x495C,0xE78396:0x495D,0xE78398:0x495E,0xE7839C:0x495F,0xE783A4:0x4960,
0xE783BA:0x4961,0xE78483:0x4962,0xE78484:0x4963,0xE78485:0x4964,0xE78486:0x4965,
0xE78487:0x4966,0xE7848B:0x4967,0xE7848C:0x4968,0xE7848F:0x4969,0xE7849E:0x496A,
0xE784A0:0x496B,0xE784AB:0x496C,0xE784AD:0x496D,0xE784AF:0x496E,0xE784B0:0x496F,
0xE784B1:0x4970,0xE784B8:0x4971,0xE78581:0x4972,0xE78585:0x4973,0xE78586:0x4974,
0xE78587:0x4975,0xE7858A:0x4976,0xE7858B:0x4977,0xE78590:0x4978,0xE78592:0x4979,
0xE78597:0x497A,0xE7859A:0x497B,0xE7859C:0x497C,0xE7859E:0x497D,0xE785A0:0x497E,
0xE785A8:0x4A21,0xE785B9:0x4A22,0xE78680:0x4A23,0xE78685:0x4A24,0xE78687:0x4A25,
0xE7868C:0x4A26,0xE78692:0x4A27,0xE7869A:0x4A28,0xE7869B:0x4A29,0xE786A0:0x4A2A,
0xE786A2:0x4A2B,0xE786AF:0x4A2C,0xE786B0:0x4A2D,0xE786B2:0x4A2E,0xE786B3:0x4A2F,
0xE786BA:0x4A30,0xE786BF:0x4A31,0xE78780:0x4A32,0xE78781:0x4A33,0xE78784:0x4A34,
0xE7878B:0x4A35,0xE7878C:0x4A36,0xE78793:0x4A37,0xE78796:0x4A38,0xE78799:0x4A39,
0xE7879A:0x4A3A,0xE7879C:0x4A3B,0xE787B8:0x4A3C,0xE787BE:0x4A3D,0xE78880:0x4A3E,
0xE78887:0x4A3F,0xE78888:0x4A40,0xE78889:0x4A41,0xE78893:0x4A42,0xE78897:0x4A43,
0xE7889A:0x4A44,0xE7889D:0x4A45,0xE7889F:0x4A46,0xE788A4:0x4A47,0xE788AB:0x4A48,
0xE788AF:0x4A49,0xE788B4:0x4A4A,0xE788B8:0x4A4B,0xE788B9:0x4A4C,0xE78981:0x4A4D,
0xE78982:0x4A4E,0xE78983:0x4A4F,0xE78985:0x4A50,0xE7898E:0x4A51,0xE7898F:0x4A52,
0xE78990:0x4A53,0xE78993:0x4A54,0xE78995:0x4A55,0xE78996:0x4A56,0xE7899A:0x4A57,
0xE7899C:0x4A58,0xE7899E:0x4A59,0xE789A0:0x4A5A,0xE789A3:0x4A5B,0xE789A8:0x4A5C,
0xE789AB:0x4A5D,0xE789AE:0x4A5E,0xE789AF:0x4A5F,0xE789B1:0x4A60,0xE789B7:0x4A61,
0xE789B8:0x4A62,0xE789BB:0x4A63,0xE789BC:0x4A64,0xE789BF:0x4A65,0xE78A84:0x4A66,
0xE78A89:0x4A67,0xE78A8D:0x4A68,0xE78A8E:0x4A69,0xE78A93:0x4A6A,0xE78A9B:0x4A6B,
0xE78AA8:0x4A6C,0xE78AAD:0x4A6D,0xE78AAE:0x4A6E,0xE78AB1:0x4A6F,0xE78AB4:0x4A70,
0xE78ABE:0x4A71,0xE78B81:0x4A72,0xE78B87:0x4A73,0xE78B89:0x4A74,0xE78B8C:0x4A75,
0xE78B95:0x4A76,0xE78B96:0x4A77,0xE78B98:0x4A78,0xE78B9F:0x4A79,0xE78BA5:0x4A7A,
0xE78BB3:0x4A7B,0xE78BB4:0x4A7C,0xE78BBA:0x4A7D,0xE78BBB:0x4A7E,0xE78BBE:0x4B21,
0xE78C82:0x4B22,0xE78C84:0x4B23,0xE78C85:0x4B24,0xE78C87:0x4B25,0xE78C8B:0x4B26,
0xE78C8D:0x4B27,0xE78C92:0x4B28,0xE78C93:0x4B29,0xE78C98:0x4B2A,0xE78C99:0x4B2B,
0xE78C9E:0x4B2C,0xE78CA2:0x4B2D,0xE78CA4:0x4B2E,0xE78CA7:0x4B2F,0xE78CA8:0x4B30,
0xE78CAC:0x4B31,0xE78CB1:0x4B32,0xE78CB2:0x4B33,0xE78CB5:0x4B34,0xE78CBA:0x4B35,
0xE78CBB:0x4B36,0xE78CBD:0x4B37,0xE78D83:0x4B38,0xE78D8D:0x4B39,0xE78D90:0x4B3A,
0xE78D92:0x4B3B,0xE78D96:0x4B3C,0xE78D98:0x4B3D,0xE78D9D:0x4B3E,0xE78D9E:0x4B3F,
0xE78D9F:0x4B40,0xE78DA0:0x4B41,0xE78DA6:0x4B42,0xE78DA7:0x4B43,0xE78DA9:0x4B44,
0xE78DAB:0x4B45,0xE78DAC:0x4B46,0xE78DAE:0x4B47,0xE78DAF:0x4B48,0xE78DB1:0x4B49,
0xE78DB7:0x4B4A,0xE78DB9:0x4B4B,0xE78DBC:0x4B4C,0xE78E80:0x4B4D,0xE78E81:0x4B4E,
0xE78E83:0x4B4F,0xE78E85:0x4B50,0xE78E86:0x4B51,0xE78E8E:0x4B52,0xE78E90:0x4B53,
0xE78E93:0x4B54,0xE78E95:0x4B55,0xE78E97:0x4B56,0xE78E98:0x4B57,0xE78E9C:0x4B58,
0xE78E9E:0x4B59,0xE78E9F:0x4B5A,0xE78EA0:0x4B5B,0xE78EA2:0x4B5C,0xE78EA5:0x4B5D,
0xE78EA6:0x4B5E,0xE78EAA:0x4B5F,0xE78EAB:0x4B60,0xE78EAD:0x4B61,0xE78EB5:0x4B62,
0xE78EB7:0x4B63,0xE78EB9:0x4B64,0xE78EBC:0x4B65,0xE78EBD:0x4B66,0xE78EBF:0x4B67,
0xE78F85:0x4B68,0xE78F86:0x4B69,0xE78F89:0x4B6A,0xE78F8B:0x4B6B,0xE78F8C:0x4B6C,
0xE78F8F:0x4B6D,0xE78F92:0x4B6E,0xE78F93:0x4B6F,0xE78F96:0x4B70,0xE78F99:0x4B71,
0xE78F9D:0x4B72,0xE78FA1:0x4B73,0xE78FA3:0x4B74,0xE78FA6:0x4B75,0xE78FA7:0x4B76,
0xE78FA9:0x4B77,0xE78FB4:0x4B78,0xE78FB5:0x4B79,0xE78FB7:0x4B7A,0xE78FB9:0x4B7B,
0xE78FBA:0x4B7C,0xE78FBB:0x4B7D,0xE78FBD:0x4B7E,0xE78FBF:0x4C21,0xE79080:0x4C22,
0xE79081:0x4C23,0xE79084:0x4C24,0xE79087:0x4C25,0xE7908A:0x4C26,0xE79091:0x4C27,
0xE7909A:0x4C28,0xE7909B:0x4C29,0xE790A4:0x4C2A,0xE790A6:0x4C2B,0xE790A8:0x4C2C,
0xE790A9:0x4C2D,0xE790AA:0x4C2E,0xE790AB:0x4C2F,0xE790AC:0x4C30,0xE790AD:0x4C31,
0xE790AE:0x4C32,0xE790AF:0x4C33,0xE790B0:0x4C34,0xE790B1:0x4C35,0xE790B9:0x4C36,
0xE79180:0x4C37,0xE79183:0x4C38,0xE79184:0x4C39,0xE79186:0x4C3A,0xE79187:0x4C3B,
0xE7918B:0x4C3C,0xE7918D:0x4C3D,0xE79191:0x4C3E,0xE79192:0x4C3F,0xE79197:0x4C40,
0xE7919D:0x4C41,0xE791A2:0x4C42,0xE791A6:0x4C43,0xE791A7:0x4C44,0xE791A8:0x4C45,
0xE791AB:0x4C46,0xE791AD:0x4C47,0xE791AE:0x4C48,0xE791B1:0x4C49,0xE791B2:0x4C4A,
0xE79280:0x4C4B,0xE79281:0x4C4C,0xE79285:0x4C4D,0xE79286:0x4C4E,0xE79287:0x4C4F,
0xE79289:0x4C50,0xE7928F:0x4C51,0xE79290:0x4C52,0xE79291:0x4C53,0xE79292:0x4C54,
0xE79298:0x4C55,0xE79299:0x4C56,0xE7929A:0x4C57,0xE7929C:0x4C58,0xE7929F:0x4C59,
0xE792A0:0x4C5A,0xE792A1:0x4C5B,0xE792A3:0x4C5C,0xE792A6:0x4C5D,0xE792A8:0x4C5E,
0xE792A9:0x4C5F,0xE792AA:0x4C60,0xE792AB:0x4C61,0xE792AE:0x4C62,0xE792AF:0x4C63,
0xE792B1:0x4C64,0xE792B2:0x4C65,0xE792B5:0x4C66,0xE792B9:0x4C67,0xE792BB:0x4C68,
0xE792BF:0x4C69,0xE79388:0x4C6A,0xE79389:0x4C6B,0xE7938C:0x4C6C,0xE79390:0x4C6D,
0xE79393:0x4C6E,0xE79398:0x4C6F,0xE7939A:0x4C70,0xE7939B:0x4C71,0xE7939E:0x4C72,
0xE7939F:0x4C73,0xE793A4:0x4C74,0xE793A8:0x4C75,0xE793AA:0x4C76,0xE793AB:0x4C77,
0xE793AF:0x4C78,0xE793B4:0x4C79,0xE793BA:0x4C7A,0xE793BB:0x4C7B,0xE793BC:0x4C7C,
0xE793BF:0x4C7D,0xE79486:0x4C7E,0xE79492:0x4D21,0xE79496:0x4D22,0xE79497:0x4D23,
0xE794A0:0x4D24,0xE794A1:0x4D25,0xE794A4:0x4D26,0xE794A7:0x4D27,0xE794A9:0x4D28,
0xE794AA:0x4D29,0xE794AF:0x4D2A,0xE794B6:0x4D2B,0xE794B9:0x4D2C,0xE794BD:0x4D2D,
0xE794BE:0x4D2E,0xE794BF:0x4D2F,0xE79580:0x4D30,0xE79583:0x4D31,0xE79587:0x4D32,
0xE79588:0x4D33,0xE7958E:0x4D34,0xE79590:0x4D35,0xE79592:0x4D36,0xE79597:0x4D37,
0xE7959E:0x4D38,0xE7959F:0x4D39,0xE795A1:0x4D3A,0xE795AF:0x4D3B,0xE795B1:0x4D3C,
0xE795B9:0x4D3D,0xE795BA:0x4D3E,0xE795BB:0x4D3F,0xE795BC:0x4D40,0xE795BD:0x4D41,
0xE795BE:0x4D42,0xE79681:0x4D43,0xE79685:0x4D44,0xE79690:0x4D45,0xE79692:0x4D46,
0xE79693:0x4D47,0xE79695:0x4D48,0xE79699:0x4D49,0xE7969C:0x4D4A,0xE796A2:0x4D4B,
0xE796A4:0x4D4C,0xE796B4:0x4D4D,0xE796BA:0x4D4E,0xE796BF:0x4D4F,0xE79780:0x4D50,
0xE79781:0x4D51,0xE79784:0x4D52,0xE79786:0x4D53,0xE7978C:0x4D54,0xE7978E:0x4D55,
0xE7978F:0x4D56,0xE79797:0x4D57,0xE7979C:0x4D58,0xE7979F:0x4D59,0xE797A0:0x4D5A,
0xE797A1:0x4D5B,0xE797A4:0x4D5C,0xE797A7:0x4D5D,0xE797AC:0x4D5E,0xE797AE:0x4D5F,
0xE797AF:0x4D60,0xE797B1:0x4D61,0xE797B9:0x4D62,0xE79880:0x4D63,0xE79882:0x4D64,
0xE79883:0x4D65,0xE79884:0x4D66,0xE79887:0x4D67,0xE79888:0x4D68,0xE7988A:0x4D69,
0xE7988C:0x4D6A,0xE7988F:0x4D6B,0xE79892:0x4D6C,0xE79893:0x4D6D,0xE79895:0x4D6E,
0xE79896:0x4D6F,0xE79899:0x4D70,0xE7989B:0x4D71,0xE7989C:0x4D72,0xE7989D:0x4D73,
0xE7989E:0x4D74,0xE798A3:0x4D75,0xE798A5:0x4D76,0xE798A6:0x4D77,0xE798A9:0x4D78,
0xE798AD:0x4D79,0xE798B2:0x4D7A,0xE798B3:0x4D7B,0xE798B5:0x4D7C,0xE798B8:0x4D7D,
0xE798B9:0x4D7E,0xE798BA:0x4E21,0xE798BC:0x4E22,0xE7998A:0x4E23,0xE79980:0x4E24,
0xE79981:0x4E25,0xE79983:0x4E26,0xE79984:0x4E27,0xE79985:0x4E28,0xE79989:0x4E29,
0xE7998B:0x4E2A,0xE79995:0x4E2B,0xE79999:0x4E2C,0xE7999F:0x4E2D,0xE799A4:0x4E2E,
0xE799A5:0x4E2F,0xE799AD:0x4E30,0xE799AE:0x4E31,0xE799AF:0x4E32,0xE799B1:0x4E33,
0xE799B4:0x4E34,0xE79A81:0x4E35,0xE79A85:0x4E36,0xE79A8C:0x4E37,0xE79A8D:0x4E38,
0xE79A95:0x4E39,0xE79A9B:0x4E3A,0xE79A9C:0x4E3B,0xE79A9D:0x4E3C,0xE79A9F:0x4E3D,
0xE79AA0:0x4E3E,0xE79AA2:0x4E3F,0xE79AA3:0x4E40,0xE79AA4:0x4E41,0xE79AA5:0x4E42,
0xE79AA6:0x4E43,0xE79AA7:0x4E44,0xE79AA8:0x4E45,0xE79AAA:0x4E46,0xE79AAD:0x4E47,
0xE79ABD:0x4E48,0xE79B81:0x4E49,0xE79B85:0x4E4A,0xE79B89:0x4E4B,0xE79B8B:0x4E4C,
0xE79B8C:0x4E4D,0xE79B8E:0x4E4E,0xE79B94:0x4E4F,0xE79B99:0x4E50,0xE79BA0:0x4E51,
0xE79BA6:0x4E52,0xE79BA8:0x4E53,0xE79BAC:0x4E54,0xE79BB0:0x4E55,0xE79BB1:0x4E56,
0xE79BB6:0x4E57,0xE79BB9:0x4E58,0xE79BBC:0x4E59,0xE79C80:0x4E5A,0xE79C86:0x4E5B,
0xE79C8A:0x4E5C,0xE79C8E:0x4E5D,0xE79C92:0x4E5E,0xE79C94:0x4E5F,0xE79C95:0x4E60,
0xE79C97:0x4E61,0xE79C99:0x4E62,0xE79C9A:0x4E63,0xE79C9C:0x4E64,0xE79CA2:0x4E65,
0xE79CA8:0x4E66,0xE79CAD:0x4E67,0xE79CAE:0x4E68,0xE79CAF:0x4E69,0xE79CB4:0x4E6A,
0xE79CB5:0x4E6B,0xE79CB6:0x4E6C,0xE79CB9:0x4E6D,0xE79CBD:0x4E6E,0xE79CBE:0x4E6F,
0xE79D82:0x4E70,0xE79D85:0x4E71,0xE79D86:0x4E72,0xE79D8A:0x4E73,0xE79D8D:0x4E74,
0xE79D8E:0x4E75,0xE79D8F:0x4E76,0xE79D92:0x4E77,0xE79D96:0x4E78,0xE79D97:0x4E79,
0xE79D9C:0x4E7A,0xE79D9E:0x4E7B,0xE79D9F:0x4E7C,0xE79DA0:0x4E7D,0xE79DA2:0x4E7E,
0xE79DA4:0x4F21,0xE79DA7:0x4F22,0xE79DAA:0x4F23,0xE79DAC:0x4F24,0xE79DB0:0x4F25,
0xE79DB2:0x4F26,0xE79DB3:0x4F27,0xE79DB4:0x4F28,0xE79DBA:0x4F29,0xE79DBD:0x4F2A,
0xE79E80:0x4F2B,0xE79E84:0x4F2C,0xE79E8C:0x4F2D,0xE79E8D:0x4F2E,0xE79E94:0x4F2F,
0xE79E95:0x4F30,0xE79E96:0x4F31,0xE79E9A:0x4F32,0xE79E9F:0x4F33,0xE79EA2:0x4F34,
0xE79EA7:0x4F35,0xE79EAA:0x4F36,0xE79EAE:0x4F37,0xE79EAF:0x4F38,0xE79EB1:0x4F39,
0xE79EB5:0x4F3A,0xE79EBE:0x4F3B,0xE79F83:0x4F3C,0xE79F89:0x4F3D,0xE79F91:0x4F3E,
0xE79F92:0x4F3F,0xE79F95:0x4F40,0xE79F99:0x4F41,0xE79F9E:0x4F42,0xE79F9F:0x4F43,
0xE79FA0:0x4F44,0xE79FA4:0x4F45,0xE79FA6:0x4F46,0xE79FAA:0x4F47,0xE79FAC:0x4F48,
0xE79FB0:0x4F49,0xE79FB1:0x4F4A,0xE79FB4:0x4F4B,0xE79FB8:0x4F4C,0xE79FBB:0x4F4D,
0xE7A085:0x4F4E,0xE7A086:0x4F4F,0xE7A089:0x4F50,0xE7A08D:0x4F51,0xE7A08E:0x4F52,
0xE7A091:0x4F53,0xE7A09D:0x4F54,0xE7A0A1:0x4F55,0xE7A0A2:0x4F56,0xE7A0A3:0x4F57,
0xE7A0AD:0x4F58,0xE7A0AE:0x4F59,0xE7A0B0:0x4F5A,0xE7A0B5:0x4F5B,0xE7A0B7:0x4F5C,
0xE7A183:0x4F5D,0xE7A184:0x4F5E,0xE7A187:0x4F5F,0xE7A188:0x4F60,0xE7A18C:0x4F61,
0xE7A18E:0x4F62,0xE7A192:0x4F63,0xE7A19C:0x4F64,0xE7A19E:0x4F65,0xE7A1A0:0x4F66,
0xE7A1A1:0x4F67,0xE7A1A3:0x4F68,0xE7A1A4:0x4F69,0xE7A1A8:0x4F6A,0xE7A1AA:0x4F6B,
0xE7A1AE:0x4F6C,0xE7A1BA:0x4F6D,0xE7A1BE:0x4F6E,0xE7A28A:0x4F6F,0xE7A28F:0x4F70,
0xE7A294:0x4F71,0xE7A298:0x4F72,0xE7A2A1:0x4F73,0xE7A29D:0x4F74,0xE7A29E:0x4F75,
0xE7A29F:0x4F76,0xE7A2A4:0x4F77,0xE7A2A8:0x4F78,0xE7A2AC:0x4F79,0xE7A2AD:0x4F7A,
0xE7A2B0:0x4F7B,0xE7A2B1:0x4F7C,0xE7A2B2:0x4F7D,0xE7A2B3:0x4F7E,0xE7A2BB:0x5021,
0xE7A2BD:0x5022,0xE7A2BF:0x5023,0xE7A387:0x5024,0xE7A388:0x5025,0xE7A389:0x5026,
0xE7A38C:0x5027,0xE7A38E:0x5028,0xE7A392:0x5029,0xE7A393:0x502A,0xE7A395:0x502B,
0xE7A396:0x502C,0xE7A3A4:0x502D,0xE7A39B:0x502E,0xE7A39F:0x502F,0xE7A3A0:0x5030,
0xE7A3A1:0x5031,0xE7A3A6:0x5032,0xE7A3AA:0x5033,0xE7A3B2:0x5034,0xE7A3B3:0x5035,
0xE7A480:0x5036,0xE7A3B6:0x5037,0xE7A3B7:0x5038,0xE7A3BA:0x5039,0xE7A3BB:0x503A,
0xE7A3BF:0x503B,0xE7A486:0x503C,0xE7A48C:0x503D,0xE7A490:0x503E,0xE7A49A:0x503F,
0xE7A49C:0x5040,0xE7A49E:0x5041,0xE7A49F:0x5042,0xE7A4A0:0x5043,0xE7A4A5:0x5044,
0xE7A4A7:0x5045,0xE7A4A9:0x5046,0xE7A4AD:0x5047,0xE7A4B1:0x5048,0xE7A4B4:0x5049,
0xE7A4B5:0x504A,0xE7A4BB:0x504B,0xE7A4BD:0x504C,0xE7A4BF:0x504D,0xE7A584:0x504E,
0xE7A585:0x504F,0xE7A586:0x5050,0xE7A58A:0x5051,0xE7A58B:0x5052,0xE7A58F:0x5053,
0xE7A591:0x5054,0xE7A594:0x5055,0xE7A598:0x5056,0xE7A59B:0x5057,0xE7A59C:0x5058,
0xE7A5A7:0x5059,0xE7A5A9:0x505A,0xE7A5AB:0x505B,0xE7A5B2:0x505C,0xE7A5B9:0x505D,
0xE7A5BB:0x505E,0xE7A5BC:0x505F,0xE7A5BE:0x5060,0xE7A68B:0x5061,0xE7A68C:0x5062,
0xE7A691:0x5063,0xE7A693:0x5064,0xE7A694:0x5065,0xE7A695:0x5066,0xE7A696:0x5067,
0xE7A698:0x5068,0xE7A69B:0x5069,0xE7A69C:0x506A,0xE7A6A1:0x506B,0xE7A6A8:0x506C,
0xE7A6A9:0x506D,0xE7A6AB:0x506E,0xE7A6AF:0x506F,0xE7A6B1:0x5070,0xE7A6B4:0x5071,
0xE7A6B8:0x5072,0xE7A6BB:0x5073,0xE7A782:0x5074,0xE7A784:0x5075,0xE7A787:0x5076,
0xE7A788:0x5077,0xE7A78A:0x5078,0xE7A78F:0x5079,0xE7A794:0x507A,0xE7A796:0x507B,
0xE7A79A:0x507C,0xE7A79D:0x507D,0xE7A79E:0x507E,0xE7A7A0:0x5121,0xE7A7A2:0x5122,
0xE7A7A5:0x5123,0xE7A7AA:0x5124,0xE7A7AB:0x5125,0xE7A7AD:0x5126,0xE7A7B1:0x5127,
0xE7A7B8:0x5128,0xE7A7BC:0x5129,0xE7A882:0x512A,0xE7A883:0x512B,0xE7A887:0x512C,
0xE7A889:0x512D,0xE7A88A:0x512E,0xE7A88C:0x512F,0xE7A891:0x5130,0xE7A895:0x5131,
0xE7A89B:0x5132,0xE7A89E:0x5133,0xE7A8A1:0x5134,0xE7A8A7:0x5135,0xE7A8AB:0x5136,
0xE7A8AD:0x5137,0xE7A8AF:0x5138,0xE7A8B0:0x5139,0xE7A8B4:0x513A,0xE7A8B5:0x513B,
0xE7A8B8:0x513C,0xE7A8B9:0x513D,0xE7A8BA:0x513E,0xE7A984:0x513F,0xE7A985:0x5140,
0xE7A987:0x5141,0xE7A988:0x5142,0xE7A98C:0x5143,0xE7A995:0x5144,0xE7A996:0x5145,
0xE7A999:0x5146,0xE7A99C:0x5147,0xE7A99D:0x5148,0xE7A99F:0x5149,0xE7A9A0:0x514A,
0xE7A9A5:0x514B,0xE7A9A7:0x514C,0xE7A9AA:0x514D,0xE7A9AD:0x514E,0xE7A9B5:0x514F,
0xE7A9B8:0x5150,0xE7A9BE:0x5151,0xE7AA80:0x5152,0xE7AA82:0x5153,0xE7AA85:0x5154,
0xE7AA86:0x5155,0xE7AA8A:0x5156,0xE7AA8B:0x5157,0xE7AA90:0x5158,0xE7AA91:0x5159,
0xE7AA94:0x515A,0xE7AA9E:0x515B,0xE7AAA0:0x515C,0xE7AAA3:0x515D,0xE7AAAC:0x515E,
0xE7AAB3:0x515F,0xE7AAB5:0x5160,0xE7AAB9:0x5161,0xE7AABB:0x5162,0xE7AABC:0x5163,
0xE7AB86:0x5164,0xE7AB89:0x5165,0xE7AB8C:0x5166,0xE7AB8E:0x5167,0xE7AB91:0x5168,
0xE7AB9B:0x5169,0xE7ABA8:0x516A,0xE7ABA9:0x516B,0xE7ABAB:0x516C,0xE7ABAC:0x516D,
0xE7ABB1:0x516E,0xE7ABB4:0x516F,0xE7ABBB:0x5170,0xE7ABBD:0x5171,0xE7ABBE:0x5172,
0xE7AC87:0x5173,0xE7AC94:0x5174,0xE7AC9F:0x5175,0xE7ACA3:0x5176,0xE7ACA7:0x5177,
0xE7ACA9:0x5178,0xE7ACAA:0x5179,0xE7ACAB:0x517A,0xE7ACAD:0x517B,0xE7ACAE:0x517C,
0xE7ACAF:0x517D,0xE7ACB0:0x517E,0xE7ACB1:0x5221,0xE7ACB4:0x5222,0xE7ACBD:0x5223,
0xE7ACBF:0x5224,0xE7AD80:0x5225,0xE7AD81:0x5226,0xE7AD87:0x5227,0xE7AD8E:0x5228,
0xE7AD95:0x5229,0xE7ADA0:0x522A,0xE7ADA4:0x522B,0xE7ADA6:0x522C,0xE7ADA9:0x522D,
0xE7ADAA:0x522E,0xE7ADAD:0x522F,0xE7ADAF:0x5230,0xE7ADB2:0x5231,0xE7ADB3:0x5232,
0xE7ADB7:0x5233,0xE7AE84:0x5234,0xE7AE89:0x5235,0xE7AE8E:0x5236,0xE7AE90:0x5237,
0xE7AE91:0x5238,0xE7AE96:0x5239,0xE7AE9B:0x523A,0xE7AE9E:0x523B,0xE7AEA0:0x523C,
0xE7AEA5:0x523D,0xE7AEAC:0x523E,0xE7AEAF:0x523F,0xE7AEB0:0x5240,0xE7AEB2:0x5241,
0xE7AEB5:0x5242,0xE7AEB6:0x5243,0xE7AEBA:0x5244,0xE7AEBB:0x5245,0xE7AEBC:0x5246,
0xE7AEBD:0x5247,0xE7AF82:0x5248,0xE7AF85:0x5249,0xE7AF88:0x524A,0xE7AF8A:0x524B,
0xE7AF94:0x524C,0xE7AF96:0x524D,0xE7AF97:0x524E,0xE7AF99:0x524F,0xE7AF9A:0x5250,
0xE7AF9B:0x5251,0xE7AFA8:0x5252,0xE7AFAA:0x5253,0xE7AFB2:0x5254,0xE7AFB4:0x5255,
0xE7AFB5:0x5256,0xE7AFB8:0x5257,0xE7AFB9:0x5258,0xE7AFBA:0x5259,0xE7AFBC:0x525A,
0xE7AFBE:0x525B,0xE7B081:0x525C,0xE7B082:0x525D,0xE7B083:0x525E,0xE7B084:0x525F,
0xE7B086:0x5260,0xE7B089:0x5261,0xE7B08B:0x5262,0xE7B08C:0x5263,0xE7B08E:0x5264,
0xE7B08F:0x5265,0xE7B099:0x5266,0xE7B09B:0x5267,0xE7B0A0:0x5268,0xE7B0A5:0x5269,
0xE7B0A6:0x526A,0xE7B0A8:0x526B,0xE7B0AC:0x526C,0xE7B0B1:0x526D,0xE7B0B3:0x526E,
0xE7B0B4:0x526F,0xE7B0B6:0x5270,0xE7B0B9:0x5271,0xE7B0BA:0x5272,0xE7B186:0x5273,
0xE7B18A:0x5274,0xE7B195:0x5275,0xE7B191:0x5276,0xE7B192:0x5277,0xE7B193:0x5278,
0xE7B199:0x5279,0xE7B19A:0x527A,0xE7B19B:0x527B,0xE7B19C:0x527C,0xE7B19D:0x527D,
0xE7B19E:0x527E,0xE7B1A1:0x5321,0xE7B1A3:0x5322,0xE7B1A7:0x5323,0xE7B1A9:0x5324,
0xE7B1AD:0x5325,0xE7B1AE:0x5326,0xE7B1B0:0x5327,0xE7B1B2:0x5328,0xE7B1B9:0x5329,
0xE7B1BC:0x532A,0xE7B1BD:0x532B,0xE7B286:0x532C,0xE7B287:0x532D,0xE7B28F:0x532E,
0xE7B294:0x532F,0xE7B29E:0x5330,0xE7B2A0:0x5331,0xE7B2A6:0x5332,0xE7B2B0:0x5333,
0xE7B2B6:0x5334,0xE7B2B7:0x5335,0xE7B2BA:0x5336,0xE7B2BB:0x5337,0xE7B2BC:0x5338,
0xE7B2BF:0x5339,0xE7B384:0x533A,0xE7B387:0x533B,0xE7B388:0x533C,0xE7B389:0x533D,
0xE7B38D:0x533E,0xE7B38F:0x533F,0xE7B393:0x5340,0xE7B394:0x5341,0xE7B395:0x5342,
0xE7B397:0x5343,0xE7B399:0x5344,0xE7B39A:0x5345,0xE7B39D:0x5346,0xE7B3A6:0x5347,
0xE7B3A9:0x5348,0xE7B3AB:0x5349,0xE7B3B5:0x534A,0xE7B483:0x534B,0xE7B487:0x534C,
0xE7B488:0x534D,0xE7B489:0x534E,0xE7B48F:0x534F,0xE7B491:0x5350,0xE7B492:0x5351,
0xE7B493:0x5352,0xE7B496:0x5353,0xE7B49D:0x5354,0xE7B49E:0x5355,0xE7B4A3:0x5356,
0xE7B4A6:0x5357,0xE7B4AA:0x5358,0xE7B4AD:0x5359,0xE7B4B1:0x535A,0xE7B4BC:0x535B,
0xE7B4BD:0x535C,0xE7B4BE:0x535D,0xE7B580:0x535E,0xE7B581:0x535F,0xE7B587:0x5360,
0xE7B588:0x5361,0xE7B58D:0x5362,0xE7B591:0x5363,0xE7B593:0x5364,0xE7B597:0x5365,
0xE7B599:0x5366,0xE7B59A:0x5367,0xE7B59C:0x5368,0xE7B59D:0x5369,0xE7B5A5:0x536A,
0xE7B5A7:0x536B,0xE7B5AA:0x536C,0xE7B5B0:0x536D,0xE7B5B8:0x536E,0xE7B5BA:0x536F,
0xE7B5BB:0x5370,0xE7B5BF:0x5371,0xE7B681:0x5372,0xE7B682:0x5373,0xE7B683:0x5374,
0xE7B685:0x5375,0xE7B686:0x5376,0xE7B688:0x5377,0xE7B68B:0x5378,0xE7B68C:0x5379,
0xE7B68D:0x537A,0xE7B691:0x537B,0xE7B696:0x537C,0xE7B697:0x537D,0xE7B69D:0x537E,
0xE7B69E:0x5421,0xE7B6A6:0x5422,0xE7B6A7:0x5423,0xE7B6AA:0x5424,0xE7B6B3:0x5425,
0xE7B6B6:0x5426,0xE7B6B7:0x5427,0xE7B6B9:0x5428,0xE7B782:0x5429,0xE7B783:0x542A,
0xE7B784:0x542B,0xE7B785:0x542C,0xE7B786:0x542D,0xE7B78C:0x542E,0xE7B78D:0x542F,
0xE7B78E:0x5430,0xE7B797:0x5431,0xE7B799:0x5432,0xE7B880:0x5433,0xE7B7A2:0x5434,
0xE7B7A5:0x5435,0xE7B7A6:0x5436,0xE7B7AA:0x5437,0xE7B7AB:0x5438,0xE7B7AD:0x5439,
0xE7B7B1:0x543A,0xE7B7B5:0x543B,0xE7B7B6:0x543C,0xE7B7B9:0x543D,0xE7B7BA:0x543E,
0xE7B888:0x543F,0xE7B890:0x5440,0xE7B891:0x5441,0xE7B895:0x5442,0xE7B897:0x5443,
0xE7B89C:0x5444,0xE7B89D:0x5445,0xE7B8A0:0x5446,0xE7B8A7:0x5447,0xE7B8A8:0x5448,
0xE7B8AC:0x5449,0xE7B8AD:0x544A,0xE7B8AF:0x544B,0xE7B8B3:0x544C,0xE7B8B6:0x544D,
0xE7B8BF:0x544E,0xE7B984:0x544F,0xE7B985:0x5450,0xE7B987:0x5451,0xE7B98E:0x5452,
0xE7B990:0x5453,0xE7B992:0x5454,0xE7B998:0x5455,0xE7B99F:0x5456,0xE7B9A1:0x5457,
0xE7B9A2:0x5458,0xE7B9A5:0x5459,0xE7B9AB:0x545A,0xE7B9AE:0x545B,0xE7B9AF:0x545C,
0xE7B9B3:0x545D,0xE7B9B8:0x545E,0xE7B9BE:0x545F,0xE7BA81:0x5460,0xE7BA86:0x5461,
0xE7BA87:0x5462,0xE7BA8A:0x5463,0xE7BA8D:0x5464,0xE7BA91:0x5465,0xE7BA95:0x5466,
0xE7BA98:0x5467,0xE7BA9A:0x5468,0xE7BA9D:0x5469,0xE7BA9E:0x546A,0xE7BCBC:0x546B,
0xE7BCBB:0x546C,0xE7BCBD:0x546D,0xE7BCBE:0x546E,0xE7BCBF:0x546F,0xE7BD83:0x5470,
0xE7BD84:0x5471,0xE7BD87:0x5472,0xE7BD8F:0x5473,0xE7BD92:0x5474,0xE7BD93:0x5475,
0xE7BD9B:0x5476,0xE7BD9C:0x5477,0xE7BD9D:0x5478,0xE7BDA1:0x5479,0xE7BDA3:0x547A,
0xE7BDA4:0x547B,0xE7BDA5:0x547C,0xE7BDA6:0x547D,0xE7BDAD:0x547E,0xE7BDB1:0x5521,
0xE7BDBD:0x5522,0xE7BDBE:0x5523,0xE7BDBF:0x5524,0xE7BE80:0x5525,0xE7BE8B:0x5526,
0xE7BE8D:0x5527,0xE7BE8F:0x5528,0xE7BE90:0x5529,0xE7BE91:0x552A,0xE7BE96:0x552B,
0xE7BE97:0x552C,0xE7BE9C:0x552D,0xE7BEA1:0x552E,0xE7BEA2:0x552F,0xE7BEA6:0x5530,
0xE7BEAA:0x5531,0xE7BEAD:0x5532,0xE7BEB4:0x5533,0xE7BEBC:0x5534,0xE7BEBF:0x5535,
0xE7BF80:0x5536,0xE7BF83:0x5537,0xE7BF88:0x5538,0xE7BF8E:0x5539,0xE7BF8F:0x553A,
0xE7BF9B:0x553B,0xE7BF9F:0x553C,0xE7BFA3:0x553D,0xE7BFA5:0x553E,0xE7BFA8:0x553F,
0xE7BFAC:0x5540,0xE7BFAE:0x5541,0xE7BFAF:0x5542,0xE7BFB2:0x5543,0xE7BFBA:0x5544,
0xE7BFBD:0x5545,0xE7BFBE:0x5546,0xE7BFBF:0x5547,0xE88087:0x5548,0xE88088:0x5549,
0xE8808A:0x554A,0xE8808D:0x554B,0xE8808E:0x554C,0xE8808F:0x554D,0xE88091:0x554E,
0xE88093:0x554F,0xE88094:0x5550,0xE88096:0x5551,0xE8809D:0x5552,0xE8809E:0x5553,
0xE8809F:0x5554,0xE880A0:0x5555,0xE880A4:0x5556,0xE880A6:0x5557,0xE880AC:0x5558,
0xE880AE:0x5559,0xE880B0:0x555A,0xE880B4:0x555B,0xE880B5:0x555C,0xE880B7:0x555D,
0xE880B9:0x555E,0xE880BA:0x555F,0xE880BC:0x5560,0xE880BE:0x5561,0xE88180:0x5562,
0xE88184:0x5563,0xE881A0:0x5564,0xE881A4:0x5565,0xE881A6:0x5566,0xE881AD:0x5567,
0xE881B1:0x5568,0xE881B5:0x5569,0xE88281:0x556A,0xE88288:0x556B,0xE8828E:0x556C,
0xE8829C:0x556D,0xE8829E:0x556E,0xE882A6:0x556F,0xE882A7:0x5570,0xE882AB:0x5571,
0xE882B8:0x5572,0xE882B9:0x5573,0xE88388:0x5574,0xE8838D:0x5575,0xE8838F:0x5576,
0xE88392:0x5577,0xE88394:0x5578,0xE88395:0x5579,0xE88397:0x557A,0xE88398:0x557B,
0xE883A0:0x557C,0xE883AD:0x557D,0xE883AE:0x557E,0xE883B0:0x5621,0xE883B2:0x5622,
0xE883B3:0x5623,0xE883B6:0x5624,0xE883B9:0x5625,0xE883BA:0x5626,0xE883BE:0x5627,
0xE88483:0x5628,0xE8848B:0x5629,0xE88496:0x562A,0xE88497:0x562B,0xE88498:0x562C,
0xE8849C:0x562D,0xE8849E:0x562E,0xE884A0:0x562F,0xE884A4:0x5630,0xE884A7:0x5631,
0xE884AC:0x5632,0xE884B0:0x5633,0xE884B5:0x5634,0xE884BA:0x5635,0xE884BC:0x5636,
0xE88585:0x5637,0xE88587:0x5638,0xE8858A:0x5639,0xE8858C:0x563A,0xE88592:0x563B,
0xE88597:0x563C,0xE885A0:0x563D,0xE885A1:0x563E,0xE885A7:0x563F,0xE885A8:0x5640,
0xE885A9:0x5641,0xE885AD:0x5642,0xE885AF:0x5643,0xE885B7:0x5644,0xE88681:0x5645,
0xE88690:0x5646,0xE88684:0x5647,0xE88685:0x5648,0xE88686:0x5649,0xE8868B:0x564A,
0xE8868E:0x564B,0xE88696:0x564C,0xE88698:0x564D,0xE8869B:0x564E,0xE8869E:0x564F,
0xE886A2:0x5650,0xE886AE:0x5651,0xE886B2:0x5652,0xE886B4:0x5653,0xE886BB:0x5654,
0xE8878B:0x5655,0xE88783:0x5656,0xE88785:0x5657,0xE8878A:0x5658,0xE8878E:0x5659,
0xE8878F:0x565A,0xE88795:0x565B,0xE88797:0x565C,0xE8879B:0x565D,0xE8879D:0x565E,
0xE8879E:0x565F,0xE887A1:0x5660,0xE887A4:0x5661,0xE887AB:0x5662,0xE887AC:0x5663,
0xE887B0:0x5664,0xE887B1:0x5665,0xE887B2:0x5666,0xE887B5:0x5667,0xE887B6:0x5668,
0xE887B8:0x5669,0xE887B9:0x566A,0xE887BD:0x566B,0xE887BF:0x566C,0xE88880:0x566D,
0xE88883:0x566E,0xE8888F:0x566F,0xE88893:0x5670,0xE88894:0x5671,0xE88899:0x5672,
0xE8889A:0x5673,0xE8889D:0x5674,0xE888A1:0x5675,0xE888A2:0x5676,0xE888A8:0x5677,
0xE888B2:0x5678,0xE888B4:0x5679,0xE888BA:0x567A,0xE88983:0x567B,0xE88984:0x567C,
0xE88985:0x567D,0xE88986:0x567E,0xE8898B:0x5721,0xE8898E:0x5722,0xE8898F:0x5723,
0xE88991:0x5724,0xE88996:0x5725,0xE8899C:0x5726,0xE889A0:0x5727,0xE889A3:0x5728,
0xE889A7:0x5729,0xE889AD:0x572A,0xE889B4:0x572B,0xE889BB:0x572C,0xE889BD:0x572D,
0xE889BF:0x572E,0xE88A80:0x572F,0xE88A81:0x5730,0xE88A83:0x5731,0xE88A84:0x5732,
0xE88A87:0x5733,0xE88A89:0x5734,0xE88A8A:0x5735,0xE88A8E:0x5736,0xE88A91:0x5737,
0xE88A94:0x5738,0xE88A96:0x5739,0xE88A98:0x573A,0xE88A9A:0x573B,0xE88A9B:0x573C,
0xE88AA0:0x573D,0xE88AA1:0x573E,0xE88AA3:0x573F,0xE88AA4:0x5740,0xE88AA7:0x5741,
0xE88AA8:0x5742,0xE88AA9:0x5743,0xE88AAA:0x5744,0xE88AAE:0x5745,0xE88AB0:0x5746,
0xE88AB2:0x5747,0xE88AB4:0x5748,0xE88AB7:0x5749,0xE88ABA:0x574A,0xE88ABC:0x574B,
0xE88ABE:0x574C,0xE88ABF:0x574D,0xE88B86:0x574E,0xE88B90:0x574F,0xE88B95:0x5750,
0xE88B9A:0x5751,0xE88BA0:0x5752,0xE88BA2:0x5753,0xE88BA4:0x5754,0xE88BA8:0x5755,
0xE88BAA:0x5756,0xE88BAD:0x5757,0xE88BAF:0x5758,0xE88BB6:0x5759,0xE88BB7:0x575A,
0xE88BBD:0x575B,0xE88BBE:0x575C,0xE88C80:0x575D,0xE88C81:0x575E,0xE88C87:0x575F,
0xE88C88:0x5760,0xE88C8A:0x5761,0xE88C8B:0x5762,0xE88D94:0x5763,0xE88C9B:0x5764,
0xE88C9D:0x5765,0xE88C9E:0x5766,0xE88C9F:0x5767,0xE88CA1:0x5768,0xE88CA2:0x5769,
0xE88CAC:0x576A,0xE88CAD:0x576B,0xE88CAE:0x576C,0xE88CB0:0x576D,0xE88CB3:0x576E,
0xE88CB7:0x576F,0xE88CBA:0x5770,0xE88CBC:0x5771,0xE88CBD:0x5772,0xE88D82:0x5773,
0xE88D83:0x5774,0xE88D84:0x5775,0xE88D87:0x5776,0xE88D8D:0x5777,0xE88D8E:0x5778,
0xE88D91:0x5779,0xE88D95:0x577A,0xE88D96:0x577B,0xE88D97:0x577C,0xE88DB0:0x577D,
0xE88DB8:0x577E,0xE88DBD:0x5821,0xE88DBF:0x5822,0xE88E80:0x5823,0xE88E82:0x5824,
0xE88E84:0x5825,0xE88E86:0x5826,0xE88E8D:0x5827,0xE88E92:0x5828,0xE88E94:0x5829,
0xE88E95:0x582A,0xE88E98:0x582B,0xE88E99:0x582C,0xE88E9B:0x582D,0xE88E9C:0x582E,
0xE88E9D:0x582F,0xE88EA6:0x5830,0xE88EA7:0x5831,0xE88EA9:0x5832,0xE88EAC:0x5833,
0xE88EBE:0x5834,0xE88EBF:0x5835,0xE88F80:0x5836,0xE88F87:0x5837,0xE88F89:0x5838,
0xE88F8F:0x5839,0xE88F90:0x583A,0xE88F91:0x583B,0xE88F94:0x583C,0xE88F9D:0x583D,
0xE88D93:0x583E,0xE88FA8:0x583F,0xE88FAA:0x5840,0xE88FB6:0x5841,0xE88FB8:0x5842,
0xE88FB9:0x5843,0xE88FBC:0x5844,0xE89081:0x5845,0xE89086:0x5846,0xE8908A:0x5847,
0xE8908F:0x5848,0xE89091:0x5849,0xE89095:0x584A,0xE89099:0x584B,0xE88EAD:0x584C,
0xE890AF:0x584D,0xE890B9:0x584E,0xE89185:0x584F,0xE89187:0x5850,0xE89188:0x5851,
0xE8918A:0x5852,0xE8918D:0x5853,0xE8918F:0x5854,0xE89191:0x5855,0xE89192:0x5856,
0xE89196:0x5857,0xE89198:0x5858,0xE89199:0x5859,0xE8919A:0x585A,0xE8919C:0x585B,
0xE891A0:0x585C,0xE891A4:0x585D,0xE891A5:0x585E,0xE891A7:0x585F,0xE891AA:0x5860,
0xE891B0:0x5861,0xE891B3:0x5862,0xE891B4:0x5863,0xE891B6:0x5864,0xE891B8:0x5865,
0xE891BC:0x5866,0xE891BD:0x5867,0xE89281:0x5868,0xE89285:0x5869,0xE89292:0x586A,
0xE89293:0x586B,0xE89295:0x586C,0xE8929E:0x586D,0xE892A6:0x586E,0xE892A8:0x586F,
0xE892A9:0x5870,0xE892AA:0x5871,0xE892AF:0x5872,0xE892B1:0x5873,0xE892B4:0x5874,
0xE892BA:0x5875,0xE892BD:0x5876,0xE892BE:0x5877,0xE89380:0x5878,0xE89382:0x5879,
0xE89387:0x587A,0xE89388:0x587B,0xE8938C:0x587C,0xE8938F:0x587D,0xE89393:0x587E,
0xE8939C:0x5921,0xE893A7:0x5922,0xE893AA:0x5923,0xE893AF:0x5924,0xE893B0:0x5925,
0xE893B1:0x5926,0xE893B2:0x5927,0xE893B7:0x5928,0xE894B2:0x5929,0xE893BA:0x592A,
0xE893BB:0x592B,0xE893BD:0x592C,0xE89482:0x592D,0xE89483:0x592E,0xE89487:0x592F,
0xE8948C:0x5930,0xE8948E:0x5931,0xE89490:0x5932,0xE8949C:0x5933,0xE8949E:0x5934,
0xE894A2:0x5935,0xE894A3:0x5936,0xE894A4:0x5937,0xE894A5:0x5938,0xE894A7:0x5939,
0xE894AA:0x593A,0xE894AB:0x593B,0xE894AF:0x593C,0xE894B3:0x593D,0xE894B4:0x593E,
0xE894B6:0x593F,0xE894BF:0x5940,0xE89586:0x5941,0xE8958F:0x5942,0xE89590:0x5943,
0xE89591:0x5944,0xE89592:0x5945,0xE89593:0x5946,0xE89596:0x5947,0xE89599:0x5948,
0xE8959C:0x5949,0xE8959D:0x594A,0xE8959E:0x594B,0xE8959F:0x594C,0xE895A0:0x594D,
0xE895A1:0x594E,0xE895A2:0x594F,0xE895A4:0x5950,0xE895AB:0x5951,0xE895AF:0x5952,
0xE895B9:0x5953,0xE895BA:0x5954,0xE895BB:0x5955,0xE895BD:0x5956,0xE895BF:0x5957,
0xE89681:0x5958,0xE89685:0x5959,0xE89686:0x595A,0xE89689:0x595B,0xE8968B:0x595C,
0xE8968C:0x595D,0xE8968F:0x595E,0xE89693:0x595F,0xE89698:0x5960,0xE8969D:0x5961,
0xE8969F:0x5962,0xE896A0:0x5963,0xE896A2:0x5964,0xE896A5:0x5965,0xE896A7:0x5966,
0xE896B4:0x5967,0xE896B6:0x5968,0xE896B7:0x5969,0xE896B8:0x596A,0xE896BC:0x596B,
0xE896BD:0x596C,0xE896BE:0x596D,0xE896BF:0x596E,0xE89782:0x596F,0xE89787:0x5970,
0xE8978A:0x5971,0xE8978B:0x5972,0xE8978E:0x5973,0xE896AD:0x5974,0xE89798:0x5975,
0xE8979A:0x5976,0xE8979F:0x5977,0xE897A0:0x5978,0xE897A6:0x5979,0xE897A8:0x597A,
0xE897AD:0x597B,0xE897B3:0x597C,0xE897B6:0x597D,0xE897BC:0x597E,0xE897BF:0x5A21,
0xE89880:0x5A22,0xE89884:0x5A23,0xE89885:0x5A24,0xE8988D:0x5A25,0xE8988E:0x5A26,
0xE89890:0x5A27,0xE89891:0x5A28,0xE89892:0x5A29,0xE89898:0x5A2A,0xE89899:0x5A2B,
0xE8989B:0x5A2C,0xE8989E:0x5A2D,0xE898A1:0x5A2E,0xE898A7:0x5A2F,0xE898A9:0x5A30,
0xE898B6:0x5A31,0xE898B8:0x5A32,0xE898BA:0x5A33,0xE898BC:0x5A34,0xE898BD:0x5A35,
0xE89980:0x5A36,0xE89982:0x5A37,0xE89986:0x5A38,0xE89992:0x5A39,0xE89993:0x5A3A,
0xE89996:0x5A3B,0xE89997:0x5A3C,0xE89998:0x5A3D,0xE89999:0x5A3E,0xE8999D:0x5A3F,
0xE899A0:0x5A40,0xE899A1:0x5A41,0xE899A2:0x5A42,0xE899A3:0x5A43,0xE899A4:0x5A44,
0xE899A9:0x5A45,0xE899AC:0x5A46,0xE899AF:0x5A47,0xE899B5:0x5A48,0xE899B6:0x5A49,
0xE899B7:0x5A4A,0xE899BA:0x5A4B,0xE89A8D:0x5A4C,0xE89A91:0x5A4D,0xE89A96:0x5A4E,
0xE89A98:0x5A4F,0xE89A9A:0x5A50,0xE89A9C:0x5A51,0xE89AA1:0x5A52,0xE89AA6:0x5A53,
0xE89AA7:0x5A54,0xE89AA8:0x5A55,0xE89AAD:0x5A56,0xE89AB1:0x5A57,0xE89AB3:0x5A58,
0xE89AB4:0x5A59,0xE89AB5:0x5A5A,0xE89AB7:0x5A5B,0xE89AB8:0x5A5C,0xE89AB9:0x5A5D,
0xE89ABF:0x5A5E,0xE89B80:0x5A5F,0xE89B81:0x5A60,0xE89B83:0x5A61,0xE89B85:0x5A62,
0xE89B91:0x5A63,0xE89B92:0x5A64,0xE89B95:0x5A65,0xE89B97:0x5A66,0xE89B9A:0x5A67,
0xE89B9C:0x5A68,0xE89BA0:0x5A69,0xE89BA3:0x5A6A,0xE89BA5:0x5A6B,0xE89BA7:0x5A6C,
0xE89A88:0x5A6D,0xE89BBA:0x5A6E,0xE89BBC:0x5A6F,0xE89BBD:0x5A70,0xE89C84:0x5A71,
0xE89C85:0x5A72,0xE89C87:0x5A73,0xE89C8B:0x5A74,0xE89C8E:0x5A75,0xE89C8F:0x5A76,
0xE89C90:0x5A77,0xE89C93:0x5A78,0xE89C94:0x5A79,0xE89C99:0x5A7A,0xE89C9E:0x5A7B,
0xE89C9F:0x5A7C,0xE89CA1:0x5A7D,0xE89CA3:0x5A7E,0xE89CA8:0x5B21,0xE89CAE:0x5B22,
0xE89CAF:0x5B23,0xE89CB1:0x5B24,0xE89CB2:0x5B25,0xE89CB9:0x5B26,0xE89CBA:0x5B27,
0xE89CBC:0x5B28,0xE89CBD:0x5B29,0xE89CBE:0x5B2A,0xE89D80:0x5B2B,0xE89D83:0x5B2C,
0xE89D85:0x5B2D,0xE89D8D:0x5B2E,0xE89D98:0x5B2F,0xE89D9D:0x5B30,0xE89DA1:0x5B31,
0xE89DA4:0x5B32,0xE89DA5:0x5B33,0xE89DAF:0x5B34,0xE89DB1:0x5B35,0xE89DB2:0x5B36,
0xE89DBB:0x5B37,0xE89E83:0x5B38,0xE89E84:0x5B39,0xE89E85:0x5B3A,0xE89E86:0x5B3B,
0xE89E87:0x5B3C,0xE89E88:0x5B3D,0xE89E89:0x5B3E,0xE89E8B:0x5B3F,0xE89E8C:0x5B40,
0xE89E90:0x5B41,0xE89E93:0x5B42,0xE89E95:0x5B43,0xE89E97:0x5B44,0xE89E98:0x5B45,
0xE89E99:0x5B46,0xE89E9E:0x5B47,0xE89EA0:0x5B48,0xE89EA3:0x5B49,0xE89EA7:0x5B4A,
0xE89EAC:0x5B4B,0xE89EAD:0x5B4C,0xE89EAE:0x5B4D,0xE89EB1:0x5B4E,0xE89EB5:0x5B4F,
0xE89EBE:0x5B50,0xE89EBF:0x5B51,0xE89F81:0x5B52,0xE89F88:0x5B53,0xE89F89:0x5B54,
0xE89F8A:0x5B55,0xE89F8E:0x5B56,0xE89F95:0x5B57,0xE89F96:0x5B58,0xE89F99:0x5B59,
0xE89F9A:0x5B5A,0xE89F9C:0x5B5B,0xE89F9F:0x5B5C,0xE89FA2:0x5B5D,0xE89FA3:0x5B5E,
0xE89FA4:0x5B5F,0xE89FAA:0x5B60,0xE89FAB:0x5B61,0xE89FAD:0x5B62,0xE89FB1:0x5B63,
0xE89FB3:0x5B64,0xE89FB8:0x5B65,0xE89FBA:0x5B66,0xE89FBF:0x5B67,0xE8A081:0x5B68,
0xE8A083:0x5B69,0xE8A086:0x5B6A,0xE8A089:0x5B6B,0xE8A08A:0x5B6C,0xE8A08B:0x5B6D,
0xE8A090:0x5B6E,0xE8A099:0x5B6F,0xE8A092:0x5B70,0xE8A093:0x5B71,0xE8A094:0x5B72,
0xE8A098:0x5B73,0xE8A09A:0x5B74,0xE8A09B:0x5B75,0xE8A09C:0x5B76,0xE8A09E:0x5B77,
0xE8A09F:0x5B78,0xE8A0A8:0x5B79,0xE8A0AD:0x5B7A,0xE8A0AE:0x5B7B,0xE8A0B0:0x5B7C,
0xE8A0B2:0x5B7D,0xE8A0B5:0x5B7E,0xE8A0BA:0x5C21,0xE8A0BC:0x5C22,0xE8A181:0x5C23,
0xE8A183:0x5C24,0xE8A185:0x5C25,0xE8A188:0x5C26,0xE8A189:0x5C27,0xE8A18A:0x5C28,
0xE8A18B:0x5C29,0xE8A18E:0x5C2A,0xE8A191:0x5C2B,0xE8A195:0x5C2C,0xE8A196:0x5C2D,
0xE8A198:0x5C2E,0xE8A19A:0x5C2F,0xE8A19C:0x5C30,0xE8A19F:0x5C31,0xE8A1A0:0x5C32,
0xE8A1A4:0x5C33,0xE8A1A9:0x5C34,0xE8A1B1:0x5C35,0xE8A1B9:0x5C36,0xE8A1BB:0x5C37,
0xE8A280:0x5C38,0xE8A298:0x5C39,0xE8A29A:0x5C3A,0xE8A29B:0x5C3B,0xE8A29C:0x5C3C,
0xE8A29F:0x5C3D,0xE8A2A0:0x5C3E,0xE8A2A8:0x5C3F,0xE8A2AA:0x5C40,0xE8A2BA:0x5C41,
0xE8A2BD:0x5C42,0xE8A2BE:0x5C43,0xE8A380:0x5C44,0xE8A38A:0x5C45,0xE8A38B:0x5C46,
0xE8A38C:0x5C47,0xE8A38D:0x5C48,0xE8A38E:0x5C49,0xE8A391:0x5C4A,0xE8A392:0x5C4B,
0xE8A393:0x5C4C,0xE8A39B:0x5C4D,0xE8A39E:0x5C4E,0xE8A3A7:0x5C4F,0xE8A3AF:0x5C50,
0xE8A3B0:0x5C51,0xE8A3B1:0x5C52,0xE8A3B5:0x5C53,0xE8A3B7:0x5C54,0xE8A481:0x5C55,
0xE8A486:0x5C56,0xE8A48D:0x5C57,0xE8A48E:0x5C58,0xE8A48F:0x5C59,0xE8A495:0x5C5A,
0xE8A496:0x5C5B,0xE8A498:0x5C5C,0xE8A499:0x5C5D,0xE8A49A:0x5C5E,0xE8A49C:0x5C5F,
0xE8A4A0:0x5C60,0xE8A4A6:0x5C61,0xE8A4A7:0x5C62,0xE8A4A8:0x5C63,0xE8A4B0:0x5C64,
0xE8A4B1:0x5C65,0xE8A4B2:0x5C66,0xE8A4B5:0x5C67,0xE8A4B9:0x5C68,0xE8A4BA:0x5C69,
0xE8A4BE:0x5C6A,0xE8A580:0x5C6B,0xE8A582:0x5C6C,0xE8A585:0x5C6D,0xE8A586:0x5C6E,
0xE8A589:0x5C6F,0xE8A58F:0x5C70,0xE8A592:0x5C71,0xE8A597:0x5C72,0xE8A59A:0x5C73,
0xE8A59B:0x5C74,0xE8A59C:0x5C75,0xE8A5A1:0x5C76,0xE8A5A2:0x5C77,0xE8A5A3:0x5C78,
0xE8A5AB:0x5C79,0xE8A5AE:0x5C7A,0xE8A5B0:0x5C7B,0xE8A5B3:0x5C7C,0xE8A5B5:0x5C7D,
0xE8A5BA:0x5C7E,0xE8A5BB:0x5D21,0xE8A5BC:0x5D22,0xE8A5BD:0x5D23,0xE8A689:0x5D24,
0xE8A68D:0x5D25,0xE8A690:0x5D26,0xE8A694:0x5D27,0xE8A695:0x5D28,0xE8A69B:0x5D29,
0xE8A69C:0x5D2A,0xE8A69F:0x5D2B,0xE8A6A0:0x5D2C,0xE8A6A5:0x5D2D,0xE8A6B0:0x5D2E,
0xE8A6B4:0x5D2F,0xE8A6B5:0x5D30,0xE8A6B6:0x5D31,0xE8A6B7:0x5D32,0xE8A6BC:0x5D33,
0xE8A794:0x5D34,0xE8A795:0x5D35,0xE8A796:0x5D36,0xE8A797:0x5D37,0xE8A798:0x5D38,
0xE8A7A5:0x5D39,0xE8A7A9:0x5D3A,0xE8A7AB:0x5D3B,0xE8A7AD:0x5D3C,0xE8A7B1:0x5D3D,
0xE8A7B3:0x5D3E,0xE8A7B6:0x5D3F,0xE8A7B9:0x5D40,0xE8A7BD:0x5D41,0xE8A7BF:0x5D42,
0xE8A884:0x5D43,0xE8A885:0x5D44,0xE8A887:0x5D45,0xE8A88F:0x5D46,0xE8A891:0x5D47,
0xE8A892:0x5D48,0xE8A894:0x5D49,0xE8A895:0x5D4A,0xE8A89E:0x5D4B,0xE8A8A0:0x5D4C,
0xE8A8A2:0x5D4D,0xE8A8A4:0x5D4E,0xE8A8A6:0x5D4F,0xE8A8AB:0x5D50,0xE8A8AC:0x5D51,
0xE8A8AF:0x5D52,0xE8A8B5:0x5D53,0xE8A8B7:0x5D54,0xE8A8BD:0x5D55,0xE8A8BE:0x5D56,
0xE8A980:0x5D57,0xE8A983:0x5D58,0xE8A985:0x5D59,0xE8A987:0x5D5A,0xE8A989:0x5D5B,
0xE8A98D:0x5D5C,0xE8A98E:0x5D5D,0xE8A993:0x5D5E,0xE8A996:0x5D5F,0xE8A997:0x5D60,
0xE8A998:0x5D61,0xE8A99C:0x5D62,0xE8A99D:0x5D63,0xE8A9A1:0x5D64,0xE8A9A5:0x5D65,
0xE8A9A7:0x5D66,0xE8A9B5:0x5D67,0xE8A9B6:0x5D68,0xE8A9B7:0x5D69,0xE8A9B9:0x5D6A,
0xE8A9BA:0x5D6B,0xE8A9BB:0x5D6C,0xE8A9BE:0x5D6D,0xE8A9BF:0x5D6E,0xE8AA80:0x5D6F,
0xE8AA83:0x5D70,0xE8AA86:0x5D71,0xE8AA8B:0x5D72,0xE8AA8F:0x5D73,0xE8AA90:0x5D74,
0xE8AA92:0x5D75,0xE8AA96:0x5D76,0xE8AA97:0x5D77,0xE8AA99:0x5D78,0xE8AA9F:0x5D79,
0xE8AAA7:0x5D7A,0xE8AAA9:0x5D7B,0xE8AAAE:0x5D7C,0xE8AAAF:0x5D7D,0xE8AAB3:0x5D7E,
0xE8AAB6:0x5E21,0xE8AAB7:0x5E22,0xE8AABB:0x5E23,0xE8AABE:0x5E24,0xE8AB83:0x5E25,
0xE8AB86:0x5E26,0xE8AB88:0x5E27,0xE8AB89:0x5E28,0xE8AB8A:0x5E29,0xE8AB91:0x5E2A,
0xE8AB93:0x5E2B,0xE8AB94:0x5E2C,0xE8AB95:0x5E2D,0xE8AB97:0x5E2E,0xE8AB9D:0x5E2F,
0xE8AB9F:0x5E30,0xE8ABAC:0x5E31,0xE8ABB0:0x5E32,0xE8ABB4:0x5E33,0xE8ABB5:0x5E34,
0xE8ABB6:0x5E35,0xE8ABBC:0x5E36,0xE8ABBF:0x5E37,0xE8AC85:0x5E38,0xE8AC86:0x5E39,
0xE8AC8B:0x5E3A,0xE8AC91:0x5E3B,0xE8AC9C:0x5E3C,0xE8AC9E:0x5E3D,0xE8AC9F:0x5E3E,
0xE8AC8A:0x5E3F,0xE8ACAD:0x5E40,0xE8ACB0:0x5E41,0xE8ACB7:0x5E42,0xE8ACBC:0x5E43,
0xE8AD82:0x5E44,0xE8AD83:0x5E45,0xE8AD84:0x5E46,0xE8AD85:0x5E47,0xE8AD86:0x5E48,
0xE8AD88:0x5E49,0xE8AD92:0x5E4A,0xE8AD93:0x5E4B,0xE8AD94:0x5E4C,0xE8AD99:0x5E4D,
0xE8AD8D:0x5E4E,0xE8AD9E:0x5E4F,0xE8ADA3:0x5E50,0xE8ADAD:0x5E51,0xE8ADB6:0x5E52,
0xE8ADB8:0x5E53,0xE8ADB9:0x5E54,0xE8ADBC:0x5E55,0xE8ADBE:0x5E56,0xE8AE81:0x5E57,
0xE8AE84:0x5E58,0xE8AE85:0x5E59,0xE8AE8B:0x5E5A,0xE8AE8D:0x5E5B,0xE8AE8F:0x5E5C,
0xE8AE94:0x5E5D,0xE8AE95:0x5E5E,0xE8AE9C:0x5E5F,0xE8AE9E:0x5E60,0xE8AE9F:0x5E61,
0xE8B0B8:0x5E62,0xE8B0B9:0x5E63,0xE8B0BD:0x5E64,0xE8B0BE:0x5E65,0xE8B185:0x5E66,
0xE8B187:0x5E67,0xE8B189:0x5E68,0xE8B18B:0x5E69,0xE8B18F:0x5E6A,0xE8B191:0x5E6B,
0xE8B193:0x5E6C,0xE8B194:0x5E6D,0xE8B197:0x5E6E,0xE8B198:0x5E6F,0xE8B19B:0x5E70,
0xE8B19D:0x5E71,0xE8B199:0x5E72,0xE8B1A3:0x5E73,0xE8B1A4:0x5E74,0xE8B1A6:0x5E75,
0xE8B1A8:0x5E76,0xE8B1A9:0x5E77,0xE8B1AD:0x5E78,0xE8B1B3:0x5E79,0xE8B1B5:0x5E7A,
0xE8B1B6:0x5E7B,0xE8B1BB:0x5E7C,0xE8B1BE:0x5E7D,0xE8B286:0x5E7E,0xE8B287:0x5F21,
0xE8B28B:0x5F22,0xE8B290:0x5F23,0xE8B292:0x5F24,0xE8B293:0x5F25,0xE8B299:0x5F26,
0xE8B29B:0x5F27,0xE8B29C:0x5F28,0xE8B2A4:0x5F29,0xE8B2B9:0x5F2A,0xE8B2BA:0x5F2B,
0xE8B385:0x5F2C,0xE8B386:0x5F2D,0xE8B389:0x5F2E,0xE8B38B:0x5F2F,0xE8B38F:0x5F30,
0xE8B396:0x5F31,0xE8B395:0x5F32,0xE8B399:0x5F33,0xE8B39D:0x5F34,0xE8B3A1:0x5F35,
0xE8B3A8:0x5F36,0xE8B3AC:0x5F37,0xE8B3AF:0x5F38,0xE8B3B0:0x5F39,0xE8B3B2:0x5F3A,
0xE8B3B5:0x5F3B,0xE8B3B7:0x5F3C,0xE8B3B8:0x5F3D,0xE8B3BE:0x5F3E,0xE8B3BF:0x5F3F,
0xE8B481:0x5F40,0xE8B483:0x5F41,0xE8B489:0x5F42,0xE8B492:0x5F43,0xE8B497:0x5F44,
0xE8B49B:0x5F45,0xE8B5A5:0x5F46,0xE8B5A9:0x5F47,0xE8B5AC:0x5F48,0xE8B5AE:0x5F49,
0xE8B5BF:0x5F4A,0xE8B682:0x5F4B,0xE8B684:0x5F4C,0xE8B688:0x5F4D,0xE8B68D:0x5F4E,
0xE8B690:0x5F4F,0xE8B691:0x5F50,0xE8B695:0x5F51,0xE8B69E:0x5F52,0xE8B69F:0x5F53,
0xE8B6A0:0x5F54,0xE8B6A6:0x5F55,0xE8B6AB:0x5F56,0xE8B6AC:0x5F57,0xE8B6AF:0x5F58,
0xE8B6B2:0x5F59,0xE8B6B5:0x5F5A,0xE8B6B7:0x5F5B,0xE8B6B9:0x5F5C,0xE8B6BB:0x5F5D,
0xE8B780:0x5F5E,0xE8B785:0x5F5F,0xE8B786:0x5F60,0xE8B787:0x5F61,0xE8B788:0x5F62,
0xE8B78A:0x5F63,0xE8B78E:0x5F64,0xE8B791:0x5F65,0xE8B794:0x5F66,0xE8B795:0x5F67,
0xE8B797:0x5F68,0xE8B799:0x5F69,0xE8B7A4:0x5F6A,0xE8B7A5:0x5F6B,0xE8B7A7:0x5F6C,
0xE8B7AC:0x5F6D,0xE8B7B0:0x5F6E,0xE8B6BC:0x5F6F,0xE8B7B1:0x5F70,0xE8B7B2:0x5F71,
0xE8B7B4:0x5F72,0xE8B7BD:0x5F73,0xE8B881:0x5F74,0xE8B884:0x5F75,0xE8B885:0x5F76,
0xE8B886:0x5F77,0xE8B88B:0x5F78,0xE8B891:0x5F79,0xE8B894:0x5F7A,0xE8B896:0x5F7B,
0xE8B8A0:0x5F7C,0xE8B8A1:0x5F7D,0xE8B8A2:0x5F7E,0xE8B8A3:0x6021,0xE8B8A6:0x6022,
0xE8B8A7:0x6023,0xE8B8B1:0x6024,0xE8B8B3:0x6025,0xE8B8B6:0x6026,0xE8B8B7:0x6027,
0xE8B8B8:0x6028,0xE8B8B9:0x6029,0xE8B8BD:0x602A,0xE8B980:0x602B,0xE8B981:0x602C,
0xE8B98B:0x602D,0xE8B98D:0x602E,0xE8B98E:0x602F,0xE8B98F:0x6030,0xE8B994:0x6031,
0xE8B99B:0x6032,0xE8B99C:0x6033,0xE8B99D:0x6034,0xE8B99E:0x6035,0xE8B9A1:0x6036,
0xE8B9A2:0x6037,0xE8B9A9:0x6038,0xE8B9AC:0x6039,0xE8B9AD:0x603A,0xE8B9AF:0x603B,
0xE8B9B0:0x603C,0xE8B9B1:0x603D,0xE8B9B9:0x603E,0xE8B9BA:0x603F,0xE8B9BB:0x6040,
0xE8BA82:0x6041,0xE8BA83:0x6042,0xE8BA89:0x6043,0xE8BA90:0x6044,0xE8BA92:0x6045,
0xE8BA95:0x6046,0xE8BA9A:0x6047,0xE8BA9B:0x6048,0xE8BA9D:0x6049,0xE8BA9E:0x604A,
0xE8BAA2:0x604B,0xE8BAA7:0x604C,0xE8BAA9:0x604D,0xE8BAAD:0x604E,0xE8BAAE:0x604F,
0xE8BAB3:0x6050,0xE8BAB5:0x6051,0xE8BABA:0x6052,0xE8BABB:0x6053,0xE8BB80:0x6054,
0xE8BB81:0x6055,0xE8BB83:0x6056,0xE8BB84:0x6057,0xE8BB87:0x6058,0xE8BB8F:0x6059,
0xE8BB91:0x605A,0xE8BB94:0x605B,0xE8BB9C:0x605C,0xE8BBA8:0x605D,0xE8BBAE:0x605E,
0xE8BBB0:0x605F,0xE8BBB1:0x6060,0xE8BBB7:0x6061,0xE8BBB9:0x6062,0xE8BBBA:0x6063,
0xE8BBAD:0x6064,0xE8BC80:0x6065,0xE8BC82:0x6066,0xE8BC87:0x6067,0xE8BC88:0x6068,
0xE8BC8F:0x6069,0xE8BC90:0x606A,0xE8BC96:0x606B,0xE8BC97:0x606C,0xE8BC98:0x606D,
0xE8BC9E:0x606E,0xE8BCA0:0x606F,0xE8BCA1:0x6070,0xE8BCA3:0x6071,0xE8BCA5:0x6072,
0xE8BCA7:0x6073,0xE8BCA8:0x6074,0xE8BCAC:0x6075,0xE8BCAD:0x6076,0xE8BCAE:0x6077,
0xE8BCB4:0x6078,0xE8BCB5:0x6079,0xE8BCB6:0x607A,0xE8BCB7:0x607B,0xE8BCBA:0x607C,
0xE8BD80:0x607D,0xE8BD81:0x607E,0xE8BD83:0x6121,0xE8BD87:0x6122,0xE8BD8F:0x6123,
0xE8BD91:0x6124,0xE8BD92:0x6125,0xE8BD93:0x6126,0xE8BD94:0x6127,0xE8BD95:0x6128,
0xE8BD98:0x6129,0xE8BD9D:0x612A,0xE8BD9E:0x612B,0xE8BDA5:0x612C,0xE8BE9D:0x612D,
0xE8BEA0:0x612E,0xE8BEA1:0x612F,0xE8BEA4:0x6130,0xE8BEA5:0x6131,0xE8BEA6:0x6132,
0xE8BEB5:0x6133,0xE8BEB6:0x6134,0xE8BEB8:0x6135,0xE8BEBE:0x6136,0xE8BF80:0x6137,
0xE8BF81:0x6138,0xE8BF86:0x6139,0xE8BF8A:0x613A,0xE8BF8B:0x613B,0xE8BF8D:0x613C,
0xE8BF90:0x613D,0xE8BF92:0x613E,0xE8BF93:0x613F,0xE8BF95:0x6140,0xE8BFA0:0x6141,
0xE8BFA3:0x6142,0xE8BFA4:0x6143,0xE8BFA8:0x6144,0xE8BFAE:0x6145,0xE8BFB1:0x6146,
0xE8BFB5:0x6147,0xE8BFB6:0x6148,0xE8BFBB:0x6149,0xE8BFBE:0x614A,0xE98082:0x614B,
0xE98084:0x614C,0xE98088:0x614D,0xE9808C:0x614E,0xE98098:0x614F,0xE9809B:0x6150,
0xE980A8:0x6151,0xE980A9:0x6152,0xE980AF:0x6153,0xE980AA:0x6154,0xE980AC:0x6155,
0xE980AD:0x6156,0xE980B3:0x6157,0xE980B4:0x6158,0xE980B7:0x6159,0xE980BF:0x615A,
0xE98183:0x615B,0xE98184:0x615C,0xE9818C:0x615D,0xE9819B:0x615E,0xE9819D:0x615F,
0xE981A2:0x6160,0xE981A6:0x6161,0xE981A7:0x6162,0xE981AC:0x6163,0xE981B0:0x6164,
0xE981B4:0x6165,0xE981B9:0x6166,0xE98285:0x6167,0xE98288:0x6168,0xE9828B:0x6169,
0xE9828C:0x616A,0xE9828E:0x616B,0xE98290:0x616C,0xE98295:0x616D,0xE98297:0x616E,
0xE98298:0x616F,0xE98299:0x6170,0xE9829B:0x6171,0xE982A0:0x6172,0xE982A1:0x6173,
0xE982A2:0x6174,0xE982A5:0x6175,0xE982B0:0x6176,0xE982B2:0x6177,0xE982B3:0x6178,
0xE982B4:0x6179,0xE982B6:0x617A,0xE982BD:0x617B,0xE9838C:0x617C,0xE982BE:0x617D,
0xE98383:0x617E,0xE98384:0x6221,0xE98385:0x6222,0xE98387:0x6223,0xE98388:0x6224,
0xE98395:0x6225,0xE98397:0x6226,0xE98398:0x6227,0xE98399:0x6228,0xE9839C:0x6229,
0xE9839D:0x622A,0xE9839F:0x622B,0xE983A5:0x622C,0xE98392:0x622D,0xE983B6:0x622E,
0xE983AB:0x622F,0xE983AF:0x6230,0xE983B0:0x6231,0xE983B4:0x6232,0xE983BE:0x6233,
0xE983BF:0x6234,0xE98480:0x6235,0xE98484:0x6236,0xE98485:0x6237,0xE98486:0x6238,
0xE98488:0x6239,0xE9848D:0x623A,0xE98490:0x623B,0xE98494:0x623C,0xE98496:0x623D,
0xE98497:0x623E,0xE98498:0x623F,0xE9849A:0x6240,0xE9849C:0x6241,0xE9849E:0x6242,
0xE984A0:0x6243,0xE984A5:0x6244,0xE984A2:0x6245,0xE984A3:0x6246,0xE984A7:0x6247,
0xE984A9:0x6248,0xE984AE:0x6249,0xE984AF:0x624A,0xE984B1:0x624B,0xE984B4:0x624C,
0xE984B6:0x624D,0xE984B7:0x624E,0xE984B9:0x624F,0xE984BA:0x6250,0xE984BC:0x6251,
0xE984BD:0x6252,0xE98583:0x6253,0xE98587:0x6254,0xE98588:0x6255,0xE9858F:0x6256,
0xE98593:0x6257,0xE98597:0x6258,0xE98599:0x6259,0xE9859A:0x625A,0xE9859B:0x625B,
0xE985A1:0x625C,0xE985A4:0x625D,0xE985A7:0x625E,0xE985AD:0x625F,0xE985B4:0x6260,
0xE985B9:0x6261,0xE985BA:0x6262,0xE985BB:0x6263,0xE98681:0x6264,0xE98683:0x6265,
0xE98685:0x6266,0xE98686:0x6267,0xE9868A:0x6268,0xE9868E:0x6269,0xE98691:0x626A,
0xE98693:0x626B,0xE98694:0x626C,0xE98695:0x626D,0xE98698:0x626E,0xE9869E:0x626F,
0xE986A1:0x6270,0xE986A6:0x6271,0xE986A8:0x6272,0xE986AC:0x6273,0xE986AD:0x6274,
0xE986AE:0x6275,0xE986B0:0x6276,0xE986B1:0x6277,0xE986B2:0x6278,0xE986B3:0x6279,
0xE986B6:0x627A,0xE986BB:0x627B,0xE986BC:0x627C,0xE986BD:0x627D,0xE986BF:0x627E,
0xE98782:0x6321,0xE98783:0x6322,0xE98785:0x6323,0xE98793:0x6324,0xE98794:0x6325,
0xE98797:0x6326,0xE98799:0x6327,0xE9879A:0x6328,0xE9879E:0x6329,0xE987A4:0x632A,
0xE987A5:0x632B,0xE987A9:0x632C,0xE987AA:0x632D,0xE987AC:0x632E,0xE987AD:0x632F,
0xE987AE:0x6330,0xE987AF:0x6331,0xE987B0:0x6332,0xE987B1:0x6333,0xE987B7:0x6334,
0xE987B9:0x6335,0xE987BB:0x6336,0xE987BD:0x6337,0xE98880:0x6338,0xE98881:0x6339,
0xE98884:0x633A,0xE98885:0x633B,0xE98886:0x633C,0xE98887:0x633D,0xE98889:0x633E,
0xE9888A:0x633F,0xE9888C:0x6340,0xE98890:0x6341,0xE98892:0x6342,0xE98893:0x6343,
0xE98896:0x6344,0xE98898:0x6345,0xE9889C:0x6346,0xE9889D:0x6347,0xE988A3:0x6348,
0xE988A4:0x6349,0xE988A5:0x634A,0xE988A6:0x634B,0xE988A8:0x634C,0xE988AE:0x634D,
0xE988AF:0x634E,0xE988B0:0x634F,0xE988B3:0x6350,0xE988B5:0x6351,0xE988B6:0x6352,
0xE988B8:0x6353,0xE988B9:0x6354,0xE988BA:0x6355,0xE988BC:0x6356,0xE988BE:0x6357,
0xE98980:0x6358,0xE98982:0x6359,0xE98983:0x635A,0xE98986:0x635B,0xE98987:0x635C,
0xE9898A:0x635D,0xE9898D:0x635E,0xE9898E:0x635F,0xE9898F:0x6360,0xE98991:0x6361,
0xE98998:0x6362,0xE98999:0x6363,0xE9899C:0x6364,0xE9899D:0x6365,0xE989A0:0x6366,
0xE989A1:0x6367,0xE989A5:0x6368,0xE989A7:0x6369,0xE989A8:0x636A,0xE989A9:0x636B,
0xE989AE:0x636C,0xE989AF:0x636D,0xE989B0:0x636E,0xE989B5:0x636F,0xE989B6:0x6370,
0xE989B7:0x6371,0xE989B8:0x6372,0xE989B9:0x6373,0xE989BB:0x6374,0xE989BC:0x6375,
0xE989BD:0x6376,0xE989BF:0x6377,0xE98A88:0x6378,0xE98A89:0x6379,0xE98A8A:0x637A,
0xE98A8D:0x637B,0xE98A8E:0x637C,0xE98A92:0x637D,0xE98A97:0x637E,0xE98A99:0x6421,
0xE98A9F:0x6422,0xE98AA0:0x6423,0xE98AA4:0x6424,0xE98AA5:0x6425,0xE98AA7:0x6426,
0xE98AA8:0x6427,0xE98AAB:0x6428,0xE98AAF:0x6429,0xE98AB2:0x642A,0xE98AB6:0x642B,
0xE98AB8:0x642C,0xE98ABA:0x642D,0xE98ABB:0x642E,0xE98ABC:0x642F,0xE98ABD:0x6430,
0xE98ABF:0x6431,0xE98B80:0x6432,0xE98B81:0x6433,0xE98B82:0x6434,0xE98B83:0x6435,
0xE98B85:0x6436,0xE98B86:0x6437,0xE98B87:0x6438,0xE98B88:0x6439,0xE98B8B:0x643A,
0xE98B8C:0x643B,0xE98B8D:0x643C,0xE98B8E:0x643D,0xE98B90:0x643E,0xE98B93:0x643F,
0xE98B95:0x6440,0xE98B97:0x6441,0xE98B98:0x6442,0xE98B99:0x6443,0xE98B9C:0x6444,
0xE98B9D:0x6445,0xE98B9F:0x6446,0xE98BA0:0x6447,0xE98BA1:0x6448,0xE98BA3:0x6449,
0xE98BA5:0x644A,0xE98BA7:0x644B,0xE98BA8:0x644C,0xE98BAC:0x644D,0xE98BAE:0x644E,
0xE98BB0:0x644F,0xE98BB9:0x6450,0xE98BBB:0x6451,0xE98BBF:0x6452,0xE98C80:0x6453,
0xE98C82:0x6454,0xE98C88:0x6455,0xE98C8D:0x6456,0xE98C91:0x6457,0xE98C94:0x6458,
0xE98C95:0x6459,0xE98C9C:0x645A,0xE98C9D:0x645B,0xE98C9E:0x645C,0xE98C9F:0x645D,
0xE98CA1:0x645E,0xE98CA4:0x645F,0xE98CA5:0x6460,0xE98CA7:0x6461,0xE98CA9:0x6462,
0xE98CAA:0x6463,0xE98CB3:0x6464,0xE98CB4:0x6465,0xE98CB6:0x6466,0xE98CB7:0x6467,
0xE98D87:0x6468,0xE98D88:0x6469,0xE98D89:0x646A,0xE98D90:0x646B,0xE98D91:0x646C,
0xE98D92:0x646D,0xE98D95:0x646E,0xE98D97:0x646F,0xE98D98:0x6470,0xE98D9A:0x6471,
0xE98D9E:0x6472,0xE98DA4:0x6473,0xE98DA5:0x6474,0xE98DA7:0x6475,0xE98DA9:0x6476,
0xE98DAA:0x6477,0xE98DAD:0x6478,0xE98DAF:0x6479,0xE98DB0:0x647A,0xE98DB1:0x647B,
0xE98DB3:0x647C,0xE98DB4:0x647D,0xE98DB6:0x647E,0xE98DBA:0x6521,0xE98DBD:0x6522,
0xE98DBF:0x6523,0xE98E80:0x6524,0xE98E81:0x6525,0xE98E82:0x6526,0xE98E88:0x6527,
0xE98E8A:0x6528,0xE98E8B:0x6529,0xE98E8D:0x652A,0xE98E8F:0x652B,0xE98E92:0x652C,
0xE98E95:0x652D,0xE98E98:0x652E,0xE98E9B:0x652F,0xE98E9E:0x6530,0xE98EA1:0x6531,
0xE98EA3:0x6532,0xE98EA4:0x6533,0xE98EA6:0x6534,0xE98EA8:0x6535,0xE98EAB:0x6536,
0xE98EB4:0x6537,0xE98EB5:0x6538,0xE98EB6:0x6539,0xE98EBA:0x653A,0xE98EA9:0x653B,
0xE98F81:0x653C,0xE98F84:0x653D,0xE98F85:0x653E,0xE98F86:0x653F,0xE98F87:0x6540,
0xE98F89:0x6541,0xE98F8A:0x6542,0xE98F8B:0x6543,0xE98F8C:0x6544,0xE98F8D:0x6545,
0xE98F93:0x6546,0xE98F99:0x6547,0xE98F9C:0x6548,0xE98F9E:0x6549,0xE98F9F:0x654A,
0xE98FA2:0x654B,0xE98FA6:0x654C,0xE98FA7:0x654D,0xE98FB9:0x654E,0xE98FB7:0x654F,
0xE98FB8:0x6550,0xE98FBA:0x6551,0xE98FBB:0x6552,0xE98FBD:0x6553,0xE99081:0x6554,
0xE99082:0x6555,0xE99084:0x6556,0xE99088:0x6557,0xE99089:0x6558,0xE9908D:0x6559,
0xE9908E:0x655A,0xE9908F:0x655B,0xE99095:0x655C,0xE99096:0x655D,0xE99097:0x655E,
0xE9909F:0x655F,0xE990AE:0x6560,0xE990AF:0x6561,0xE990B1:0x6562,0xE990B2:0x6563,
0xE990B3:0x6564,0xE990B4:0x6565,0xE990BB:0x6566,0xE990BF:0x6567,0xE990BD:0x6568,
0xE99183:0x6569,0xE99185:0x656A,0xE99188:0x656B,0xE9918A:0x656C,0xE9918C:0x656D,
0xE99195:0x656E,0xE99199:0x656F,0xE9919C:0x6570,0xE9919F:0x6571,0xE991A1:0x6572,
0xE991A3:0x6573,0xE991A8:0x6574,0xE991AB:0x6575,0xE991AD:0x6576,0xE991AE:0x6577,
0xE991AF:0x6578,0xE991B1:0x6579,0xE991B2:0x657A,0xE99284:0x657B,0xE99283:0x657C,
0xE995B8:0x657D,0xE995B9:0x657E,0xE995BE:0x6621,0xE99684:0x6622,0xE99688:0x6623,
0xE9968C:0x6624,0xE9968D:0x6625,0xE9968E:0x6626,0xE9969D:0x6627,0xE9969E:0x6628,
0xE9969F:0x6629,0xE996A1:0x662A,0xE996A6:0x662B,0xE996A9:0x662C,0xE996AB:0x662D,
0xE996AC:0x662E,0xE996B4:0x662F,0xE996B6:0x6630,0xE996BA:0x6631,0xE996BD:0x6632,
0xE996BF:0x6633,0xE99786:0x6634,0xE99788:0x6635,0xE99789:0x6636,0xE9978B:0x6637,
0xE99790:0x6638,0xE99791:0x6639,0xE99792:0x663A,0xE99793:0x663B,0xE99799:0x663C,
0xE9979A:0x663D,0xE9979D:0x663E,0xE9979E:0x663F,0xE9979F:0x6640,0xE997A0:0x6641,
0xE997A4:0x6642,0xE997A6:0x6643,0xE9989D:0x6644,0xE9989E:0x6645,0xE998A2:0x6646,
0xE998A4:0x6647,0xE998A5:0x6648,0xE998A6:0x6649,0xE998AC:0x664A,0xE998B1:0x664B,
0xE998B3:0x664C,0xE998B7:0x664D,0xE998B8:0x664E,0xE998B9:0x664F,0xE998BA:0x6650,
0xE998BC:0x6651,0xE998BD:0x6652,0xE99981:0x6653,0xE99992:0x6654,0xE99994:0x6655,
0xE99996:0x6656,0xE99997:0x6657,0xE99998:0x6658,0xE999A1:0x6659,0xE999AE:0x665A,
0xE999B4:0x665B,0xE999BB:0x665C,0xE999BC:0x665D,0xE999BE:0x665E,0xE999BF:0x665F,
0xE99A81:0x6660,0xE99A82:0x6661,0xE99A83:0x6662,0xE99A84:0x6663,0xE99A89:0x6664,
0xE99A91:0x6665,0xE99A96:0x6666,0xE99A9A:0x6667,0xE99A9D:0x6668,0xE99A9F:0x6669,
0xE99AA4:0x666A,0xE99AA5:0x666B,0xE99AA6:0x666C,0xE99AA9:0x666D,0xE99AAE:0x666E,
0xE99AAF:0x666F,0xE99AB3:0x6670,0xE99ABA:0x6671,0xE99B8A:0x6672,0xE99B92:0x6673,
0xE5B6B2:0x6674,0xE99B98:0x6675,0xE99B9A:0x6676,0xE99B9D:0x6677,0xE99B9E:0x6678,
0xE99B9F:0x6679,0xE99BA9:0x667A,0xE99BAF:0x667B,0xE99BB1:0x667C,0xE99BBA:0x667D,
0xE99C82:0x667E,0xE99C83:0x6721,0xE99C85:0x6722,0xE99C89:0x6723,0xE99C9A:0x6724,
0xE99C9B:0x6725,0xE99C9D:0x6726,0xE99CA1:0x6727,0xE99CA2:0x6728,0xE99CA3:0x6729,
0xE99CA8:0x672A,0xE99CB1:0x672B,0xE99CB3:0x672C,0xE99D81:0x672D,0xE99D83:0x672E,
0xE99D8A:0x672F,0xE99D8E:0x6730,0xE99D8F:0x6731,0xE99D95:0x6732,0xE99D97:0x6733,
0xE99D98:0x6734,0xE99D9A:0x6735,0xE99D9B:0x6736,0xE99DA3:0x6737,0xE99DA7:0x6738,
0xE99DAA:0x6739,0xE99DAE:0x673A,0xE99DB3:0x673B,0xE99DB6:0x673C,0xE99DB7:0x673D,
0xE99DB8:0x673E,0xE99DBB:0x673F,0xE99DBD:0x6740,0xE99DBF:0x6741,0xE99E80:0x6742,
0xE99E89:0x6743,0xE99E95:0x6744,0xE99E96:0x6745,0xE99E97:0x6746,0xE99E99:0x6747,
0xE99E9A:0x6748,0xE99E9E:0x6749,0xE99E9F:0x674A,0xE99EA2:0x674B,0xE99EAC:0x674C,
0xE99EAE:0x674D,0xE99EB1:0x674E,0xE99EB2:0x674F,0xE99EB5:0x6750,0xE99EB6:0x6751,
0xE99EB8:0x6752,0xE99EB9:0x6753,0xE99EBA:0x6754,0xE99EBC:0x6755,0xE99EBE:0x6756,
0xE99EBF:0x6757,0xE99F81:0x6758,0xE99F84:0x6759,0xE99F85:0x675A,0xE99F87:0x675B,
0xE99F89:0x675C,0xE99F8A:0x675D,0xE99F8C:0x675E,0xE99F8D:0x675F,0xE99F8E:0x6760,
0xE99F90:0x6761,0xE99F91:0x6762,0xE99F94:0x6763,0xE99F97:0x6764,0xE99F98:0x6765,
0xE99F99:0x6766,0xE99F9D:0x6767,0xE99F9E:0x6768,0xE99FA0:0x6769,0xE99F9B:0x676A,
0xE99FA1:0x676B,0xE99FA4:0x676C,0xE99FAF:0x676D,0xE99FB1:0x676E,0xE99FB4:0x676F,
0xE99FB7:0x6770,0xE99FB8:0x6771,0xE99FBA:0x6772,0xE9A087:0x6773,0xE9A08A:0x6774,
0xE9A099:0x6775,0xE9A08D:0x6776,0xE9A08E:0x6777,0xE9A094:0x6778,0xE9A096:0x6779,
0xE9A09C:0x677A,0xE9A09E:0x677B,0xE9A0A0:0x677C,0xE9A0A3:0x677D,0xE9A0A6:0x677E,
0xE9A0AB:0x6821,0xE9A0AE:0x6822,0xE9A0AF:0x6823,0xE9A0B0:0x6824,0xE9A0B2:0x6825,
0xE9A0B3:0x6826,0xE9A0B5:0x6827,0xE9A0A5:0x6828,0xE9A0BE:0x6829,0xE9A184:0x682A,
0xE9A187:0x682B,0xE9A18A:0x682C,0xE9A191:0x682D,0xE9A192:0x682E,0xE9A193:0x682F,
0xE9A196:0x6830,0xE9A197:0x6831,0xE9A199:0x6832,0xE9A19A:0x6833,0xE9A1A2:0x6834,
0xE9A1A3:0x6835,0xE9A1A5:0x6836,0xE9A1A6:0x6837,0xE9A1AA:0x6838,0xE9A1AC:0x6839,
0xE9A2AB:0x683A,0xE9A2AD:0x683B,0xE9A2AE:0x683C,0xE9A2B0:0x683D,0xE9A2B4:0x683E,
0xE9A2B7:0x683F,0xE9A2B8:0x6840,0xE9A2BA:0x6841,0xE9A2BB:0x6842,0xE9A2BF:0x6843,
0xE9A382:0x6844,0xE9A385:0x6845,0xE9A388:0x6846,0xE9A38C:0x6847,0xE9A3A1:0x6848,
0xE9A3A3:0x6849,0xE9A3A5:0x684A,0xE9A3A6:0x684B,0xE9A3A7:0x684C,0xE9A3AA:0x684D,
0xE9A3B3:0x684E,0xE9A3B6:0x684F,0xE9A482:0x6850,0xE9A487:0x6851,0xE9A488:0x6852,
0xE9A491:0x6853,0xE9A495:0x6854,0xE9A496:0x6855,0xE9A497:0x6856,0xE9A49A:0x6857,
0xE9A49B:0x6858,0xE9A49C:0x6859,0xE9A49F:0x685A,0xE9A4A2:0x685B,0xE9A4A6:0x685C,
0xE9A4A7:0x685D,0xE9A4AB:0x685E,0xE9A4B1:0x685F,0xE9A4B2:0x6860,0xE9A4B3:0x6861,
0xE9A4B4:0x6862,0xE9A4B5:0x6863,0xE9A4B9:0x6864,0xE9A4BA:0x6865,0xE9A4BB:0x6866,
0xE9A4BC:0x6867,0xE9A580:0x6868,0xE9A581:0x6869,0xE9A586:0x686A,0xE9A587:0x686B,
0xE9A588:0x686C,0xE9A58D:0x686D,0xE9A58E:0x686E,0xE9A594:0x686F,0xE9A598:0x6870,
0xE9A599:0x6871,0xE9A59B:0x6872,0xE9A59C:0x6873,0xE9A59E:0x6874,0xE9A59F:0x6875,
0xE9A5A0:0x6876,0xE9A69B:0x6877,0xE9A69D:0x6878,0xE9A69F:0x6879,0xE9A6A6:0x687A,
0xE9A6B0:0x687B,0xE9A6B1:0x687C,0xE9A6B2:0x687D,0xE9A6B5:0x687E,0xE9A6B9:0x6921,
0xE9A6BA:0x6922,0xE9A6BD:0x6923,0xE9A6BF:0x6924,0xE9A783:0x6925,0xE9A789:0x6926,
0xE9A793:0x6927,0xE9A794:0x6928,0xE9A799:0x6929,0xE9A79A:0x692A,0xE9A79C:0x692B,
0xE9A79E:0x692C,0xE9A7A7:0x692D,0xE9A7AA:0x692E,0xE9A7AB:0x692F,0xE9A7AC:0x6930,
0xE9A7B0:0x6931,0xE9A7B4:0x6932,0xE9A7B5:0x6933,0xE9A7B9:0x6934,0xE9A7BD:0x6935,
0xE9A7BE:0x6936,0xE9A882:0x6937,0xE9A883:0x6938,0xE9A884:0x6939,0xE9A88B:0x693A,
0xE9A88C:0x693B,0xE9A890:0x693C,0xE9A891:0x693D,0xE9A896:0x693E,0xE9A89E:0x693F,
0xE9A8A0:0x6940,0xE9A8A2:0x6941,0xE9A8A3:0x6942,0xE9A8A4:0x6943,0xE9A8A7:0x6944,
0xE9A8AD:0x6945,0xE9A8AE:0x6946,0xE9A8B3:0x6947,0xE9A8B5:0x6948,0xE9A8B6:0x6949,
0xE9A8B8:0x694A,0xE9A987:0x694B,0xE9A981:0x694C,0xE9A984:0x694D,0xE9A98A:0x694E,
0xE9A98B:0x694F,0xE9A98C:0x6950,0xE9A98E:0x6951,0xE9A991:0x6952,0xE9A994:0x6953,
0xE9A996:0x6954,0xE9A99D:0x6955,0xE9AAAA:0x6956,0xE9AAAC:0x6957,0xE9AAAE:0x6958,
0xE9AAAF:0x6959,0xE9AAB2:0x695A,0xE9AAB4:0x695B,0xE9AAB5:0x695C,0xE9AAB6:0x695D,
0xE9AAB9:0x695E,0xE9AABB:0x695F,0xE9AABE:0x6960,0xE9AABF:0x6961,0xE9AB81:0x6962,
0xE9AB83:0x6963,0xE9AB86:0x6964,0xE9AB88:0x6965,0xE9AB8E:0x6966,0xE9AB90:0x6967,
0xE9AB92:0x6968,0xE9AB95:0x6969,0xE9AB96:0x696A,0xE9AB97:0x696B,0xE9AB9B:0x696C,
0xE9AB9C:0x696D,0xE9ABA0:0x696E,0xE9ABA4:0x696F,0xE9ABA5:0x6970,0xE9ABA7:0x6971,
0xE9ABA9:0x6972,0xE9ABAC:0x6973,0xE9ABB2:0x6974,0xE9ABB3:0x6975,0xE9ABB5:0x6976,
0xE9ABB9:0x6977,0xE9ABBA:0x6978,0xE9ABBD:0x6979,0xE9ABBF:0x697A,0xE9AC80:0x697B,
0xE9AC81:0x697C,0xE9AC82:0x697D,0xE9AC83:0x697E,0xE9AC84:0x6A21,0xE9AC85:0x6A22,
0xE9AC88:0x6A23,0xE9AC89:0x6A24,0xE9AC8B:0x6A25,0xE9AC8C:0x6A26,0xE9AC8D:0x6A27,
0xE9AC8E:0x6A28,0xE9AC90:0x6A29,0xE9AC92:0x6A2A,0xE9AC96:0x6A2B,0xE9AC99:0x6A2C,
0xE9AC9B:0x6A2D,0xE9AC9C:0x6A2E,0xE9ACA0:0x6A2F,0xE9ACA6:0x6A30,0xE9ACAB:0x6A31,
0xE9ACAD:0x6A32,0xE9ACB3:0x6A33,0xE9ACB4:0x6A34,0xE9ACB5:0x6A35,0xE9ACB7:0x6A36,
0xE9ACB9:0x6A37,0xE9ACBA:0x6A38,0xE9ACBD:0x6A39,0xE9AD88:0x6A3A,0xE9AD8B:0x6A3B,
0xE9AD8C:0x6A3C,0xE9AD95:0x6A3D,0xE9AD96:0x6A3E,0xE9AD97:0x6A3F,0xE9AD9B:0x6A40,
0xE9AD9E:0x6A41,0xE9ADA1:0x6A42,0xE9ADA3:0x6A43,0xE9ADA5:0x6A44,0xE9ADA6:0x6A45,
0xE9ADA8:0x6A46,0xE9ADAA:0x6A47,0xE9ADAB:0x6A48,0xE9ADAC:0x6A49,0xE9ADAD:0x6A4A,
0xE9ADAE:0x6A4B,0xE9ADB3:0x6A4C,0xE9ADB5:0x6A4D,0xE9ADB7:0x6A4E,0xE9ADB8:0x6A4F,
0xE9ADB9:0x6A50,0xE9ADBF:0x6A51,0xE9AE80:0x6A52,0xE9AE84:0x6A53,0xE9AE85:0x6A54,
0xE9AE86:0x6A55,0xE9AE87:0x6A56,0xE9AE89:0x6A57,0xE9AE8A:0x6A58,0xE9AE8B:0x6A59,
0xE9AE8D:0x6A5A,0xE9AE8F:0x6A5B,0xE9AE90:0x6A5C,0xE9AE94:0x6A5D,0xE9AE9A:0x6A5E,
0xE9AE9D:0x6A5F,0xE9AE9E:0x6A60,0xE9AEA6:0x6A61,0xE9AEA7:0x6A62,0xE9AEA9:0x6A63,
0xE9AEAC:0x6A64,0xE9AEB0:0x6A65,0xE9AEB1:0x6A66,0xE9AEB2:0x6A67,0xE9AEB7:0x6A68,
0xE9AEB8:0x6A69,0xE9AEBB:0x6A6A,0xE9AEBC:0x6A6B,0xE9AEBE:0x6A6C,0xE9AEBF:0x6A6D,
0xE9AF81:0x6A6E,0xE9AF87:0x6A6F,0xE9AF88:0x6A70,0xE9AF8E:0x6A71,0xE9AF90:0x6A72,
0xE9AF97:0x6A73,0xE9AF98:0x6A74,0xE9AF9D:0x6A75,0xE9AF9F:0x6A76,0xE9AFA5:0x6A77,
0xE9AFA7:0x6A78,0xE9AFAA:0x6A79,0xE9AFAB:0x6A7A,0xE9AFAF:0x6A7B,0xE9AFB3:0x6A7C,
0xE9AFB7:0x6A7D,0xE9AFB8:0x6A7E,0xE9AFB9:0x6B21,0xE9AFBA:0x6B22,0xE9AFBD:0x6B23,
0xE9AFBF:0x6B24,0xE9B080:0x6B25,0xE9B082:0x6B26,0xE9B08B:0x6B27,0xE9B08F:0x6B28,
0xE9B091:0x6B29,0xE9B096:0x6B2A,0xE9B098:0x6B2B,0xE9B099:0x6B2C,0xE9B09A:0x6B2D,
0xE9B09C:0x6B2E,0xE9B09E:0x6B2F,0xE9B0A2:0x6B30,0xE9B0A3:0x6B31,0xE9B0A6:0x6B32,
0xE9B0A7:0x6B33,0xE9B0A8:0x6B34,0xE9B0A9:0x6B35,0xE9B0AA:0x6B36,0xE9B0B1:0x6B37,
0xE9B0B5:0x6B38,0xE9B0B6:0x6B39,0xE9B0B7:0x6B3A,0xE9B0BD:0x6B3B,0xE9B181:0x6B3C,
0xE9B183:0x6B3D,0xE9B184:0x6B3E,0xE9B185:0x6B3F,0xE9B189:0x6B40,0xE9B18A:0x6B41,
0xE9B18E:0x6B42,0xE9B18F:0x6B43,0xE9B190:0x6B44,0xE9B193:0x6B45,0xE9B194:0x6B46,
0xE9B196:0x6B47,0xE9B198:0x6B48,0xE9B19B:0x6B49,0xE9B19D:0x6B4A,0xE9B19E:0x6B4B,
0xE9B19F:0x6B4C,0xE9B1A3:0x6B4D,0xE9B1A9:0x6B4E,0xE9B1AA:0x6B4F,0xE9B19C:0x6B50,
0xE9B1AB:0x6B51,0xE9B1A8:0x6B52,0xE9B1AE:0x6B53,0xE9B1B0:0x6B54,0xE9B1B2:0x6B55,
0xE9B1B5:0x6B56,0xE9B1B7:0x6B57,0xE9B1BB:0x6B58,0xE9B3A6:0x6B59,0xE9B3B2:0x6B5A,
0xE9B3B7:0x6B5B,0xE9B3B9:0x6B5C,0xE9B48B:0x6B5D,0xE9B482:0x6B5E,0xE9B491:0x6B5F,
0xE9B497:0x6B60,0xE9B498:0x6B61,0xE9B49C:0x6B62,0xE9B49D:0x6B63,0xE9B49E:0x6B64,
0xE9B4AF:0x6B65,0xE9B4B0:0x6B66,0xE9B4B2:0x6B67,0xE9B4B3:0x6B68,0xE9B4B4:0x6B69,
0xE9B4BA:0x6B6A,0xE9B4BC:0x6B6B,0xE9B585:0x6B6C,0xE9B4BD:0x6B6D,0xE9B582:0x6B6E,
0xE9B583:0x6B6F,0xE9B587:0x6B70,0xE9B58A:0x6B71,0xE9B593:0x6B72,0xE9B594:0x6B73,
0xE9B59F:0x6B74,0xE9B5A3:0x6B75,0xE9B5A2:0x6B76,0xE9B5A5:0x6B77,0xE9B5A9:0x6B78,
0xE9B5AA:0x6B79,0xE9B5AB:0x6B7A,0xE9B5B0:0x6B7B,0xE9B5B6:0x6B7C,0xE9B5B7:0x6B7D,
0xE9B5BB:0x6B7E,0xE9B5BC:0x6C21,0xE9B5BE:0x6C22,0xE9B683:0x6C23,0xE9B684:0x6C24,
0xE9B686:0x6C25,0xE9B68A:0x6C26,0xE9B68D:0x6C27,0xE9B68E:0x6C28,0xE9B692:0x6C29,
0xE9B693:0x6C2A,0xE9B695:0x6C2B,0xE9B696:0x6C2C,0xE9B697:0x6C2D,0xE9B698:0x6C2E,
0xE9B6A1:0x6C2F,0xE9B6AA:0x6C30,0xE9B6AC:0x6C31,0xE9B6AE:0x6C32,0xE9B6B1:0x6C33,
0xE9B6B5:0x6C34,0xE9B6B9:0x6C35,0xE9B6BC:0x6C36,0xE9B6BF:0x6C37,0xE9B783:0x6C38,
0xE9B787:0x6C39,0xE9B789:0x6C3A,0xE9B78A:0x6C3B,0xE9B794:0x6C3C,0xE9B795:0x6C3D,
0xE9B796:0x6C3E,0xE9B797:0x6C3F,0xE9B79A:0x6C40,0xE9B79E:0x6C41,0xE9B79F:0x6C42,
0xE9B7A0:0x6C43,0xE9B7A5:0x6C44,0xE9B7A7:0x6C45,0xE9B7A9:0x6C46,0xE9B7AB:0x6C47,
0xE9B7AE:0x6C48,0xE9B7B0:0x6C49,0xE9B7B3:0x6C4A,0xE9B7B4:0x6C4B,0xE9B7BE:0x6C4C,
0xE9B88A:0x6C4D,0xE9B882:0x6C4E,0xE9B887:0x6C4F,0xE9B88E:0x6C50,0xE9B890:0x6C51,
0xE9B891:0x6C52,0xE9B892:0x6C53,0xE9B895:0x6C54,0xE9B896:0x6C55,0xE9B899:0x6C56,
0xE9B89C:0x6C57,0xE9B89D:0x6C58,0xE9B9BA:0x6C59,0xE9B9BB:0x6C5A,0xE9B9BC:0x6C5B,
0xE9BA80:0x6C5C,0xE9BA82:0x6C5D,0xE9BA83:0x6C5E,0xE9BA84:0x6C5F,0xE9BA85:0x6C60,
0xE9BA87:0x6C61,0xE9BA8E:0x6C62,0xE9BA8F:0x6C63,0xE9BA96:0x6C64,0xE9BA98:0x6C65,
0xE9BA9B:0x6C66,0xE9BA9E:0x6C67,0xE9BAA4:0x6C68,0xE9BAA8:0x6C69,0xE9BAAC:0x6C6A,
0xE9BAAE:0x6C6B,0xE9BAAF:0x6C6C,0xE9BAB0:0x6C6D,0xE9BAB3:0x6C6E,0xE9BAB4:0x6C6F,
0xE9BAB5:0x6C70,0xE9BB86:0x6C71,0xE9BB88:0x6C72,0xE9BB8B:0x6C73,0xE9BB95:0x6C74,
0xE9BB9F:0x6C75,0xE9BBA4:0x6C76,0xE9BBA7:0x6C77,0xE9BBAC:0x6C78,0xE9BBAD:0x6C79,
0xE9BBAE:0x6C7A,0xE9BBB0:0x6C7B,0xE9BBB1:0x6C7C,0xE9BBB2:0x6C7D,0xE9BBB5:0x6C7E,
0xE9BBB8:0x6D21,0xE9BBBF:0x6D22,0xE9BC82:0x6D23,0xE9BC83:0x6D24,0xE9BC89:0x6D25,
0xE9BC8F:0x6D26,0xE9BC90:0x6D27,0xE9BC91:0x6D28,0xE9BC92:0x6D29,0xE9BC94:0x6D2A,
0xE9BC96:0x6D2B,0xE9BC97:0x6D2C,0xE9BC99:0x6D2D,0xE9BC9A:0x6D2E,0xE9BC9B:0x6D2F,
0xE9BC9F:0x6D30,0xE9BCA2:0x6D31,0xE9BCA6:0x6D32,0xE9BCAA:0x6D33,0xE9BCAB:0x6D34,
0xE9BCAF:0x6D35,0xE9BCB1:0x6D36,0xE9BCB2:0x6D37,0xE9BCB4:0x6D38,0xE9BCB7:0x6D39,
0xE9BCB9:0x6D3A,0xE9BCBA:0x6D3B,0xE9BCBC:0x6D3C,0xE9BCBD:0x6D3D,0xE9BCBF:0x6D3E,
0xE9BD81:0x6D3F,0xE9BD83:0x6D40,0xE9BD84:0x6D41,0xE9BD85:0x6D42,0xE9BD86:0x6D43,
0xE9BD87:0x6D44,0xE9BD93:0x6D45,0xE9BD95:0x6D46,0xE9BD96:0x6D47,0xE9BD97:0x6D48,
0xE9BD98:0x6D49,0xE9BD9A:0x6D4A,0xE9BD9D:0x6D4B,0xE9BD9E:0x6D4C,0xE9BDA8:0x6D4D,
0xE9BDA9:0x6D4E,0xE9BDAD:0x6D4F,0xE9BDAE:0x6D50,0xE9BDAF:0x6D51,0xE9BDB0:0x6D52,
0xE9BDB1:0x6D53,0xE9BDB3:0x6D54,0xE9BDB5:0x6D55,0xE9BDBA:0x6D56,0xE9BDBD:0x6D57,
0xE9BE8F:0x6D58,0xE9BE90:0x6D59,0xE9BE91:0x6D5A,0xE9BE92:0x6D5B,0xE9BE94:0x6D5C,
0xE9BE96:0x6D5D,0xE9BE97:0x6D5E,0xE9BE9E:0x6D5F,0xE9BEA1:0x6D60,0xE9BEA2:0x6D61,
0xE9BEA3:0x6D62,0xE9BEA5:0x6D63,

//FIXME: mojibake
0xE3809C:0x2141
};


/**
 * Encoding conversion table for JIS to UTF-8.
 *
 * @ignore
 */
var JIS_TO_UTF8_TABLE = null;

/**
 * The encoding conversion table for JIS X 0212:1990 (Hojo-Kanji) to UTF-8.
 *
 * @ignore
 */
var JISX0212_TO_UTF8_TABLE = null;

function init_JIS_TO_UTF8_TABLE() {
  if (JIS_TO_UTF8_TABLE === null) {
    JIS_TO_UTF8_TABLE = {};

    var keys = getKeys(UTF8_TO_JIS_TABLE);
    var i = 0;
    var len = keys.length;
    var key, value;

    for (; i < len; i++) {
      key = keys[i];
      value = UTF8_TO_JIS_TABLE[key];
      if (value > 0x5F) {
        JIS_TO_UTF8_TABLE[value] = key | 0;
      }
    }

    JISX0212_TO_UTF8_TABLE = {};
    keys = getKeys(UTF8_TO_JISX0212_TABLE);
    len = keys.length;

    for (i = 0; i < len; i++) {
      key = keys[i];
      value = UTF8_TO_JISX0212_TABLE[key];
      JISX0212_TO_UTF8_TABLE[value] = key | 0;
    }
  }
}

/**
 * Katakana table
 *
 * @ignore
 */
var hankanaCase_table = {
  0x3001:0xFF64,0x3002:0xFF61,0x300C:0xFF62,0x300D:0xFF63,0x309B:0xFF9E,
  0x309C:0xFF9F,0x30A1:0xFF67,0x30A2:0xFF71,0x30A3:0xFF68,0x30A4:0xFF72,
  0x30A5:0xFF69,0x30A6:0xFF73,0x30A7:0xFF6A,0x30A8:0xFF74,0x30A9:0xFF6B,
  0x30AA:0xFF75,0x30AB:0xFF76,0x30AD:0xFF77,0x30AF:0xFF78,0x30B1:0xFF79,
  0x30B3:0xFF7A,0x30B5:0xFF7B,0x30B7:0xFF7C,0x30B9:0xFF7D,0x30BB:0xFF7E,
  0x30BD:0xFF7F,0x30BF:0xFF80,0x30C1:0xFF81,0x30C3:0xFF6F,0x30C4:0xFF82,
  0x30C6:0xFF83,0x30C8:0xFF84,0x30CA:0xFF85,0x30CB:0xFF86,0x30CC:0xFF87,
  0x30CD:0xFF88,0x30CE:0xFF89,0x30CF:0xFF8A,0x30D2:0xFF8B,0x30D5:0xFF8C,
  0x30D8:0xFF8D,0x30DB:0xFF8E,0x30DE:0xFF8F,0x30DF:0xFF90,0x30E0:0xFF91,
  0x30E1:0xFF92,0x30E2:0xFF93,0x30E3:0xFF6C,0x30E4:0xFF94,0x30E5:0xFF6D,
  0x30E6:0xFF95,0x30E7:0xFF6E,0x30E8:0xFF96,0x30E9:0xFF97,0x30EA:0xFF98,
  0x30EB:0xFF99,0x30EC:0xFF9A,0x30ED:0xFF9B,0x30EF:0xFF9C,0x30F2:0xFF66,
  0x30F3:0xFF9D,0x30FB:0xFF65,0x30FC:0xFF70
};

/**
 * @ignore
 */
var hankanaCase_sonants = {
  0x30F4:0xFF73,
  0x30F7:0xFF9C,
  0x30FA:0xFF66
};

/**
 * Sonant marks.
 *
 * @ignore
 */
var hankanaCase_marks = [0xFF9E, 0xFF9F];

/**
 * Zenkaku table [U+FF61] - [U+FF9F]
 *
 * @ignore
 */
var zenkanaCase_table = [
  0x3002, 0x300C, 0x300D, 0x3001, 0x30FB, 0x30F2, 0x30A1, 0x30A3,
  0x30A5, 0x30A7, 0x30A9, 0x30E3, 0x30E5, 0x30E7, 0x30C3, 0x30FC,
  0x30A2, 0x30A4, 0x30A6, 0x30A8, 0x30AA, 0x30AB, 0x30AD, 0x30AF,
  0x30B1, 0x30B3, 0x30B5, 0x30B7, 0x30B9, 0x30BB, 0x30BD, 0x30BF,
  0x30C1, 0x30C4, 0x30C6, 0x30C8, 0x30CA, 0x30CB, 0x30CC, 0x30CD,
  0x30CE, 0x30CF, 0x30D2, 0x30D5, 0x30D8, 0x30DB, 0x30DE, 0x30DF,
  0x30E0, 0x30E1, 0x30E2, 0x30E4, 0x30E6, 0x30E8, 0x30E9, 0x30EA,
  0x30EB, 0x30EC, 0x30ED, 0x30EF, 0x30F3, 0x309B, 0x309C
];

return Encoding;
});

},{}],38:[function(require,module,exports){
(function (global){
'use strict';
var Mutation = global.MutationObserver || global.WebKitMutationObserver;

var scheduleDrain;

{
  if (Mutation) {
    var called = 0;
    var observer = new Mutation(nextTick);
    var element = global.document.createTextNode('');
    observer.observe(element, {
      characterData: true
    });
    scheduleDrain = function () {
      element.data = (called = ++called % 2);
    };
  } else if (!global.setImmediate && typeof global.MessageChannel !== 'undefined') {
    var channel = new global.MessageChannel();
    channel.port1.onmessage = nextTick;
    scheduleDrain = function () {
      channel.port2.postMessage(0);
    };
  } else if ('document' in global && 'onreadystatechange' in global.document.createElement('script')) {
    scheduleDrain = function () {

      // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
      // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
      var scriptEl = global.document.createElement('script');
      scriptEl.onreadystatechange = function () {
        nextTick();

        scriptEl.onreadystatechange = null;
        scriptEl.parentNode.removeChild(scriptEl);
        scriptEl = null;
      };
      global.document.documentElement.appendChild(scriptEl);
    };
  } else {
    scheduleDrain = function () {
      setTimeout(nextTick, 0);
    };
  }
}

var draining;
var queue = [];
//named nextTick for less confusing stack traces
function nextTick() {
  draining = true;
  var i, oldQueue;
  var len = queue.length;
  while (len) {
    oldQueue = queue;
    queue = [];
    i = -1;
    while (++i < len) {
      oldQueue[i]();
    }
    len = queue.length;
  }
  draining = false;
}

module.exports = immediate;
function immediate(task) {
  if (queue.push(task) === 1 && !draining) {
    scheduleDrain();
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],39:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],40:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9}],41:[function(require,module,exports){
'use strict';
var utils = require('./utils');
var support = require('./support');
// private property
var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";


// public method for encoding
exports.encode = function(input) {
    var output = [];
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0, len = input.length, remainingBytes = len;

    var isArray = utils.getTypeOf(input) !== "string";
    while (i < input.length) {
        remainingBytes = len - i;

        if (!isArray) {
            chr1 = input.charCodeAt(i++);
            chr2 = i < len ? input.charCodeAt(i++) : 0;
            chr3 = i < len ? input.charCodeAt(i++) : 0;
        } else {
            chr1 = input[i++];
            chr2 = i < len ? input[i++] : 0;
            chr3 = i < len ? input[i++] : 0;
        }

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = remainingBytes > 1 ? (((chr2 & 15) << 2) | (chr3 >> 6)) : 64;
        enc4 = remainingBytes > 2 ? (chr3 & 63) : 64;

        output.push(_keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4));

    }

    return output.join("");
};

// public method for decoding
exports.decode = function(input) {
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0, resultIndex = 0;

    var dataUrlPrefix = "data:";

    if (input.substr(dataUrlPrefix.length) === dataUrlPrefix) {
        // This is a common error: people give a data url
        // (data:image/png;base64,iVBOR...) with a {base64: true} and
        // wonders why things don't work.
        // We can detect that the string input looks like a data url but we
        // *can't* be sure it is one: removing everything up to the comma would
        // be too dangerous.
        throw new Error("Invalid base64 input, it looks like a data url.");
    }

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    var totalLength = input.length * 3 / 4;
    if(input.charAt(input.length - 1) === _keyStr.charAt(64)) {
        totalLength--;
    }
    if(input.charAt(input.length - 2) === _keyStr.charAt(64)) {
        totalLength--;
    }
    if (totalLength % 1 !== 0) {
        // totalLength is not an integer, the length does not match a valid
        // base64 content. That can happen if:
        // - the input is not a base64 content
        // - the input is *almost* a base64 content, with a extra chars at the
        //   beginning or at the end
        // - the input uses a base64 variant (base64url for example)
        throw new Error("Invalid base64 input, bad content length.");
    }
    var output;
    if (support.uint8array) {
        output = new Uint8Array(totalLength|0);
    } else {
        output = new Array(totalLength|0);
    }

    while (i < input.length) {

        enc1 = _keyStr.indexOf(input.charAt(i++));
        enc2 = _keyStr.indexOf(input.charAt(i++));
        enc3 = _keyStr.indexOf(input.charAt(i++));
        enc4 = _keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output[resultIndex++] = chr1;

        if (enc3 !== 64) {
            output[resultIndex++] = chr2;
        }
        if (enc4 !== 64) {
            output[resultIndex++] = chr3;
        }

    }

    return output;
};

},{"./support":69,"./utils":71}],42:[function(require,module,exports){
'use strict';

var external = require("./external");
var DataWorker = require('./stream/DataWorker');
var DataLengthProbe = require('./stream/DataLengthProbe');
var Crc32Probe = require('./stream/Crc32Probe');
var DataLengthProbe = require('./stream/DataLengthProbe');

/**
 * Represent a compressed object, with everything needed to decompress it.
 * @constructor
 * @param {number} compressedSize the size of the data compressed.
 * @param {number} uncompressedSize the size of the data after decompression.
 * @param {number} crc32 the crc32 of the decompressed file.
 * @param {object} compression the type of compression, see lib/compressions.js.
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the compressed data.
 */
function CompressedObject(compressedSize, uncompressedSize, crc32, compression, data) {
    this.compressedSize = compressedSize;
    this.uncompressedSize = uncompressedSize;
    this.crc32 = crc32;
    this.compression = compression;
    this.compressedContent = data;
}

CompressedObject.prototype = {
    /**
     * Create a worker to get the uncompressed content.
     * @return {GenericWorker} the worker.
     */
    getContentWorker : function () {
        var worker = new DataWorker(external.Promise.resolve(this.compressedContent))
        .pipe(this.compression.uncompressWorker())
        .pipe(new DataLengthProbe("data_length"));

        var that = this;
        worker.on("end", function () {
            if(this.streamInfo['data_length'] !== that.uncompressedSize) {
                throw new Error("Bug : uncompressed data size mismatch");
            }
        });
        return worker;
    },
    /**
     * Create a worker to get the compressed content.
     * @return {GenericWorker} the worker.
     */
    getCompressedWorker : function () {
        return new DataWorker(external.Promise.resolve(this.compressedContent))
        .withStreamInfo("compressedSize", this.compressedSize)
        .withStreamInfo("uncompressedSize", this.uncompressedSize)
        .withStreamInfo("crc32", this.crc32)
        .withStreamInfo("compression", this.compression)
        ;
    }
};

/**
 * Chain the given worker with other workers to compress the content with the
 * given compresion.
 * @param {GenericWorker} uncompressedWorker the worker to pipe.
 * @param {Object} compression the compression object.
 * @param {Object} compressionOptions the options to use when compressing.
 * @return {GenericWorker} the new worker compressing the content.
 */
CompressedObject.createWorkerFrom = function (uncompressedWorker, compression, compressionOptions) {
    return uncompressedWorker
    .pipe(new Crc32Probe())
    .pipe(new DataLengthProbe("uncompressedSize"))
    .pipe(compression.compressWorker(compressionOptions))
    .pipe(new DataLengthProbe("compressedSize"))
    .withStreamInfo("compression", compression);
};

module.exports = CompressedObject;

},{"./external":46,"./stream/Crc32Probe":64,"./stream/DataLengthProbe":65,"./stream/DataWorker":66}],43:[function(require,module,exports){
'use strict';

var GenericWorker = require("./stream/GenericWorker");

exports.STORE = {
    magic: "\x00\x00",
    compressWorker : function (compressionOptions) {
        return new GenericWorker("STORE compression");
    },
    uncompressWorker : function () {
        return new GenericWorker("STORE decompression");
    }
};
exports.DEFLATE = require('./flate');

},{"./flate":47,"./stream/GenericWorker":67}],44:[function(require,module,exports){
'use strict';

var utils = require('./utils');

/**
 * The following functions come from pako, from pako/lib/zlib/crc32.js
 * released under the MIT license, see pako https://github.com/nodeca/pako/
 */

// Use ordinary array, since untyped makes no boost here
function makeTable() {
    var c, table = [];

    for(var n =0; n < 256; n++){
        c = n;
        for(var k =0; k < 8; k++){
            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        table[n] = c;
    }

    return table;
}

// Create table on load. Just 255 signed longs. Not a problem.
var crcTable = makeTable();


function crc32(crc, buf, len, pos) {
    var t = crcTable, end = pos + len;

    crc = crc ^ (-1);

    for (var i = pos; i < end; i++ ) {
        crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
    }

    return (crc ^ (-1)); // >>> 0;
}

// That's all for the pako functions.

/**
 * Compute the crc32 of a string.
 * This is almost the same as the function crc32, but for strings. Using the
 * same function for the two use cases leads to horrible performances.
 * @param {Number} crc the starting value of the crc.
 * @param {String} str the string to use.
 * @param {Number} len the length of the string.
 * @param {Number} pos the starting position for the crc32 computation.
 * @return {Number} the computed crc32.
 */
function crc32str(crc, str, len, pos) {
    var t = crcTable, end = pos + len;

    crc = crc ^ (-1);

    for (var i = pos; i < end; i++ ) {
        crc = (crc >>> 8) ^ t[(crc ^ str.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ (-1)); // >>> 0;
}

module.exports = function crc32wrapper(input, crc) {
    if (typeof input === "undefined" || !input.length) {
        return 0;
    }

    var isArray = utils.getTypeOf(input) !== "string";

    if(isArray) {
        return crc32(crc|0, input, input.length, 0);
    } else {
        return crc32str(crc|0, input, input.length, 0);
    }
};
// vim: set shiftwidth=4 softtabstop=4:

},{"./utils":71}],45:[function(require,module,exports){
'use strict';
exports.base64 = false;
exports.binary = false;
exports.dir = false;
exports.createFolders = true;
exports.date = null;
exports.compression = null;
exports.compressionOptions = null;
exports.comment = null;
exports.unixPermissions = null;
exports.dosPermissions = null;

},{}],46:[function(require,module,exports){
(function (global){
'use strict';

// load the global object first:
// - it should be better integrated in the system (unhandledRejection in node)
// - the environment may have a custom Promise implementation (see zone.js)
var ES6Promise = global.Promise || require("lie");

/**
 * Let the user use/change some implementations.
 */
module.exports = {
    Promise: ES6Promise
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"lie":75}],47:[function(require,module,exports){
'use strict';
var USE_TYPEDARRAY = (typeof Uint8Array !== 'undefined') && (typeof Uint16Array !== 'undefined') && (typeof Uint32Array !== 'undefined');

var pako = require("pako");
var utils = require("./utils");
var GenericWorker = require("./stream/GenericWorker");

var ARRAY_TYPE = USE_TYPEDARRAY ? "uint8array" : "array";

exports.magic = "\x08\x00";

/**
 * Create a worker that uses pako to inflate/deflate.
 * @constructor
 * @param {String} action the name of the pako function to call : either "Deflate" or "Inflate".
 * @param {Object} options the options to use when (de)compressing.
 */
function FlateWorker(action, options) {
    GenericWorker.call(this, "FlateWorker/" + action);

    this._pako = new pako[action]({
        raw:true,
        level : options.level || -1 // default compression
    });
    // the `meta` object from the last chunk received
    // this allow this worker to pass around metadata
    this.meta = {};

    var self = this;
    this._pako.onData = function(data) {
        self.push({
            data : data,
            meta : self.meta
        });
    };
}

utils.inherits(FlateWorker, GenericWorker);

/**
 * @see GenericWorker.processChunk
 */
FlateWorker.prototype.processChunk = function (chunk) {
    this.meta = chunk.meta;
    this._pako.push(utils.transformTo(ARRAY_TYPE, chunk.data), false);
};

/**
 * @see GenericWorker.flush
 */
FlateWorker.prototype.flush = function () {
    GenericWorker.prototype.flush.call(this);
    this._pako.push([], true);
};
/**
 * @see GenericWorker.cleanUp
 */
FlateWorker.prototype.cleanUp = function () {
    GenericWorker.prototype.cleanUp.call(this);
    this._pako = null;
};

exports.compressWorker = function (compressionOptions) {
    return new FlateWorker("Deflate", compressionOptions);
};
exports.uncompressWorker = function () {
    return new FlateWorker("Inflate", {});
};

},{"./stream/GenericWorker":67,"./utils":71,"pako":76}],48:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var GenericWorker = require('../stream/GenericWorker');
var utf8 = require('../utf8');
var crc32 = require('../crc32');
var signature = require('../signature');

/**
 * Transform an integer into a string in hexadecimal.
 * @private
 * @param {number} dec the number to convert.
 * @param {number} bytes the number of bytes to generate.
 * @returns {string} the result.
 */
var decToHex = function(dec, bytes) {
    var hex = "", i;
    for (i = 0; i < bytes; i++) {
        hex += String.fromCharCode(dec & 0xff);
        dec = dec >>> 8;
    }
    return hex;
};

/**
 * Generate the UNIX part of the external file attributes.
 * @param {Object} unixPermissions the unix permissions or null.
 * @param {Boolean} isDir true if the entry is a directory, false otherwise.
 * @return {Number} a 32 bit integer.
 *
 * adapted from http://unix.stackexchange.com/questions/14705/the-zip-formats-external-file-attribute :
 *
 * TTTTsstrwxrwxrwx0000000000ADVSHR
 * ^^^^____________________________ file type, see zipinfo.c (UNX_*)
 *     ^^^_________________________ setuid, setgid, sticky
 *        ^^^^^^^^^________________ permissions
 *                 ^^^^^^^^^^______ not used ?
 *                           ^^^^^^ DOS attribute bits : Archive, Directory, Volume label, System file, Hidden, Read only
 */
var generateUnixExternalFileAttr = function (unixPermissions, isDir) {

    var result = unixPermissions;
    if (!unixPermissions) {
        // I can't use octal values in strict mode, hence the hexa.
        //  040775 => 0x41fd
        // 0100664 => 0x81b4
        result = isDir ? 0x41fd : 0x81b4;
    }
    return (result & 0xFFFF) << 16;
};

/**
 * Generate the DOS part of the external file attributes.
 * @param {Object} dosPermissions the dos permissions or null.
 * @param {Boolean} isDir true if the entry is a directory, false otherwise.
 * @return {Number} a 32 bit integer.
 *
 * Bit 0     Read-Only
 * Bit 1     Hidden
 * Bit 2     System
 * Bit 3     Volume Label
 * Bit 4     Directory
 * Bit 5     Archive
 */
var generateDosExternalFileAttr = function (dosPermissions, isDir) {

    // the dir flag is already set for compatibility
    return (dosPermissions || 0)  & 0x3F;
};

/**
 * Generate the various parts used in the construction of the final zip file.
 * @param {Object} streamInfo the hash with informations about the compressed file.
 * @param {Boolean} streamedContent is the content streamed ?
 * @param {Boolean} streamingEnded is the stream finished ?
 * @param {number} offset the current offset from the start of the zip file.
 * @param {String} platform let's pretend we are this platform (change platform dependents fields)
 * @param {Function} encodeFileName the function to encode the file name / comment.
 * @return {Object} the zip parts.
 */
var generateZipParts = function(streamInfo, streamedContent, streamingEnded, offset, platform, encodeFileName) {
    var file = streamInfo['file'],
    compression = streamInfo['compression'],
    useCustomEncoding = encodeFileName !== utf8.utf8encode,
    encodedFileName = utils.transformTo("string", encodeFileName(file.name)),
    utfEncodedFileName = utils.transformTo("string", utf8.utf8encode(file.name)),
    comment = file.comment,
    encodedComment = utils.transformTo("string", encodeFileName(comment)),
    utfEncodedComment = utils.transformTo("string", utf8.utf8encode(comment)),
    useUTF8ForFileName = utfEncodedFileName.length !== file.name.length,
    useUTF8ForComment = utfEncodedComment.length !== comment.length,
    dosTime,
    dosDate,
    extraFields = "",
    unicodePathExtraField = "",
    unicodeCommentExtraField = "",
    dir = file.dir,
    date = file.date;


    var dataInfo = {
        crc32 : 0,
        compressedSize : 0,
        uncompressedSize : 0
    };

    // if the content is streamed, the sizes/crc32 are only available AFTER
    // the end of the stream.
    if (!streamedContent || streamingEnded) {
        dataInfo.crc32 = streamInfo['crc32'];
        dataInfo.compressedSize = streamInfo['compressedSize'];
        dataInfo.uncompressedSize = streamInfo['uncompressedSize'];
    }

    var bitflag = 0;
    if (streamedContent) {
        bitflag |= 0x0008;
    }
    if (!useCustomEncoding && (useUTF8ForFileName || useUTF8ForComment)) {
        bitflag |= 0x0800;
    }


    var extFileAttr = 0;
    var versionMadeBy = 0;
    if (dir) {
        // dos or unix, we set the dos dir flag
        extFileAttr |= 0x00010;
    }
    if(platform === "UNIX") {
        versionMadeBy = 0x031E; // UNIX, version 3.0
        extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir);
    } else { // DOS or other, fallback to DOS
        versionMadeBy = 0x0014; // DOS, version 2.0
        extFileAttr |= generateDosExternalFileAttr(file.dosPermissions, dir);
    }

    // date
    // @see http://www.delorie.com/djgpp/doc/rbinter/it/52/13.html
    // @see http://www.delorie.com/djgpp/doc/rbinter/it/65/16.html
    // @see http://www.delorie.com/djgpp/doc/rbinter/it/66/16.html

    dosTime = date.getUTCHours();
    dosTime = dosTime << 6;
    dosTime = dosTime | date.getUTCMinutes();
    dosTime = dosTime << 5;
    dosTime = dosTime | date.getUTCSeconds() / 2;

    dosDate = date.getUTCFullYear() - 1980;
    dosDate = dosDate << 4;
    dosDate = dosDate | (date.getUTCMonth() + 1);
    dosDate = dosDate << 5;
    dosDate = dosDate | date.getUTCDate();

    if (useUTF8ForFileName) {
        // set the unicode path extra field. unzip needs at least one extra
        // field to correctly handle unicode path, so using the path is as good
        // as any other information. This could improve the situation with
        // other archive managers too.
        // This field is usually used without the utf8 flag, with a non
        // unicode path in the header (winrar, winzip). This helps (a bit)
        // with the messy Windows' default compressed folders feature but
        // breaks on p7zip which doesn't seek the unicode path extra field.
        // So for now, UTF-8 everywhere !
        unicodePathExtraField =
            // Version
            decToHex(1, 1) +
            // NameCRC32
            decToHex(crc32(encodedFileName), 4) +
            // UnicodeName
            utfEncodedFileName;

        extraFields +=
            // Info-ZIP Unicode Path Extra Field
            "\x75\x70" +
            // size
            decToHex(unicodePathExtraField.length, 2) +
            // content
            unicodePathExtraField;
    }

    if(useUTF8ForComment) {

        unicodeCommentExtraField =
            // Version
            decToHex(1, 1) +
            // CommentCRC32
            decToHex(crc32(encodedComment), 4) +
            // UnicodeName
            utfEncodedComment;

        extraFields +=
            // Info-ZIP Unicode Path Extra Field
            "\x75\x63" +
            // size
            decToHex(unicodeCommentExtraField.length, 2) +
            // content
            unicodeCommentExtraField;
    }

    var header = "";

    // version needed to extract
    header += "\x0A\x00";
    // general purpose bit flag
    // set bit 11 if utf8
    header += decToHex(bitflag, 2);
    // compression method
    header += compression.magic;
    // last mod file time
    header += decToHex(dosTime, 2);
    // last mod file date
    header += decToHex(dosDate, 2);
    // crc-32
    header += decToHex(dataInfo.crc32, 4);
    // compressed size
    header += decToHex(dataInfo.compressedSize, 4);
    // uncompressed size
    header += decToHex(dataInfo.uncompressedSize, 4);
    // file name length
    header += decToHex(encodedFileName.length, 2);
    // extra field length
    header += decToHex(extraFields.length, 2);


    var fileRecord = signature.LOCAL_FILE_HEADER + header + encodedFileName + extraFields;

    var dirRecord = signature.CENTRAL_FILE_HEADER +
        // version made by (00: DOS)
        decToHex(versionMadeBy, 2) +
        // file header (common to file and central directory)
        header +
        // file comment length
        decToHex(encodedComment.length, 2) +
        // disk number start
        "\x00\x00" +
        // internal file attributes TODO
        "\x00\x00" +
        // external file attributes
        decToHex(extFileAttr, 4) +
        // relative offset of local header
        decToHex(offset, 4) +
        // file name
        encodedFileName +
        // extra field
        extraFields +
        // file comment
        encodedComment;

    return {
        fileRecord: fileRecord,
        dirRecord: dirRecord
    };
};

/**
 * Generate the EOCD record.
 * @param {Number} entriesCount the number of entries in the zip file.
 * @param {Number} centralDirLength the length (in bytes) of the central dir.
 * @param {Number} localDirLength the length (in bytes) of the local dir.
 * @param {String} comment the zip file comment as a binary string.
 * @param {Function} encodeFileName the function to encode the comment.
 * @return {String} the EOCD record.
 */
var generateCentralDirectoryEnd = function (entriesCount, centralDirLength, localDirLength, comment, encodeFileName) {
    var dirEnd = "";
    var encodedComment = utils.transformTo("string", encodeFileName(comment));

    // end of central dir signature
    dirEnd = signature.CENTRAL_DIRECTORY_END +
        // number of this disk
        "\x00\x00" +
        // number of the disk with the start of the central directory
        "\x00\x00" +
        // total number of entries in the central directory on this disk
        decToHex(entriesCount, 2) +
        // total number of entries in the central directory
        decToHex(entriesCount, 2) +
        // size of the central directory   4 bytes
        decToHex(centralDirLength, 4) +
        // offset of start of central directory with respect to the starting disk number
        decToHex(localDirLength, 4) +
        // .ZIP file comment length
        decToHex(encodedComment.length, 2) +
        // .ZIP file comment
        encodedComment;

    return dirEnd;
};

/**
 * Generate data descriptors for a file entry.
 * @param {Object} streamInfo the hash generated by a worker, containing informations
 * on the file entry.
 * @return {String} the data descriptors.
 */
var generateDataDescriptors = function (streamInfo) {
    var descriptor = "";
    descriptor = signature.DATA_DESCRIPTOR +
        // crc-32                          4 bytes
        decToHex(streamInfo['crc32'], 4) +
        // compressed size                 4 bytes
        decToHex(streamInfo['compressedSize'], 4) +
        // uncompressed size               4 bytes
        decToHex(streamInfo['uncompressedSize'], 4);

    return descriptor;
};


/**
 * A worker to concatenate other workers to create a zip file.
 * @param {Boolean} streamFiles `true` to stream the content of the files,
 * `false` to accumulate it.
 * @param {String} comment the comment to use.
 * @param {String} platform the platform to use, "UNIX" or "DOS".
 * @param {Function} encodeFileName the function to encode file names and comments.
 */
function ZipFileWorker(streamFiles, comment, platform, encodeFileName) {
    GenericWorker.call(this, "ZipFileWorker");
    // The number of bytes written so far. This doesn't count accumulated chunks.
    this.bytesWritten = 0;
    // The comment of the zip file
    this.zipComment = comment;
    // The platform "generating" the zip file.
    this.zipPlatform = platform;
    // the function to encode file names and comments.
    this.encodeFileName = encodeFileName;
    // Should we stream the content of the files ?
    this.streamFiles = streamFiles;
    // If `streamFiles` is false, we will need to accumulate the content of the
    // files to calculate sizes / crc32 (and write them *before* the content).
    // This boolean indicates if we are accumulating chunks (it will change a lot
    // during the lifetime of this worker).
    this.accumulate = false;
    // The buffer receiving chunks when accumulating content.
    this.contentBuffer = [];
    // The list of generated directory records.
    this.dirRecords = [];
    // The offset (in bytes) from the beginning of the zip file for the current source.
    this.currentSourceOffset = 0;
    // The total number of entries in this zip file.
    this.entriesCount = 0;
    // the name of the file currently being added, null when handling the end of the zip file.
    // Used for the emited metadata.
    this.currentFile = null;



    this._sources = [];
}
utils.inherits(ZipFileWorker, GenericWorker);

/**
 * @see GenericWorker.push
 */
ZipFileWorker.prototype.push = function (chunk) {

    var currentFilePercent = chunk.meta.percent || 0;
    var entriesCount = this.entriesCount;
    var remainingFiles = this._sources.length;

    if(this.accumulate) {
        this.contentBuffer.push(chunk);
    } else {
        this.bytesWritten += chunk.data.length;

        GenericWorker.prototype.push.call(this, {
            data : chunk.data,
            meta : {
                currentFile : this.currentFile,
                percent : entriesCount ? (currentFilePercent + 100 * (entriesCount - remainingFiles - 1)) / entriesCount : 100
            }
        });
    }
};

/**
 * The worker started a new source (an other worker).
 * @param {Object} streamInfo the streamInfo object from the new source.
 */
ZipFileWorker.prototype.openedSource = function (streamInfo) {
    this.currentSourceOffset = this.bytesWritten;
    this.currentFile = streamInfo['file'].name;

    // don't stream folders (because they don't have any content)
    if(this.streamFiles && !streamInfo['file'].dir) {
        var record = generateZipParts(streamInfo, this.streamFiles, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
        this.push({
            data : record.fileRecord,
            meta : {percent:0}
        });
    } else {
        // we need to wait for the whole file before pushing anything
        this.accumulate = true;
    }
};

/**
 * The worker finished a source (an other worker).
 * @param {Object} streamInfo the streamInfo object from the finished source.
 */
ZipFileWorker.prototype.closedSource = function (streamInfo) {
    this.accumulate = false;
    var record = generateZipParts(streamInfo, this.streamFiles, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);

    this.dirRecords.push(record.dirRecord);
    if(this.streamFiles && !streamInfo['file'].dir) {
        // after the streamed file, we put data descriptors
        this.push({
            data : generateDataDescriptors(streamInfo),
            meta : {percent:100}
        });
    } else {
        // the content wasn't streamed, we need to push everything now
        // first the file record, then the content
        this.push({
            data : record.fileRecord,
            meta : {percent:0}
        });
        while(this.contentBuffer.length) {
            this.push(this.contentBuffer.shift());
        }
    }
    this.currentFile = null;
};

/**
 * @see GenericWorker.flush
 */
ZipFileWorker.prototype.flush = function () {

    var localDirLength = this.bytesWritten;
    for(var i = 0; i < this.dirRecords.length; i++) {
        this.push({
            data : this.dirRecords[i],
            meta : {percent:100}
        });
    }
    var centralDirLength = this.bytesWritten - localDirLength;

    var dirEnd = generateCentralDirectoryEnd(this.dirRecords.length, centralDirLength, localDirLength, this.zipComment, this.encodeFileName);

    this.push({
        data : dirEnd,
        meta : {percent:100}
    });
};

/**
 * Prepare the next source to be read.
 */
ZipFileWorker.prototype.prepareNextSource = function () {
    this.previous = this._sources.shift();
    this.openedSource(this.previous.streamInfo);
    if (this.isPaused) {
        this.previous.pause();
    } else {
        this.previous.resume();
    }
};

/**
 * @see GenericWorker.registerPrevious
 */
ZipFileWorker.prototype.registerPrevious = function (previous) {
    this._sources.push(previous);
    var self = this;

    previous.on('data', function (chunk) {
        self.processChunk(chunk);
    });
    previous.on('end', function () {
        self.closedSource(self.previous.streamInfo);
        if(self._sources.length) {
            self.prepareNextSource();
        } else {
            self.end();
        }
    });
    previous.on('error', function (e) {
        self.error(e);
    });
    return this;
};

/**
 * @see GenericWorker.resume
 */
ZipFileWorker.prototype.resume = function () {
    if(!GenericWorker.prototype.resume.call(this)) {
        return false;
    }

    if (!this.previous && this._sources.length) {
        this.prepareNextSource();
        return true;
    }
    if (!this.previous && !this._sources.length && !this.generatedError) {
        this.end();
        return true;
    }
};

/**
 * @see GenericWorker.error
 */
ZipFileWorker.prototype.error = function (e) {
    var sources = this._sources;
    if(!GenericWorker.prototype.error.call(this, e)) {
        return false;
    }
    for(var i = 0; i < sources.length; i++) {
        try {
            sources[i].error(e);
        } catch(e) {
            // the `error` exploded, nothing to do
        }
    }
    return true;
};

/**
 * @see GenericWorker.lock
 */
ZipFileWorker.prototype.lock = function () {
    GenericWorker.prototype.lock.call(this);
    var sources = this._sources;
    for(var i = 0; i < sources.length; i++) {
        sources[i].lock();
    }
};

module.exports = ZipFileWorker;

},{"../crc32":44,"../signature":62,"../stream/GenericWorker":67,"../utf8":70,"../utils":71}],49:[function(require,module,exports){
'use strict';

var compressions = require('../compressions');
var ZipFileWorker = require('./ZipFileWorker');

/**
 * Find the compression to use.
 * @param {String} fileCompression the compression defined at the file level, if any.
 * @param {String} zipCompression the compression defined at the load() level.
 * @return {Object} the compression object to use.
 */
var getCompression = function (fileCompression, zipCompression) {

    var compressionName = fileCompression || zipCompression;
    var compression = compressions[compressionName];
    if (!compression) {
        throw new Error(compressionName + " is not a valid compression method !");
    }
    return compression;
};

/**
 * Create a worker to generate a zip file.
 * @param {JSZip} zip the JSZip instance at the right root level.
 * @param {Object} options to generate the zip file.
 * @param {String} comment the comment to use.
 */
exports.generateWorker = function (zip, options, comment) {

    var zipFileWorker = new ZipFileWorker(options.streamFiles, comment, options.platform, options.encodeFileName);
    var entriesCount = 0;
    try {

        zip.forEach(function (relativePath, file) {
            entriesCount++;
            var compression = getCompression(file.options.compression, options.compression);
            var compressionOptions = file.options.compressionOptions || options.compressionOptions || {};
            var dir = file.dir, date = file.date;

            file._compressWorker(compression, compressionOptions)
            .withStreamInfo("file", {
                name : relativePath,
                dir : dir,
                date : date,
                comment : file.comment || "",
                unixPermissions : file.unixPermissions,
                dosPermissions : file.dosPermissions
            })
            .pipe(zipFileWorker);
        });
        zipFileWorker.entriesCount = entriesCount;
    } catch (e) {
        zipFileWorker.error(e);
    }

    return zipFileWorker;
};

},{"../compressions":43,"./ZipFileWorker":48}],50:[function(require,module,exports){
'use strict';

/**
 * Representation a of zip file in js
 * @constructor
 */
function JSZip() {
    // if this constructor is used without `new`, it adds `new` before itself:
    if(!(this instanceof JSZip)) {
        return new JSZip();
    }

    if(arguments.length) {
        throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
    }

    // object containing the files :
    // {
    //   "folder/" : {...},
    //   "folder/data.txt" : {...}
    // }
    this.files = {};

    this.comment = null;

    // Where we are in the hierarchy
    this.root = "";
    this.clone = function() {
        var newObj = new JSZip();
        for (var i in this) {
            if (typeof this[i] !== "function") {
                newObj[i] = this[i];
            }
        }
        return newObj;
    };
}
JSZip.prototype = require('./object');
JSZip.prototype.loadAsync = require('./load');
JSZip.support = require('./support');
JSZip.defaults = require('./defaults');

// TODO find a better way to handle this version,
// a require('package.json').version doesn't work with webpack, see #327
JSZip.version = "3.1.1";

JSZip.loadAsync = function (content, options) {
    return new JSZip().loadAsync(content, options);
};

JSZip.external = require("./external");
module.exports = JSZip;

},{"./defaults":45,"./external":46,"./load":51,"./object":55,"./support":69}],51:[function(require,module,exports){
'use strict';
var utils = require('./utils');
var external = require("./external");
var utf8 = require('./utf8');
var utils = require('./utils');
var ZipEntries = require('./zipEntries');
var Crc32Probe = require('./stream/Crc32Probe');
var nodejsUtils = require("./nodejsUtils");

/**
 * Check the CRC32 of an entry.
 * @param {ZipEntry} zipEntry the zip entry to check.
 * @return {Promise} the result.
 */
function checkEntryCRC32(zipEntry) {
    return new external.Promise(function (resolve, reject) {
        var worker = zipEntry.decompressed.getContentWorker().pipe(new Crc32Probe());
        worker.on("error", function (e) {
            reject(e);
        })
        .on("end", function () {
            if (worker.streamInfo.crc32 !== zipEntry.decompressed.crc32) {
                reject(new Error("Corrupted zip : CRC32 mismatch"));
            } else {
                resolve();
            }
        })
        .resume();
    });
}

module.exports = function(data, options) {
    var zip = this;
    options = utils.extend(options || {}, {
        base64: false,
        checkCRC32: false,
        optimizedBinaryString: false,
        createFolders: false,
        decodeFileName: utf8.utf8decode
    });

    if (nodejsUtils.isNode && nodejsUtils.isStream(data)) {
        return external.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file."));
    }

    return utils.prepareContent("the loaded zip file", data, true, options.optimizedBinaryString, options.base64)
    .then(function(data) {
        var zipEntries = new ZipEntries(options);
        zipEntries.load(data);
        return zipEntries;
    }).then(function checkCRC32(zipEntries) {
        var promises = [external.Promise.resolve(zipEntries)];
        var files = zipEntries.files;
        if (options.checkCRC32) {
            for (var i = 0; i < files.length; i++) {
                promises.push(checkEntryCRC32(files[i]));
            }
        }
        return external.Promise.all(promises);
    }).then(function addFiles(results) {
        var zipEntries = results.shift();
        var files = zipEntries.files;
        for (var i = 0; i < files.length; i++) {
            var input = files[i];
            zip.file(input.fileNameStr, input.decompressed, {
                binary: true,
                optimizedBinaryString: true,
                date: input.date,
                dir: input.dir,
                comment : input.fileCommentStr.length ? input.fileCommentStr : null,
                unixPermissions : input.unixPermissions,
                dosPermissions : input.dosPermissions,
                createFolders: options.createFolders
            });
        }
        if (zipEntries.zipComment.length) {
            zip.comment = zipEntries.zipComment;
        }

        return zip;
    });
};

},{"./external":46,"./nodejsUtils":54,"./stream/Crc32Probe":64,"./utf8":70,"./utils":71,"./zipEntries":72}],52:[function(require,module,exports){
"use strict";

var utils = require('../utils');
var GenericWorker = require('../stream/GenericWorker');

/**
 * A worker that use a nodejs stream as source.
 * @constructor
 * @param {String} filename the name of the file entry for this stream.
 * @param {Readable} stream the nodejs stream.
 */
function NodejsStreamInputAdapter(filename, stream) {
    GenericWorker.call(this, "Nodejs stream input adapter for " + filename);
    this._upstreamEnded = false;
    this._bindStream(stream);
}

utils.inherits(NodejsStreamInputAdapter, GenericWorker);

/**
 * Prepare the stream and bind the callbacks on it.
 * Do this ASAP on node 0.10 ! A lazy binding doesn't always work.
 * @param {Stream} stream the nodejs stream to use.
 */
NodejsStreamInputAdapter.prototype._bindStream = function (stream) {
    var self = this;
    this._stream = stream;
    stream.pause();
    stream
    .on("data", function (chunk) {
        self.push({
            data: chunk,
            meta : {
                percent : 0
            }
        });
    })
    .on("error", function (e) {
        if(self.isPaused) {
            this.generatedError = e;
        } else {
            self.error(e);
        }
    })
    .on("end", function () {
        if(self.isPaused) {
            self._upstreamEnded = true;
        } else {
            self.end();
        }
    });
};
NodejsStreamInputAdapter.prototype.pause = function () {
    if(!GenericWorker.prototype.pause.call(this)) {
        return false;
    }
    this._stream.pause();
    return true;
};
NodejsStreamInputAdapter.prototype.resume = function () {
    if(!GenericWorker.prototype.resume.call(this)) {
        return false;
    }

    if(this._upstreamEnded) {
        this.end();
    } else {
        this._stream.resume();
    }

    return true;
};

module.exports = NodejsStreamInputAdapter;

},{"../stream/GenericWorker":67,"../utils":71}],53:[function(require,module,exports){
'use strict';

var Readable = require('readable-stream').Readable;

var util = require('util');
util.inherits(NodejsStreamOutputAdapter, Readable);

/**
* A nodejs stream using a worker as source.
* @see the SourceWrapper in http://nodejs.org/api/stream.html
* @constructor
* @param {StreamHelper} helper the helper wrapping the worker
* @param {Object} options the nodejs stream options
* @param {Function} updateCb the update callback.
*/
function NodejsStreamOutputAdapter(helper, options, updateCb) {
    Readable.call(this, options);
    this._helper = helper;

    var self = this;
    helper.on("data", function (data, meta) {
        if (!self.push(data)) {
            self._helper.pause();
        }
        if(updateCb) {
            updateCb(meta);
        }
    })
    .on("error", function(e) {
        self.emit('error', e);
    })
    .on("end", function () {
        self.push(null);
    });
}


NodejsStreamOutputAdapter.prototype._read = function() {
    this._helper.resume();
};

module.exports = NodejsStreamOutputAdapter;

},{"readable-stream":98,"util":12}],54:[function(require,module,exports){
(function (Buffer){
'use strict';

module.exports = {
    /**
     * True if this is running in Nodejs, will be undefined in a browser.
     * In a browser, browserify won't include this file and the whole module
     * will be resolved an empty object.
     */
    isNode : typeof Buffer !== "undefined",
    /**
     * Create a new nodejs Buffer.
     * @param {Object} data the data to pass to the constructor.
     * @param {String} encoding the encoding to use.
     * @return {Buffer} a new Buffer.
     */
    newBuffer : function(data, encoding){
        return new Buffer(data, encoding);
    },
    /**
     * Find out if an object is a Buffer.
     * @param {Object} b the object to test.
     * @return {Boolean} true if the object is a Buffer, false otherwise.
     */
    isBuffer : function(b){
        return Buffer.isBuffer(b);
    },

    isStream : function (obj) {
        return obj &&
            typeof obj.on === "function" &&
            typeof obj.pause === "function" &&
            typeof obj.resume === "function";
    }
};

}).call(this,require("buffer").Buffer)
},{"buffer":4}],55:[function(require,module,exports){
'use strict';
var utf8 = require('./utf8');
var utils = require('./utils');
var GenericWorker = require('./stream/GenericWorker');
var StreamHelper = require('./stream/StreamHelper');
var defaults = require('./defaults');
var CompressedObject = require('./compressedObject');
var ZipObject = require('./zipObject');
var generate = require("./generate");
var nodejsUtils = require("./nodejsUtils");
var NodejsStreamInputAdapter = require("./nodejs/NodejsStreamInputAdapter");


/**
 * Add a file in the current folder.
 * @private
 * @param {string} name the name of the file
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data of the file
 * @param {Object} o the options of the file
 * @return {Object} the new file.
 */
var fileAdd = function(name, data, o) {
    // be sure sub folders exist
    var dataType = utils.getTypeOf(data),
        parent;


    /*
     * Correct options.
     */

    o = utils.extend(o || {}, defaults);
    o.date = o.date || new Date();
    if (o.compression !== null) {
        o.compression = o.compression.toUpperCase();
    }

    if (typeof o.unixPermissions === "string") {
        o.unixPermissions = parseInt(o.unixPermissions, 8);
    }

    // UNX_IFDIR  0040000 see zipinfo.c
    if (o.unixPermissions && (o.unixPermissions & 0x4000)) {
        o.dir = true;
    }
    // Bit 4    Directory
    if (o.dosPermissions && (o.dosPermissions & 0x0010)) {
        o.dir = true;
    }

    if (o.dir) {
        name = forceTrailingSlash(name);
    }
    if (o.createFolders && (parent = parentFolder(name))) {
        folderAdd.call(this, parent, true);
    }

    var isUnicodeString = dataType === "string" && o.binary === false && o.base64 === false;
    o.binary = !isUnicodeString;


    var isCompressedEmpty = (data instanceof CompressedObject) && data.uncompressedSize === 0;

    if (isCompressedEmpty || o.dir || !data || data.length === 0) {
        o.base64 = false;
        o.binary = true;
        data = "";
        o.compression = "STORE";
        dataType = "string";
    }

    /*
     * Convert content to fit.
     */

    var zipObjectContent = null;
    if (data instanceof CompressedObject || data instanceof GenericWorker) {
        zipObjectContent = data;
    } else if (nodejsUtils.isNode && nodejsUtils.isStream(data)) {
        zipObjectContent = new NodejsStreamInputAdapter(name, data);
    } else {
        zipObjectContent = utils.prepareContent(name, data, o.binary, o.optimizedBinaryString, o.base64);
    }

    var object = new ZipObject(name, zipObjectContent, o);
    this.files[name] = object;
    /*
    TODO: we can't throw an exception because we have async promises
    (we can have a promise of a Date() for example) but returning a
    promise is useless because file(name, data) returns the JSZip
    object for chaining. Should we break that to allow the user
    to catch the error ?

    return external.Promise.resolve(zipObjectContent)
    .then(function () {
        return object;
    });
    */
};

/**
 * Find the parent folder of the path.
 * @private
 * @param {string} path the path to use
 * @return {string} the parent folder, or ""
 */
var parentFolder = function (path) {
    if (path.slice(-1) === '/') {
        path = path.substring(0, path.length - 1);
    }
    var lastSlash = path.lastIndexOf('/');
    return (lastSlash > 0) ? path.substring(0, lastSlash) : "";
};

/**
 * Returns the path with a slash at the end.
 * @private
 * @param {String} path the path to check.
 * @return {String} the path with a trailing slash.
 */
var forceTrailingSlash = function(path) {
    // Check the name ends with a /
    if (path.slice(-1) !== "/") {
        path += "/"; // IE doesn't like substr(-1)
    }
    return path;
};

/**
 * Add a (sub) folder in the current folder.
 * @private
 * @param {string} name the folder's name
 * @param {boolean=} [createFolders] If true, automatically create sub
 *  folders. Defaults to false.
 * @return {Object} the new folder.
 */
var folderAdd = function(name, createFolders) {
    createFolders = (typeof createFolders !== 'undefined') ? createFolders : defaults.createFolders;

    name = forceTrailingSlash(name);

    // Does this folder already exist?
    if (!this.files[name]) {
        fileAdd.call(this, name, null, {
            dir: true,
            createFolders: createFolders
        });
    }
    return this.files[name];
};

/**
* Cross-window, cross-Node-context regular expression detection
* @param  {Object}  object Anything
* @return {Boolean}        true if the object is a regular expression,
* false otherwise
*/
function isRegExp(object) {
    return Object.prototype.toString.call(object) === "[object RegExp]";
}

// return the actual prototype of JSZip
var out = {
    /**
     * @see loadAsync
     */
    load: function() {
        throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
    },


    /**
     * Call a callback function for each entry at this folder level.
     * @param {Function} cb the callback function:
     * function (relativePath, file) {...}
     * It takes 2 arguments : the relative path and the file.
     */
    forEach: function(cb) {
        var filename, relativePath, file;
        for (filename in this.files) {
            if (!this.files.hasOwnProperty(filename)) {
                continue;
            }
            file = this.files[filename];
            relativePath = filename.slice(this.root.length, filename.length);
            if (relativePath && filename.slice(0, this.root.length) === this.root) { // the file is in the current root
                cb(relativePath, file); // TODO reverse the parameters ? need to be clean AND consistent with the filter search fn...
            }
        }
    },

    /**
     * Filter nested files/folders with the specified function.
     * @param {Function} search the predicate to use :
     * function (relativePath, file) {...}
     * It takes 2 arguments : the relative path and the file.
     * @return {Array} An array of matching elements.
     */
    filter: function(search) {
        var result = [];
        this.forEach(function (relativePath, entry) {
            if (search(relativePath, entry)) { // the file matches the function
                result.push(entry);
            }

        });
        return result;
    },

    /**
     * Add a file to the zip file, or search a file.
     * @param   {string|RegExp} name The name of the file to add (if data is defined),
     * the name of the file to find (if no data) or a regex to match files.
     * @param   {String|ArrayBuffer|Uint8Array|Buffer} data  The file data, either raw or base64 encoded
     * @param   {Object} o     File options
     * @return  {JSZip|Object|Array} this JSZip object (when adding a file),
     * a file (when searching by string) or an array of files (when searching by regex).
     */
    file: function(name, data, o) {
        if (arguments.length === 1) {
            if (isRegExp(name)) {
                var regexp = name;
                return this.filter(function(relativePath, file) {
                    return !file.dir && regexp.test(relativePath);
                });
            }
            else { // text
                var obj = this.files[this.root + name];
                if (obj && !obj.dir) {
                    return obj;
                } else {
                    return null;
                }
            }
        }
        else { // more than one argument : we have data !
            name = this.root + name;
            fileAdd.call(this, name, data, o);
        }
        return this;
    },

    /**
     * Add a directory to the zip file, or search.
     * @param   {String|RegExp} arg The name of the directory to add, or a regex to search folders.
     * @return  {JSZip} an object with the new directory as the root, or an array containing matching folders.
     */
    folder: function(arg) {
        if (!arg) {
            return this;
        }

        if (isRegExp(arg)) {
            return this.filter(function(relativePath, file) {
                return file.dir && arg.test(relativePath);
            });
        }

        // else, name is a new folder
        var name = this.root + arg;
        var newFolder = folderAdd.call(this, name);

        // Allow chaining by returning a new object with this folder as the root
        var ret = this.clone();
        ret.root = newFolder.name;
        return ret;
    },

    /**
     * Delete a file, or a directory and all sub-files, from the zip
     * @param {string} name the name of the file to delete
     * @return {JSZip} this JSZip object
     */
    remove: function(name) {
        name = this.root + name;
        var file = this.files[name];
        if (!file) {
            // Look for any folders
            if (name.slice(-1) !== "/") {
                name += "/";
            }
            file = this.files[name];
        }

        if (file && !file.dir) {
            // file
            delete this.files[name];
        } else {
            // maybe a folder, delete recursively
            var kids = this.filter(function(relativePath, file) {
                return file.name.slice(0, name.length) === name;
            });
            for (var i = 0; i < kids.length; i++) {
                delete this.files[kids[i].name];
            }
        }

        return this;
    },

    /**
     * Generate the complete zip file
     * @param {Object} options the options to generate the zip file :
     * - compression, "STORE" by default.
     * - type, "base64" by default. Values are : string, base64, uint8array, arraybuffer, blob.
     * @return {String|Uint8Array|ArrayBuffer|Buffer|Blob} the zip file
     */
    generate: function(options) {
        throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
    },

    /**
     * Generate the complete zip file as an internal stream.
     * @param {Object} options the options to generate the zip file :
     * - compression, "STORE" by default.
     * - type, "base64" by default. Values are : string, base64, uint8array, arraybuffer, blob.
     * @return {StreamHelper} the streamed zip file.
     */
    generateInternalStream: function(options) {
      var worker, opts = {};
      try {
          opts = utils.extend(options || {}, {
              streamFiles: false,
              compression: "STORE",
              compressionOptions : null,
              type: "",
              platform: "DOS",
              comment: null,
              mimeType: 'application/zip',
              encodeFileName: utf8.utf8encode
          });

          opts.type = opts.type.toLowerCase();
          opts.compression = opts.compression.toUpperCase();

          // "binarystring" is prefered but the internals use "string".
          if(opts.type === "binarystring") {
            opts.type = "string";
          }

          if (!opts.type) {
            throw new Error("No output type specified.");
          }

          utils.checkSupport(opts.type);

          // accept nodejs `process.platform`
          if(
              options.platform === 'darwin' ||
              options.platform === 'freebsd' ||
              options.platform === 'linux' ||
              options.platform === 'sunos'
          ) {
              options.platform = "UNIX";
          }
          if (options.platform === 'win32') {
              options.platform = "DOS";
          }

          var comment = opts.comment || this.comment || "";
          worker = generate.generateWorker(this, opts, comment);
      } catch (e) {
        worker = new GenericWorker("error");
        worker.error(e);
      }
      return new StreamHelper(worker, opts.type || "string", opts.mimeType);
    },
    /**
     * Generate the complete zip file asynchronously.
     * @see generateInternalStream
     */
    generateAsync: function(options, onUpdate) {
        return this.generateInternalStream(options).accumulate(onUpdate);
    },
    /**
     * Generate the complete zip file asynchronously.
     * @see generateInternalStream
     */
    generateNodeStream: function(options, onUpdate) {
        options = options || {};
        if (!options.type) {
            options.type = "nodebuffer";
        }
        return this.generateInternalStream(options).toNodejsStream(onUpdate);
    }
};
module.exports = out;

},{"./compressedObject":42,"./defaults":45,"./generate":49,"./nodejs/NodejsStreamInputAdapter":52,"./nodejsUtils":54,"./stream/GenericWorker":67,"./stream/StreamHelper":68,"./utf8":70,"./utils":71,"./zipObject":74}],56:[function(require,module,exports){
'use strict';
var DataReader = require('./DataReader');
var utils = require('../utils');

function ArrayReader(data) {
    DataReader.call(this, data);
	for(var i = 0; i < this.data.length; i++) {
		data[i] = data[i] & 0xFF;
	}
}
utils.inherits(ArrayReader, DataReader);
/**
 * @see DataReader.byteAt
 */
ArrayReader.prototype.byteAt = function(i) {
    return this.data[this.zero + i];
};
/**
 * @see DataReader.lastIndexOfSignature
 */
ArrayReader.prototype.lastIndexOfSignature = function(sig) {
    var sig0 = sig.charCodeAt(0),
        sig1 = sig.charCodeAt(1),
        sig2 = sig.charCodeAt(2),
        sig3 = sig.charCodeAt(3);
    for (var i = this.length - 4; i >= 0; --i) {
        if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) {
            return i - this.zero;
        }
    }

    return -1;
};
/**
 * @see DataReader.readAndCheckSignature
 */
ArrayReader.prototype.readAndCheckSignature = function (sig) {
    var sig0 = sig.charCodeAt(0),
        sig1 = sig.charCodeAt(1),
        sig2 = sig.charCodeAt(2),
        sig3 = sig.charCodeAt(3),
        data = this.readData(4);
    return sig0 === data[0] && sig1 === data[1] && sig2 === data[2] && sig3 === data[3];
};
/**
 * @see DataReader.readData
 */
ArrayReader.prototype.readData = function(size) {
    this.checkOffset(size);
    if(size === 0) {
        return [];
    }
    var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
    this.index += size;
    return result;
};
module.exports = ArrayReader;

},{"../utils":71,"./DataReader":57}],57:[function(require,module,exports){
'use strict';
var utils = require('../utils');

function DataReader(data) {
    this.data = data; // type : see implementation
    this.length = data.length;
    this.index = 0;
    this.zero = 0;
}
DataReader.prototype = {
    /**
     * Check that the offset will not go too far.
     * @param {string} offset the additional offset to check.
     * @throws {Error} an Error if the offset is out of bounds.
     */
    checkOffset: function(offset) {
        this.checkIndex(this.index + offset);
    },
    /**
     * Check that the specifed index will not be too far.
     * @param {string} newIndex the index to check.
     * @throws {Error} an Error if the index is out of bounds.
     */
    checkIndex: function(newIndex) {
        if (this.length < this.zero + newIndex || newIndex < 0) {
            throw new Error("End of data reached (data length = " + this.length + ", asked index = " + (newIndex) + "). Corrupted zip ?");
        }
    },
    /**
     * Change the index.
     * @param {number} newIndex The new index.
     * @throws {Error} if the new index is out of the data.
     */
    setIndex: function(newIndex) {
        this.checkIndex(newIndex);
        this.index = newIndex;
    },
    /**
     * Skip the next n bytes.
     * @param {number} n the number of bytes to skip.
     * @throws {Error} if the new index is out of the data.
     */
    skip: function(n) {
        this.setIndex(this.index + n);
    },
    /**
     * Get the byte at the specified index.
     * @param {number} i the index to use.
     * @return {number} a byte.
     */
    byteAt: function(i) {
        // see implementations
    },
    /**
     * Get the next number with a given byte size.
     * @param {number} size the number of bytes to read.
     * @return {number} the corresponding number.
     */
    readInt: function(size) {
        var result = 0,
            i;
        this.checkOffset(size);
        for (i = this.index + size - 1; i >= this.index; i--) {
            result = (result << 8) + this.byteAt(i);
        }
        this.index += size;
        return result;
    },
    /**
     * Get the next string with a given byte size.
     * @param {number} size the number of bytes to read.
     * @return {string} the corresponding string.
     */
    readString: function(size) {
        return utils.transformTo("string", this.readData(size));
    },
    /**
     * Get raw data without conversion, <size> bytes.
     * @param {number} size the number of bytes to read.
     * @return {Object} the raw data, implementation specific.
     */
    readData: function(size) {
        // see implementations
    },
    /**
     * Find the last occurence of a zip signature (4 bytes).
     * @param {string} sig the signature to find.
     * @return {number} the index of the last occurence, -1 if not found.
     */
    lastIndexOfSignature: function(sig) {
        // see implementations
    },
    /**
     * Read the signature (4 bytes) at the current position and compare it with sig.
     * @param {string} sig the expected signature
     * @return {boolean} true if the signature matches, false otherwise.
     */
    readAndCheckSignature: function(sig) {
        // see implementations
    },
    /**
     * Get the next date.
     * @return {Date} the date.
     */
    readDate: function() {
        var dostime = this.readInt(4);
        return new Date(Date.UTC(
        ((dostime >> 25) & 0x7f) + 1980, // year
        ((dostime >> 21) & 0x0f) - 1, // month
        (dostime >> 16) & 0x1f, // day
        (dostime >> 11) & 0x1f, // hour
        (dostime >> 5) & 0x3f, // minute
        (dostime & 0x1f) << 1)); // second
    }
};
module.exports = DataReader;

},{"../utils":71}],58:[function(require,module,exports){
'use strict';
var Uint8ArrayReader = require('./Uint8ArrayReader');
var utils = require('../utils');

function NodeBufferReader(data) {
    Uint8ArrayReader.call(this, data);
}
utils.inherits(NodeBufferReader, Uint8ArrayReader);

/**
 * @see DataReader.readData
 */
NodeBufferReader.prototype.readData = function(size) {
    this.checkOffset(size);
    var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
    this.index += size;
    return result;
};
module.exports = NodeBufferReader;

},{"../utils":71,"./Uint8ArrayReader":60}],59:[function(require,module,exports){
'use strict';
var DataReader = require('./DataReader');
var utils = require('../utils');

function StringReader(data) {
    DataReader.call(this, data);
}
utils.inherits(StringReader, DataReader);
/**
 * @see DataReader.byteAt
 */
StringReader.prototype.byteAt = function(i) {
    return this.data.charCodeAt(this.zero + i);
};
/**
 * @see DataReader.lastIndexOfSignature
 */
StringReader.prototype.lastIndexOfSignature = function(sig) {
    return this.data.lastIndexOf(sig) - this.zero;
};
/**
 * @see DataReader.readAndCheckSignature
 */
StringReader.prototype.readAndCheckSignature = function (sig) {
    var data = this.readData(4);
    return sig === data;
};
/**
 * @see DataReader.readData
 */
StringReader.prototype.readData = function(size) {
    this.checkOffset(size);
    // this will work because the constructor applied the "& 0xff" mask.
    var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
    this.index += size;
    return result;
};
module.exports = StringReader;

},{"../utils":71,"./DataReader":57}],60:[function(require,module,exports){
'use strict';
var ArrayReader = require('./ArrayReader');
var utils = require('../utils');

function Uint8ArrayReader(data) {
    ArrayReader.call(this, data);
}
utils.inherits(Uint8ArrayReader, ArrayReader);
/**
 * @see DataReader.readData
 */
Uint8ArrayReader.prototype.readData = function(size) {
    this.checkOffset(size);
    if(size === 0) {
        // in IE10, when using subarray(idx, idx), we get the array [0x00] instead of [].
        return new Uint8Array(0);
    }
    var result = this.data.subarray(this.zero + this.index, this.zero + this.index + size);
    this.index += size;
    return result;
};
module.exports = Uint8ArrayReader;

},{"../utils":71,"./ArrayReader":56}],61:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var support = require('../support');
var ArrayReader = require('./ArrayReader');
var StringReader = require('./StringReader');
var NodeBufferReader = require('./NodeBufferReader');
var Uint8ArrayReader = require('./Uint8ArrayReader');

/**
 * Create a reader adapted to the data.
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data to read.
 * @return {DataReader} the data reader.
 */
module.exports = function (data) {
    var type = utils.getTypeOf(data);
    utils.checkSupport(type);
    if (type === "string" && !support.uint8array) {
        return new StringReader(data);
    }
    if (type === "nodebuffer") {
        return new NodeBufferReader(data);
    }
    if (support.uint8array) {
        return new Uint8ArrayReader(utils.transformTo("uint8array", data));
    }
    return new ArrayReader(utils.transformTo("array", data));
};

// vim: set shiftwidth=4 softtabstop=4:

},{"../support":69,"../utils":71,"./ArrayReader":56,"./NodeBufferReader":58,"./StringReader":59,"./Uint8ArrayReader":60}],62:[function(require,module,exports){
'use strict';
exports.LOCAL_FILE_HEADER = "PK\x03\x04";
exports.CENTRAL_FILE_HEADER = "PK\x01\x02";
exports.CENTRAL_DIRECTORY_END = "PK\x05\x06";
exports.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x06\x07";
exports.ZIP64_CENTRAL_DIRECTORY_END = "PK\x06\x06";
exports.DATA_DESCRIPTOR = "PK\x07\x08";

},{}],63:[function(require,module,exports){
'use strict';

var GenericWorker = require('./GenericWorker');
var utils = require('../utils');

/**
 * A worker which convert chunks to a specified type.
 * @constructor
 * @param {String} destType the destination type.
 */
function ConvertWorker(destType) {
    GenericWorker.call(this, "ConvertWorker to " + destType);
    this.destType = destType;
}
utils.inherits(ConvertWorker, GenericWorker);

/**
 * @see GenericWorker.processChunk
 */
ConvertWorker.prototype.processChunk = function (chunk) {
    this.push({
        data : utils.transformTo(this.destType, chunk.data),
        meta : chunk.meta
    });
};
module.exports = ConvertWorker;

},{"../utils":71,"./GenericWorker":67}],64:[function(require,module,exports){
'use strict';

var GenericWorker = require('./GenericWorker');
var crc32 = require('../crc32');
var utils = require('../utils');

/**
 * A worker which calculate the crc32 of the data flowing through.
 * @constructor
 */
function Crc32Probe() {
    GenericWorker.call(this, "Crc32Probe");
}
utils.inherits(Crc32Probe, GenericWorker);

/**
 * @see GenericWorker.processChunk
 */
Crc32Probe.prototype.processChunk = function (chunk) {
    this.streamInfo.crc32 = crc32(chunk.data, this.streamInfo.crc32 || 0);
    this.push(chunk);
};
module.exports = Crc32Probe;

},{"../crc32":44,"../utils":71,"./GenericWorker":67}],65:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var GenericWorker = require('./GenericWorker');

/**
 * A worker which calculate the total length of the data flowing through.
 * @constructor
 * @param {String} propName the name used to expose the length
 */
function DataLengthProbe(propName) {
    GenericWorker.call(this, "DataLengthProbe for " + propName);
    this.propName = propName;
    this.withStreamInfo(propName, 0);
}
utils.inherits(DataLengthProbe, GenericWorker);

/**
 * @see GenericWorker.processChunk
 */
DataLengthProbe.prototype.processChunk = function (chunk) {
    if(chunk) {
        var length = this.streamInfo[this.propName] || 0;
        this.streamInfo[this.propName] = length + chunk.data.length;
    }
    GenericWorker.prototype.processChunk.call(this, chunk);
};
module.exports = DataLengthProbe;


},{"../utils":71,"./GenericWorker":67}],66:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var GenericWorker = require('./GenericWorker');

// the size of the generated chunks
// TODO expose this as a public variable
var DEFAULT_BLOCK_SIZE = 16 * 1024;

/**
 * A worker that reads a content and emits chunks.
 * @constructor
 * @param {Promise} dataP the promise of the data to split
 */
function DataWorker(dataP) {
    GenericWorker.call(this, "DataWorker");
    var self = this;
    this.dataIsReady = false;
    this.index = 0;
    this.max = 0;
    this.data = null;
    this.type = "";

    this._tickScheduled = false;

    dataP.then(function (data) {
        self.dataIsReady = true;
        self.data = data;
        self.max = data && data.length || 0;
        self.type = utils.getTypeOf(data);
        if(!self.isPaused) {
            self._tickAndRepeat();
        }
    }, function (e) {
        self.error(e);
    });
}

utils.inherits(DataWorker, GenericWorker);

/**
 * @see GenericWorker.cleanUp
 */
DataWorker.prototype.cleanUp = function () {
    GenericWorker.prototype.cleanUp.call(this);
    this.data = null;
};

/**
 * @see GenericWorker.resume
 */
DataWorker.prototype.resume = function () {
    if(!GenericWorker.prototype.resume.call(this)) {
        return false;
    }

    if (!this._tickScheduled && this.dataIsReady) {
        this._tickScheduled = true;
        utils.delay(this._tickAndRepeat, [], this);
    }
    return true;
};

/**
 * Trigger a tick a schedule an other call to this function.
 */
DataWorker.prototype._tickAndRepeat = function() {
    this._tickScheduled = false;
    if(this.isPaused || this.isFinished) {
        return;
    }
    this._tick();
    if(!this.isFinished) {
        utils.delay(this._tickAndRepeat, [], this);
        this._tickScheduled = true;
    }
};

/**
 * Read and push a chunk.
 */
DataWorker.prototype._tick = function() {

    if(this.isPaused || this.isFinished) {
        return false;
    }

    var size = DEFAULT_BLOCK_SIZE;
    var data = null, nextIndex = Math.min(this.max, this.index + size);
    if (this.index >= this.max) {
        // EOF
        return this.end();
    } else {
        switch(this.type) {
            case "string":
                data = this.data.substring(this.index, nextIndex);
            break;
            case "uint8array":
                data = this.data.subarray(this.index, nextIndex);
            break;
            case "array":
            case "nodebuffer":
                data = this.data.slice(this.index, nextIndex);
            break;
        }
        this.index = nextIndex;
        return this.push({
            data : data,
            meta : {
                percent : this.max ? this.index / this.max * 100 : 0
            }
        });
    }
};

module.exports = DataWorker;

},{"../utils":71,"./GenericWorker":67}],67:[function(require,module,exports){
'use strict';

/**
 * A worker that does nothing but passing chunks to the next one. This is like
 * a nodejs stream but with some differences. On the good side :
 * - it works on IE 6-9 without any issue / polyfill
 * - it weights less than the full dependencies bundled with browserify
 * - it forwards errors (no need to declare an error handler EVERYWHERE)
 *
 * A chunk is an object with 2 attributes : `meta` and `data`. The former is an
 * object containing anything (`percent` for example), see each worker for more
 * details. The latter is the real data (String, Uint8Array, etc).
 *
 * @constructor
 * @param {String} name the name of the stream (mainly used for debugging purposes)
 */
function GenericWorker(name) {
    // the name of the worker
    this.name = name || "default";
    // an object containing metadata about the workers chain
    this.streamInfo = {};
    // an error which happened when the worker was paused
    this.generatedError = null;
    // an object containing metadata to be merged by this worker into the general metadata
    this.extraStreamInfo = {};
    // true if the stream is paused (and should not do anything), false otherwise
    this.isPaused = true;
    // true if the stream is finished (and should not do anything), false otherwise
    this.isFinished = false;
    // true if the stream is locked to prevent further structure updates (pipe), false otherwise
    this.isLocked = false;
    // the event listeners
    this._listeners = {
        'data':[],
        'end':[],
        'error':[]
    };
    // the previous worker, if any
    this.previous = null;
}

GenericWorker.prototype = {
    /**
     * Push a chunk to the next workers.
     * @param {Object} chunk the chunk to push
     */
    push : function (chunk) {
        this.emit("data", chunk);
    },
    /**
     * End the stream.
     * @return {Boolean} true if this call ended the worker, false otherwise.
     */
    end : function () {
        if (this.isFinished) {
            return false;
        }

        this.flush();
        try {
            this.emit("end");
            this.cleanUp();
            this.isFinished = true;
        } catch (e) {
            this.emit("error", e);
        }
        return true;
    },
    /**
     * End the stream with an error.
     * @param {Error} e the error which caused the premature end.
     * @return {Boolean} true if this call ended the worker with an error, false otherwise.
     */
    error : function (e) {
        if (this.isFinished) {
            return false;
        }

        if(this.isPaused) {
            this.generatedError = e;
        } else {
            this.isFinished = true;

            this.emit("error", e);

            // in the workers chain exploded in the middle of the chain,
            // the error event will go downward but we also need to notify
            // workers upward that there has been an error.
            if(this.previous) {
                this.previous.error(e);
            }

            this.cleanUp();
        }
        return true;
    },
    /**
     * Add a callback on an event.
     * @param {String} name the name of the event (data, end, error)
     * @param {Function} listener the function to call when the event is triggered
     * @return {GenericWorker} the current object for chainability
     */
    on : function (name, listener) {
        this._listeners[name].push(listener);
        return this;
    },
    /**
     * Clean any references when a worker is ending.
     */
    cleanUp : function () {
        this.streamInfo = this.generatedError = this.extraStreamInfo = null;
        this._listeners = [];
    },
    /**
     * Trigger an event. This will call registered callback with the provided arg.
     * @param {String} name the name of the event (data, end, error)
     * @param {Object} arg the argument to call the callback with.
     */
    emit : function (name, arg) {
        if (this._listeners[name]) {
            for(var i = 0; i < this._listeners[name].length; i++) {
                this._listeners[name][i].call(this, arg);
            }
        }
    },
    /**
     * Chain a worker with an other.
     * @param {Worker} next the worker receiving events from the current one.
     * @return {worker} the next worker for chainability
     */
    pipe : function (next) {
        return next.registerPrevious(this);
    },
    /**
     * Same as `pipe` in the other direction.
     * Using an API with `pipe(next)` is very easy.
     * Implementing the API with the point of view of the next one registering
     * a source is easier, see the ZipFileWorker.
     * @param {Worker} previous the previous worker, sending events to this one
     * @return {Worker} the current worker for chainability
     */
    registerPrevious : function (previous) {
        if (this.isLocked) {
            throw new Error("The stream '" + this + "' has already been used.");
        }

        // sharing the streamInfo...
        this.streamInfo = previous.streamInfo;
        // ... and adding our own bits
        this.mergeStreamInfo();
        this.previous =  previous;
        var self = this;
        previous.on('data', function (chunk) {
            self.processChunk(chunk);
        });
        previous.on('end', function () {
            self.end();
        });
        previous.on('error', function (e) {
            self.error(e);
        });
        return this;
    },
    /**
     * Pause the stream so it doesn't send events anymore.
     * @return {Boolean} true if this call paused the worker, false otherwise.
     */
    pause : function () {
        if(this.isPaused || this.isFinished) {
            return false;
        }
        this.isPaused = true;

        if(this.previous) {
            this.previous.pause();
        }
        return true;
    },
    /**
     * Resume a paused stream.
     * @return {Boolean} true if this call resumed the worker, false otherwise.
     */
    resume : function () {
        if(!this.isPaused || this.isFinished) {
            return false;
        }
        this.isPaused = false;

        // if true, the worker tried to resume but failed
        var withError = false;
        if(this.generatedError) {
            this.error(this.generatedError);
            withError = true;
        }
        if(this.previous) {
            this.previous.resume();
        }

        return !withError;
    },
    /**
     * Flush any remaining bytes as the stream is ending.
     */
    flush : function () {},
    /**
     * Process a chunk. This is usually the method overridden.
     * @param {Object} chunk the chunk to process.
     */
    processChunk : function(chunk) {
        this.push(chunk);
    },
    /**
     * Add a key/value to be added in the workers chain streamInfo once activated.
     * @param {String} key the key to use
     * @param {Object} value the associated value
     * @return {Worker} the current worker for chainability
     */
    withStreamInfo : function (key, value) {
        this.extraStreamInfo[key] = value;
        this.mergeStreamInfo();
        return this;
    },
    /**
     * Merge this worker's streamInfo into the chain's streamInfo.
     */
    mergeStreamInfo : function () {
        for(var key in this.extraStreamInfo) {
            if (!this.extraStreamInfo.hasOwnProperty(key)) {
                continue;
            }
            this.streamInfo[key] = this.extraStreamInfo[key];
        }
    },

    /**
     * Lock the stream to prevent further updates on the workers chain.
     * After calling this method, all calls to pipe will fail.
     */
    lock: function () {
        if (this.isLocked) {
            throw new Error("The stream '" + this + "' has already been used.");
        }
        this.isLocked = true;
        if (this.previous) {
            this.previous.lock();
        }
    },

    /**
     *
     * Pretty print the workers chain.
     */
    toString : function () {
        var me = "Worker " + this.name;
        if (this.previous) {
            return this.previous + " -> " + me;
        } else {
            return me;
        }
    }
};

module.exports = GenericWorker;

},{}],68:[function(require,module,exports){
(function (Buffer){
'use strict';

var utils = require('../utils');
var ConvertWorker = require('./ConvertWorker');
var GenericWorker = require('./GenericWorker');
var base64 = require('../base64');
var NodejsStreamOutputAdapter = require('../nodejs/NodejsStreamOutputAdapter');
var external = require("../external");

/**
 * Apply the final transformation of the data. If the user wants a Blob for
 * example, it's easier to work with an U8intArray and finally do the
 * ArrayBuffer/Blob conversion.
 * @param {String} type the name of the final type
 * @param {String|Uint8Array|Buffer} content the content to transform
 * @param {String} mimeType the mime type of the content, if applicable.
 * @return {String|Uint8Array|ArrayBuffer|Buffer|Blob} the content in the right format.
 */
function transformZipOutput(type, content, mimeType) {
    switch(type) {
        case "blob" :
            return utils.newBlob(utils.transformTo("arraybuffer", content), mimeType);
        case "base64" :
            return base64.encode(content);
        default :
            return utils.transformTo(type, content);
    }
}

/**
 * Concatenate an array of data of the given type.
 * @param {String} type the type of the data in the given array.
 * @param {Array} dataArray the array containing the data chunks to concatenate
 * @return {String|Uint8Array|Buffer} the concatenated data
 * @throws Error if the asked type is unsupported
 */
function concat (type, dataArray) {
    var i, index = 0, res = null, totalLength = 0;
    for(i = 0; i < dataArray.length; i++) {
        totalLength += dataArray[i].length;
    }
    switch(type) {
        case "string":
            return dataArray.join("");
          case "array":
            return Array.prototype.concat.apply([], dataArray);
        case "uint8array":
            res = new Uint8Array(totalLength);
            for(i = 0; i < dataArray.length; i++) {
                res.set(dataArray[i], index);
                index += dataArray[i].length;
            }
            return res;
        case "nodebuffer":
            return Buffer.concat(dataArray);
        default:
            throw new Error("concat : unsupported type '"  + type + "'");
    }
}

/**
 * Listen a StreamHelper, accumulate its content and concatenate it into a
 * complete block.
 * @param {StreamHelper} helper the helper to use.
 * @param {Function} updateCallback a callback called on each update. Called
 * with one arg :
 * - the metadata linked to the update received.
 * @return Promise the promise for the accumulation.
 */
function accumulate(helper, updateCallback) {
    return new external.Promise(function (resolve, reject){
        var dataArray = [];
        var chunkType = helper._internalType,
            resultType = helper._outputType,
            mimeType = helper._mimeType;
        helper
        .on('data', function (data, meta) {
            dataArray.push(data);
            if(updateCallback) {
                updateCallback(meta);
            }
        })
        .on('error', function(err) {
            dataArray = [];
            reject(err);
        })
        .on('end', function (){
            try {
                var result = transformZipOutput(resultType, concat(chunkType, dataArray), mimeType);
                resolve(result);
            } catch (e) {
                reject(e);
            }
            dataArray = [];
        })
        .resume();
    });
}

/**
 * An helper to easily use workers outside of JSZip.
 * @constructor
 * @param {Worker} worker the worker to wrap
 * @param {String} outputType the type of data expected by the use
 * @param {String} mimeType the mime type of the content, if applicable.
 */
function StreamHelper(worker, outputType, mimeType) {
    var internalType = outputType;
    switch(outputType) {
        case "blob":
        case "arraybuffer":
            internalType = "uint8array";
        break;
        case "base64":
            internalType = "string";
        break;
    }

    try {
        // the type used internally
        this._internalType = internalType;
        // the type used to output results
        this._outputType = outputType;
        // the mime type
        this._mimeType = mimeType;
        utils.checkSupport(internalType);
        this._worker = worker.pipe(new ConvertWorker(internalType));
        // the last workers can be rewired without issues but we need to
        // prevent any updates on previous workers.
        worker.lock();
    } catch(e) {
        this._worker = new GenericWorker("error");
        this._worker.error(e);
    }
}

StreamHelper.prototype = {
    /**
     * Listen a StreamHelper, accumulate its content and concatenate it into a
     * complete block.
     * @param {Function} updateCb the update callback.
     * @return Promise the promise for the accumulation.
     */
    accumulate : function (updateCb) {
        return accumulate(this, updateCb);
    },
    /**
     * Add a listener on an event triggered on a stream.
     * @param {String} evt the name of the event
     * @param {Function} fn the listener
     * @return {StreamHelper} the current helper.
     */
    on : function (evt, fn) {
        var self = this;

        if(evt === "data") {
            this._worker.on(evt, function (chunk) {
                fn.call(self, chunk.data, chunk.meta);
            });
        } else {
            this._worker.on(evt, function () {
                utils.delay(fn, arguments, self);
            });
        }
        return this;
    },
    /**
     * Resume the flow of chunks.
     * @return {StreamHelper} the current helper.
     */
    resume : function () {
        utils.delay(this._worker.resume, [], this._worker);
        return this;
    },
    /**
     * Pause the flow of chunks.
     * @return {StreamHelper} the current helper.
     */
    pause : function () {
        this._worker.pause();
        return this;
    },
    /**
     * Return a nodejs stream for this helper.
     * @param {Function} updateCb the update callback.
     * @return {NodejsStreamOutputAdapter} the nodejs stream.
     */
    toNodejsStream : function (updateCb) {
        utils.checkSupport("nodestream");
        if (this._outputType !== "nodebuffer") {
            // an object stream containing blob/arraybuffer/uint8array/string
            // is strange and I don't know if it would be useful.
            // I you find this comment and have a good usecase, please open a
            // bug report !
            throw new Error(this._outputType + " is not supported by this method");
        }

        return new NodejsStreamOutputAdapter(this, {
            objectMode : this._outputType !== "nodebuffer"
        }, updateCb);
    }
};


module.exports = StreamHelper;

}).call(this,require("buffer").Buffer)
},{"../base64":41,"../external":46,"../nodejs/NodejsStreamOutputAdapter":53,"../utils":71,"./ConvertWorker":63,"./GenericWorker":67,"buffer":4}],69:[function(require,module,exports){
(function (Buffer){
'use strict';

exports.base64 = true;
exports.array = true;
exports.string = true;
exports.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
exports.nodebuffer = typeof Buffer !== "undefined";
// contains true if JSZip can read/generate Uint8Array, false otherwise.
exports.uint8array = typeof Uint8Array !== "undefined";

if (typeof ArrayBuffer === "undefined") {
    exports.blob = false;
}
else {
    var buffer = new ArrayBuffer(0);
    try {
        exports.blob = new Blob([buffer], {
            type: "application/zip"
        }).size === 0;
    }
    catch (e) {
        try {
            var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
            var builder = new Builder();
            builder.append(buffer);
            exports.blob = builder.getBlob('application/zip').size === 0;
        }
        catch (e) {
            exports.blob = false;
        }
    }
}

exports.nodestream = !!require("./nodejs/NodejsStreamOutputAdapter").prototype;

}).call(this,require("buffer").Buffer)
},{"./nodejs/NodejsStreamOutputAdapter":53,"buffer":4}],70:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var support = require('./support');
var nodejsUtils = require('./nodejsUtils');
var GenericWorker = require('./stream/GenericWorker');

/**
 * The following functions come from pako, from pako/lib/utils/strings
 * released under the MIT license, see pako https://github.com/nodeca/pako/
 */

// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
var _utf8len = new Array(256);
for (var i=0; i<256; i++) {
  _utf8len[i] = (i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1);
}
_utf8len[254]=_utf8len[254]=1; // Invalid sequence start

// convert string to array (typed, when possible)
var string2buf = function (str) {
    var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

    // count binary size
    for (m_pos = 0; m_pos < str_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
            c2 = str.charCodeAt(m_pos+1);
            if ((c2 & 0xfc00) === 0xdc00) {
                c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
                m_pos++;
            }
        }
        buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
    }

    // allocate buffer
    if (support.uint8array) {
        buf = new Uint8Array(buf_len);
    } else {
        buf = new Array(buf_len);
    }

    // convert
    for (i=0, m_pos = 0; i < buf_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
            c2 = str.charCodeAt(m_pos+1);
            if ((c2 & 0xfc00) === 0xdc00) {
                c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
                m_pos++;
            }
        }
        if (c < 0x80) {
            /* one byte */
            buf[i++] = c;
        } else if (c < 0x800) {
            /* two bytes */
            buf[i++] = 0xC0 | (c >>> 6);
            buf[i++] = 0x80 | (c & 0x3f);
        } else if (c < 0x10000) {
            /* three bytes */
            buf[i++] = 0xE0 | (c >>> 12);
            buf[i++] = 0x80 | (c >>> 6 & 0x3f);
            buf[i++] = 0x80 | (c & 0x3f);
        } else {
            /* four bytes */
            buf[i++] = 0xf0 | (c >>> 18);
            buf[i++] = 0x80 | (c >>> 12 & 0x3f);
            buf[i++] = 0x80 | (c >>> 6 & 0x3f);
            buf[i++] = 0x80 | (c & 0x3f);
        }
    }

    return buf;
};

// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
var utf8border = function(buf, max) {
    var pos;

    max = max || buf.length;
    if (max > buf.length) { max = buf.length; }

    // go back from last position, until start of sequence found
    pos = max-1;
    while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

    // Fuckup - very small and broken sequence,
    // return max, because we should return something anyway.
    if (pos < 0) { return max; }

    // If we came to start of buffer - that means vuffer is too small,
    // return max too.
    if (pos === 0) { return max; }

    return (pos + _utf8len[buf[pos]] > max) ? pos : max;
};

// convert array to string
var buf2string = function (buf) {
    var str, i, out, c, c_len;
    var len = buf.length;

    // Reserve max possible length (2 words per char)
    // NB: by unknown reasons, Array is significantly faster for
    //     String.fromCharCode.apply than Uint16Array.
    var utf16buf = new Array(len*2);

    for (out=0, i=0; i<len;) {
        c = buf[i++];
        // quick process ascii
        if (c < 0x80) { utf16buf[out++] = c; continue; }

        c_len = _utf8len[c];
        // skip 5 & 6 byte codes
        if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len-1; continue; }

        // apply mask on first byte
        c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
        // join the rest
        while (c_len > 1 && i < len) {
            c = (c << 6) | (buf[i++] & 0x3f);
            c_len--;
        }

        // terminated by end of string?
        if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

        if (c < 0x10000) {
            utf16buf[out++] = c;
        } else {
            c -= 0x10000;
            utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
            utf16buf[out++] = 0xdc00 | (c & 0x3ff);
        }
    }

    // shrinkBuf(utf16buf, out)
    if (utf16buf.length !== out) {
        if(utf16buf.subarray) {
            utf16buf = utf16buf.subarray(0, out);
        } else {
            utf16buf.length = out;
        }
    }

    // return String.fromCharCode.apply(null, utf16buf);
    return utils.applyFromCharCode(utf16buf);
};


// That's all for the pako functions.


/**
 * Transform a javascript string into an array (typed if possible) of bytes,
 * UTF-8 encoded.
 * @param {String} str the string to encode
 * @return {Array|Uint8Array|Buffer} the UTF-8 encoded string.
 */
exports.utf8encode = function utf8encode(str) {
    if (support.nodebuffer) {
        return nodejsUtils.newBuffer(str, "utf-8");
    }

    return string2buf(str);
};


/**
 * Transform a bytes array (or a representation) representing an UTF-8 encoded
 * string into a javascript string.
 * @param {Array|Uint8Array|Buffer} buf the data de decode
 * @return {String} the decoded string.
 */
exports.utf8decode = function utf8decode(buf) {
    if (support.nodebuffer) {
        return utils.transformTo("nodebuffer", buf).toString("utf-8");
    }

    buf = utils.transformTo(support.uint8array ? "uint8array" : "array", buf);

    return buf2string(buf);
};

/**
 * A worker to decode utf8 encoded binary chunks into string chunks.
 * @constructor
 */
function Utf8DecodeWorker() {
    GenericWorker.call(this, "utf-8 decode");
    // the last bytes if a chunk didn't end with a complete codepoint.
    this.leftOver = null;
}
utils.inherits(Utf8DecodeWorker, GenericWorker);

/**
 * @see GenericWorker.processChunk
 */
Utf8DecodeWorker.prototype.processChunk = function (chunk) {

    var data = utils.transformTo(support.uint8array ? "uint8array" : "array", chunk.data);

    // 1st step, re-use what's left of the previous chunk
    if (this.leftOver && this.leftOver.length) {
        if(support.uint8array) {
            var previousData = data;
            data = new Uint8Array(previousData.length + this.leftOver.length);
            data.set(this.leftOver, 0);
            data.set(previousData, this.leftOver.length);
        } else {
            data = this.leftOver.concat(data);
        }
        this.leftOver = null;
    }

    var nextBoundary = utf8border(data);
    var usableData = data;
    if (nextBoundary !== data.length) {
        if (support.uint8array) {
            usableData = data.subarray(0, nextBoundary);
            this.leftOver = data.subarray(nextBoundary, data.length);
        } else {
            usableData = data.slice(0, nextBoundary);
            this.leftOver = data.slice(nextBoundary, data.length);
        }
    }

    this.push({
        data : exports.utf8decode(usableData),
        meta : chunk.meta
    });
};

/**
 * @see GenericWorker.flush
 */
Utf8DecodeWorker.prototype.flush = function () {
    if(this.leftOver && this.leftOver.length) {
        this.push({
            data : exports.utf8decode(this.leftOver),
            meta : {}
        });
        this.leftOver = null;
    }
};
exports.Utf8DecodeWorker = Utf8DecodeWorker;

/**
 * A worker to endcode string chunks into utf8 encoded binary chunks.
 * @constructor
 */
function Utf8EncodeWorker() {
    GenericWorker.call(this, "utf-8 encode");
}
utils.inherits(Utf8EncodeWorker, GenericWorker);

/**
 * @see GenericWorker.processChunk
 */
Utf8EncodeWorker.prototype.processChunk = function (chunk) {
    this.push({
        data : exports.utf8encode(chunk.data),
        meta : chunk.meta
    });
};
exports.Utf8EncodeWorker = Utf8EncodeWorker;

},{"./nodejsUtils":54,"./stream/GenericWorker":67,"./support":69,"./utils":71}],71:[function(require,module,exports){
'use strict';

var support = require('./support');
var base64 = require('./base64');
var nodejsUtils = require('./nodejsUtils');
var setImmediate = require('core-js/library/fn/set-immediate');
var external = require("./external");


/**
 * Convert a string that pass as a "binary string": it should represent a byte
 * array but may have > 255 char codes. Be sure to take only the first byte
 * and returns the byte array.
 * @param {String} str the string to transform.
 * @return {Array|Uint8Array} the string in a binary format.
 */
function string2binary(str) {
    var result = null;
    if (support.uint8array) {
      result = new Uint8Array(str.length);
    } else {
      result = new Array(str.length);
    }
    return stringToArrayLike(str, result);
}

/**
 * Create a new blob with the given content and the given type.
 * @param {String|ArrayBuffer} part the content to put in the blob. DO NOT use
 * an Uint8Array because the stock browser of android 4 won't accept it (it
 * will be silently converted to a string, "[object Uint8Array]").
 * @param {String} type the mime type of the blob.
 * @return {Blob} the created blob.
 */
exports.newBlob = function(part, type) {
    exports.checkSupport("blob");

    try {
        // Blob constructor
        return new Blob([part], {
            type: type
        });
    }
    catch (e) {

        try {
            // deprecated, browser only, old way
            var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
            var builder = new Builder();
            builder.append(part);
            return builder.getBlob(type);
        }
        catch (e) {

            // well, fuck ?!
            throw new Error("Bug : can't construct the Blob.");
        }
    }


};
/**
 * The identity function.
 * @param {Object} input the input.
 * @return {Object} the same input.
 */
function identity(input) {
    return input;
}

/**
 * Fill in an array with a string.
 * @param {String} str the string to use.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to fill in (will be mutated).
 * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated array.
 */
function stringToArrayLike(str, array) {
    for (var i = 0; i < str.length; ++i) {
        array[i] = str.charCodeAt(i) & 0xFF;
    }
    return array;
}

/**
 * An helper for the function arrayLikeToString.
 * This contains static informations and functions that
 * can be optimized by the browser JIT compiler.
 */
var arrayToStringHelper = {
    /**
     * Transform an array of int into a string, chunk by chunk.
     * See the performances notes on arrayLikeToString.
     * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
     * @param {String} type the type of the array.
     * @param {Integer} chunk the chunk size.
     * @return {String} the resulting string.
     * @throws Error if the chunk is too big for the stack.
     */
    stringifyByChunk: function(array, type, chunk) {
        var result = [], k = 0, len = array.length;
        // shortcut
        if (len <= chunk) {
            return String.fromCharCode.apply(null, array);
        }
        while (k < len) {
            if (type === "array" || type === "nodebuffer") {
                result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
            }
            else {
                result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
            }
            k += chunk;
        }
        return result.join("");
    },
    /**
     * Call String.fromCharCode on every item in the array.
     * This is the naive implementation, which generate A LOT of intermediate string.
     * This should be used when everything else fail.
     * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
     * @return {String} the result.
     */
    stringifyByChar: function(array){
        var resultStr = "";
        for(var i = 0; i < array.length; i++) {
            resultStr += String.fromCharCode(array[i]);
        }
        return resultStr;
    },
    applyCanBeUsed : {
        /**
         * true if the browser accepts to use String.fromCharCode on Uint8Array
         */
        uint8array : (function () {
            try {
                return support.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
            } catch (e) {
                return false;
            }
        })(),
        /**
         * true if the browser accepts to use String.fromCharCode on nodejs Buffer.
         */
        nodebuffer : (function () {
            try {
                return support.nodebuffer && String.fromCharCode.apply(null, nodejsUtils.newBuffer(1)).length === 1;
            } catch (e) {
                return false;
            }
        })()
    }
};

/**
 * Transform an array-like object to a string.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
 * @return {String} the result.
 */
function arrayLikeToString(array) {
    // Performances notes :
    // --------------------
    // String.fromCharCode.apply(null, array) is the fastest, see
    // see http://jsperf.com/converting-a-uint8array-to-a-string/2
    // but the stack is limited (and we can get huge arrays !).
    //
    // result += String.fromCharCode(array[i]); generate too many strings !
    //
    // This code is inspired by http://jsperf.com/arraybuffer-to-string-apply-performance/2
    // TODO : we now have workers that split the work. Do we still need that ?
    var chunk = 65536,
        type = exports.getTypeOf(array),
        canUseApply = true;
    if (type === "uint8array") {
        canUseApply = arrayToStringHelper.applyCanBeUsed.uint8array;
    } else if (type === "nodebuffer") {
        canUseApply = arrayToStringHelper.applyCanBeUsed.nodebuffer;
    }

    if (canUseApply) {
        while (chunk > 1) {
            try {
                return arrayToStringHelper.stringifyByChunk(array, type, chunk);
            } catch (e) {
                chunk = Math.floor(chunk / 2);
            }
        }
    }

    // no apply or chunk error : slow and painful algorithm
    // default browser on android 4.*
    return arrayToStringHelper.stringifyByChar(array);
}

exports.applyFromCharCode = arrayLikeToString;


/**
 * Copy the data from an array-like to an other array-like.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayFrom the origin array.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayTo the destination array which will be mutated.
 * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated destination array.
 */
function arrayLikeToArrayLike(arrayFrom, arrayTo) {
    for (var i = 0; i < arrayFrom.length; i++) {
        arrayTo[i] = arrayFrom[i];
    }
    return arrayTo;
}

// a matrix containing functions to transform everything into everything.
var transform = {};

// string to ?
transform["string"] = {
    "string": identity,
    "array": function(input) {
        return stringToArrayLike(input, new Array(input.length));
    },
    "arraybuffer": function(input) {
        return transform["string"]["uint8array"](input).buffer;
    },
    "uint8array": function(input) {
        return stringToArrayLike(input, new Uint8Array(input.length));
    },
    "nodebuffer": function(input) {
        return stringToArrayLike(input, nodejsUtils.newBuffer(input.length));
    }
};

// array to ?
transform["array"] = {
    "string": arrayLikeToString,
    "array": identity,
    "arraybuffer": function(input) {
        return (new Uint8Array(input)).buffer;
    },
    "uint8array": function(input) {
        return new Uint8Array(input);
    },
    "nodebuffer": function(input) {
        return nodejsUtils.newBuffer(input);
    }
};

// arraybuffer to ?
transform["arraybuffer"] = {
    "string": function(input) {
        return arrayLikeToString(new Uint8Array(input));
    },
    "array": function(input) {
        return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
    },
    "arraybuffer": identity,
    "uint8array": function(input) {
        return new Uint8Array(input);
    },
    "nodebuffer": function(input) {
        return nodejsUtils.newBuffer(new Uint8Array(input));
    }
};

// uint8array to ?
transform["uint8array"] = {
    "string": arrayLikeToString,
    "array": function(input) {
        return arrayLikeToArrayLike(input, new Array(input.length));
    },
    "arraybuffer": function(input) {
        return input.buffer;
    },
    "uint8array": identity,
    "nodebuffer": function(input) {
        return nodejsUtils.newBuffer(input);
    }
};

// nodebuffer to ?
transform["nodebuffer"] = {
    "string": arrayLikeToString,
    "array": function(input) {
        return arrayLikeToArrayLike(input, new Array(input.length));
    },
    "arraybuffer": function(input) {
        return transform["nodebuffer"]["uint8array"](input).buffer;
    },
    "uint8array": function(input) {
        return arrayLikeToArrayLike(input, new Uint8Array(input.length));
    },
    "nodebuffer": identity
};

/**
 * Transform an input into any type.
 * The supported output type are : string, array, uint8array, arraybuffer, nodebuffer.
 * If no output type is specified, the unmodified input will be returned.
 * @param {String} outputType the output type.
 * @param {String|Array|ArrayBuffer|Uint8Array|Buffer} input the input to convert.
 * @throws {Error} an Error if the browser doesn't support the requested output type.
 */
exports.transformTo = function(outputType, input) {
    if (!input) {
        // undefined, null, etc
        // an empty string won't harm.
        input = "";
    }
    if (!outputType) {
        return input;
    }
    exports.checkSupport(outputType);
    var inputType = exports.getTypeOf(input);
    var result = transform[inputType][outputType](input);
    return result;
};

/**
 * Return the type of the input.
 * The type will be in a format valid for JSZip.utils.transformTo : string, array, uint8array, arraybuffer.
 * @param {Object} input the input to identify.
 * @return {String} the (lowercase) type of the input.
 */
exports.getTypeOf = function(input) {
    if (typeof input === "string") {
        return "string";
    }
    if (Object.prototype.toString.call(input) === "[object Array]") {
        return "array";
    }
    if (support.nodebuffer && nodejsUtils.isBuffer(input)) {
        return "nodebuffer";
    }
    if (support.uint8array && input instanceof Uint8Array) {
        return "uint8array";
    }
    if (support.arraybuffer && input instanceof ArrayBuffer) {
        return "arraybuffer";
    }
};

/**
 * Throw an exception if the type is not supported.
 * @param {String} type the type to check.
 * @throws {Error} an Error if the browser doesn't support the requested type.
 */
exports.checkSupport = function(type) {
    var supported = support[type.toLowerCase()];
    if (!supported) {
        throw new Error(type + " is not supported by this platform");
    }
};

exports.MAX_VALUE_16BITS = 65535;
exports.MAX_VALUE_32BITS = -1; // well, "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF" is parsed as -1

/**
 * Prettify a string read as binary.
 * @param {string} str the string to prettify.
 * @return {string} a pretty string.
 */
exports.pretty = function(str) {
    var res = '',
        code, i;
    for (i = 0; i < (str || "").length; i++) {
        code = str.charCodeAt(i);
        res += '\\x' + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
    }
    return res;
};

/**
 * Defer the call of a function.
 * @param {Function} callback the function to call asynchronously.
 * @param {Array} args the arguments to give to the callback.
 */
exports.delay = function(callback, args, self) {
    setImmediate(function () {
        callback.apply(self || null, args || []);
    });
};

/**
 * Extends a prototype with an other, without calling a constructor with
 * side effects. Inspired by nodejs' `utils.inherits`
 * @param {Function} ctor the constructor to augment
 * @param {Function} superCtor the parent constructor to use
 */
exports.inherits = function (ctor, superCtor) {
    var Obj = function() {};
    Obj.prototype = superCtor.prototype;
    ctor.prototype = new Obj();
};

/**
 * Merge the objects passed as parameters into a new one.
 * @private
 * @param {...Object} var_args All objects to merge.
 * @return {Object} a new object with the data of the others.
 */
exports.extend = function() {
    var result = {}, i, attr;
    for (i = 0; i < arguments.length; i++) { // arguments is not enumerable in some browsers
        for (attr in arguments[i]) {
            if (arguments[i].hasOwnProperty(attr) && typeof result[attr] === "undefined") {
                result[attr] = arguments[i][attr];
            }
        }
    }
    return result;
};

/**
 * Transform arbitrary content into a Promise.
 * @param {String} name a name for the content being processed.
 * @param {Object} inputData the content to process.
 * @param {Boolean} isBinary true if the content is not an unicode string
 * @param {Boolean} isOptimizedBinaryString true if the string content only has one byte per character.
 * @param {Boolean} isBase64 true if the string content is encoded with base64.
 * @return {Promise} a promise in a format usable by JSZip.
 */
exports.prepareContent = function(name, inputData, isBinary, isOptimizedBinaryString, isBase64) {

    // if inputData is already a promise, this flatten it.
    var promise = external.Promise.resolve(inputData).then(function(data) {
        if (support.blob && data instanceof Blob && typeof FileReader !== "undefined") {
            return new external.Promise(function (resolve, reject) {
                var reader = new FileReader();

                reader.onload = function(e) {
                    resolve(e.target.result);
                };
                reader.onerror = function(e) {
                    reject(e.target.error);
                };
                reader.readAsArrayBuffer(data);
            });
        } else {
            return data;
        }
    });

    return promise.then(function(data) {
        var dataType = exports.getTypeOf(data);

        if (!dataType) {
            return external.Promise.reject(
                new Error("The data of '" + name + "' is in an unsupported format !")
            );
        }
        // special case : it's way easier to work with Uint8Array than with ArrayBuffer
        if (dataType === "arraybuffer") {
            data = exports.transformTo("uint8array", data);
        } else if (dataType === "string") {
            if (isBase64) {
                data = base64.decode(data);
            }
            else if (isBinary) {
                // optimizedBinaryString === true means that the file has already been filtered with a 0xFF mask
                if (isOptimizedBinaryString !== true) {
                    // this is a string, not in a base64 format.
                    // Be sure that this is a correct "binary string"
                    data = string2binary(data);
                }
            }
        }
        return data;
    });
};

},{"./base64":41,"./external":46,"./nodejsUtils":54,"./support":69,"core-js/library/fn/set-immediate":15}],72:[function(require,module,exports){
'use strict';
var readerFor = require('./reader/readerFor');
var utils = require('./utils');
var sig = require('./signature');
var ZipEntry = require('./zipEntry');
var utf8 = require('./utf8');
var support = require('./support');
//  class ZipEntries {{{
/**
 * All the entries in the zip file.
 * @constructor
 * @param {Object} loadOptions Options for loading the stream.
 */
function ZipEntries(loadOptions) {
    this.files = [];
    this.loadOptions = loadOptions;
}
ZipEntries.prototype = {
    /**
     * Check that the reader is on the speficied signature.
     * @param {string} expectedSignature the expected signature.
     * @throws {Error} if it is an other signature.
     */
    checkSignature: function(expectedSignature) {
        if (!this.reader.readAndCheckSignature(expectedSignature)) {
            this.reader.index -= 4;
            var signature = this.reader.readString(4);
            throw new Error("Corrupted zip or bug : unexpected signature " + "(" + utils.pretty(signature) + ", expected " + utils.pretty(expectedSignature) + ")");
        }
    },
    /**
     * Check if the given signature is at the given index.
     * @param {number} askedIndex the index to check.
     * @param {string} expectedSignature the signature to expect.
     * @return {boolean} true if the signature is here, false otherwise.
     */
    isSignature: function(askedIndex, expectedSignature) {
        var currentIndex = this.reader.index;
        this.reader.setIndex(askedIndex);
        var signature = this.reader.readString(4);
        var result = signature === expectedSignature;
        this.reader.setIndex(currentIndex);
        return result;
    },
    /**
     * Read the end of the central directory.
     */
    readBlockEndOfCentral: function() {
        this.diskNumber = this.reader.readInt(2);
        this.diskWithCentralDirStart = this.reader.readInt(2);
        this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
        this.centralDirRecords = this.reader.readInt(2);
        this.centralDirSize = this.reader.readInt(4);
        this.centralDirOffset = this.reader.readInt(4);

        this.zipCommentLength = this.reader.readInt(2);
        // warning : the encoding depends of the system locale
        // On a linux machine with LANG=en_US.utf8, this field is utf8 encoded.
        // On a windows machine, this field is encoded with the localized windows code page.
        var zipComment = this.reader.readData(this.zipCommentLength);
        var decodeParamType = support.uint8array ? "uint8array" : "array";
        // To get consistent behavior with the generation part, we will assume that
        // this is utf8 encoded unless specified otherwise.
        var decodeContent = utils.transformTo(decodeParamType, zipComment);
        this.zipComment = this.loadOptions.decodeFileName(decodeContent);
    },
    /**
     * Read the end of the Zip 64 central directory.
     * Not merged with the method readEndOfCentral :
     * The end of central can coexist with its Zip64 brother,
     * I don't want to read the wrong number of bytes !
     */
    readBlockZip64EndOfCentral: function() {
        this.zip64EndOfCentralSize = this.reader.readInt(8);
        this.reader.skip(4);
        // this.versionMadeBy = this.reader.readString(2);
        // this.versionNeeded = this.reader.readInt(2);
        this.diskNumber = this.reader.readInt(4);
        this.diskWithCentralDirStart = this.reader.readInt(4);
        this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
        this.centralDirRecords = this.reader.readInt(8);
        this.centralDirSize = this.reader.readInt(8);
        this.centralDirOffset = this.reader.readInt(8);

        this.zip64ExtensibleData = {};
        var extraDataSize = this.zip64EndOfCentralSize - 44,
            index = 0,
            extraFieldId,
            extraFieldLength,
            extraFieldValue;
        while (index < extraDataSize) {
            extraFieldId = this.reader.readInt(2);
            extraFieldLength = this.reader.readInt(4);
            extraFieldValue = this.reader.readData(extraFieldLength);
            this.zip64ExtensibleData[extraFieldId] = {
                id: extraFieldId,
                length: extraFieldLength,
                value: extraFieldValue
            };
        }
    },
    /**
     * Read the end of the Zip 64 central directory locator.
     */
    readBlockZip64EndOfCentralLocator: function() {
        this.diskWithZip64CentralDirStart = this.reader.readInt(4);
        this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
        this.disksCount = this.reader.readInt(4);
        if (this.disksCount > 1) {
            throw new Error("Multi-volumes zip are not supported");
        }
    },
    /**
     * Read the local files, based on the offset read in the central part.
     */
    readLocalFiles: function() {
        var i, file;
        for (i = 0; i < this.files.length; i++) {
            file = this.files[i];
            this.reader.setIndex(file.localHeaderOffset);
            this.checkSignature(sig.LOCAL_FILE_HEADER);
            file.readLocalPart(this.reader);
            file.handleUTF8();
            file.processAttributes();
        }
    },
    /**
     * Read the central directory.
     */
    readCentralDir: function() {
        var file;

        this.reader.setIndex(this.centralDirOffset);
        while (this.reader.readAndCheckSignature(sig.CENTRAL_FILE_HEADER)) {
            file = new ZipEntry({
                zip64: this.zip64
            }, this.loadOptions);
            file.readCentralPart(this.reader);
            this.files.push(file);
        }

        if (this.centralDirRecords !== this.files.length) {
            if (this.centralDirRecords !== 0 && this.files.length === 0) {
                // We expected some records but couldn't find ANY.
                // This is really suspicious, as if something went wrong.
                throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
            } else {
                // We found some records but not all.
                // Something is wrong but we got something for the user: no error here.
                // console.warn("expected", this.centralDirRecords, "records in central dir, got", this.files.length);
            }
        }
    },
    /**
     * Read the end of central directory.
     */
    readEndOfCentral: function() {
        var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
        if (offset < 0) {
            // Check if the content is a truncated zip or complete garbage.
            // A "LOCAL_FILE_HEADER" is not required at the beginning (auto
            // extractible zip for example) but it can give a good hint.
            // If an ajax request was used without responseType, we will also
            // get unreadable data.
            var isGarbage = !this.isSignature(0, sig.LOCAL_FILE_HEADER);

            if (isGarbage) {
                throw new Error("Can't find end of central directory : is this a zip file ? " +
                                "If it is, see http://stuk.github.io/jszip/documentation/howto/read_zip.html");
            } else {
                throw new Error("Corrupted zip : can't find end of central directory");
            }

        }
        this.reader.setIndex(offset);
        var endOfCentralDirOffset = offset;
        this.checkSignature(sig.CENTRAL_DIRECTORY_END);
        this.readBlockEndOfCentral();


        /* extract from the zip spec :
            4)  If one of the fields in the end of central directory
                record is too small to hold required data, the field
                should be set to -1 (0xFFFF or 0xFFFFFFFF) and the
                ZIP64 format record should be created.
            5)  The end of central directory record and the
                Zip64 end of central directory locator record must
                reside on the same disk when splitting or spanning
                an archive.
         */
        if (this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
            this.zip64 = true;

            /*
            Warning : the zip64 extension is supported, but ONLY if the 64bits integer read from
            the zip file can fit into a 32bits integer. This cannot be solved : Javascript represents
            all numbers as 64-bit double precision IEEE 754 floating point numbers.
            So, we have 53bits for integers and bitwise operations treat everything as 32bits.
            see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Bitwise_Operators
            and http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf section 8.5
            */

            // should look for a zip64 EOCD locator
            offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
            if (offset < 0) {
                throw new Error("Corrupted zip : can't find the ZIP64 end of central directory locator");
            }
            this.reader.setIndex(offset);
            this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
            this.readBlockZip64EndOfCentralLocator();

            // now the zip64 EOCD record
            if (!this.isSignature(this.relativeOffsetEndOfZip64CentralDir, sig.ZIP64_CENTRAL_DIRECTORY_END)) {
                // console.warn("ZIP64 end of central directory not where expected.");
                this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
                if (this.relativeOffsetEndOfZip64CentralDir < 0) {
                    throw new Error("Corrupted zip : can't find the ZIP64 end of central directory");
                }
            }
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
            this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
            this.readBlockZip64EndOfCentral();
        }

        var expectedEndOfCentralDirOffset = this.centralDirOffset + this.centralDirSize;
        if (this.zip64) {
            expectedEndOfCentralDirOffset += 20; // end of central dir 64 locator
            expectedEndOfCentralDirOffset += 12 /* should not include the leading 12 bytes */ + this.zip64EndOfCentralSize;
        }

        var extraBytes = endOfCentralDirOffset - expectedEndOfCentralDirOffset;

        if (extraBytes > 0) {
            // console.warn(extraBytes, "extra bytes at beginning or within zipfile");
            if (this.isSignature(endOfCentralDirOffset, sig.CENTRAL_FILE_HEADER)) {
                // The offsets seem wrong, but we have something at the specified offset.
                // So… we keep it.
            } else {
                // the offset is wrong, update the "zero" of the reader
                // this happens if data has been prepended (crx files for example)
                this.reader.zero = extraBytes;
            }
        } else if (extraBytes < 0) {
            throw new Error("Corrupted zip: missing " + Math.abs(extraBytes) + " bytes.");
        }
    },
    prepareReader: function(data) {
        this.reader = readerFor(data);
    },
    /**
     * Read a zip file and create ZipEntries.
     * @param {String|ArrayBuffer|Uint8Array|Buffer} data the binary string representing a zip file.
     */
    load: function(data) {
        this.prepareReader(data);
        this.readEndOfCentral();
        this.readCentralDir();
        this.readLocalFiles();
    }
};
// }}} end of ZipEntries
module.exports = ZipEntries;

},{"./reader/readerFor":61,"./signature":62,"./support":69,"./utf8":70,"./utils":71,"./zipEntry":73}],73:[function(require,module,exports){
'use strict';
var readerFor = require('./reader/readerFor');
var utils = require('./utils');
var CompressedObject = require('./compressedObject');
var crc32fn = require('./crc32');
var utf8 = require('./utf8');
var compressions = require('./compressions');
var support = require('./support');

var MADE_BY_DOS = 0x00;
var MADE_BY_UNIX = 0x03;

/**
 * Find a compression registered in JSZip.
 * @param {string} compressionMethod the method magic to find.
 * @return {Object|null} the JSZip compression object, null if none found.
 */
var findCompression = function(compressionMethod) {
    for (var method in compressions) {
        if (!compressions.hasOwnProperty(method)) {
            continue;
        }
        if (compressions[method].magic === compressionMethod) {
            return compressions[method];
        }
    }
    return null;
};

// class ZipEntry {{{
/**
 * An entry in the zip file.
 * @constructor
 * @param {Object} options Options of the current file.
 * @param {Object} loadOptions Options for loading the stream.
 */
function ZipEntry(options, loadOptions) {
    this.options = options;
    this.loadOptions = loadOptions;
}
ZipEntry.prototype = {
    /**
     * say if the file is encrypted.
     * @return {boolean} true if the file is encrypted, false otherwise.
     */
    isEncrypted: function() {
        // bit 1 is set
        return (this.bitFlag & 0x0001) === 0x0001;
    },
    /**
     * say if the file has utf-8 filename/comment.
     * @return {boolean} true if the filename/comment is in utf-8, false otherwise.
     */
    useUTF8: function() {
        // bit 11 is set
        return (this.bitFlag & 0x0800) === 0x0800;
    },
    /**
     * Read the local part of a zip file and add the info in this object.
     * @param {DataReader} reader the reader to use.
     */
    readLocalPart: function(reader) {
        var compression, localExtraFieldsLength;

        // we already know everything from the central dir !
        // If the central dir data are false, we are doomed.
        // On the bright side, the local part is scary  : zip64, data descriptors, both, etc.
        // The less data we get here, the more reliable this should be.
        // Let's skip the whole header and dash to the data !
        reader.skip(22);
        // in some zip created on windows, the filename stored in the central dir contains \ instead of /.
        // Strangely, the filename here is OK.
        // I would love to treat these zip files as corrupted (see http://www.info-zip.org/FAQ.html#backslashes
        // or APPNOTE#4.4.17.1, "All slashes MUST be forward slashes '/'") but there are a lot of bad zip generators...
        // Search "unzip mismatching "local" filename continuing with "central" filename version" on
        // the internet.
        //
        // I think I see the logic here : the central directory is used to display
        // content and the local directory is used to extract the files. Mixing / and \
        // may be used to display \ to windows users and use / when extracting the files.
        // Unfortunately, this lead also to some issues : http://seclists.org/fulldisclosure/2009/Sep/394
        this.fileNameLength = reader.readInt(2);
        localExtraFieldsLength = reader.readInt(2); // can't be sure this will be the same as the central dir
        // the fileName is stored as binary data, the handleUTF8 method will take care of the encoding.
        this.fileName = reader.readData(this.fileNameLength);
        reader.skip(localExtraFieldsLength);

        if (this.compressedSize === -1 || this.uncompressedSize === -1) {
            throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory " + "(compressedSize === -1 || uncompressedSize === -1)");
        }

        compression = findCompression(this.compressionMethod);
        if (compression === null) { // no compression found
            throw new Error("Corrupted zip : compression " + utils.pretty(this.compressionMethod) + " unknown (inner file : " + utils.transformTo("string", this.fileName) + ")");
        }
        this.decompressed = new CompressedObject(this.compressedSize, this.uncompressedSize, this.crc32, compression, reader.readData(this.compressedSize));
    },

    /**
     * Read the central part of a zip file and add the info in this object.
     * @param {DataReader} reader the reader to use.
     */
    readCentralPart: function(reader) {
        this.versionMadeBy = reader.readInt(2);
        reader.skip(2);
        // this.versionNeeded = reader.readInt(2);
        this.bitFlag = reader.readInt(2);
        this.compressionMethod = reader.readString(2);
        this.date = reader.readDate();
        this.crc32 = reader.readInt(4);
        this.compressedSize = reader.readInt(4);
        this.uncompressedSize = reader.readInt(4);
        var fileNameLength = reader.readInt(2);
        this.extraFieldsLength = reader.readInt(2);
        this.fileCommentLength = reader.readInt(2);
        this.diskNumberStart = reader.readInt(2);
        this.internalFileAttributes = reader.readInt(2);
        this.externalFileAttributes = reader.readInt(4);
        this.localHeaderOffset = reader.readInt(4);

        if (this.isEncrypted()) {
            throw new Error("Encrypted zip are not supported");
        }

        // will be read in the local part, see the comments there
        reader.skip(fileNameLength);
        this.readExtraFields(reader);
        this.parseZIP64ExtraField(reader);
        this.fileComment = reader.readData(this.fileCommentLength);
    },

    /**
     * Parse the external file attributes and get the unix/dos permissions.
     */
    processAttributes: function () {
        this.unixPermissions = null;
        this.dosPermissions = null;
        var madeBy = this.versionMadeBy >> 8;

        // Check if we have the DOS directory flag set.
        // We look for it in the DOS and UNIX permissions
        // but some unknown platform could set it as a compatibility flag.
        this.dir = this.externalFileAttributes & 0x0010 ? true : false;

        if(madeBy === MADE_BY_DOS) {
            // first 6 bits (0 to 5)
            this.dosPermissions = this.externalFileAttributes & 0x3F;
        }

        if(madeBy === MADE_BY_UNIX) {
            this.unixPermissions = (this.externalFileAttributes >> 16) & 0xFFFF;
            // the octal permissions are in (this.unixPermissions & 0x01FF).toString(8);
        }

        // fail safe : if the name ends with a / it probably means a folder
        if (!this.dir && this.fileNameStr.slice(-1) === '/') {
            this.dir = true;
        }
    },

    /**
     * Parse the ZIP64 extra field and merge the info in the current ZipEntry.
     * @param {DataReader} reader the reader to use.
     */
    parseZIP64ExtraField: function(reader) {

        if (!this.extraFields[0x0001]) {
            return;
        }

        // should be something, preparing the extra reader
        var extraReader = readerFor(this.extraFields[0x0001].value);

        // I really hope that these 64bits integer can fit in 32 bits integer, because js
        // won't let us have more.
        if (this.uncompressedSize === utils.MAX_VALUE_32BITS) {
            this.uncompressedSize = extraReader.readInt(8);
        }
        if (this.compressedSize === utils.MAX_VALUE_32BITS) {
            this.compressedSize = extraReader.readInt(8);
        }
        if (this.localHeaderOffset === utils.MAX_VALUE_32BITS) {
            this.localHeaderOffset = extraReader.readInt(8);
        }
        if (this.diskNumberStart === utils.MAX_VALUE_32BITS) {
            this.diskNumberStart = extraReader.readInt(4);
        }
    },
    /**
     * Read the central part of a zip file and add the info in this object.
     * @param {DataReader} reader the reader to use.
     */
    readExtraFields: function(reader) {
        var end = reader.index + this.extraFieldsLength,
            extraFieldId,
            extraFieldLength,
            extraFieldValue;

        if (!this.extraFields) {
            this.extraFields = {};
        }

        while (reader.index < end) {
            extraFieldId = reader.readInt(2);
            extraFieldLength = reader.readInt(2);
            extraFieldValue = reader.readData(extraFieldLength);

            this.extraFields[extraFieldId] = {
                id: extraFieldId,
                length: extraFieldLength,
                value: extraFieldValue
            };
        }
    },
    /**
     * Apply an UTF8 transformation if needed.
     */
    handleUTF8: function() {
        var decodeParamType = support.uint8array ? "uint8array" : "array";
        if (this.useUTF8()) {
            this.fileNameStr = utf8.utf8decode(this.fileName);
            this.fileCommentStr = utf8.utf8decode(this.fileComment);
        } else {
            var upath = this.findExtraFieldUnicodePath();
            if (upath !== null) {
                this.fileNameStr = upath;
            } else {
                // ASCII text or unsupported code page
                var fileNameByteArray =  utils.transformTo(decodeParamType, this.fileName);
                this.fileNameStr = this.loadOptions.decodeFileName(fileNameByteArray);
            }

            var ucomment = this.findExtraFieldUnicodeComment();
            if (ucomment !== null) {
                this.fileCommentStr = ucomment;
            } else {
                // ASCII text or unsupported code page
                var commentByteArray =  utils.transformTo(decodeParamType, this.fileComment);
                this.fileCommentStr = this.loadOptions.decodeFileName(commentByteArray);
            }
        }
    },

    /**
     * Find the unicode path declared in the extra field, if any.
     * @return {String} the unicode path, null otherwise.
     */
    findExtraFieldUnicodePath: function() {
        var upathField = this.extraFields[0x7075];
        if (upathField) {
            var extraReader = readerFor(upathField.value);

            // wrong version
            if (extraReader.readInt(1) !== 1) {
                return null;
            }

            // the crc of the filename changed, this field is out of date.
            if (crc32fn(this.fileName) !== extraReader.readInt(4)) {
                return null;
            }

            return utf8.utf8decode(extraReader.readData(upathField.length - 5));
        }
        return null;
    },

    /**
     * Find the unicode comment declared in the extra field, if any.
     * @return {String} the unicode comment, null otherwise.
     */
    findExtraFieldUnicodeComment: function() {
        var ucommentField = this.extraFields[0x6375];
        if (ucommentField) {
            var extraReader = readerFor(ucommentField.value);

            // wrong version
            if (extraReader.readInt(1) !== 1) {
                return null;
            }

            // the crc of the comment changed, this field is out of date.
            if (crc32fn(this.fileComment) !== extraReader.readInt(4)) {
                return null;
            }

            return utf8.utf8decode(extraReader.readData(ucommentField.length - 5));
        }
        return null;
    }
};
module.exports = ZipEntry;

},{"./compressedObject":42,"./compressions":43,"./crc32":44,"./reader/readerFor":61,"./support":69,"./utf8":70,"./utils":71}],74:[function(require,module,exports){
'use strict';

var StreamHelper = require('./stream/StreamHelper');
var DataWorker = require('./stream/DataWorker');
var utf8 = require('./utf8');
var CompressedObject = require('./compressedObject');
var GenericWorker = require('./stream/GenericWorker');

/**
 * A simple object representing a file in the zip file.
 * @constructor
 * @param {string} name the name of the file
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data
 * @param {Object} options the options of the file
 */
var ZipObject = function(name, data, options) {
    this.name = name;
    this.dir = options.dir;
    this.date = options.date;
    this.comment = options.comment;
    this.unixPermissions = options.unixPermissions;
    this.dosPermissions = options.dosPermissions;

    this._data = data;
    this._dataBinary = options.binary;
    // keep only the compression
    this.options = {
        compression : options.compression,
        compressionOptions : options.compressionOptions
    };
};

ZipObject.prototype = {
    /**
     * Create an internal stream for the content of this object.
     * @param {String} type the type of each chunk.
     * @return StreamHelper the stream.
     */
    internalStream: function (type) {
        var outputType = type.toLowerCase();
        var askUnicodeString = outputType === "string" || outputType === "text";
        if (outputType === "binarystring" || outputType === "text") {
            outputType = "string";
        }
        var result = this._decompressWorker();

        var isUnicodeString = !this._dataBinary;

        if (isUnicodeString && !askUnicodeString) {
            result = result.pipe(new utf8.Utf8EncodeWorker());
        }
        if (!isUnicodeString && askUnicodeString) {
            result = result.pipe(new utf8.Utf8DecodeWorker());
        }

        return new StreamHelper(result, outputType, "");
    },

    /**
     * Prepare the content in the asked type.
     * @param {String} type the type of the result.
     * @param {Function} onUpdate a function to call on each internal update.
     * @return Promise the promise of the result.
     */
    async: function (type, onUpdate) {
        return this.internalStream(type).accumulate(onUpdate);
    },

    /**
     * Prepare the content as a nodejs stream.
     * @param {String} type the type of each chunk.
     * @param {Function} onUpdate a function to call on each internal update.
     * @return Stream the stream.
     */
    nodeStream: function (type, onUpdate) {
        return this.internalStream(type || "nodebuffer").toNodejsStream(onUpdate);
    },

    /**
     * Return a worker for the compressed content.
     * @private
     * @param {Object} compression the compression object to use.
     * @param {Object} compressionOptions the options to use when compressing.
     * @return Worker the worker.
     */
    _compressWorker: function (compression, compressionOptions) {
        if (
            this._data instanceof CompressedObject &&
            this._data.compression.magic === compression.magic
        ) {
            return this._data.getCompressedWorker();
        } else {
            var result = this._decompressWorker();
            if(!this._dataBinary) {
                result = result.pipe(new utf8.Utf8EncodeWorker());
            }
            return CompressedObject.createWorkerFrom(result, compression, compressionOptions);
        }
    },
    /**
     * Return a worker for the decompressed content.
     * @private
     * @return Worker the worker.
     */
    _decompressWorker : function () {
        if (this._data instanceof CompressedObject) {
            return this._data.getContentWorker();
        } else if (this._data instanceof GenericWorker) {
            return this._data;
        } else {
            return new DataWorker(this._data);
        }
    }
};

var removedMethods = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"];
var removedFn = function () {
    throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
};

for(var i = 0; i < removedMethods.length; i++) {
    ZipObject.prototype[removedMethods[i]] = removedFn;
}
module.exports = ZipObject;

},{"./compressedObject":42,"./stream/DataWorker":66,"./stream/GenericWorker":67,"./stream/StreamHelper":68,"./utf8":70}],75:[function(require,module,exports){
'use strict';
var immediate = require('immediate');

/* istanbul ignore next */
function INTERNAL() {}

var handlers = {};

var REJECTED = ['REJECTED'];
var FULFILLED = ['FULFILLED'];
var PENDING = ['PENDING'];

module.exports = Promise;

function Promise(resolver) {
  if (typeof resolver !== 'function') {
    throw new TypeError('resolver must be a function');
  }
  this.state = PENDING;
  this.queue = [];
  this.outcome = void 0;
  if (resolver !== INTERNAL) {
    safelyResolveThenable(this, resolver);
  }
}

Promise.prototype["catch"] = function (onRejected) {
  return this.then(null, onRejected);
};
Promise.prototype.then = function (onFulfilled, onRejected) {
  if (typeof onFulfilled !== 'function' && this.state === FULFILLED ||
    typeof onRejected !== 'function' && this.state === REJECTED) {
    return this;
  }
  var promise = new this.constructor(INTERNAL);
  if (this.state !== PENDING) {
    var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
    unwrap(promise, resolver, this.outcome);
  } else {
    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
  }

  return promise;
};
function QueueItem(promise, onFulfilled, onRejected) {
  this.promise = promise;
  if (typeof onFulfilled === 'function') {
    this.onFulfilled = onFulfilled;
    this.callFulfilled = this.otherCallFulfilled;
  }
  if (typeof onRejected === 'function') {
    this.onRejected = onRejected;
    this.callRejected = this.otherCallRejected;
  }
}
QueueItem.prototype.callFulfilled = function (value) {
  handlers.resolve(this.promise, value);
};
QueueItem.prototype.otherCallFulfilled = function (value) {
  unwrap(this.promise, this.onFulfilled, value);
};
QueueItem.prototype.callRejected = function (value) {
  handlers.reject(this.promise, value);
};
QueueItem.prototype.otherCallRejected = function (value) {
  unwrap(this.promise, this.onRejected, value);
};

function unwrap(promise, func, value) {
  immediate(function () {
    var returnValue;
    try {
      returnValue = func(value);
    } catch (e) {
      return handlers.reject(promise, e);
    }
    if (returnValue === promise) {
      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
    } else {
      handlers.resolve(promise, returnValue);
    }
  });
}

handlers.resolve = function (self, value) {
  var result = tryCatch(getThen, value);
  if (result.status === 'error') {
    return handlers.reject(self, result.value);
  }
  var thenable = result.value;

  if (thenable) {
    safelyResolveThenable(self, thenable);
  } else {
    self.state = FULFILLED;
    self.outcome = value;
    var i = -1;
    var len = self.queue.length;
    while (++i < len) {
      self.queue[i].callFulfilled(value);
    }
  }
  return self;
};
handlers.reject = function (self, error) {
  self.state = REJECTED;
  self.outcome = error;
  var i = -1;
  var len = self.queue.length;
  while (++i < len) {
    self.queue[i].callRejected(error);
  }
  return self;
};

function getThen(obj) {
  // Make sure we only access the accessor once as required by the spec
  var then = obj && obj.then;
  if (obj && typeof obj === 'object' && typeof then === 'function') {
    return function appyThen() {
      then.apply(obj, arguments);
    };
  }
}

function safelyResolveThenable(self, thenable) {
  // Either fulfill, reject or reject with error
  var called = false;
  function onError(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.reject(self, value);
  }

  function onSuccess(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.resolve(self, value);
  }

  function tryToUnwrap() {
    thenable(onSuccess, onError);
  }

  var result = tryCatch(tryToUnwrap);
  if (result.status === 'error') {
    onError(result.value);
  }
}

function tryCatch(func, value) {
  var out = {};
  try {
    out.value = func(value);
    out.status = 'success';
  } catch (e) {
    out.status = 'error';
    out.value = e;
  }
  return out;
}

Promise.resolve = resolve;
function resolve(value) {
  if (value instanceof this) {
    return value;
  }
  return handlers.resolve(new this(INTERNAL), value);
}

Promise.reject = reject;
function reject(reason) {
  var promise = new this(INTERNAL);
  return handlers.reject(promise, reason);
}

Promise.all = all;
function all(iterable) {
  var self = this;
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return this.reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return this.resolve([]);
  }

  var values = new Array(len);
  var resolved = 0;
  var i = -1;
  var promise = new this(INTERNAL);

  while (++i < len) {
    allResolver(iterable[i], i);
  }
  return promise;
  function allResolver(value, i) {
    self.resolve(value).then(resolveFromAll, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
    function resolveFromAll(outValue) {
      values[i] = outValue;
      if (++resolved === len && !called) {
        called = true;
        handlers.resolve(promise, values);
      }
    }
  }
}

Promise.race = race;
function race(iterable) {
  var self = this;
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return this.reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return this.resolve([]);
  }

  var i = -1;
  var promise = new this(INTERNAL);

  while (++i < len) {
    resolver(iterable[i]);
  }
  return promise;
  function resolver(value) {
    self.resolve(value).then(function (response) {
      if (!called) {
        called = true;
        handlers.resolve(promise, response);
      }
    }, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
  }
}

},{"immediate":38}],76:[function(require,module,exports){
// Top level file is just a mixin of submodules & constants
'use strict';

var assign    = require('./lib/utils/common').assign;

var deflate   = require('./lib/deflate');
var inflate   = require('./lib/inflate');
var constants = require('./lib/zlib/constants');

var pako = {};

assign(pako, deflate, inflate, constants);

module.exports = pako;

},{"./lib/deflate":77,"./lib/inflate":78,"./lib/utils/common":79,"./lib/zlib/constants":82}],77:[function(require,module,exports){
'use strict';


var zlib_deflate = require('./zlib/deflate');
var utils        = require('./utils/common');
var strings      = require('./utils/strings');
var msg          = require('./zlib/messages');
var ZStream      = require('./zlib/zstream');

var toString = Object.prototype.toString;

/* Public constants ==========================================================*/
/* ===========================================================================*/

var Z_NO_FLUSH      = 0;
var Z_FINISH        = 4;

var Z_OK            = 0;
var Z_STREAM_END    = 1;
var Z_SYNC_FLUSH    = 2;

var Z_DEFAULT_COMPRESSION = -1;

var Z_DEFAULT_STRATEGY    = 0;

var Z_DEFLATED  = 8;

/* ===========================================================================*/


/**
 * class Deflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[deflate]],
 * [[deflateRaw]] and [[gzip]].
 **/

/* internal
 * Deflate.chunks -> Array
 *
 * Chunks of output data, if [[Deflate#onData]] not overriden.
 **/

/**
 * Deflate.result -> Uint8Array|Array
 *
 * Compressed result, generated by default [[Deflate#onData]]
 * and [[Deflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Deflate#push]] with `Z_FINISH` / `true` param)  or if you
 * push a chunk with explicit flush (call [[Deflate#push]] with
 * `Z_SYNC_FLUSH` param).
 **/

/**
 * Deflate.err -> Number
 *
 * Error code after deflate finished. 0 (Z_OK) on success.
 * You will not need it in real life, because deflate errors
 * are possible only on wrong options or bad `onData` / `onEnd`
 * custom handlers.
 **/

/**
 * Deflate.msg -> String
 *
 * Error message, if [[Deflate.err]] != 0
 **/


/**
 * new Deflate(options)
 * - options (Object): zlib deflate options.
 *
 * Creates new deflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `level`
 * - `windowBits`
 * - `memLevel`
 * - `strategy`
 * - `dictionary`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw deflate
 * - `gzip` (Boolean) - create gzip wrapper
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 * - `header` (Object) - custom header for gzip
 *   - `text` (Boolean) - true if compressed data believed to be text
 *   - `time` (Number) - modification time, unix timestamp
 *   - `os` (Number) - operation system code
 *   - `extra` (Array) - array of bytes with extra data (max 65536)
 *   - `name` (String) - file name (binary string)
 *   - `comment` (String) - comment (binary string)
 *   - `hcrc` (Boolean) - true if header crc should be added
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var deflate = new pako.Deflate({ level: 3});
 *
 * deflate.push(chunk1, false);
 * deflate.push(chunk2, true);  // true -> last chunk
 *
 * if (deflate.err) { throw new Error(deflate.err); }
 *
 * console.log(deflate.result);
 * ```
 **/
function Deflate(options) {
  if (!(this instanceof Deflate)) return new Deflate(options);

  this.options = utils.assign({
    level: Z_DEFAULT_COMPRESSION,
    method: Z_DEFLATED,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Z_DEFAULT_STRATEGY,
    to: ''
  }, options || {});

  var opt = this.options;

  if (opt.raw && (opt.windowBits > 0)) {
    opt.windowBits = -opt.windowBits;
  }

  else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
    opt.windowBits += 16;
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm = new ZStream();
  this.strm.avail_out = 0;

  var status = zlib_deflate.deflateInit2(
    this.strm,
    opt.level,
    opt.method,
    opt.windowBits,
    opt.memLevel,
    opt.strategy
  );

  if (status !== Z_OK) {
    throw new Error(msg[status]);
  }

  if (opt.header) {
    zlib_deflate.deflateSetHeader(this.strm, opt.header);
  }

  if (opt.dictionary) {
    var dict;
    // Convert data if needed
    if (typeof opt.dictionary === 'string') {
      // If we need to compress text, change encoding to utf8.
      dict = strings.string2buf(opt.dictionary);
    } else if (toString.call(opt.dictionary) === '[object ArrayBuffer]') {
      dict = new Uint8Array(opt.dictionary);
    } else {
      dict = opt.dictionary;
    }

    status = zlib_deflate.deflateSetDictionary(this.strm, dict);

    if (status !== Z_OK) {
      throw new Error(msg[status]);
    }

    this._dict_set = true;
  }
}

/**
 * Deflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|ArrayBuffer|String): input data. Strings will be
 *   converted to utf8 byte sequence.
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
 *
 * Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
 * new compressed chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
 * [[Deflate#onEnd]]. For interim explicit flushes (without ending the stream) you
 * can use mode Z_SYNC_FLUSH, keeping the compression context.
 *
 * On fail call [[Deflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * array format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Deflate.prototype.push = function (data, mode) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var status, _mode;

  if (this.ended) { return false; }

  _mode = (mode === ~~mode) ? mode : ((mode === true) ? Z_FINISH : Z_NO_FLUSH);

  // Convert data if needed
  if (typeof data === 'string') {
    // If we need to compress text, change encoding to utf8.
    strm.input = strings.string2buf(data);
  } else if (toString.call(data) === '[object ArrayBuffer]') {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  do {
    if (strm.avail_out === 0) {
      strm.output = new utils.Buf8(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    status = zlib_deflate.deflate(strm, _mode);    /* no bad return value */

    if (status !== Z_STREAM_END && status !== Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }
    if (strm.avail_out === 0 || (strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH))) {
      if (this.options.to === 'string') {
        this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
      } else {
        this.onData(utils.shrinkBuf(strm.output, strm.next_out));
      }
    }
  } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);

  // Finalize on the last chunk.
  if (_mode === Z_FINISH) {
    status = zlib_deflate.deflateEnd(this.strm);
    this.onEnd(status);
    this.ended = true;
    return status === Z_OK;
  }

  // callback interim results if Z_SYNC_FLUSH.
  if (_mode === Z_SYNC_FLUSH) {
    this.onEnd(Z_OK);
    strm.avail_out = 0;
    return true;
  }

  return true;
};


/**
 * Deflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Deflate.prototype.onData = function (chunk) {
  this.chunks.push(chunk);
};


/**
 * Deflate#onEnd(status) -> Void
 * - status (Number): deflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called once after you tell deflate that the input stream is
 * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
 * or if an error happened. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Deflate.prototype.onEnd = function (status) {
  // On success - join
  if (status === Z_OK) {
    if (this.options.to === 'string') {
      this.result = this.chunks.join('');
    } else {
      this.result = utils.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * deflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * Compress `data` with deflate algorithm and `options`.
 *
 * Supported options are:
 *
 * - level
 * - windowBits
 * - memLevel
 * - strategy
 * - dictionary
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , data = Uint8Array([1,2,3,4,5,6,7,8,9]);
 *
 * console.log(pako.deflate(data));
 * ```
 **/
function deflate(input, options) {
  var deflator = new Deflate(options);

  deflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (deflator.err) { throw deflator.msg; }

  return deflator.result;
}


/**
 * deflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function deflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return deflate(input, options);
}


/**
 * gzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but create gzip wrapper instead of
 * deflate one.
 **/
function gzip(input, options) {
  options = options || {};
  options.gzip = true;
  return deflate(input, options);
}


exports.Deflate = Deflate;
exports.deflate = deflate;
exports.deflateRaw = deflateRaw;
exports.gzip = gzip;

},{"./utils/common":79,"./utils/strings":80,"./zlib/deflate":84,"./zlib/messages":89,"./zlib/zstream":91}],78:[function(require,module,exports){
'use strict';


var zlib_inflate = require('./zlib/inflate');
var utils        = require('./utils/common');
var strings      = require('./utils/strings');
var c            = require('./zlib/constants');
var msg          = require('./zlib/messages');
var ZStream      = require('./zlib/zstream');
var GZheader     = require('./zlib/gzheader');

var toString = Object.prototype.toString;

/**
 * class Inflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[inflate]]
 * and [[inflateRaw]].
 **/

/* internal
 * inflate.chunks -> Array
 *
 * Chunks of output data, if [[Inflate#onData]] not overriden.
 **/

/**
 * Inflate.result -> Uint8Array|Array|String
 *
 * Uncompressed result, generated by default [[Inflate#onData]]
 * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Inflate#push]] with `Z_FINISH` / `true` param) or if you
 * push a chunk with explicit flush (call [[Inflate#push]] with
 * `Z_SYNC_FLUSH` param).
 **/

/**
 * Inflate.err -> Number
 *
 * Error code after inflate finished. 0 (Z_OK) on success.
 * Should be checked if broken data possible.
 **/

/**
 * Inflate.msg -> String
 *
 * Error message, if [[Inflate.err]] != 0
 **/


/**
 * new Inflate(options)
 * - options (Object): zlib inflate options.
 *
 * Creates new inflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `windowBits`
 * - `dictionary`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw inflate
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 * By default, when no options set, autodetect deflate/gzip data format via
 * wrapper header.
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var inflate = new pako.Inflate({ level: 3});
 *
 * inflate.push(chunk1, false);
 * inflate.push(chunk2, true);  // true -> last chunk
 *
 * if (inflate.err) { throw new Error(inflate.err); }
 *
 * console.log(inflate.result);
 * ```
 **/
function Inflate(options) {
  if (!(this instanceof Inflate)) return new Inflate(options);

  this.options = utils.assign({
    chunkSize: 16384,
    windowBits: 0,
    to: ''
  }, options || {});

  var opt = this.options;

  // Force window size for `raw` data, if not set directly,
  // because we have no header for autodetect.
  if (opt.raw && (opt.windowBits >= 0) && (opt.windowBits < 16)) {
    opt.windowBits = -opt.windowBits;
    if (opt.windowBits === 0) { opt.windowBits = -15; }
  }

  // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
  if ((opt.windowBits >= 0) && (opt.windowBits < 16) &&
      !(options && options.windowBits)) {
    opt.windowBits += 32;
  }

  // Gzip header has no info about windows size, we can do autodetect only
  // for deflate. So, if window size not set, force it to max when gzip possible
  if ((opt.windowBits > 15) && (opt.windowBits < 48)) {
    // bit 3 (16) -> gzipped data
    // bit 4 (32) -> autodetect gzip/deflate
    if ((opt.windowBits & 15) === 0) {
      opt.windowBits |= 15;
    }
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm   = new ZStream();
  this.strm.avail_out = 0;

  var status  = zlib_inflate.inflateInit2(
    this.strm,
    opt.windowBits
  );

  if (status !== c.Z_OK) {
    throw new Error(msg[status]);
  }

  this.header = new GZheader();

  zlib_inflate.inflateGetHeader(this.strm, this.header);
}

/**
 * Inflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|ArrayBuffer|String): input data
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
 *
 * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
 * new output chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
 * [[Inflate#onEnd]]. For interim explicit flushes (without ending the stream) you
 * can use mode Z_SYNC_FLUSH, keeping the decompression context.
 *
 * On fail call [[Inflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Inflate.prototype.push = function (data, mode) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var dictionary = this.options.dictionary;
  var status, _mode;
  var next_out_utf8, tail, utf8str;
  var dict;

  // Flag to properly process Z_BUF_ERROR on testing inflate call
  // when we check that all output data was flushed.
  var allowBufError = false;

  if (this.ended) { return false; }
  _mode = (mode === ~~mode) ? mode : ((mode === true) ? c.Z_FINISH : c.Z_NO_FLUSH);

  // Convert data if needed
  if (typeof data === 'string') {
    // Only binary strings can be decompressed on practice
    strm.input = strings.binstring2buf(data);
  } else if (toString.call(data) === '[object ArrayBuffer]') {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  do {
    if (strm.avail_out === 0) {
      strm.output = new utils.Buf8(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }

    status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);    /* no bad return value */

    if (status === c.Z_NEED_DICT && dictionary) {
      // Convert data if needed
      if (typeof dictionary === 'string') {
        dict = strings.string2buf(dictionary);
      } else if (toString.call(dictionary) === '[object ArrayBuffer]') {
        dict = new Uint8Array(dictionary);
      } else {
        dict = dictionary;
      }

      status = zlib_inflate.inflateSetDictionary(this.strm, dict);

    }

    if (status === c.Z_BUF_ERROR && allowBufError === true) {
      status = c.Z_OK;
      allowBufError = false;
    }

    if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }

    if (strm.next_out) {
      if (strm.avail_out === 0 || status === c.Z_STREAM_END || (strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH))) {

        if (this.options.to === 'string') {

          next_out_utf8 = strings.utf8border(strm.output, strm.next_out);

          tail = strm.next_out - next_out_utf8;
          utf8str = strings.buf2string(strm.output, next_out_utf8);

          // move tail
          strm.next_out = tail;
          strm.avail_out = chunkSize - tail;
          if (tail) { utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0); }

          this.onData(utf8str);

        } else {
          this.onData(utils.shrinkBuf(strm.output, strm.next_out));
        }
      }
    }

    // When no more input data, we should check that internal inflate buffers
    // are flushed. The only way to do it when avail_out = 0 - run one more
    // inflate pass. But if output data not exists, inflate return Z_BUF_ERROR.
    // Here we set flag to process this error properly.
    //
    // NOTE. Deflate does not return error in this case and does not needs such
    // logic.
    if (strm.avail_in === 0 && strm.avail_out === 0) {
      allowBufError = true;
    }

  } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);

  if (status === c.Z_STREAM_END) {
    _mode = c.Z_FINISH;
  }

  // Finalize on the last chunk.
  if (_mode === c.Z_FINISH) {
    status = zlib_inflate.inflateEnd(this.strm);
    this.onEnd(status);
    this.ended = true;
    return status === c.Z_OK;
  }

  // callback interim results if Z_SYNC_FLUSH.
  if (_mode === c.Z_SYNC_FLUSH) {
    this.onEnd(c.Z_OK);
    strm.avail_out = 0;
    return true;
  }

  return true;
};


/**
 * Inflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Inflate.prototype.onData = function (chunk) {
  this.chunks.push(chunk);
};


/**
 * Inflate#onEnd(status) -> Void
 * - status (Number): inflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called either after you tell inflate that the input stream is
 * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
 * or if an error happened. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Inflate.prototype.onEnd = function (status) {
  // On success - join
  if (status === c.Z_OK) {
    if (this.options.to === 'string') {
      // Glue & convert here, until we teach pako to send
      // utf8 alligned strings to onData
      this.result = this.chunks.join('');
    } else {
      this.result = utils.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * inflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Decompress `data` with inflate/ungzip and `options`. Autodetect
 * format via wrapper header by default. That's why we don't provide
 * separate `ungzip` method.
 *
 * Supported options are:
 *
 * - windowBits
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
 *   , output;
 *
 * try {
 *   output = pako.inflate(input);
 * } catch (err)
 *   console.log(err);
 * }
 * ```
 **/
function inflate(input, options) {
  var inflator = new Inflate(options);

  inflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (inflator.err) { throw inflator.msg; }

  return inflator.result;
}


/**
 * inflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * The same as [[inflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function inflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return inflate(input, options);
}


/**
 * ungzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Just shortcut to [[inflate]], because it autodetects format
 * by header.content. Done for convenience.
 **/


exports.Inflate = Inflate;
exports.inflate = inflate;
exports.inflateRaw = inflateRaw;
exports.ungzip  = inflate;

},{"./utils/common":79,"./utils/strings":80,"./zlib/constants":82,"./zlib/gzheader":85,"./zlib/inflate":87,"./zlib/messages":89,"./zlib/zstream":91}],79:[function(require,module,exports){
'use strict';


var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
                (typeof Uint16Array !== 'undefined') &&
                (typeof Int32Array !== 'undefined');


exports.assign = function (obj /*from1, from2, from3, ...*/) {
  var sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    var source = sources.shift();
    if (!source) { continue; }

    if (typeof source !== 'object') {
      throw new TypeError(source + 'must be non-object');
    }

    for (var p in source) {
      if (source.hasOwnProperty(p)) {
        obj[p] = source[p];
      }
    }
  }

  return obj;
};


// reduce buffer size, avoiding mem copy
exports.shrinkBuf = function (buf, size) {
  if (buf.length === size) { return buf; }
  if (buf.subarray) { return buf.subarray(0, size); }
  buf.length = size;
  return buf;
};


var fnTyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    if (src.subarray && dest.subarray) {
      dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
      return;
    }
    // Fallback to ordinary array
    for (var i = 0; i < len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function (chunks) {
    var i, l, len, pos, chunk, result;

    // calculate data length
    len = 0;
    for (i = 0, l = chunks.length; i < l; i++) {
      len += chunks[i].length;
    }

    // join chunks
    result = new Uint8Array(len);
    pos = 0;
    for (i = 0, l = chunks.length; i < l; i++) {
      chunk = chunks[i];
      result.set(chunk, pos);
      pos += chunk.length;
    }

    return result;
  }
};

var fnUntyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    for (var i = 0; i < len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function (chunks) {
    return [].concat.apply([], chunks);
  }
};


// Enable/Disable typed arrays use, for testing
//
exports.setTyped = function (on) {
  if (on) {
    exports.Buf8  = Uint8Array;
    exports.Buf16 = Uint16Array;
    exports.Buf32 = Int32Array;
    exports.assign(exports, fnTyped);
  } else {
    exports.Buf8  = Array;
    exports.Buf16 = Array;
    exports.Buf32 = Array;
    exports.assign(exports, fnUntyped);
  }
};

exports.setTyped(TYPED_OK);

},{}],80:[function(require,module,exports){
// String encode/decode helpers
'use strict';


var utils = require('./common');


// Quick check if we can use fast array to bin string conversion
//
// - apply(Array) can fail on Android 2.2
// - apply(Uint8Array) can fail on iOS 5.1 Safary
//
var STR_APPLY_OK = true;
var STR_APPLY_UIA_OK = true;

try { String.fromCharCode.apply(null, [ 0 ]); } catch (__) { STR_APPLY_OK = false; }
try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch (__) { STR_APPLY_UIA_OK = false; }


// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
var _utf8len = new utils.Buf8(256);
for (var q = 0; q < 256; q++) {
  _utf8len[q] = (q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1);
}
_utf8len[254] = _utf8len[254] = 1; // Invalid sequence start


// convert string to array (typed, when possible)
exports.string2buf = function (str) {
  var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

  // count binary size
  for (m_pos = 0; m_pos < str_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  // allocate buffer
  buf = new utils.Buf8(buf_len);

  // convert
  for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    if (c < 0x80) {
      /* one byte */
      buf[i++] = c;
    } else if (c < 0x800) {
      /* two bytes */
      buf[i++] = 0xC0 | (c >>> 6);
      buf[i++] = 0x80 | (c & 0x3f);
    } else if (c < 0x10000) {
      /* three bytes */
      buf[i++] = 0xE0 | (c >>> 12);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    } else {
      /* four bytes */
      buf[i++] = 0xf0 | (c >>> 18);
      buf[i++] = 0x80 | (c >>> 12 & 0x3f);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    }
  }

  return buf;
};

// Helper (used in 2 places)
function buf2binstring(buf, len) {
  // use fallback for big arrays to avoid stack overflow
  if (len < 65537) {
    if ((buf.subarray && STR_APPLY_UIA_OK) || (!buf.subarray && STR_APPLY_OK)) {
      return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
    }
  }

  var result = '';
  for (var i = 0; i < len; i++) {
    result += String.fromCharCode(buf[i]);
  }
  return result;
}


// Convert byte array to binary string
exports.buf2binstring = function (buf) {
  return buf2binstring(buf, buf.length);
};


// Convert binary string (typed, when possible)
exports.binstring2buf = function (str) {
  var buf = new utils.Buf8(str.length);
  for (var i = 0, len = buf.length; i < len; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
};


// convert array to string
exports.buf2string = function (buf, max) {
  var i, out, c, c_len;
  var len = max || buf.length;

  // Reserve max possible length (2 words per char)
  // NB: by unknown reasons, Array is significantly faster for
  //     String.fromCharCode.apply than Uint16Array.
  var utf16buf = new Array(len * 2);

  for (out = 0, i = 0; i < len;) {
    c = buf[i++];
    // quick process ascii
    if (c < 0x80) { utf16buf[out++] = c; continue; }

    c_len = _utf8len[c];
    // skip 5 & 6 byte codes
    if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len - 1; continue; }

    // apply mask on first byte
    c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
    // join the rest
    while (c_len > 1 && i < len) {
      c = (c << 6) | (buf[i++] & 0x3f);
      c_len--;
    }

    // terminated by end of string?
    if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

    if (c < 0x10000) {
      utf16buf[out++] = c;
    } else {
      c -= 0x10000;
      utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
      utf16buf[out++] = 0xdc00 | (c & 0x3ff);
    }
  }

  return buf2binstring(utf16buf, out);
};


// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
exports.utf8border = function (buf, max) {
  var pos;

  max = max || buf.length;
  if (max > buf.length) { max = buf.length; }

  // go back from last position, until start of sequence found
  pos = max - 1;
  while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

  // Fuckup - very small and broken sequence,
  // return max, because we should return something anyway.
  if (pos < 0) { return max; }

  // If we came to start of buffer - that means vuffer is too small,
  // return max too.
  if (pos === 0) { return max; }

  return (pos + _utf8len[buf[pos]] > max) ? pos : max;
};

},{"./common":79}],81:[function(require,module,exports){
'use strict';

// Note: adler32 takes 12% for level 0 and 2% for level 6.
// It doesn't worth to make additional optimizationa as in original.
// Small size is preferable.

function adler32(adler, buf, len, pos) {
  var s1 = (adler & 0xffff) |0,
      s2 = ((adler >>> 16) & 0xffff) |0,
      n = 0;

  while (len !== 0) {
    // Set limit ~ twice less than 5552, to keep
    // s2 in 31-bits, because we force signed ints.
    // in other case %= will fail.
    n = len > 2000 ? 2000 : len;
    len -= n;

    do {
      s1 = (s1 + buf[pos++]) |0;
      s2 = (s2 + s1) |0;
    } while (--n);

    s1 %= 65521;
    s2 %= 65521;
  }

  return (s1 | (s2 << 16)) |0;
}


module.exports = adler32;

},{}],82:[function(require,module,exports){
'use strict';


module.exports = {

  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH:         0,
  Z_PARTIAL_FLUSH:    1,
  Z_SYNC_FLUSH:       2,
  Z_FULL_FLUSH:       3,
  Z_FINISH:           4,
  Z_BLOCK:            5,
  Z_TREES:            6,

  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK:               0,
  Z_STREAM_END:       1,
  Z_NEED_DICT:        2,
  Z_ERRNO:           -1,
  Z_STREAM_ERROR:    -2,
  Z_DATA_ERROR:      -3,
  //Z_MEM_ERROR:     -4,
  Z_BUF_ERROR:       -5,
  //Z_VERSION_ERROR: -6,

  /* compression levels */
  Z_NO_COMPRESSION:         0,
  Z_BEST_SPEED:             1,
  Z_BEST_COMPRESSION:       9,
  Z_DEFAULT_COMPRESSION:   -1,


  Z_FILTERED:               1,
  Z_HUFFMAN_ONLY:           2,
  Z_RLE:                    3,
  Z_FIXED:                  4,
  Z_DEFAULT_STRATEGY:       0,

  /* Possible values of the data_type field (though see inflate()) */
  Z_BINARY:                 0,
  Z_TEXT:                   1,
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN:                2,

  /* The deflate compression method */
  Z_DEFLATED:               8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};

},{}],83:[function(require,module,exports){
'use strict';

// Note: we can't get significant speed boost here.
// So write code to minimize size - no pregenerated tables
// and array tools dependencies.


// Use ordinary array, since untyped makes no boost here
function makeTable() {
  var c, table = [];

  for (var n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }

  return table;
}

// Create table on load. Just 255 signed longs. Not a problem.
var crcTable = makeTable();


function crc32(crc, buf, len, pos) {
  var t = crcTable,
      end = pos + len;

  crc ^= -1;

  for (var i = pos; i < end; i++) {
    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  }

  return (crc ^ (-1)); // >>> 0;
}


module.exports = crc32;

},{}],84:[function(require,module,exports){
'use strict';

var utils   = require('../utils/common');
var trees   = require('./trees');
var adler32 = require('./adler32');
var crc32   = require('./crc32');
var msg     = require('./messages');

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
var Z_NO_FLUSH      = 0;
var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
//var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
//var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
//var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;


/* compression levels */
//var Z_NO_COMPRESSION      = 0;
//var Z_BEST_SPEED          = 1;
//var Z_BEST_COMPRESSION    = 9;
var Z_DEFAULT_COMPRESSION = -1;


var Z_FILTERED            = 1;
var Z_HUFFMAN_ONLY        = 2;
var Z_RLE                 = 3;
var Z_FIXED               = 4;
var Z_DEFAULT_STRATEGY    = 0;

/* Possible values of the data_type field (though see inflate()) */
//var Z_BINARY              = 0;
//var Z_TEXT                = 1;
//var Z_ASCII               = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;


/* The deflate compression method */
var Z_DEFLATED  = 8;

/*============================================================================*/


var MAX_MEM_LEVEL = 9;
/* Maximum value for memLevel in deflateInit2 */
var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_MEM_LEVEL = 8;


var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */
var LITERALS      = 256;
/* number of literal bytes 0..255 */
var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */
var D_CODES       = 30;
/* number of distance codes */
var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */
var HEAP_SIZE     = 2 * L_CODES + 1;
/* maximum heap size */
var MAX_BITS  = 15;
/* All codes must not exceed MAX_BITS bits */

var MIN_MATCH = 3;
var MAX_MATCH = 258;
var MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

var PRESET_DICT = 0x20;

var INIT_STATE = 42;
var EXTRA_STATE = 69;
var NAME_STATE = 73;
var COMMENT_STATE = 91;
var HCRC_STATE = 103;
var BUSY_STATE = 113;
var FINISH_STATE = 666;

var BS_NEED_MORE      = 1; /* block not completed, need more input or more output */
var BS_BLOCK_DONE     = 2; /* block flush performed */
var BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
var BS_FINISH_DONE    = 4; /* finish done, accept no more input or output */

var OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

function err(strm, errorCode) {
  strm.msg = msg[errorCode];
  return errorCode;
}

function rank(f) {
  return ((f) << 1) - ((f) > 4 ? 9 : 0);
}

function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }


/* =========================================================================
 * Flush as much pending output as possible. All deflate() output goes
 * through this function so some applications may wish to modify it
 * to avoid allocating a large strm->output buffer and copying into it.
 * (See also read_buf()).
 */
function flush_pending(strm) {
  var s = strm.state;

  //_tr_flush_bits(s);
  var len = s.pending;
  if (len > strm.avail_out) {
    len = strm.avail_out;
  }
  if (len === 0) { return; }

  utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
}


function flush_block_only(s, last) {
  trees._tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
}


function put_byte(s, b) {
  s.pending_buf[s.pending++] = b;
}


/* =========================================================================
 * Put a short in the pending buffer. The 16-bit value is put in MSB order.
 * IN assertion: the stream state is correct and there is enough room in
 * pending_buf.
 */
function putShortMSB(s, b) {
//  put_byte(s, (Byte)(b >> 8));
//  put_byte(s, (Byte)(b & 0xff));
  s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
  s.pending_buf[s.pending++] = b & 0xff;
}


/* ===========================================================================
 * Read a new buffer from the current input stream, update the adler32
 * and total number of bytes read.  All deflate() input goes through
 * this function so some applications may wish to modify it to avoid
 * allocating a large strm->input buffer and copying from it.
 * (See also flush_pending()).
 */
function read_buf(strm, buf, start, size) {
  var len = strm.avail_in;

  if (len > size) { len = size; }
  if (len === 0) { return 0; }

  strm.avail_in -= len;

  // zmemcpy(buf, strm->next_in, len);
  utils.arraySet(buf, strm.input, strm.next_in, len, start);
  if (strm.state.wrap === 1) {
    strm.adler = adler32(strm.adler, buf, len, start);
  }

  else if (strm.state.wrap === 2) {
    strm.adler = crc32(strm.adler, buf, len, start);
  }

  strm.next_in += len;
  strm.total_in += len;

  return len;
}


/* ===========================================================================
 * Set match_start to the longest match starting at the given string and
 * return its length. Matches shorter or equal to prev_length are discarded,
 * in which case the result is equal to prev_length and match_start is
 * garbage.
 * IN assertions: cur_match is the head of the hash chain for the current
 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
 * OUT assertion: the match length is not greater than s->lookahead.
 */
function longest_match(s, cur_match) {
  var chain_length = s.max_chain_length;      /* max hash chain length */
  var scan = s.strstart; /* current string */
  var match;                       /* matched string */
  var len;                           /* length of current match */
  var best_len = s.prev_length;              /* best match length so far */
  var nice_match = s.nice_match;             /* stop if match long enough */
  var limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
      s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0/*NIL*/;

  var _win = s.window; // shortcut

  var wmask = s.w_mask;
  var prev  = s.prev;

  /* Stop when cur_match becomes <= limit. To simplify the code,
   * we prevent matches with the string of window index 0.
   */

  var strend = s.strstart + MAX_MATCH;
  var scan_end1  = _win[scan + best_len - 1];
  var scan_end   = _win[scan + best_len];

  /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
   * It is easy to get rid of this optimization if necessary.
   */
  // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

  /* Do not waste too much time if we already have a good match: */
  if (s.prev_length >= s.good_match) {
    chain_length >>= 2;
  }
  /* Do not look for matches beyond the end of the input. This is necessary
   * to make deflate deterministic.
   */
  if (nice_match > s.lookahead) { nice_match = s.lookahead; }

  // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

  do {
    // Assert(cur_match < s->strstart, "no future");
    match = cur_match;

    /* Skip to next match if the match length cannot increase
     * or if the match length is less than 2.  Note that the checks below
     * for insufficient lookahead only occur occasionally for performance
     * reasons.  Therefore uninitialized memory will be accessed, and
     * conditional jumps will be made that depend on those values.
     * However the length of the match is limited to the lookahead, so
     * the output of deflate is not affected by the uninitialized values.
     */

    if (_win[match + best_len]     !== scan_end  ||
        _win[match + best_len - 1] !== scan_end1 ||
        _win[match]                !== _win[scan] ||
        _win[++match]              !== _win[scan + 1]) {
      continue;
    }

    /* The check at best_len-1 can be removed because it will be made
     * again later. (This heuristic is not always a win.)
     * It is not necessary to compare scan[2] and match[2] since they
     * are always equal when the other bytes match, given that
     * the hash keys are equal and that HASH_BITS >= 8.
     */
    scan += 2;
    match++;
    // Assert(*scan == *match, "match[2]?");

    /* We check for insufficient lookahead only every 8th comparison;
     * the 256th check will be made at strstart+258.
     */
    do {
      /*jshint noempty:false*/
    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             scan < strend);

    // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;

    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) {
        break;
      }
      scan_end1  = _win[scan + best_len - 1];
      scan_end   = _win[scan + best_len];
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

  if (best_len <= s.lookahead) {
    return best_len;
  }
  return s.lookahead;
}


/* ===========================================================================
 * Fill the window when the lookahead becomes insufficient.
 * Updates strstart and lookahead.
 *
 * IN assertion: lookahead < MIN_LOOKAHEAD
 * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
 *    At least one byte has been read, or avail_in == 0; reads are
 *    performed for at least two bytes (required for the zip translate_eol
 *    option -- not supported here).
 */
function fill_window(s) {
  var _w_size = s.w_size;
  var p, n, m, more, str;

  //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

  do {
    more = s.window_size - s.lookahead - s.strstart;

    // JS ints have 32 bit, block below not needed
    /* Deal with !@#$% 64K limit: */
    //if (sizeof(int) <= 2) {
    //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
    //        more = wsize;
    //
    //  } else if (more == (unsigned)(-1)) {
    //        /* Very unlikely, but possible on 16 bit machine if
    //         * strstart == 0 && lookahead == 1 (input done a byte at time)
    //         */
    //        more--;
    //    }
    //}


    /* If the window is almost full and there is insufficient lookahead,
     * move the upper half to the lower one to make room in the upper half.
     */
    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

      utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      /* we now have strstart >= MAX_DIST */
      s.block_start -= _w_size;

      /* Slide the hash table (could be avoided with 32 bit values
       at the expense of memory usage). We slide even when level == 0
       to keep the hash table consistent if we switch back to level > 0
       later. (Using level 0 permanently is not an optimal usage of
       zlib, so we don't care about this pathological case.)
       */

      n = s.hash_size;
      p = n;
      do {
        m = s.head[--p];
        s.head[p] = (m >= _w_size ? m - _w_size : 0);
      } while (--n);

      n = _w_size;
      p = n;
      do {
        m = s.prev[--p];
        s.prev[p] = (m >= _w_size ? m - _w_size : 0);
        /* If n is not on any hash chain, prev[n] is garbage but
         * its value will never be used.
         */
      } while (--n);

      more += _w_size;
    }
    if (s.strm.avail_in === 0) {
      break;
    }

    /* If there was no sliding:
     *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
     *    more == window_size - lookahead - strstart
     * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
     * => more >= window_size - 2*WSIZE + 2
     * In the BIG_MEM or MMAP case (not yet supported),
     *   window_size == input_size + MIN_LOOKAHEAD  &&
     *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
     * Otherwise, window_size == 2*WSIZE so more >= 2.
     * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
     */
    //Assert(more >= 2, "more < 2");
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;

    /* Initialize the hash value now that we have some input: */
    if (s.lookahead + s.insert >= MIN_MATCH) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];

      /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 1]) & s.hash_mask;
//#if MIN_MATCH != 3
//        Call update_hash() MIN_MATCH-3 more times
//#endif
      while (s.insert) {
        /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;

        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) {
          break;
        }
      }
    }
    /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
     * but this is not important since only literal bytes will be emitted.
     */

  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

  /* If the WIN_INIT bytes after the end of the current data have never been
   * written, then zero those bytes in order to avoid memory check reports of
   * the use of uninitialized (or uninitialised as Julian writes) bytes by
   * the longest match routines.  Update the high water mark for the next
   * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
   * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
   */
//  if (s.high_water < s.window_size) {
//    var curr = s.strstart + s.lookahead;
//    var init = 0;
//
//    if (s.high_water < curr) {
//      /* Previous high water mark below current data -- zero WIN_INIT
//       * bytes or up to end of window, whichever is less.
//       */
//      init = s.window_size - curr;
//      if (init > WIN_INIT)
//        init = WIN_INIT;
//      zmemzero(s->window + curr, (unsigned)init);
//      s->high_water = curr + init;
//    }
//    else if (s->high_water < (ulg)curr + WIN_INIT) {
//      /* High water mark at or above current data, but below current data
//       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
//       * to end of window, whichever is less.
//       */
//      init = (ulg)curr + WIN_INIT - s->high_water;
//      if (init > s->window_size - s->high_water)
//        init = s->window_size - s->high_water;
//      zmemzero(s->window + s->high_water, (unsigned)init);
//      s->high_water += init;
//    }
//  }
//
//  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
//    "not enough room for search");
}

/* ===========================================================================
 * Copy without compression as much as possible from the input stream, return
 * the current block state.
 * This function does not insert new strings in the dictionary since
 * uncompressible data is probably not useful. This function is used
 * only for the level=0 compression option.
 * NOTE: this function should be optimized to avoid extra copying from
 * window to pending_buf.
 */
function deflate_stored(s, flush) {
  /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
   * to pending_buf_size, and each stored block has a 5 byte header:
   */
  var max_block_size = 0xffff;

  if (max_block_size > s.pending_buf_size - 5) {
    max_block_size = s.pending_buf_size - 5;
  }

  /* Copy as much as possible from input to output: */
  for (;;) {
    /* Fill the window as much as possible: */
    if (s.lookahead <= 1) {

      //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
      //  s->block_start >= (long)s->w_size, "slide too late");
//      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
//        s.block_start >= s.w_size)) {
//        throw  new Error("slide too late");
//      }

      fill_window(s);
      if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }

      if (s.lookahead === 0) {
        break;
      }
      /* flush the current block */
    }
    //Assert(s->block_start >= 0L, "block gone");
//    if (s.block_start < 0) throw new Error("block gone");

    s.strstart += s.lookahead;
    s.lookahead = 0;

    /* Emit a stored block if pending_buf will be full: */
    var max_start = s.block_start + max_block_size;

    if (s.strstart === 0 || s.strstart >= max_start) {
      /* strstart == 0 is possible when wraparound on 16-bit machine */
      s.lookahead = s.strstart - max_start;
      s.strstart = max_start;
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/


    }
    /* Flush if we may have to slide, otherwise block_start may become
     * negative and the data will be gone:
     */
    if (s.strstart - s.block_start >= (s.w_size - MIN_LOOKAHEAD)) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }

  s.insert = 0;

  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }

  if (s.strstart > s.block_start) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_NEED_MORE;
}

/* ===========================================================================
 * Compress as much as possible from the input stream, return the current
 * block state.
 * This function does not perform lazy evaluation of matches and inserts
 * new strings in the dictionary only for unmatched strings or for short
 * matches. It is used only for the fast compression options.
 */
function deflate_fast(s, flush) {
  var hash_head;        /* head of the hash chain */
  var bflush;           /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break; /* flush the current block */
      }
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     * At this point we have always match_length < MIN_MATCH
     */
    if (hash_head !== 0/*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */
    }
    if (s.match_length >= MIN_MATCH) {
      // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

      /*** _tr_tally_dist(s, s.strstart - s.match_start,
                     s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;

      /* Insert new strings in the hash table only if the match length
       * is not too large. This saves time but degrades compression.
       */
      if (s.match_length <= s.max_lazy_match/*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
        s.match_length--; /* string at strstart already in table */
        do {
          s.strstart++;
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
          /* strstart never exceeds WSIZE-MAX_MATCH, so there are
           * always MIN_MATCH bytes ahead.
           */
        } while (--s.match_length !== 0);
        s.strstart++;
      } else
      {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 1]) & s.hash_mask;

//#if MIN_MATCH != 3
//                Call UPDATE_HASH() MIN_MATCH-3 more times
//#endif
        /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
         * matter since it will be recomputed at next deflate call.
         */
      }
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s.window[s.strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = ((s.strstart < (MIN_MATCH - 1)) ? s.strstart : MIN_MATCH - 1);
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * Same as above, but achieves better compression. We use a lazy
 * evaluation for matches: a match is finally adopted only if there is
 * no better match at the next window position.
 */
function deflate_slow(s, flush) {
  var hash_head;          /* head of hash chain */
  var bflush;              /* set if current block must be flushed */

  var max_insert;

  /* Process the input block. */
  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     */
    s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH - 1;

    if (hash_head !== 0/*NIL*/ && s.prev_length < s.max_lazy_match &&
        s.strstart - hash_head <= (s.w_size - MIN_LOOKAHEAD)/*MAX_DIST(s)*/) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */

      if (s.match_length <= 5 &&
         (s.strategy === Z_FILTERED || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096/*TOO_FAR*/))) {

        /* If prev_match is also MIN_MATCH, match_start is garbage
         * but we will ignore the current match anyway.
         */
        s.match_length = MIN_MATCH - 1;
      }
    }
    /* If there was a match at the previous step and the current
     * match is not better, output the previous match:
     */
    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      /* Do not insert strings in hash table beyond this. */

      //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

      /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                     s.prev_length - MIN_MATCH, bflush);***/
      bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
      /* Insert in hash table all strings up to the end of the match.
       * strstart-1 and strstart are already inserted. If there is not
       * enough lookahead, the last two strings are not inserted in
       * the hash table.
       */
      s.lookahead -= s.prev_length - 1;
      s.prev_length -= 2;
      do {
        if (++s.strstart <= max_insert) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }
      } while (--s.prev_length !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH - 1;
      s.strstart++;

      if (bflush) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }

    } else if (s.match_available) {
      /* If there was no match at the previous position, output a
       * single literal. If there was a match but the current match
       * is longer, truncate the previous match to a single literal.
       */
      //Tracevv((stderr,"%c", s->window[s->strstart-1]));
      /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);

      if (bflush) {
        /*** FLUSH_BLOCK_ONLY(s, 0) ***/
        flush_block_only(s, false);
        /***/
      }
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    } else {
      /* There is no previous match to compare with, wait for
       * the next step to decide.
       */
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  //Assert (flush != Z_NO_FLUSH, "no flush?");
  if (s.match_available) {
    //Tracevv((stderr,"%c", s->window[s->strstart-1]));
    /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);

    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_BLOCK_DONE;
}


/* ===========================================================================
 * For Z_RLE, simply look for runs of bytes, generate matches only of distance
 * one.  Do not maintain a hash table.  (It will be regenerated if this run of
 * deflate switches away from Z_RLE.)
 */
function deflate_rle(s, flush) {
  var bflush;            /* set if current block must be flushed */
  var prev;              /* byte at distance one to match */
  var scan, strend;      /* scan goes up to strend for length of run */

  var _win = s.window;

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the longest run, plus one for the unrolled loop.
     */
    if (s.lookahead <= MAX_MATCH) {
      fill_window(s);
      if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* See how many times the previous byte repeats */
    s.match_length = 0;
    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
      scan = s.strstart - 1;
      prev = _win[scan];
      if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
        strend = s.strstart + MAX_MATCH;
        do {
          /*jshint noempty:false*/
        } while (prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 scan < strend);
        s.match_length = MAX_MATCH - (strend - scan);
        if (s.match_length > s.lookahead) {
          s.match_length = s.lookahead;
        }
      }
      //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
    }

    /* Emit match if have run of MIN_MATCH or longer, else emit literal */
    if (s.match_length >= MIN_MATCH) {
      //check_match(s, s.strstart, s.strstart - 1, s.match_length);

      /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s->window[s->strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
 * (It will be regenerated if this run of deflate switches away from Huffman.)
 */
function deflate_huff(s, flush) {
  var bflush;             /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we have a literal to write. */
    if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === Z_NO_FLUSH) {
          return BS_NEED_MORE;
        }
        break;      /* flush the current block */
      }
    }

    /* Output a literal byte */
    s.match_length = 0;
    //Tracevv((stderr,"%c", s->window[s->strstart]));
    /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* Values for max_lazy_match, good_match and max_chain_length, depending on
 * the desired pack level (0..9). The values given below have been tuned to
 * exclude worst case performance for pathological files. Better values may be
 * found for specific files.
 */
function Config(good_length, max_lazy, nice_length, max_chain, func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
}

var configuration_table;

configuration_table = [
  /*      good lazy nice chain */
  new Config(0, 0, 0, 0, deflate_stored),          /* 0 store only */
  new Config(4, 4, 8, 4, deflate_fast),            /* 1 max speed, no lazy matches */
  new Config(4, 5, 16, 8, deflate_fast),           /* 2 */
  new Config(4, 6, 32, 32, deflate_fast),          /* 3 */

  new Config(4, 4, 16, 16, deflate_slow),          /* 4 lazy matches */
  new Config(8, 16, 32, 32, deflate_slow),         /* 5 */
  new Config(8, 16, 128, 128, deflate_slow),       /* 6 */
  new Config(8, 32, 128, 256, deflate_slow),       /* 7 */
  new Config(32, 128, 258, 1024, deflate_slow),    /* 8 */
  new Config(32, 258, 258, 4096, deflate_slow)     /* 9 max compression */
];


/* ===========================================================================
 * Initialize the "longest match" routines for a new zlib stream
 */
function lm_init(s) {
  s.window_size = 2 * s.w_size;

  /*** CLEAR_HASH(s); ***/
  zero(s.head); // Fill with NIL (= 0);

  /* Set the default configuration parameters:
   */
  s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;

  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
}


function DeflateState() {
  this.strm = null;            /* pointer back to this zlib stream */
  this.status = 0;            /* as the name implies */
  this.pending_buf = null;      /* output still pending */
  this.pending_buf_size = 0;  /* size of pending_buf */
  this.pending_out = 0;       /* next pending byte to output to the stream */
  this.pending = 0;           /* nb of bytes in the pending buffer */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.gzhead = null;         /* gzip header information to write */
  this.gzindex = 0;           /* where in extra, name, or comment */
  this.method = Z_DEFLATED; /* can only be DEFLATED */
  this.last_flush = -1;   /* value of flush param for previous deflate call */

  this.w_size = 0;  /* LZ77 window size (32K by default) */
  this.w_bits = 0;  /* log2(w_size)  (8..16) */
  this.w_mask = 0;  /* w_size - 1 */

  this.window = null;
  /* Sliding window. Input bytes are read into the second half of the window,
   * and move to the first half later to keep a dictionary of at least wSize
   * bytes. With this organization, matches are limited to a distance of
   * wSize-MAX_MATCH bytes, but this ensures that IO is always
   * performed with a length multiple of the block size.
   */

  this.window_size = 0;
  /* Actual size of window: 2*wSize, except when the user input buffer
   * is directly used as sliding window.
   */

  this.prev = null;
  /* Link to older string with same hash index. To limit the size of this
   * array to 64K, this link is maintained only for the last 32K strings.
   * An index in this array is thus a window index modulo 32K.
   */

  this.head = null;   /* Heads of the hash chains or NIL. */

  this.ins_h = 0;       /* hash index of string to be inserted */
  this.hash_size = 0;   /* number of elements in hash table */
  this.hash_bits = 0;   /* log2(hash_size) */
  this.hash_mask = 0;   /* hash_size-1 */

  this.hash_shift = 0;
  /* Number of bits by which ins_h must be shifted at each input
   * step. It must be such that after MIN_MATCH steps, the oldest
   * byte no longer takes part in the hash key, that is:
   *   hash_shift * MIN_MATCH >= hash_bits
   */

  this.block_start = 0;
  /* Window position at the beginning of the current output block. Gets
   * negative when the window is moved backwards.
   */

  this.match_length = 0;      /* length of best match */
  this.prev_match = 0;        /* previous match */
  this.match_available = 0;   /* set if previous match exists */
  this.strstart = 0;          /* start of string to insert */
  this.match_start = 0;       /* start of matching string */
  this.lookahead = 0;         /* number of valid bytes ahead in window */

  this.prev_length = 0;
  /* Length of the best match at previous step. Matches not greater than this
   * are discarded. This is used in the lazy match evaluation.
   */

  this.max_chain_length = 0;
  /* To speed up deflation, hash chains are never searched beyond this
   * length.  A higher limit improves compression ratio but degrades the
   * speed.
   */

  this.max_lazy_match = 0;
  /* Attempt to find a better match only when the current match is strictly
   * smaller than this value. This mechanism is used only for compression
   * levels >= 4.
   */
  // That's alias to max_lazy_match, don't use directly
  //this.max_insert_length = 0;
  /* Insert new strings in the hash table only if the match length is not
   * greater than this length. This saves time but degrades compression.
   * max_insert_length is used only for compression levels <= 3.
   */

  this.level = 0;     /* compression level (1..9) */
  this.strategy = 0;  /* favor or force Huffman coding*/

  this.good_match = 0;
  /* Use a faster search when the previous match is longer than this */

  this.nice_match = 0; /* Stop searching when current match exceeds this */

              /* used by trees.c: */

  /* Didn't use ct_data typedef below to suppress compiler warning */

  // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
  // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
  // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

  // Use flat array of DOUBLE size, with interleaved fata,
  // because JS does not support effective
  this.dyn_ltree  = new utils.Buf16(HEAP_SIZE * 2);
  this.dyn_dtree  = new utils.Buf16((2 * D_CODES + 1) * 2);
  this.bl_tree    = new utils.Buf16((2 * BL_CODES + 1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);

  this.l_desc   = null;         /* desc. for literal tree */
  this.d_desc   = null;         /* desc. for distance tree */
  this.bl_desc  = null;         /* desc. for bit length tree */

  //ush bl_count[MAX_BITS+1];
  this.bl_count = new utils.Buf16(MAX_BITS + 1);
  /* number of codes at each bit length for an optimal tree */

  //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
  this.heap = new utils.Buf16(2 * L_CODES + 1);  /* heap used to build the Huffman trees */
  zero(this.heap);

  this.heap_len = 0;               /* number of elements in the heap */
  this.heap_max = 0;               /* element of largest frequency */
  /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
   * The same heap array is used to build all trees.
   */

  this.depth = new utils.Buf16(2 * L_CODES + 1); //uch depth[2*L_CODES+1];
  zero(this.depth);
  /* Depth of each subtree used as tie breaker for trees of equal frequency
   */

  this.l_buf = 0;          /* buffer index for literals or lengths */

  this.lit_bufsize = 0;
  /* Size of match buffer for literals/lengths.  There are 4 reasons for
   * limiting lit_bufsize to 64K:
   *   - frequencies can be kept in 16 bit counters
   *   - if compression is not successful for the first block, all input
   *     data is still in the window so we can still emit a stored block even
   *     when input comes from standard input.  (This can also be done for
   *     all blocks if lit_bufsize is not greater than 32K.)
   *   - if compression is not successful for a file smaller than 64K, we can
   *     even emit a stored file instead of a stored block (saving 5 bytes).
   *     This is applicable only for zip (not gzip or zlib).
   *   - creating new Huffman trees less frequently may not provide fast
   *     adaptation to changes in the input data statistics. (Take for
   *     example a binary file with poorly compressible code followed by
   *     a highly compressible string table.) Smaller buffer sizes give
   *     fast adaptation but have of course the overhead of transmitting
   *     trees more frequently.
   *   - I can't count above 4
   */

  this.last_lit = 0;      /* running index in l_buf */

  this.d_buf = 0;
  /* Buffer index for distances. To simplify the code, d_buf and l_buf have
   * the same number of elements. To use different lengths, an extra flag
   * array would be necessary.
   */

  this.opt_len = 0;       /* bit length of current block with optimal trees */
  this.static_len = 0;    /* bit length of current block with static trees */
  this.matches = 0;       /* number of string matches in current block */
  this.insert = 0;        /* bytes at end of window left to insert */


  this.bi_buf = 0;
  /* Output buffer. bits are inserted starting at the bottom (least
   * significant bits).
   */
  this.bi_valid = 0;
  /* Number of valid bits in bi_buf.  All bits above the last valid bit
   * are always zero.
   */

  // Used for window memory init. We safely ignore it for JS. That makes
  // sense only for pointers and memory check tools.
  //this.high_water = 0;
  /* High water mark offset in window for initialized bytes -- bytes above
   * this are set to zero in order to avoid memory check warnings when
   * longest match routines access bytes past the input.  This is then
   * updated to the new high water mark.
   */
}


function deflateResetKeep(strm) {
  var s;

  if (!strm || !strm.state) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;

  s = strm.state;
  s.pending = 0;
  s.pending_out = 0;

  if (s.wrap < 0) {
    s.wrap = -s.wrap;
    /* was made negative by deflate(..., Z_FINISH); */
  }
  s.status = (s.wrap ? INIT_STATE : BUSY_STATE);
  strm.adler = (s.wrap === 2) ?
    0  // crc32(0, Z_NULL, 0)
  :
    1; // adler32(0, Z_NULL, 0)
  s.last_flush = Z_NO_FLUSH;
  trees._tr_init(s);
  return Z_OK;
}


function deflateReset(strm) {
  var ret = deflateResetKeep(strm);
  if (ret === Z_OK) {
    lm_init(strm.state);
  }
  return ret;
}


function deflateSetHeader(strm, head) {
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  if (strm.state.wrap !== 2) { return Z_STREAM_ERROR; }
  strm.state.gzhead = head;
  return Z_OK;
}


function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
  if (!strm) { // === Z_NULL
    return Z_STREAM_ERROR;
  }
  var wrap = 1;

  if (level === Z_DEFAULT_COMPRESSION) {
    level = 6;
  }

  if (windowBits < 0) { /* suppress zlib wrapper */
    wrap = 0;
    windowBits = -windowBits;
  }

  else if (windowBits > 15) {
    wrap = 2;           /* write gzip wrapper instead */
    windowBits -= 16;
  }


  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED ||
    windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
    strategy < 0 || strategy > Z_FIXED) {
    return err(strm, Z_STREAM_ERROR);
  }


  if (windowBits === 8) {
    windowBits = 9;
  }
  /* until 256-byte window bug fixed */

  var s = new DeflateState();

  strm.state = s;
  s.strm = strm;

  s.wrap = wrap;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;

  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

  s.window = new utils.Buf8(s.w_size * 2);
  s.head = new utils.Buf16(s.hash_size);
  s.prev = new utils.Buf16(s.w_size);

  // Don't need mem init magic for JS.
  //s.high_water = 0;  /* nothing written to s->window yet */

  s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

  s.pending_buf_size = s.lit_bufsize * 4;

  //overlay = (ushf *) ZALLOC(strm, s->lit_bufsize, sizeof(ush)+2);
  //s->pending_buf = (uchf *) overlay;
  s.pending_buf = new utils.Buf8(s.pending_buf_size);

  // It is offset from `s.pending_buf` (size is `s.lit_bufsize * 2`)
  //s->d_buf = overlay + s->lit_bufsize/sizeof(ush);
  s.d_buf = 1 * s.lit_bufsize;

  //s->l_buf = s->pending_buf + (1+sizeof(ush))*s->lit_bufsize;
  s.l_buf = (1 + 2) * s.lit_bufsize;

  s.level = level;
  s.strategy = strategy;
  s.method = method;

  return deflateReset(strm);
}

function deflateInit(strm, level) {
  return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
}


function deflate(strm, flush) {
  var old_flush, s;
  var beg, val; // for gzip header write only

  if (!strm || !strm.state ||
    flush > Z_BLOCK || flush < 0) {
    return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
  }

  s = strm.state;

  if (!strm.output ||
      (!strm.input && strm.avail_in !== 0) ||
      (s.status === FINISH_STATE && flush !== Z_FINISH)) {
    return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR : Z_STREAM_ERROR);
  }

  s.strm = strm; /* just in case */
  old_flush = s.last_flush;
  s.last_flush = flush;

  /* Write the header */
  if (s.status === INIT_STATE) {

    if (s.wrap === 2) { // GZIP header
      strm.adler = 0;  //crc32(0L, Z_NULL, 0);
      put_byte(s, 31);
      put_byte(s, 139);
      put_byte(s, 8);
      if (!s.gzhead) { // s->gzhead == Z_NULL
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, OS_CODE);
        s.status = BUSY_STATE;
      }
      else {
        put_byte(s, (s.gzhead.text ? 1 : 0) +
                    (s.gzhead.hcrc ? 2 : 0) +
                    (!s.gzhead.extra ? 0 : 4) +
                    (!s.gzhead.name ? 0 : 8) +
                    (!s.gzhead.comment ? 0 : 16)
                );
        put_byte(s, s.gzhead.time & 0xff);
        put_byte(s, (s.gzhead.time >> 8) & 0xff);
        put_byte(s, (s.gzhead.time >> 16) & 0xff);
        put_byte(s, (s.gzhead.time >> 24) & 0xff);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, s.gzhead.os & 0xff);
        if (s.gzhead.extra && s.gzhead.extra.length) {
          put_byte(s, s.gzhead.extra.length & 0xff);
          put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
        }
        if (s.gzhead.hcrc) {
          strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
        }
        s.gzindex = 0;
        s.status = EXTRA_STATE;
      }
    }
    else // DEFLATE header
    {
      var header = (Z_DEFLATED + ((s.w_bits - 8) << 4)) << 8;
      var level_flags = -1;

      if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
        level_flags = 0;
      } else if (s.level < 6) {
        level_flags = 1;
      } else if (s.level === 6) {
        level_flags = 2;
      } else {
        level_flags = 3;
      }
      header |= (level_flags << 6);
      if (s.strstart !== 0) { header |= PRESET_DICT; }
      header += 31 - (header % 31);

      s.status = BUSY_STATE;
      putShortMSB(s, header);

      /* Save the adler32 of the preset dictionary: */
      if (s.strstart !== 0) {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 0xffff);
      }
      strm.adler = 1; // adler32(0L, Z_NULL, 0);
    }
  }

//#ifdef GZIP
  if (s.status === EXTRA_STATE) {
    if (s.gzhead.extra/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */

      while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            break;
          }
        }
        put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
        s.gzindex++;
      }
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (s.gzindex === s.gzhead.extra.length) {
        s.gzindex = 0;
        s.status = NAME_STATE;
      }
    }
    else {
      s.status = NAME_STATE;
    }
  }
  if (s.status === NAME_STATE) {
    if (s.gzhead.name/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.name.length) {
          val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.gzindex = 0;
        s.status = COMMENT_STATE;
      }
    }
    else {
      s.status = COMMENT_STATE;
    }
  }
  if (s.status === COMMENT_STATE) {
    if (s.gzhead.comment/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.comment.length) {
          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.status = HCRC_STATE;
      }
    }
    else {
      s.status = HCRC_STATE;
    }
  }
  if (s.status === HCRC_STATE) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) {
        flush_pending(strm);
      }
      if (s.pending + 2 <= s.pending_buf_size) {
        put_byte(s, strm.adler & 0xff);
        put_byte(s, (strm.adler >> 8) & 0xff);
        strm.adler = 0; //crc32(0L, Z_NULL, 0);
        s.status = BUSY_STATE;
      }
    }
    else {
      s.status = BUSY_STATE;
    }
  }
//#endif

  /* Flush as much pending output as possible */
  if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      /* Since avail_out is 0, deflate will be called again with
       * more output space, but possibly with both pending and
       * avail_in equal to zero. There won't be anything to do,
       * but this is not an error situation so make sure we
       * return OK instead of BUF_ERROR at next call of deflate:
       */
      s.last_flush = -1;
      return Z_OK;
    }

    /* Make sure there is something to do and avoid duplicate consecutive
     * flushes. For repeated and useless calls with Z_FINISH, we keep
     * returning Z_STREAM_END instead of Z_BUF_ERROR.
     */
  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
    flush !== Z_FINISH) {
    return err(strm, Z_BUF_ERROR);
  }

  /* User must not provide more input after the first FINISH: */
  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
    return err(strm, Z_BUF_ERROR);
  }

  /* Start a new block or continue the current one.
   */
  if (strm.avail_in !== 0 || s.lookahead !== 0 ||
    (flush !== Z_NO_FLUSH && s.status !== FINISH_STATE)) {
    var bstate = (s.strategy === Z_HUFFMAN_ONLY) ? deflate_huff(s, flush) :
      (s.strategy === Z_RLE ? deflate_rle(s, flush) :
        configuration_table[s.level].func(s, flush));

    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
      s.status = FINISH_STATE;
    }
    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        /* avoid BUF_ERROR next call, see above */
      }
      return Z_OK;
      /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
       * of deflate should use the same flush parameter to make sure
       * that the flush is complete. So we don't have to output an
       * empty block here, this will be done at next call. This also
       * ensures that for a very small output buffer, we emit at most
       * one empty block.
       */
    }
    if (bstate === BS_BLOCK_DONE) {
      if (flush === Z_PARTIAL_FLUSH) {
        trees._tr_align(s);
      }
      else if (flush !== Z_BLOCK) { /* FULL_FLUSH or SYNC_FLUSH */

        trees._tr_stored_block(s, 0, 0, false);
        /* For a full flush, this empty block will be recognized
         * as a special marker by inflate_sync().
         */
        if (flush === Z_FULL_FLUSH) {
          /*** CLEAR_HASH(s); ***/             /* forget history */
          zero(s.head); // Fill with NIL (= 0);

          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
        return Z_OK;
      }
    }
  }
  //Assert(strm->avail_out > 0, "bug2");
  //if (strm.avail_out <= 0) { throw new Error("bug2");}

  if (flush !== Z_FINISH) { return Z_OK; }
  if (s.wrap <= 0) { return Z_STREAM_END; }

  /* Write the trailer */
  if (s.wrap === 2) {
    put_byte(s, strm.adler & 0xff);
    put_byte(s, (strm.adler >> 8) & 0xff);
    put_byte(s, (strm.adler >> 16) & 0xff);
    put_byte(s, (strm.adler >> 24) & 0xff);
    put_byte(s, strm.total_in & 0xff);
    put_byte(s, (strm.total_in >> 8) & 0xff);
    put_byte(s, (strm.total_in >> 16) & 0xff);
    put_byte(s, (strm.total_in >> 24) & 0xff);
  }
  else
  {
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 0xffff);
  }

  flush_pending(strm);
  /* If avail_out is zero, the application will call deflate again
   * to flush the rest.
   */
  if (s.wrap > 0) { s.wrap = -s.wrap; }
  /* write the trailer only once! */
  return s.pending !== 0 ? Z_OK : Z_STREAM_END;
}

function deflateEnd(strm) {
  var status;

  if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
    return Z_STREAM_ERROR;
  }

  status = strm.state.status;
  if (status !== INIT_STATE &&
    status !== EXTRA_STATE &&
    status !== NAME_STATE &&
    status !== COMMENT_STATE &&
    status !== HCRC_STATE &&
    status !== BUSY_STATE &&
    status !== FINISH_STATE
  ) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.state = null;

  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
}


/* =========================================================================
 * Initializes the compression dictionary from the given byte
 * sequence without producing any compressed output.
 */
function deflateSetDictionary(strm, dictionary) {
  var dictLength = dictionary.length;

  var s;
  var str, n;
  var wrap;
  var avail;
  var next;
  var input;
  var tmpDict;

  if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
    return Z_STREAM_ERROR;
  }

  s = strm.state;
  wrap = s.wrap;

  if (wrap === 2 || (wrap === 1 && s.status !== INIT_STATE) || s.lookahead) {
    return Z_STREAM_ERROR;
  }

  /* when using zlib wrappers, compute Adler-32 for provided dictionary */
  if (wrap === 1) {
    /* adler32(strm->adler, dictionary, dictLength); */
    strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
  }

  s.wrap = 0;   /* avoid computing Adler-32 in read_buf */

  /* if dictionary would fill window, just replace the history */
  if (dictLength >= s.w_size) {
    if (wrap === 0) {            /* already empty otherwise */
      /*** CLEAR_HASH(s); ***/
      zero(s.head); // Fill with NIL (= 0);
      s.strstart = 0;
      s.block_start = 0;
      s.insert = 0;
    }
    /* use the tail */
    // dictionary = dictionary.slice(dictLength - s.w_size);
    tmpDict = new utils.Buf8(s.w_size);
    utils.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
    dictionary = tmpDict;
    dictLength = s.w_size;
  }
  /* insert dictionary into window and hash */
  avail = strm.avail_in;
  next = strm.next_in;
  input = strm.input;
  strm.avail_in = dictLength;
  strm.next_in = 0;
  strm.input = dictionary;
  fill_window(s);
  while (s.lookahead >= MIN_MATCH) {
    str = s.strstart;
    n = s.lookahead - (MIN_MATCH - 1);
    do {
      /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;

      s.prev[str & s.w_mask] = s.head[s.ins_h];

      s.head[s.ins_h] = str;
      str++;
    } while (--n);
    s.strstart = str;
    s.lookahead = MIN_MATCH - 1;
    fill_window(s);
  }
  s.strstart += s.lookahead;
  s.block_start = s.strstart;
  s.insert = s.lookahead;
  s.lookahead = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  strm.next_in = next;
  strm.input = input;
  strm.avail_in = avail;
  s.wrap = wrap;
  return Z_OK;
}


exports.deflateInit = deflateInit;
exports.deflateInit2 = deflateInit2;
exports.deflateReset = deflateReset;
exports.deflateResetKeep = deflateResetKeep;
exports.deflateSetHeader = deflateSetHeader;
exports.deflate = deflate;
exports.deflateEnd = deflateEnd;
exports.deflateSetDictionary = deflateSetDictionary;
exports.deflateInfo = 'pako deflate (from Nodeca project)';

/* Not implemented
exports.deflateBound = deflateBound;
exports.deflateCopy = deflateCopy;
exports.deflateParams = deflateParams;
exports.deflatePending = deflatePending;
exports.deflatePrime = deflatePrime;
exports.deflateTune = deflateTune;
*/

},{"../utils/common":79,"./adler32":81,"./crc32":83,"./messages":89,"./trees":90}],85:[function(require,module,exports){
'use strict';


function GZheader() {
  /* true if compressed data believed to be text */
  this.text       = 0;
  /* modification time */
  this.time       = 0;
  /* extra flags (not used when writing a gzip file) */
  this.xflags     = 0;
  /* operating system */
  this.os         = 0;
  /* pointer to extra field or Z_NULL if none */
  this.extra      = null;
  /* extra field length (valid if extra != Z_NULL) */
  this.extra_len  = 0; // Actually, we don't need it in JS,
                       // but leave for few code modifications

  //
  // Setup limits is not necessary because in js we should not preallocate memory
  // for inflate use constant limit in 65536 bytes
  //

  /* space at extra (only when reading header) */
  // this.extra_max  = 0;
  /* pointer to zero-terminated file name or Z_NULL */
  this.name       = '';
  /* space at name (only when reading header) */
  // this.name_max   = 0;
  /* pointer to zero-terminated comment or Z_NULL */
  this.comment    = '';
  /* space at comment (only when reading header) */
  // this.comm_max   = 0;
  /* true if there was or will be a header crc */
  this.hcrc       = 0;
  /* true when done reading gzip header (not used when writing a gzip file) */
  this.done       = false;
}

module.exports = GZheader;

},{}],86:[function(require,module,exports){
'use strict';

// See state defs from inflate.js
var BAD = 30;       /* got a data error -- remain here until reset */
var TYPE = 12;      /* i: waiting for type bits, including last-flag bit */

/*
   Decode literal, length, and distance codes and write out the resulting
   literal and match bytes until either not enough input or output is
   available, an end-of-block is encountered, or a data error is encountered.
   When large enough input and output buffers are supplied to inflate(), for
   example, a 16K input buffer and a 64K output buffer, more than 95% of the
   inflate execution time is spent in this routine.

   Entry assumptions:

        state.mode === LEN
        strm.avail_in >= 6
        strm.avail_out >= 258
        start >= strm.avail_out
        state.bits < 8

   On return, state.mode is one of:

        LEN -- ran out of enough output space or enough available input
        TYPE -- reached end of block code, inflate() to interpret next block
        BAD -- error in block data

   Notes:

    - The maximum input bits used by a length/distance pair is 15 bits for the
      length code, 5 bits for the length extra, 15 bits for the distance code,
      and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
      Therefore if strm.avail_in >= 6, then there is enough input to avoid
      checking for available input while decoding.

    - The maximum bytes that a single length/distance pair can output is 258
      bytes, which is the maximum length that can be coded.  inflate_fast()
      requires strm.avail_out >= 258 for each loop to avoid checking for
      output space.
 */
module.exports = function inflate_fast(strm, start) {
  var state;
  var _in;                    /* local strm.input */
  var last;                   /* have enough input while in < last */
  var _out;                   /* local strm.output */
  var beg;                    /* inflate()'s initial strm.output */
  var end;                    /* while out < end, enough space available */
//#ifdef INFLATE_STRICT
  var dmax;                   /* maximum distance from zlib header */
//#endif
  var wsize;                  /* window size or zero if not using window */
  var whave;                  /* valid bytes in the window */
  var wnext;                  /* window write index */
  // Use `s_window` instead `window`, avoid conflict with instrumentation tools
  var s_window;               /* allocated sliding window, if wsize != 0 */
  var hold;                   /* local strm.hold */
  var bits;                   /* local strm.bits */
  var lcode;                  /* local strm.lencode */
  var dcode;                  /* local strm.distcode */
  var lmask;                  /* mask for first level of length codes */
  var dmask;                  /* mask for first level of distance codes */
  var here;                   /* retrieved table entry */
  var op;                     /* code bits, operation, extra bits, or */
                              /*  window position, window bytes to copy */
  var len;                    /* match length, unused bytes */
  var dist;                   /* match distance */
  var from;                   /* where to copy match from */
  var from_source;


  var input, output; // JS specific, because we have no pointers

  /* copy state to local variables */
  state = strm.state;
  //here = state.here;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
//#ifdef INFLATE_STRICT
  dmax = state.dmax;
//#endif
  wsize = state.wsize;
  whave = state.whave;
  wnext = state.wnext;
  s_window = state.window;
  hold = state.hold;
  bits = state.bits;
  lcode = state.lencode;
  dcode = state.distcode;
  lmask = (1 << state.lenbits) - 1;
  dmask = (1 << state.distbits) - 1;


  /* decode literals and length/distances until end-of-block or not enough
     input data or output space */

  top:
  do {
    if (bits < 15) {
      hold += input[_in++] << bits;
      bits += 8;
      hold += input[_in++] << bits;
      bits += 8;
    }

    here = lcode[hold & lmask];

    dolen:
    for (;;) { // Goto emulation
      op = here >>> 24/*here.bits*/;
      hold >>>= op;
      bits -= op;
      op = (here >>> 16) & 0xff/*here.op*/;
      if (op === 0) {                          /* literal */
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        output[_out++] = here & 0xffff/*here.val*/;
      }
      else if (op & 16) {                     /* length base */
        len = here & 0xffff/*here.val*/;
        op &= 15;                           /* number of extra bits */
        if (op) {
          if (bits < op) {
            hold += input[_in++] << bits;
            bits += 8;
          }
          len += hold & ((1 << op) - 1);
          hold >>>= op;
          bits -= op;
        }
        //Tracevv((stderr, "inflate:         length %u\n", len));
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }
        here = dcode[hold & dmask];

        dodist:
        for (;;) { // goto emulation
          op = here >>> 24/*here.bits*/;
          hold >>>= op;
          bits -= op;
          op = (here >>> 16) & 0xff/*here.op*/;

          if (op & 16) {                      /* distance base */
            dist = here & 0xffff/*here.val*/;
            op &= 15;                       /* number of extra bits */
            if (bits < op) {
              hold += input[_in++] << bits;
              bits += 8;
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
            }
            dist += hold & ((1 << op) - 1);
//#ifdef INFLATE_STRICT
            if (dist > dmax) {
              strm.msg = 'invalid distance too far back';
              state.mode = BAD;
              break top;
            }
//#endif
            hold >>>= op;
            bits -= op;
            //Tracevv((stderr, "inflate:         distance %u\n", dist));
            op = _out - beg;                /* max distance in output */
            if (dist > op) {                /* see if copy from window */
              op = dist - op;               /* distance back in window */
              if (op > whave) {
                if (state.sane) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD;
                  break top;
                }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//                if (len <= op - whave) {
//                  do {
//                    output[_out++] = 0;
//                  } while (--len);
//                  continue top;
//                }
//                len -= op - whave;
//                do {
//                  output[_out++] = 0;
//                } while (--op > whave);
//                if (op === 0) {
//                  from = _out - dist;
//                  do {
//                    output[_out++] = output[from++];
//                  } while (--len);
//                  continue top;
//                }
//#endif
              }
              from = 0; // window index
              from_source = s_window;
              if (wnext === 0) {           /* very common case */
                from += wsize - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              else if (wnext < op) {      /* wrap around window */
                from += wsize + wnext - op;
                op -= wnext;
                if (op < len) {         /* some from end of window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = 0;
                  if (wnext < len) {  /* some from start of window */
                    op = wnext;
                    len -= op;
                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);
                    from = _out - dist;      /* rest from output */
                    from_source = output;
                  }
                }
              }
              else {                      /* contiguous in window */
                from += wnext - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              while (len > 2) {
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                len -= 3;
              }
              if (len) {
                output[_out++] = from_source[from++];
                if (len > 1) {
                  output[_out++] = from_source[from++];
                }
              }
            }
            else {
              from = _out - dist;          /* copy direct from output */
              do {                        /* minimum length is three */
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                len -= 3;
              } while (len > 2);
              if (len) {
                output[_out++] = output[from++];
                if (len > 1) {
                  output[_out++] = output[from++];
                }
              }
            }
          }
          else if ((op & 64) === 0) {          /* 2nd level distance code */
            here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
            continue dodist;
          }
          else {
            strm.msg = 'invalid distance code';
            state.mode = BAD;
            break top;
          }

          break; // need to emulate goto via "continue"
        }
      }
      else if ((op & 64) === 0) {              /* 2nd level length code */
        here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
        continue dolen;
      }
      else if (op & 32) {                     /* end-of-block */
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.mode = TYPE;
        break top;
      }
      else {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break top;
      }

      break; // need to emulate goto via "continue"
    }
  } while (_in < last && _out < end);

  /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;

  /* update state and return */
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
  strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
  state.hold = hold;
  state.bits = bits;
  return;
};

},{}],87:[function(require,module,exports){
'use strict';


var utils         = require('../utils/common');
var adler32       = require('./adler32');
var crc32         = require('./crc32');
var inflate_fast  = require('./inffast');
var inflate_table = require('./inftrees');

var CODES = 0;
var LENS = 1;
var DISTS = 2;

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
//var Z_NO_FLUSH      = 0;
//var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
//var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;

/* The deflate compression method */
var Z_DEFLATED  = 8;


/* STATES ====================================================================*/
/* ===========================================================================*/


var    HEAD = 1;       /* i: waiting for magic header */
var    FLAGS = 2;      /* i: waiting for method and flags (gzip) */
var    TIME = 3;       /* i: waiting for modification time (gzip) */
var    OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
var    EXLEN = 5;      /* i: waiting for extra length (gzip) */
var    EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
var    NAME = 7;       /* i: waiting for end of file name (gzip) */
var    COMMENT = 8;    /* i: waiting for end of comment (gzip) */
var    HCRC = 9;       /* i: waiting for header crc (gzip) */
var    DICTID = 10;    /* i: waiting for dictionary check value */
var    DICT = 11;      /* waiting for inflateSetDictionary() call */
var        TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
var        TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
var        STORED = 14;    /* i: waiting for stored size (length and complement) */
var        COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
var        COPY = 16;      /* i/o: waiting for input or output to copy stored block */
var        TABLE = 17;     /* i: waiting for dynamic block table lengths */
var        LENLENS = 18;   /* i: waiting for code length code lengths */
var        CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
var            LEN_ = 20;      /* i: same as LEN below, but only first time in */
var            LEN = 21;       /* i: waiting for length/lit/eob code */
var            LENEXT = 22;    /* i: waiting for length extra bits */
var            DIST = 23;      /* i: waiting for distance code */
var            DISTEXT = 24;   /* i: waiting for distance extra bits */
var            MATCH = 25;     /* o: waiting for output space to copy string */
var            LIT = 26;       /* o: waiting for output space to write literal */
var    CHECK = 27;     /* i: waiting for 32-bit check value */
var    LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
var    DONE = 29;      /* finished check, done -- remain here until reset */
var    BAD = 30;       /* got a data error -- remain here until reset */
var    MEM = 31;       /* got an inflate() memory error -- remain here until reset */
var    SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

/* ===========================================================================*/



var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_WBITS = MAX_WBITS;


function zswap32(q) {
  return  (((q >>> 24) & 0xff) +
          ((q >>> 8) & 0xff00) +
          ((q & 0xff00) << 8) +
          ((q & 0xff) << 24));
}


function InflateState() {
  this.mode = 0;             /* current inflate mode */
  this.last = false;          /* true if processing last block */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.havedict = false;      /* true if dictionary provided */
  this.flags = 0;             /* gzip header method and flags (0 if zlib) */
  this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
  this.check = 0;             /* protected copy of check value */
  this.total = 0;             /* protected copy of output count */
  // TODO: may be {}
  this.head = null;           /* where to save gzip header information */

  /* sliding window */
  this.wbits = 0;             /* log base 2 of requested window size */
  this.wsize = 0;             /* window size or zero if not using window */
  this.whave = 0;             /* valid bytes in the window */
  this.wnext = 0;             /* window write index */
  this.window = null;         /* allocated sliding window, if needed */

  /* bit accumulator */
  this.hold = 0;              /* input bit accumulator */
  this.bits = 0;              /* number of bits in "in" */

  /* for string and stored block copying */
  this.length = 0;            /* literal or length of data to copy */
  this.offset = 0;            /* distance back to copy string from */

  /* for table and code decoding */
  this.extra = 0;             /* extra bits needed */

  /* fixed and dynamic code tables */
  this.lencode = null;          /* starting table for length/literal codes */
  this.distcode = null;         /* starting table for distance codes */
  this.lenbits = 0;           /* index bits for lencode */
  this.distbits = 0;          /* index bits for distcode */

  /* dynamic table building */
  this.ncode = 0;             /* number of code length code lengths */
  this.nlen = 0;              /* number of length code lengths */
  this.ndist = 0;             /* number of distance code lengths */
  this.have = 0;              /* number of code lengths in lens[] */
  this.next = null;              /* next available space in codes[] */

  this.lens = new utils.Buf16(320); /* temporary storage for code lengths */
  this.work = new utils.Buf16(288); /* work area for code table building */

  /*
   because we don't have pointers in js, we use lencode and distcode directly
   as buffers so we don't need codes
  */
  //this.codes = new utils.Buf32(ENOUGH);       /* space for code tables */
  this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
  this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
  this.sane = 0;                   /* if false, allow invalid distance too far */
  this.back = 0;                   /* bits back of last unprocessed length/lit */
  this.was = 0;                    /* initial length of match */
}

function inflateResetKeep(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  strm.msg = ''; /*Z_NULL*/
  if (state.wrap) {       /* to support ill-conceived Java test suite */
    strm.adler = state.wrap & 1;
  }
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.dmax = 32768;
  state.head = null/*Z_NULL*/;
  state.hold = 0;
  state.bits = 0;
  //state.lencode = state.distcode = state.next = state.codes;
  state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
  state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);

  state.sane = 1;
  state.back = -1;
  //Tracev((stderr, "inflate: reset\n"));
  return Z_OK;
}

function inflateReset(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);

}

function inflateReset2(strm, windowBits) {
  var wrap;
  var state;

  /* get the state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;

  /* extract wrap request from windowBits parameter */
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  }
  else {
    wrap = (windowBits >> 4) + 1;
    if (windowBits < 48) {
      windowBits &= 15;
    }
  }

  /* set number of window bits, free window if different */
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
    return Z_STREAM_ERROR;
  }
  if (state.window !== null && state.wbits !== windowBits) {
    state.window = null;
  }

  /* update state and reset the rest of it */
  state.wrap = wrap;
  state.wbits = windowBits;
  return inflateReset(strm);
}

function inflateInit2(strm, windowBits) {
  var ret;
  var state;

  if (!strm) { return Z_STREAM_ERROR; }
  //strm.msg = Z_NULL;                 /* in case we return an error */

  state = new InflateState();

  //if (state === Z_NULL) return Z_MEM_ERROR;
  //Tracev((stderr, "inflate: allocated\n"));
  strm.state = state;
  state.window = null/*Z_NULL*/;
  ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK) {
    strm.state = null/*Z_NULL*/;
  }
  return ret;
}

function inflateInit(strm) {
  return inflateInit2(strm, DEF_WBITS);
}


/*
 Return state with length and distance decoding tables and index sizes set to
 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
 If BUILDFIXED is defined, then instead this routine builds the tables the
 first time it's called, and returns those tables the first time and
 thereafter.  This reduces the size of the code by about 2K bytes, in
 exchange for a little execution time.  However, BUILDFIXED should not be
 used for threaded applications, since the rewriting of the tables and virgin
 may not be thread-safe.
 */
var virgin = true;

var lenfix, distfix; // We have no pointers in JS, so keep tables separate

function fixedtables(state) {
  /* build fixed huffman tables if first call (may not be thread safe) */
  if (virgin) {
    var sym;

    lenfix = new utils.Buf32(512);
    distfix = new utils.Buf32(32);

    /* literal/length table */
    sym = 0;
    while (sym < 144) { state.lens[sym++] = 8; }
    while (sym < 256) { state.lens[sym++] = 9; }
    while (sym < 280) { state.lens[sym++] = 7; }
    while (sym < 288) { state.lens[sym++] = 8; }

    inflate_table(LENS,  state.lens, 0, 288, lenfix,   0, state.work, { bits: 9 });

    /* distance table */
    sym = 0;
    while (sym < 32) { state.lens[sym++] = 5; }

    inflate_table(DISTS, state.lens, 0, 32,   distfix, 0, state.work, { bits: 5 });

    /* do this just once */
    virgin = false;
  }

  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
}


/*
 Update the window with the last wsize (normally 32K) bytes written before
 returning.  If window does not exist yet, create it.  This is only called
 when a window is already in use, or when output has been written during this
 inflate call, but the end of the deflate stream has not been reached yet.
 It is also called to create a window for dictionary data when a dictionary
 is loaded.

 Providing output buffers larger than 32K to inflate() should provide a speed
 advantage, since only the last 32K of output is copied to the sliding window
 upon return from inflate(), and since all distances after the first 32K of
 output will fall in the output data, making match copies simpler and faster.
 The advantage may be dependent on the size of the processor's data caches.
 */
function updatewindow(strm, src, end, copy) {
  var dist;
  var state = strm.state;

  /* if it hasn't been done already, allocate space for the window */
  if (state.window === null) {
    state.wsize = 1 << state.wbits;
    state.wnext = 0;
    state.whave = 0;

    state.window = new utils.Buf8(state.wsize);
  }

  /* copy state->wsize or less output bytes into the circular window */
  if (copy >= state.wsize) {
    utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
    state.wnext = 0;
    state.whave = state.wsize;
  }
  else {
    dist = state.wsize - state.wnext;
    if (dist > copy) {
      dist = copy;
    }
    //zmemcpy(state->window + state->wnext, end - copy, dist);
    utils.arraySet(state.window, src, end - copy, dist, state.wnext);
    copy -= dist;
    if (copy) {
      //zmemcpy(state->window, end - copy, copy);
      utils.arraySet(state.window, src, end - copy, copy, 0);
      state.wnext = copy;
      state.whave = state.wsize;
    }
    else {
      state.wnext += dist;
      if (state.wnext === state.wsize) { state.wnext = 0; }
      if (state.whave < state.wsize) { state.whave += dist; }
    }
  }
  return 0;
}

function inflate(strm, flush) {
  var state;
  var input, output;          // input/output buffers
  var next;                   /* next input INDEX */
  var put;                    /* next output INDEX */
  var have, left;             /* available input and output */
  var hold;                   /* bit buffer */
  var bits;                   /* bits in bit buffer */
  var _in, _out;              /* save starting available input and output */
  var copy;                   /* number of stored or match bytes to copy */
  var from;                   /* where to copy match bytes from */
  var from_source;
  var here = 0;               /* current decoding table entry */
  var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
  //var last;                   /* parent table entry */
  var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
  var len;                    /* length to copy for repeats, bits to drop */
  var ret;                    /* return code */
  var hbuf = new utils.Buf8(4);    /* buffer for gzip header crc calculation */
  var opts;

  var n; // temporary var for NEED_BITS

  var order = /* permutation of code lengths */
    [ 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ];


  if (!strm || !strm.state || !strm.output ||
      (!strm.input && strm.avail_in !== 0)) {
    return Z_STREAM_ERROR;
  }

  state = strm.state;
  if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


  //--- LOAD() ---
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  //---

  _in = have;
  _out = left;
  ret = Z_OK;

  inf_leave: // goto emulation
  for (;;) {
    switch (state.mode) {
    case HEAD:
      if (state.wrap === 0) {
        state.mode = TYPEDO;
        break;
      }
      //=== NEEDBITS(16);
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
        state.check = 0/*crc32(0L, Z_NULL, 0)*/;
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//

        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        state.mode = FLAGS;
        break;
      }
      state.flags = 0;           /* expect zlib header */
      if (state.head) {
        state.head.done = false;
      }
      if (!(state.wrap & 1) ||   /* check if zlib header allowed */
        (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
        strm.msg = 'incorrect header check';
        state.mode = BAD;
        break;
      }
      if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
      len = (hold & 0x0f)/*BITS(4)*/ + 8;
      if (state.wbits === 0) {
        state.wbits = len;
      }
      else if (len > state.wbits) {
        strm.msg = 'invalid window size';
        state.mode = BAD;
        break;
      }
      state.dmax = 1 << len;
      //Tracev((stderr, "inflate:   zlib header ok\n"));
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = hold & 0x200 ? DICTID : TYPE;
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      break;
    case FLAGS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.flags = hold;
      if ((state.flags & 0xff) !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      if (state.flags & 0xe000) {
        strm.msg = 'unknown header flags set';
        state.mode = BAD;
        break;
      }
      if (state.head) {
        state.head.text = ((hold >> 8) & 1);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = TIME;
      /* falls through */
    case TIME:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.time = hold;
      }
      if (state.flags & 0x0200) {
        //=== CRC4(state.check, hold)
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        hbuf[2] = (hold >>> 16) & 0xff;
        hbuf[3] = (hold >>> 24) & 0xff;
        state.check = crc32(state.check, hbuf, 4, 0);
        //===
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = OS;
      /* falls through */
    case OS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.xflags = (hold & 0xff);
        state.head.os = (hold >> 8);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = EXLEN;
      /* falls through */
    case EXLEN:
      if (state.flags & 0x0400) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length = hold;
        if (state.head) {
          state.head.extra_len = hold;
        }
        if (state.flags & 0x0200) {
          //=== CRC2(state.check, hold);
          hbuf[0] = hold & 0xff;
          hbuf[1] = (hold >>> 8) & 0xff;
          state.check = crc32(state.check, hbuf, 2, 0);
          //===//
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      else if (state.head) {
        state.head.extra = null/*Z_NULL*/;
      }
      state.mode = EXTRA;
      /* falls through */
    case EXTRA:
      if (state.flags & 0x0400) {
        copy = state.length;
        if (copy > have) { copy = have; }
        if (copy) {
          if (state.head) {
            len = state.head.extra_len - state.length;
            if (!state.head.extra) {
              // Use untyped array for more conveniend processing later
              state.head.extra = new Array(state.head.extra_len);
            }
            utils.arraySet(
              state.head.extra,
              input,
              next,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              copy,
              /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
              len
            );
            //zmemcpy(state.head.extra + len, next,
            //        len + copy > state.head.extra_max ?
            //        state.head.extra_max - len : copy);
          }
          if (state.flags & 0x0200) {
            state.check = crc32(state.check, input, copy, next);
          }
          have -= copy;
          next += copy;
          state.length -= copy;
        }
        if (state.length) { break inf_leave; }
      }
      state.length = 0;
      state.mode = NAME;
      /* falls through */
    case NAME:
      if (state.flags & 0x0800) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          // TODO: 2 or 1 bytes?
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.name_max*/)) {
            state.head.name += String.fromCharCode(len);
          }
        } while (len && copy < have);

        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.name = null;
      }
      state.length = 0;
      state.mode = COMMENT;
      /* falls through */
    case COMMENT:
      if (state.flags & 0x1000) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.comm_max*/)) {
            state.head.comment += String.fromCharCode(len);
          }
        } while (len && copy < have);
        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.comment = null;
      }
      state.mode = HCRC;
      /* falls through */
    case HCRC:
      if (state.flags & 0x0200) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.check & 0xffff)) {
          strm.msg = 'header crc mismatch';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      if (state.head) {
        state.head.hcrc = ((state.flags >> 9) & 1);
        state.head.done = true;
      }
      strm.adler = state.check = 0;
      state.mode = TYPE;
      break;
    case DICTID:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      strm.adler = state.check = zswap32(hold);
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = DICT;
      /* falls through */
    case DICT:
      if (state.havedict === 0) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        return Z_NEED_DICT;
      }
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      /* falls through */
    case TYPE:
      if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case TYPEDO:
      if (state.last) {
        //--- BYTEBITS() ---//
        hold >>>= bits & 7;
        bits -= bits & 7;
        //---//
        state.mode = CHECK;
        break;
      }
      //=== NEEDBITS(3); */
      while (bits < 3) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.last = (hold & 0x01)/*BITS(1)*/;
      //--- DROPBITS(1) ---//
      hold >>>= 1;
      bits -= 1;
      //---//

      switch ((hold & 0x03)/*BITS(2)*/) {
      case 0:                             /* stored block */
        //Tracev((stderr, "inflate:     stored block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = STORED;
        break;
      case 1:                             /* fixed block */
        fixedtables(state);
        //Tracev((stderr, "inflate:     fixed codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = LEN_;             /* decode codes */
        if (flush === Z_TREES) {
          //--- DROPBITS(2) ---//
          hold >>>= 2;
          bits -= 2;
          //---//
          break inf_leave;
        }
        break;
      case 2:                             /* dynamic block */
        //Tracev((stderr, "inflate:     dynamic codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = TABLE;
        break;
      case 3:
        strm.msg = 'invalid block type';
        state.mode = BAD;
      }
      //--- DROPBITS(2) ---//
      hold >>>= 2;
      bits -= 2;
      //---//
      break;
    case STORED:
      //--- BYTEBITS() ---// /* go to byte boundary */
      hold >>>= bits & 7;
      bits -= bits & 7;
      //---//
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
        strm.msg = 'invalid stored block lengths';
        state.mode = BAD;
        break;
      }
      state.length = hold & 0xffff;
      //Tracev((stderr, "inflate:       stored length %u\n",
      //        state.length));
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = COPY_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case COPY_:
      state.mode = COPY;
      /* falls through */
    case COPY:
      copy = state.length;
      if (copy) {
        if (copy > have) { copy = have; }
        if (copy > left) { copy = left; }
        if (copy === 0) { break inf_leave; }
        //--- zmemcpy(put, next, copy); ---
        utils.arraySet(output, input, next, copy, put);
        //---//
        have -= copy;
        next += copy;
        left -= copy;
        put += copy;
        state.length -= copy;
        break;
      }
      //Tracev((stderr, "inflate:       stored end\n"));
      state.mode = TYPE;
      break;
    case TABLE:
      //=== NEEDBITS(14); */
      while (bits < 14) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
//#ifndef PKZIP_BUG_WORKAROUND
      if (state.nlen > 286 || state.ndist > 30) {
        strm.msg = 'too many length or distance symbols';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracev((stderr, "inflate:       table sizes ok\n"));
      state.have = 0;
      state.mode = LENLENS;
      /* falls through */
    case LENLENS:
      while (state.have < state.ncode) {
        //=== NEEDBITS(3);
        while (bits < 3) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
        //--- DROPBITS(3) ---//
        hold >>>= 3;
        bits -= 3;
        //---//
      }
      while (state.have < 19) {
        state.lens[order[state.have++]] = 0;
      }
      // We have separate tables & no pointers. 2 commented lines below not needed.
      //state.next = state.codes;
      //state.lencode = state.next;
      // Switch to use dynamic table
      state.lencode = state.lendyn;
      state.lenbits = 7;

      opts = { bits: state.lenbits };
      ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
      state.lenbits = opts.bits;

      if (ret) {
        strm.msg = 'invalid code lengths set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, "inflate:       code lengths ok\n"));
      state.have = 0;
      state.mode = CODELENS;
      /* falls through */
    case CODELENS:
      while (state.have < state.nlen + state.ndist) {
        for (;;) {
          here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        if (here_val < 16) {
          //--- DROPBITS(here.bits) ---//
          hold >>>= here_bits;
          bits -= here_bits;
          //---//
          state.lens[state.have++] = here_val;
        }
        else {
          if (here_val === 16) {
            //=== NEEDBITS(here.bits + 2);
            n = here_bits + 2;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            if (state.have === 0) {
              strm.msg = 'invalid bit length repeat';
              state.mode = BAD;
              break;
            }
            len = state.lens[state.have - 1];
            copy = 3 + (hold & 0x03);//BITS(2);
            //--- DROPBITS(2) ---//
            hold >>>= 2;
            bits -= 2;
            //---//
          }
          else if (here_val === 17) {
            //=== NEEDBITS(here.bits + 3);
            n = here_bits + 3;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 3 + (hold & 0x07);//BITS(3);
            //--- DROPBITS(3) ---//
            hold >>>= 3;
            bits -= 3;
            //---//
          }
          else {
            //=== NEEDBITS(here.bits + 7);
            n = here_bits + 7;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 11 + (hold & 0x7f);//BITS(7);
            //--- DROPBITS(7) ---//
            hold >>>= 7;
            bits -= 7;
            //---//
          }
          if (state.have + copy > state.nlen + state.ndist) {
            strm.msg = 'invalid bit length repeat';
            state.mode = BAD;
            break;
          }
          while (copy--) {
            state.lens[state.have++] = len;
          }
        }
      }

      /* handle error breaks in while */
      if (state.mode === BAD) { break; }

      /* check for end-of-block code (better have one) */
      if (state.lens[256] === 0) {
        strm.msg = 'invalid code -- missing end-of-block';
        state.mode = BAD;
        break;
      }

      /* build code tables -- note: do not change the lenbits or distbits
         values here (9 and 6) without reading the comments in inftrees.h
         concerning the ENOUGH constants, which depend on those values */
      state.lenbits = 9;

      opts = { bits: state.lenbits };
      ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.lenbits = opts.bits;
      // state.lencode = state.next;

      if (ret) {
        strm.msg = 'invalid literal/lengths set';
        state.mode = BAD;
        break;
      }

      state.distbits = 6;
      //state.distcode.copy(state.codes);
      // Switch to use dynamic table
      state.distcode = state.distdyn;
      opts = { bits: state.distbits };
      ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.distbits = opts.bits;
      // state.distcode = state.next;

      if (ret) {
        strm.msg = 'invalid distances set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, 'inflate:       codes ok\n'));
      state.mode = LEN_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case LEN_:
      state.mode = LEN;
      /* falls through */
    case LEN:
      if (have >= 6 && left >= 258) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        inflate_fast(strm, _out);
        //--- LOAD() ---
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        //---

        if (state.mode === TYPE) {
          state.back = -1;
        }
        break;
      }
      state.back = 0;
      for (;;) {
        here = state.lencode[hold & ((1 << state.lenbits) - 1)];  /*BITS(state.lenbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if (here_bits <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if (here_op && (here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.lencode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      state.length = here_val;
      if (here_op === 0) {
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        state.mode = LIT;
        break;
      }
      if (here_op & 32) {
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.back = -1;
        state.mode = TYPE;
        break;
      }
      if (here_op & 64) {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break;
      }
      state.extra = here_op & 15;
      state.mode = LENEXT;
      /* falls through */
    case LENEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
      //Tracevv((stderr, "inflate:         length %u\n", state.length));
      state.was = state.length;
      state.mode = DIST;
      /* falls through */
    case DIST:
      for (;;) {
        here = state.distcode[hold & ((1 << state.distbits) - 1)];/*BITS(state.distbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if ((here_bits) <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if ((here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.distcode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      if (here_op & 64) {
        strm.msg = 'invalid distance code';
        state.mode = BAD;
        break;
      }
      state.offset = here_val;
      state.extra = (here_op) & 15;
      state.mode = DISTEXT;
      /* falls through */
    case DISTEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.offset += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
//#ifdef INFLATE_STRICT
      if (state.offset > state.dmax) {
        strm.msg = 'invalid distance too far back';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
      state.mode = MATCH;
      /* falls through */
    case MATCH:
      if (left === 0) { break inf_leave; }
      copy = _out - left;
      if (state.offset > copy) {         /* copy from window */
        copy = state.offset - copy;
        if (copy > state.whave) {
          if (state.sane) {
            strm.msg = 'invalid distance too far back';
            state.mode = BAD;
            break;
          }
// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//          Trace((stderr, "inflate.c too far\n"));
//          copy -= state.whave;
//          if (copy > state.length) { copy = state.length; }
//          if (copy > left) { copy = left; }
//          left -= copy;
//          state.length -= copy;
//          do {
//            output[put++] = 0;
//          } while (--copy);
//          if (state.length === 0) { state.mode = LEN; }
//          break;
//#endif
        }
        if (copy > state.wnext) {
          copy -= state.wnext;
          from = state.wsize - copy;
        }
        else {
          from = state.wnext - copy;
        }
        if (copy > state.length) { copy = state.length; }
        from_source = state.window;
      }
      else {                              /* copy from output */
        from_source = output;
        from = put - state.offset;
        copy = state.length;
      }
      if (copy > left) { copy = left; }
      left -= copy;
      state.length -= copy;
      do {
        output[put++] = from_source[from++];
      } while (--copy);
      if (state.length === 0) { state.mode = LEN; }
      break;
    case LIT:
      if (left === 0) { break inf_leave; }
      output[put++] = state.length;
      left--;
      state.mode = LEN;
      break;
    case CHECK:
      if (state.wrap) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          // Use '|' insdead of '+' to make sure that result is signed
          hold |= input[next++] << bits;
          bits += 8;
        }
        //===//
        _out -= left;
        strm.total_out += _out;
        state.total += _out;
        if (_out) {
          strm.adler = state.check =
              /*UPDATE(state.check, put - _out, _out);*/
              (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

        }
        _out = left;
        // NB: crc32 stored as signed 32-bit int, zswap32 returns signed too
        if ((state.flags ? hold : zswap32(hold)) !== state.check) {
          strm.msg = 'incorrect data check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   check matches trailer\n"));
      }
      state.mode = LENGTH;
      /* falls through */
    case LENGTH:
      if (state.wrap && state.flags) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.total & 0xffffffff)) {
          strm.msg = 'incorrect length check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   length matches trailer\n"));
      }
      state.mode = DONE;
      /* falls through */
    case DONE:
      ret = Z_STREAM_END;
      break inf_leave;
    case BAD:
      ret = Z_DATA_ERROR;
      break inf_leave;
    case MEM:
      return Z_MEM_ERROR;
    case SYNC:
      /* falls through */
    default:
      return Z_STREAM_ERROR;
    }
  }

  // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

  /*
     Return from inflate(), updating the total counts and the check value.
     If there was no progress during the inflate() call, return a buffer
     error.  Call updatewindow() to create and/or update the window state.
     Note: a memory error from inflate() is non-recoverable.
   */

  //--- RESTORE() ---
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  //---

  if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
                      (state.mode < CHECK || flush !== Z_FINISH))) {
    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
      state.mode = MEM;
      return Z_MEM_ERROR;
    }
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if (state.wrap && _out) {
    strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
      (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) +
                    (state.mode === TYPE ? 128 : 0) +
                    (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
    ret = Z_BUF_ERROR;
  }
  return ret;
}

function inflateEnd(strm) {

  if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
    return Z_STREAM_ERROR;
  }

  var state = strm.state;
  if (state.window) {
    state.window = null;
  }
  strm.state = null;
  return Z_OK;
}

function inflateGetHeader(strm, head) {
  var state;

  /* check state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR; }

  /* save header structure */
  state.head = head;
  head.done = false;
  return Z_OK;
}

function inflateSetDictionary(strm, dictionary) {
  var dictLength = dictionary.length;

  var state;
  var dictid;
  var ret;

  /* check state */
  if (!strm /* == Z_NULL */ || !strm.state /* == Z_NULL */) { return Z_STREAM_ERROR; }
  state = strm.state;

  if (state.wrap !== 0 && state.mode !== DICT) {
    return Z_STREAM_ERROR;
  }

  /* check for correct dictionary identifier */
  if (state.mode === DICT) {
    dictid = 1; /* adler32(0, null, 0)*/
    /* dictid = adler32(dictid, dictionary, dictLength); */
    dictid = adler32(dictid, dictionary, dictLength, 0);
    if (dictid !== state.check) {
      return Z_DATA_ERROR;
    }
  }
  /* copy dictionary to window using updatewindow(), which will amend the
   existing dictionary if appropriate */
  ret = updatewindow(strm, dictionary, dictLength, dictLength);
  if (ret) {
    state.mode = MEM;
    return Z_MEM_ERROR;
  }
  state.havedict = 1;
  // Tracev((stderr, "inflate:   dictionary set\n"));
  return Z_OK;
}

exports.inflateReset = inflateReset;
exports.inflateReset2 = inflateReset2;
exports.inflateResetKeep = inflateResetKeep;
exports.inflateInit = inflateInit;
exports.inflateInit2 = inflateInit2;
exports.inflate = inflate;
exports.inflateEnd = inflateEnd;
exports.inflateGetHeader = inflateGetHeader;
exports.inflateSetDictionary = inflateSetDictionary;
exports.inflateInfo = 'pako inflate (from Nodeca project)';

/* Not implemented
exports.inflateCopy = inflateCopy;
exports.inflateGetDictionary = inflateGetDictionary;
exports.inflateMark = inflateMark;
exports.inflatePrime = inflatePrime;
exports.inflateSync = inflateSync;
exports.inflateSyncPoint = inflateSyncPoint;
exports.inflateUndermine = inflateUndermine;
*/

},{"../utils/common":79,"./adler32":81,"./crc32":83,"./inffast":86,"./inftrees":88}],88:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');

var MAXBITS = 15;
var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

var CODES = 0;
var LENS = 1;
var DISTS = 2;

var lbase = [ /* Length codes 257..285 base */
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
];

var lext = [ /* Length codes 257..285 extra */
  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
  19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
];

var dbase = [ /* Distance codes 0..29 base */
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577, 0, 0
];

var dext = [ /* Distance codes 0..29 extra */
  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
  23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
  28, 28, 29, 29, 64, 64
];

module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts)
{
  var bits = opts.bits;
      //here = opts.here; /* table entry for duplication */

  var len = 0;               /* a code's length in bits */
  var sym = 0;               /* index of code symbols */
  var min = 0, max = 0;          /* minimum and maximum code lengths */
  var root = 0;              /* number of index bits for root table */
  var curr = 0;              /* number of index bits for current table */
  var drop = 0;              /* code bits to drop for sub-table */
  var left = 0;                   /* number of prefix codes available */
  var used = 0;              /* code entries in table used */
  var huff = 0;              /* Huffman code */
  var incr;              /* for incrementing code, index */
  var fill;              /* index for replicating entries */
  var low;               /* low bits for current root entry */
  var mask;              /* mask for low root bits */
  var next;             /* next available space in table */
  var base = null;     /* base value table to use */
  var base_index = 0;
//  var shoextra;    /* extra bits table to use */
  var end;                    /* use base and extra for symbol > end */
  var count = new utils.Buf16(MAXBITS + 1); //[MAXBITS+1];    /* number of codes of each length */
  var offs = new utils.Buf16(MAXBITS + 1); //[MAXBITS+1];     /* offsets in table for each length */
  var extra = null;
  var extra_index = 0;

  var here_bits, here_op, here_val;

  /*
   Process a set of code lengths to create a canonical Huffman code.  The
   code lengths are lens[0..codes-1].  Each length corresponds to the
   symbols 0..codes-1.  The Huffman code is generated by first sorting the
   symbols by length from short to long, and retaining the symbol order
   for codes with equal lengths.  Then the code starts with all zero bits
   for the first code of the shortest length, and the codes are integer
   increments for the same length, and zeros are appended as the length
   increases.  For the deflate format, these bits are stored backwards
   from their more natural integer increment ordering, and so when the
   decoding tables are built in the large loop below, the integer codes
   are incremented backwards.

   This routine assumes, but does not check, that all of the entries in
   lens[] are in the range 0..MAXBITS.  The caller must assure this.
   1..MAXBITS is interpreted as that code length.  zero means that that
   symbol does not occur in this code.

   The codes are sorted by computing a count of codes for each length,
   creating from that a table of starting indices for each length in the
   sorted table, and then entering the symbols in order in the sorted
   table.  The sorted table is work[], with that space being provided by
   the caller.

   The length counts are used for other purposes as well, i.e. finding
   the minimum and maximum length codes, determining if there are any
   codes at all, checking for a valid set of lengths, and looking ahead
   at length counts to determine sub-table sizes when building the
   decoding tables.
   */

  /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
  for (len = 0; len <= MAXBITS; len++) {
    count[len] = 0;
  }
  for (sym = 0; sym < codes; sym++) {
    count[lens[lens_index + sym]]++;
  }

  /* bound code lengths, force root to be within code lengths */
  root = bits;
  for (max = MAXBITS; max >= 1; max--) {
    if (count[max] !== 0) { break; }
  }
  if (root > max) {
    root = max;
  }
  if (max === 0) {                     /* no symbols to code at all */
    //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
    //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
    //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;


    //table.op[opts.table_index] = 64;
    //table.bits[opts.table_index] = 1;
    //table.val[opts.table_index++] = 0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;

    opts.bits = 1;
    return 0;     /* no symbols, but wait for decoding to report error */
  }
  for (min = 1; min < max; min++) {
    if (count[min] !== 0) { break; }
  }
  if (root < min) {
    root = min;
  }

  /* check for an over-subscribed or incomplete set of lengths */
  left = 1;
  for (len = 1; len <= MAXBITS; len++) {
    left <<= 1;
    left -= count[len];
    if (left < 0) {
      return -1;
    }        /* over-subscribed */
  }
  if (left > 0 && (type === CODES || max !== 1)) {
    return -1;                      /* incomplete set */
  }

  /* generate offsets into symbol table for each length for sorting */
  offs[1] = 0;
  for (len = 1; len < MAXBITS; len++) {
    offs[len + 1] = offs[len] + count[len];
  }

  /* sort symbols by length, by symbol order within each length */
  for (sym = 0; sym < codes; sym++) {
    if (lens[lens_index + sym] !== 0) {
      work[offs[lens[lens_index + sym]]++] = sym;
    }
  }

  /*
   Create and fill in decoding tables.  In this loop, the table being
   filled is at next and has curr index bits.  The code being used is huff
   with length len.  That code is converted to an index by dropping drop
   bits off of the bottom.  For codes where len is less than drop + curr,
   those top drop + curr - len bits are incremented through all values to
   fill the table with replicated entries.

   root is the number of index bits for the root table.  When len exceeds
   root, sub-tables are created pointed to by the root entry with an index
   of the low root bits of huff.  This is saved in low to check for when a
   new sub-table should be started.  drop is zero when the root table is
   being filled, and drop is root when sub-tables are being filled.

   When a new sub-table is needed, it is necessary to look ahead in the
   code lengths to determine what size sub-table is needed.  The length
   counts are used for this, and so count[] is decremented as codes are
   entered in the tables.

   used keeps track of how many table entries have been allocated from the
   provided *table space.  It is checked for LENS and DIST tables against
   the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
   the initial root table size constants.  See the comments in inftrees.h
   for more information.

   sym increments through all symbols, and the loop terminates when
   all codes of length max, i.e. all codes, have been processed.  This
   routine permits incomplete codes, so another loop after this one fills
   in the rest of the decoding tables with invalid code markers.
   */

  /* set up for code type */
  // poor man optimization - use if-else instead of switch,
  // to avoid deopts in old v8
  if (type === CODES) {
    base = extra = work;    /* dummy value--not used */
    end = 19;

  } else if (type === LENS) {
    base = lbase;
    base_index -= 257;
    extra = lext;
    extra_index -= 257;
    end = 256;

  } else {                    /* DISTS */
    base = dbase;
    extra = dext;
    end = -1;
  }

  /* initialize opts for loop */
  huff = 0;                   /* starting code */
  sym = 0;                    /* starting code symbol */
  len = min;                  /* starting code length */
  next = table_index;              /* current table to fill in */
  curr = root;                /* current table index bits */
  drop = 0;                   /* current bits to drop from code for index */
  low = -1;                   /* trigger new sub-table when len > root */
  used = 1 << root;          /* use root table entries */
  mask = used - 1;            /* mask for comparing low */

  /* check available table space */
  if ((type === LENS && used > ENOUGH_LENS) ||
    (type === DISTS && used > ENOUGH_DISTS)) {
    return 1;
  }

  var i = 0;
  /* process all codes and make table entries */
  for (;;) {
    i++;
    /* create table entry */
    here_bits = len - drop;
    if (work[sym] < end) {
      here_op = 0;
      here_val = work[sym];
    }
    else if (work[sym] > end) {
      here_op = extra[extra_index + work[sym]];
      here_val = base[base_index + work[sym]];
    }
    else {
      here_op = 32 + 64;         /* end of block */
      here_val = 0;
    }

    /* replicate for those indices with low len bits equal to huff */
    incr = 1 << (len - drop);
    fill = 1 << curr;
    min = fill;                 /* save offset to next table */
    do {
      fill -= incr;
      table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
    } while (fill !== 0);

    /* backwards increment the len-bit code huff */
    incr = 1 << (len - 1);
    while (huff & incr) {
      incr >>= 1;
    }
    if (incr !== 0) {
      huff &= incr - 1;
      huff += incr;
    } else {
      huff = 0;
    }

    /* go to next symbol, update count, len */
    sym++;
    if (--count[len] === 0) {
      if (len === max) { break; }
      len = lens[lens_index + work[sym]];
    }

    /* create new sub-table if needed */
    if (len > root && (huff & mask) !== low) {
      /* if first time, transition to sub-tables */
      if (drop === 0) {
        drop = root;
      }

      /* increment past last table */
      next += min;            /* here min is 1 << curr */

      /* determine length of next table */
      curr = len - drop;
      left = 1 << curr;
      while (curr + drop < max) {
        left -= count[curr + drop];
        if (left <= 0) { break; }
        curr++;
        left <<= 1;
      }

      /* check for enough space */
      used += 1 << curr;
      if ((type === LENS && used > ENOUGH_LENS) ||
        (type === DISTS && used > ENOUGH_DISTS)) {
        return 1;
      }

      /* point entry in root table to sub-table */
      low = huff & mask;
      /*table.op[low] = curr;
      table.bits[low] = root;
      table.val[low] = next - opts.table_index;*/
      table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
    }
  }

  /* fill in remaining table entry if code is incomplete (guaranteed to have
   at most one remaining entry, since if the code is incomplete, the
   maximum code length that was allowed to get this far is one bit) */
  if (huff !== 0) {
    //table.op[next + huff] = 64;            /* invalid code marker */
    //table.bits[next + huff] = len - drop;
    //table.val[next + huff] = 0;
    table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
  }

  /* set return parameters */
  //opts.table_index += used;
  opts.bits = root;
  return 0;
};

},{"../utils/common":79}],89:[function(require,module,exports){
'use strict';

module.exports = {
  2:      'need dictionary',     /* Z_NEED_DICT       2  */
  1:      'stream end',          /* Z_STREAM_END      1  */
  0:      '',                    /* Z_OK              0  */
  '-1':   'file error',          /* Z_ERRNO         (-1) */
  '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
  '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
  '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
  '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
  '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
};

},{}],90:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');

/* Public constants ==========================================================*/
/* ===========================================================================*/


//var Z_FILTERED          = 1;
//var Z_HUFFMAN_ONLY      = 2;
//var Z_RLE               = 3;
var Z_FIXED               = 4;
//var Z_DEFAULT_STRATEGY  = 0;

/* Possible values of the data_type field (though see inflate()) */
var Z_BINARY              = 0;
var Z_TEXT                = 1;
//var Z_ASCII             = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;

/*============================================================================*/


function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }

// From zutil.h

var STORED_BLOCK = 0;
var STATIC_TREES = 1;
var DYN_TREES    = 2;
/* The three kinds of block type */

var MIN_MATCH    = 3;
var MAX_MATCH    = 258;
/* The minimum and maximum match lengths */

// From deflate.h
/* ===========================================================================
 * Internal compression state.
 */

var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */

var LITERALS      = 256;
/* number of literal bytes 0..255 */

var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */

var D_CODES       = 30;
/* number of distance codes */

var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */

var HEAP_SIZE     = 2 * L_CODES + 1;
/* maximum heap size */

var MAX_BITS      = 15;
/* All codes must not exceed MAX_BITS bits */

var Buf_size      = 16;
/* size of bit buffer in bi_buf */


/* ===========================================================================
 * Constants
 */

var MAX_BL_BITS = 7;
/* Bit length codes must not exceed MAX_BL_BITS bits */

var END_BLOCK   = 256;
/* end of block literal code */

var REP_3_6     = 16;
/* repeat previous bit length 3-6 times (2 bits of repeat count) */

var REPZ_3_10   = 17;
/* repeat a zero length 3-10 times  (3 bits of repeat count) */

var REPZ_11_138 = 18;
/* repeat a zero length 11-138 times  (7 bits of repeat count) */

/* eslint-disable comma-spacing,array-bracket-spacing */
var extra_lbits =   /* extra bits for each length code */
  [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];

var extra_dbits =   /* extra bits for each distance code */
  [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

var extra_blbits =  /* extra bits for each bit length code */
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7];

var bl_order =
  [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
/* eslint-enable comma-spacing,array-bracket-spacing */

/* The lengths of the bit length codes are sent in order of decreasing
 * probability, to avoid transmitting the lengths for unused bit length codes.
 */

/* ===========================================================================
 * Local data. These are initialized only once.
 */

// We pre-fill arrays with 0 to avoid uninitialized gaps

var DIST_CODE_LEN = 512; /* see definition of array dist_code below */

// !!!! Use flat array insdead of structure, Freq = i*2, Len = i*2+1
var static_ltree  = new Array((L_CODES + 2) * 2);
zero(static_ltree);
/* The static literal tree. Since the bit lengths are imposed, there is no
 * need for the L_CODES extra codes used during heap construction. However
 * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
 * below).
 */

var static_dtree  = new Array(D_CODES * 2);
zero(static_dtree);
/* The static distance tree. (Actually a trivial tree since all codes use
 * 5 bits.)
 */

var _dist_code    = new Array(DIST_CODE_LEN);
zero(_dist_code);
/* Distance codes. The first 256 values correspond to the distances
 * 3 .. 258, the last 256 values correspond to the top 8 bits of
 * the 15 bit distances.
 */

var _length_code  = new Array(MAX_MATCH - MIN_MATCH + 1);
zero(_length_code);
/* length code for each normalized match length (0 == MIN_MATCH) */

var base_length   = new Array(LENGTH_CODES);
zero(base_length);
/* First normalized length for each code (0 = MIN_MATCH) */

var base_dist     = new Array(D_CODES);
zero(base_dist);
/* First normalized distance for each code (0 = distance of 1) */


function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {

  this.static_tree  = static_tree;  /* static tree or NULL */
  this.extra_bits   = extra_bits;   /* extra bits for each code or NULL */
  this.extra_base   = extra_base;   /* base index for extra_bits */
  this.elems        = elems;        /* max number of elements in the tree */
  this.max_length   = max_length;   /* max bit length for the codes */

  // show if `static_tree` has data or dummy - needed for monomorphic objects
  this.has_stree    = static_tree && static_tree.length;
}


var static_l_desc;
var static_d_desc;
var static_bl_desc;


function TreeDesc(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;     /* the dynamic tree */
  this.max_code = 0;            /* largest code with non zero frequency */
  this.stat_desc = stat_desc;   /* the corresponding static tree */
}



function d_code(dist) {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
}


/* ===========================================================================
 * Output a short LSB first on the stream.
 * IN assertion: there is enough room in pendingBuf.
 */
function put_short(s, w) {
//    put_byte(s, (uch)((w) & 0xff));
//    put_byte(s, (uch)((ush)(w) >> 8));
  s.pending_buf[s.pending++] = (w) & 0xff;
  s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
}


/* ===========================================================================
 * Send a value on a given number of bits.
 * IN assertion: length <= 16 and value fits in length bits.
 */
function send_bits(s, value, length) {
  if (s.bi_valid > (Buf_size - length)) {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> (Buf_size - s.bi_valid);
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    s.bi_valid += length;
  }
}


function send_code(s, c, tree) {
  send_bits(s, tree[c * 2]/*.Code*/, tree[c * 2 + 1]/*.Len*/);
}


/* ===========================================================================
 * Reverse the first len bits of a code, using straightforward code (a faster
 * method would use a table)
 * IN assertion: 1 <= len <= 15
 */
function bi_reverse(code, len) {
  var res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
}


/* ===========================================================================
 * Flush the bit buffer, keeping at most 7 bits in it.
 */
function bi_flush(s) {
  if (s.bi_valid === 16) {
    put_short(s, s.bi_buf);
    s.bi_buf = 0;
    s.bi_valid = 0;

  } else if (s.bi_valid >= 8) {
    s.pending_buf[s.pending++] = s.bi_buf & 0xff;
    s.bi_buf >>= 8;
    s.bi_valid -= 8;
  }
}


/* ===========================================================================
 * Compute the optimal bit lengths for a tree and update the total bit length
 * for the current block.
 * IN assertion: the fields freq and dad are set, heap[heap_max] and
 *    above are the tree nodes sorted by increasing frequency.
 * OUT assertions: the field len is set to the optimal bit length, the
 *     array bl_count contains the frequencies for each bit length.
 *     The length opt_len is updated; static_len is also updated if stree is
 *     not null.
 */
function gen_bitlen(s, desc)
//    deflate_state *s;
//    tree_desc *desc;    /* the tree descriptor */
{
  var tree            = desc.dyn_tree;
  var max_code        = desc.max_code;
  var stree           = desc.stat_desc.static_tree;
  var has_stree       = desc.stat_desc.has_stree;
  var extra           = desc.stat_desc.extra_bits;
  var base            = desc.stat_desc.extra_base;
  var max_length      = desc.stat_desc.max_length;
  var h;              /* heap index */
  var n, m;           /* iterate over the tree elements */
  var bits;           /* bit length */
  var xbits;          /* extra bits */
  var f;              /* frequency */
  var overflow = 0;   /* number of elements with bit length too large */

  for (bits = 0; bits <= MAX_BITS; bits++) {
    s.bl_count[bits] = 0;
  }

  /* In a first pass, compute the optimal bit lengths (which may
   * overflow in the case of the bit length tree).
   */
  tree[s.heap[s.heap_max] * 2 + 1]/*.Len*/ = 0; /* root of the heap */

  for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
    n = s.heap[h];
    bits = tree[tree[n * 2 + 1]/*.Dad*/ * 2 + 1]/*.Len*/ + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n * 2 + 1]/*.Len*/ = bits;
    /* We overwrite tree[n].Dad which is no longer needed */

    if (n > max_code) { continue; } /* not a leaf node */

    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base) {
      xbits = extra[n - base];
    }
    f = tree[n * 2]/*.Freq*/;
    s.opt_len += f * (bits + xbits);
    if (has_stree) {
      s.static_len += f * (stree[n * 2 + 1]/*.Len*/ + xbits);
    }
  }
  if (overflow === 0) { return; }

  // Trace((stderr,"\nbit length overflow\n"));
  /* This happens for example on obj2 and pic of the Calgary corpus */

  /* Find the first bit length which could increase: */
  do {
    bits = max_length - 1;
    while (s.bl_count[bits] === 0) { bits--; }
    s.bl_count[bits]--;      /* move one leaf down the tree */
    s.bl_count[bits + 1] += 2; /* move one overflow item as its brother */
    s.bl_count[max_length]--;
    /* The brother of the overflow item also moves one step up,
     * but this does not affect bl_count[max_length]
     */
    overflow -= 2;
  } while (overflow > 0);

  /* Now recompute all bit lengths, scanning in increasing frequency.
   * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
   * lengths instead of fixing only the wrong ones. This idea is taken
   * from 'ar' written by Haruhiko Okumura.)
   */
  for (bits = max_length; bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) { continue; }
      if (tree[m * 2 + 1]/*.Len*/ !== bits) {
        // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
        s.opt_len += (bits - tree[m * 2 + 1]/*.Len*/) * tree[m * 2]/*.Freq*/;
        tree[m * 2 + 1]/*.Len*/ = bits;
      }
      n--;
    }
  }
}


/* ===========================================================================
 * Generate the codes for a given tree and bit counts (which need not be
 * optimal).
 * IN assertion: the array bl_count contains the bit length statistics for
 * the given tree and the field len is set for all tree elements.
 * OUT assertion: the field code is set for all tree elements of non
 *     zero code length.
 */
function gen_codes(tree, max_code, bl_count)
//    ct_data *tree;             /* the tree to decorate */
//    int max_code;              /* largest code with non zero frequency */
//    ushf *bl_count;            /* number of codes at each bit length */
{
  var next_code = new Array(MAX_BITS + 1); /* next code value for each bit length */
  var code = 0;              /* running code value */
  var bits;                  /* bit index */
  var n;                     /* code index */

  /* The distribution counts are first used to generate the code values
   * without bit reversal.
   */
  for (bits = 1; bits <= MAX_BITS; bits++) {
    next_code[bits] = code = (code + bl_count[bits - 1]) << 1;
  }
  /* Check that the bit counts in bl_count are consistent. The last code
   * must be all ones.
   */
  //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
  //        "inconsistent bit counts");
  //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

  for (n = 0;  n <= max_code; n++) {
    var len = tree[n * 2 + 1]/*.Len*/;
    if (len === 0) { continue; }
    /* Now reverse the bits */
    tree[n * 2]/*.Code*/ = bi_reverse(next_code[len]++, len);

    //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
    //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
  }
}


/* ===========================================================================
 * Initialize the various 'constant' tables.
 */
function tr_static_init() {
  var n;        /* iterates over tree elements */
  var bits;     /* bit counter */
  var length;   /* length value */
  var code;     /* code value */
  var dist;     /* distance index */
  var bl_count = new Array(MAX_BITS + 1);
  /* number of codes at each bit length for an optimal tree */

  // do check in _tr_init()
  //if (static_init_done) return;

  /* For some embedded targets, global variables are not initialized: */
/*#ifdef NO_INIT_GLOBAL_POINTERS
  static_l_desc.static_tree = static_ltree;
  static_l_desc.extra_bits = extra_lbits;
  static_d_desc.static_tree = static_dtree;
  static_d_desc.extra_bits = extra_dbits;
  static_bl_desc.extra_bits = extra_blbits;
#endif*/

  /* Initialize the mapping length (0..255) -> length code (0..28) */
  length = 0;
  for (code = 0; code < LENGTH_CODES - 1; code++) {
    base_length[code] = length;
    for (n = 0; n < (1 << extra_lbits[code]); n++) {
      _length_code[length++] = code;
    }
  }
  //Assert (length == 256, "tr_static_init: length != 256");
  /* Note that the length 255 (match length 258) can be represented
   * in two different ways: code 284 + 5 bits or code 285, so we
   * overwrite length_code[255] to use the best encoding:
   */
  _length_code[length - 1] = code;

  /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
  dist = 0;
  for (code = 0; code < 16; code++) {
    base_dist[code] = dist;
    for (n = 0; n < (1 << extra_dbits[code]); n++) {
      _dist_code[dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: dist != 256");
  dist >>= 7; /* from now on, all distances are divided by 128 */
  for (; code < D_CODES; code++) {
    base_dist[code] = dist << 7;
    for (n = 0; n < (1 << (extra_dbits[code] - 7)); n++) {
      _dist_code[256 + dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: 256+dist != 512");

  /* Construct the codes of the static literal tree */
  for (bits = 0; bits <= MAX_BITS; bits++) {
    bl_count[bits] = 0;
  }

  n = 0;
  while (n <= 143) {
    static_ltree[n * 2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  while (n <= 255) {
    static_ltree[n * 2 + 1]/*.Len*/ = 9;
    n++;
    bl_count[9]++;
  }
  while (n <= 279) {
    static_ltree[n * 2 + 1]/*.Len*/ = 7;
    n++;
    bl_count[7]++;
  }
  while (n <= 287) {
    static_ltree[n * 2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  /* Codes 286 and 287 do not exist, but we must include them in the
   * tree construction to get a canonical Huffman tree (longest code
   * all ones)
   */
  gen_codes(static_ltree, L_CODES + 1, bl_count);

  /* The static distance tree is trivial: */
  for (n = 0; n < D_CODES; n++) {
    static_dtree[n * 2 + 1]/*.Len*/ = 5;
    static_dtree[n * 2]/*.Code*/ = bi_reverse(n, 5);
  }

  // Now data ready and we can init static trees
  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0,          D_CODES, MAX_BITS);
  static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0,         BL_CODES, MAX_BL_BITS);

  //static_init_done = true;
}


/* ===========================================================================
 * Initialize a new block.
 */
function init_block(s) {
  var n; /* iterates over tree elements */

  /* Initialize the trees. */
  for (n = 0; n < L_CODES;  n++) { s.dyn_ltree[n * 2]/*.Freq*/ = 0; }
  for (n = 0; n < D_CODES;  n++) { s.dyn_dtree[n * 2]/*.Freq*/ = 0; }
  for (n = 0; n < BL_CODES; n++) { s.bl_tree[n * 2]/*.Freq*/ = 0; }

  s.dyn_ltree[END_BLOCK * 2]/*.Freq*/ = 1;
  s.opt_len = s.static_len = 0;
  s.last_lit = s.matches = 0;
}


/* ===========================================================================
 * Flush the bit buffer and align the output on a byte boundary
 */
function bi_windup(s)
{
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    //put_byte(s, (Byte)s->bi_buf);
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
}

/* ===========================================================================
 * Copy a stored block, storing first the length and its
 * one's complement if requested.
 */
function copy_block(s, buf, len, header)
//DeflateState *s;
//charf    *buf;    /* the input data */
//unsigned len;     /* its length */
//int      header;  /* true if block header must be written */
{
  bi_windup(s);        /* align on byte boundary */

  if (header) {
    put_short(s, len);
    put_short(s, ~len);
  }
//  while (len--) {
//    put_byte(s, *buf++);
//  }
  utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
  s.pending += len;
}

/* ===========================================================================
 * Compares to subtrees, using the tree depth as tie breaker when
 * the subtrees have equal frequency. This minimizes the worst case length.
 */
function smaller(tree, n, m, depth) {
  var _n2 = n * 2;
  var _m2 = m * 2;
  return (tree[_n2]/*.Freq*/ < tree[_m2]/*.Freq*/ ||
         (tree[_n2]/*.Freq*/ === tree[_m2]/*.Freq*/ && depth[n] <= depth[m]));
}

/* ===========================================================================
 * Restore the heap property by moving down the tree starting at node k,
 * exchanging a node with the smallest of its two sons if necessary, stopping
 * when the heap property is re-established (each father smaller than its
 * two sons).
 */
function pqdownheap(s, tree, k)
//    deflate_state *s;
//    ct_data *tree;  /* the tree to restore */
//    int k;               /* node to move down */
{
  var v = s.heap[k];
  var j = k << 1;  /* left son of k */
  while (j <= s.heap_len) {
    /* Set j to the smallest of the two sons: */
    if (j < s.heap_len &&
      smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
      j++;
    }
    /* Exit if v is smaller than both sons */
    if (smaller(tree, v, s.heap[j], s.depth)) { break; }

    /* Exchange v with the smallest son */
    s.heap[k] = s.heap[j];
    k = j;

    /* And continue down the tree, setting j to the left son of k */
    j <<= 1;
  }
  s.heap[k] = v;
}


// inlined manually
// var SMALLEST = 1;

/* ===========================================================================
 * Send the block data compressed using the given Huffman trees
 */
function compress_block(s, ltree, dtree)
//    deflate_state *s;
//    const ct_data *ltree; /* literal tree */
//    const ct_data *dtree; /* distance tree */
{
  var dist;           /* distance of matched string */
  var lc;             /* match length or unmatched char (if dist == 0) */
  var lx = 0;         /* running index in l_buf */
  var code;           /* the code to send */
  var extra;          /* number of extra bits to send */

  if (s.last_lit !== 0) {
    do {
      dist = (s.pending_buf[s.d_buf + lx * 2] << 8) | (s.pending_buf[s.d_buf + lx * 2 + 1]);
      lc = s.pending_buf[s.l_buf + lx];
      lx++;

      if (dist === 0) {
        send_code(s, lc, ltree); /* send a literal byte */
        //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
      } else {
        /* Here, lc is the match length - MIN_MATCH */
        code = _length_code[lc];
        send_code(s, code + LITERALS + 1, ltree); /* send the length code */
        extra = extra_lbits[code];
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra);       /* send the extra length bits */
        }
        dist--; /* dist is now the match distance - 1 */
        code = d_code(dist);
        //Assert (code < D_CODES, "bad d_code");

        send_code(s, code, dtree);       /* send the distance code */
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra);   /* send the extra distance bits */
        }
      } /* literal or match pair ? */

      /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
      //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
      //       "pendingBuf overflow");

    } while (lx < s.last_lit);
  }

  send_code(s, END_BLOCK, ltree);
}


/* ===========================================================================
 * Construct one Huffman tree and assigns the code bit strings and lengths.
 * Update the total bit length for the current block.
 * IN assertion: the field freq is set for all tree elements.
 * OUT assertions: the fields len and code are set to the optimal bit length
 *     and corresponding code. The length opt_len is updated; static_len is
 *     also updated if stree is not null. The field max_code is set.
 */
function build_tree(s, desc)
//    deflate_state *s;
//    tree_desc *desc; /* the tree descriptor */
{
  var tree     = desc.dyn_tree;
  var stree    = desc.stat_desc.static_tree;
  var has_stree = desc.stat_desc.has_stree;
  var elems    = desc.stat_desc.elems;
  var n, m;          /* iterate over heap elements */
  var max_code = -1; /* largest code with non zero frequency */
  var node;          /* new node being created */

  /* Construct the initial heap, with least frequent element in
   * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
   * heap[0] is not used.
   */
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE;

  for (n = 0; n < elems; n++) {
    if (tree[n * 2]/*.Freq*/ !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;

    } else {
      tree[n * 2 + 1]/*.Len*/ = 0;
    }
  }

  /* The pkzip format requires that at least one distance code exists,
   * and that at least one bit should be sent even if there is only one
   * possible code. So to avoid special checks later on we force at least
   * two codes of non zero frequency.
   */
  while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
    tree[node * 2]/*.Freq*/ = 1;
    s.depth[node] = 0;
    s.opt_len--;

    if (has_stree) {
      s.static_len -= stree[node * 2 + 1]/*.Len*/;
    }
    /* node is 0 or 1 so it does not have extra bits */
  }
  desc.max_code = max_code;

  /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
   * establish sub-heaps of increasing lengths:
   */
  for (n = (s.heap_len >> 1/*int /2*/); n >= 1; n--) { pqdownheap(s, tree, n); }

  /* Construct the Huffman tree by repeatedly combining the least two
   * frequent nodes.
   */
  node = elems;              /* next internal node of the tree */
  do {
    //pqremove(s, tree, n);  /* n = node of least frequency */
    /*** pqremove ***/
    n = s.heap[1/*SMALLEST*/];
    s.heap[1/*SMALLEST*/] = s.heap[s.heap_len--];
    pqdownheap(s, tree, 1/*SMALLEST*/);
    /***/

    m = s.heap[1/*SMALLEST*/]; /* m = node of next least frequency */

    s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
    s.heap[--s.heap_max] = m;

    /* Create a new node father of n and m */
    tree[node * 2]/*.Freq*/ = tree[n * 2]/*.Freq*/ + tree[m * 2]/*.Freq*/;
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n * 2 + 1]/*.Dad*/ = tree[m * 2 + 1]/*.Dad*/ = node;

    /* and insert the new node in the heap */
    s.heap[1/*SMALLEST*/] = node++;
    pqdownheap(s, tree, 1/*SMALLEST*/);

  } while (s.heap_len >= 2);

  s.heap[--s.heap_max] = s.heap[1/*SMALLEST*/];

  /* At this point, the fields freq and dad are set. We can now
   * generate the bit lengths.
   */
  gen_bitlen(s, desc);

  /* The field len is now set, we can generate the bit codes */
  gen_codes(tree, max_code, s.bl_count);
}


/* ===========================================================================
 * Scan a literal or distance tree to determine the frequencies of the codes
 * in the bit length tree.
 */
function scan_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree;   /* the tree to be scanned */
//    int max_code;    /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0 * 2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code + 1) * 2 + 1]/*.Len*/ = 0xffff; /* guard */

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      s.bl_tree[curlen * 2]/*.Freq*/ += count;

    } else if (curlen !== 0) {

      if (curlen !== prevlen) { s.bl_tree[curlen * 2]/*.Freq*/++; }
      s.bl_tree[REP_3_6 * 2]/*.Freq*/++;

    } else if (count <= 10) {
      s.bl_tree[REPZ_3_10 * 2]/*.Freq*/++;

    } else {
      s.bl_tree[REPZ_11_138 * 2]/*.Freq*/++;
    }

    count = 0;
    prevlen = curlen;

    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Send a literal or distance tree in compressed form, using the codes in
 * bl_tree.
 */
function send_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree; /* the tree to be scanned */
//    int max_code;       /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0 * 2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  /* tree[max_code+1].Len = -1; */  /* guard already set */
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      do { send_code(s, curlen, s.bl_tree); } while (--count !== 0);

    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      //Assert(count >= 3 && count <= 6, " 3_6?");
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count - 3, 2);

    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count - 3, 3);

    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count - 11, 7);
    }

    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Construct the Huffman tree for the bit lengths and return the index in
 * bl_order of the last bit length code to send.
 */
function build_bl_tree(s) {
  var max_blindex;  /* index of last bit length code of non zero freq */

  /* Determine the bit length frequencies for literal and distance trees */
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

  /* Build the bit length tree: */
  build_tree(s, s.bl_desc);
  /* opt_len now includes the length of the tree representations, except
   * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
   */

  /* Determine the number of bit length codes to send. The pkzip format
   * requires that at least 4 bit length codes be sent. (appnote.txt says
   * 3 but the actual value used is 4.)
   */
  for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
    if (s.bl_tree[bl_order[max_blindex] * 2 + 1]/*.Len*/ !== 0) {
      break;
    }
  }
  /* Update opt_len to include the bit length tree and counts */
  s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
  //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
  //        s->opt_len, s->static_len));

  return max_blindex;
}


/* ===========================================================================
 * Send the header for a block using dynamic Huffman trees: the counts, the
 * lengths of the bit length codes, the literal tree and the distance tree.
 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
 */
function send_all_trees(s, lcodes, dcodes, blcodes)
//    deflate_state *s;
//    int lcodes, dcodes, blcodes; /* number of codes for each tree */
{
  var rank;                    /* index in bl_order */

  //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
  //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
  //        "too many codes");
  //Tracev((stderr, "\nbl counts: "));
  send_bits(s, lcodes - 257, 5); /* not +255 as stated in appnote.txt */
  send_bits(s, dcodes - 1,   5);
  send_bits(s, blcodes - 4,  4); /* not -3 as stated in appnote.txt */
  for (rank = 0; rank < blcodes; rank++) {
    //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
    send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1]/*.Len*/, 3);
  }
  //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_ltree, lcodes - 1); /* literal tree */
  //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_dtree, dcodes - 1); /* distance tree */
  //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
}


/* ===========================================================================
 * Check if the data type is TEXT or BINARY, using the following algorithm:
 * - TEXT if the two conditions below are satisfied:
 *    a) There are no non-portable control characters belonging to the
 *       "black list" (0..6, 14..25, 28..31).
 *    b) There is at least one printable character belonging to the
 *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
 * - BINARY otherwise.
 * - The following partially-portable control characters form a
 *   "gray list" that is ignored in this detection algorithm:
 *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
 * IN assertion: the fields Freq of dyn_ltree are set.
 */
function detect_data_type(s) {
  /* black_mask is the bit mask of black-listed bytes
   * set bits 0..6, 14..25, and 28..31
   * 0xf3ffc07f = binary 11110011111111111100000001111111
   */
  var black_mask = 0xf3ffc07f;
  var n;

  /* Check for non-textual ("black-listed") bytes. */
  for (n = 0; n <= 31; n++, black_mask >>>= 1) {
    if ((black_mask & 1) && (s.dyn_ltree[n * 2]/*.Freq*/ !== 0)) {
      return Z_BINARY;
    }
  }

  /* Check for textual ("white-listed") bytes. */
  if (s.dyn_ltree[9 * 2]/*.Freq*/ !== 0 || s.dyn_ltree[10 * 2]/*.Freq*/ !== 0 ||
      s.dyn_ltree[13 * 2]/*.Freq*/ !== 0) {
    return Z_TEXT;
  }
  for (n = 32; n < LITERALS; n++) {
    if (s.dyn_ltree[n * 2]/*.Freq*/ !== 0) {
      return Z_TEXT;
    }
  }

  /* There are no "black-listed" or "white-listed" bytes:
   * this stream either is empty or has tolerated ("gray-listed") bytes only.
   */
  return Z_BINARY;
}


var static_init_done = false;

/* ===========================================================================
 * Initialize the tree data structures for a new zlib stream.
 */
function _tr_init(s)
{

  if (!static_init_done) {
    tr_static_init();
    static_init_done = true;
  }

  s.l_desc  = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc  = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

  s.bi_buf = 0;
  s.bi_valid = 0;

  /* Initialize the first block of the first file: */
  init_block(s);
}


/* ===========================================================================
 * Send a stored block
 */
function _tr_stored_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);    /* send block type */
  copy_block(s, buf, stored_len, true); /* with header */
}


/* ===========================================================================
 * Send one empty static block to give enough lookahead for inflate.
 * This takes 10 bits, of which 7 may remain in the bit buffer.
 */
function _tr_align(s) {
  send_bits(s, STATIC_TREES << 1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
}


/* ===========================================================================
 * Determine the best encoding for the current block: dynamic trees, static
 * trees or store, and output the encoded block to the zip file.
 */
function _tr_flush_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block, or NULL if too old */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  var opt_lenb, static_lenb;  /* opt_len and static_len in bytes */
  var max_blindex = 0;        /* index of last bit length code of non zero freq */

  /* Build the Huffman trees unless a stored block is forced */
  if (s.level > 0) {

    /* Check if the file is binary or text */
    if (s.strm.data_type === Z_UNKNOWN) {
      s.strm.data_type = detect_data_type(s);
    }

    /* Construct the literal and distance trees */
    build_tree(s, s.l_desc);
    // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));

    build_tree(s, s.d_desc);
    // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));
    /* At this point, opt_len and static_len are the total bit lengths of
     * the compressed block data, excluding the tree representations.
     */

    /* Build the bit length tree for the above two trees, and get the index
     * in bl_order of the last bit length code to send.
     */
    max_blindex = build_bl_tree(s);

    /* Determine the best encoding. Compute the block lengths in bytes. */
    opt_lenb = (s.opt_len + 3 + 7) >>> 3;
    static_lenb = (s.static_len + 3 + 7) >>> 3;

    // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
    //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
    //        s->last_lit));

    if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

  } else {
    // Assert(buf != (char*)0, "lost buf");
    opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
  }

  if ((stored_len + 4 <= opt_lenb) && (buf !== -1)) {
    /* 4: two words for the lengths */

    /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
     * Otherwise we can't have processed more than WSIZE input bytes since
     * the last block flush, because compression would have been
     * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
     * transform a block into a stored block.
     */
    _tr_stored_block(s, buf, stored_len, last);

  } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {

    send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);

  } else {
    send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
    send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
  /* The above check is made mod 2^32, for files larger than 512 MB
   * and uLong implemented on 32 bits.
   */
  init_block(s);

  if (last) {
    bi_windup(s);
  }
  // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
  //       s->compressed_len-7*last));
}

/* ===========================================================================
 * Save the match info and tally the frequency counts. Return true if
 * the current block must be flushed.
 */
function _tr_tally(s, dist, lc)
//    deflate_state *s;
//    unsigned dist;  /* distance of matched string */
//    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
{
  //var out_length, in_length, dcode;

  s.pending_buf[s.d_buf + s.last_lit * 2]     = (dist >>> 8) & 0xff;
  s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;

  s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
  s.last_lit++;

  if (dist === 0) {
    /* lc is the unmatched char */
    s.dyn_ltree[lc * 2]/*.Freq*/++;
  } else {
    s.matches++;
    /* Here, lc is the match length - MIN_MATCH */
    dist--;             /* dist = match distance - 1 */
    //Assert((ush)dist < (ush)MAX_DIST(s) &&
    //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
    //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

    s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]/*.Freq*/++;
    s.dyn_dtree[d_code(dist) * 2]/*.Freq*/++;
  }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility

//#ifdef TRUNCATE_BLOCK
//  /* Try to guess if it is profitable to stop the current block here */
//  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
//    /* Compute an upper bound for the compressed length */
//    out_length = s.last_lit*8;
//    in_length = s.strstart - s.block_start;
//
//    for (dcode = 0; dcode < D_CODES; dcode++) {
//      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
//    }
//    out_length >>>= 3;
//    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
//    //       s->last_lit, in_length, out_length,
//    //       100L - out_length*100L/in_length));
//    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
//      return true;
//    }
//  }
//#endif

  return (s.last_lit === s.lit_bufsize - 1);
  /* We avoid equality with lit_bufsize because of wraparound at 64K
   * on 16 bit machines and because stored blocks are restricted to
   * 64K-1 bytes.
   */
}

exports._tr_init  = _tr_init;
exports._tr_stored_block = _tr_stored_block;
exports._tr_flush_block  = _tr_flush_block;
exports._tr_tally = _tr_tally;
exports._tr_align = _tr_align;

},{"../utils/common":79}],91:[function(require,module,exports){
'use strict';


function ZStream() {
  /* next input byte */
  this.input = null; // JS specific, because we have no pointers
  this.next_in = 0;
  /* number of bytes available at input */
  this.avail_in = 0;
  /* total number of input bytes read so far */
  this.total_in = 0;
  /* next output byte should be put there */
  this.output = null; // JS specific, because we have no pointers
  this.next_out = 0;
  /* remaining free space at output */
  this.avail_out = 0;
  /* total number of bytes output so far */
  this.total_out = 0;
  /* last error message, NULL if no error */
  this.msg = ''/*Z_NULL*/;
  /* not visible by applications */
  this.state = null;
  /* best guess about the data type: binary or text */
  this.data_type = 2/*Z_UNKNOWN*/;
  /* adler32 value of the uncompressed data */
  this.adler = 0;
}

module.exports = ZStream;

},{}],92:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = nextTick;
} else {
  module.exports = process.nextTick;
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}

}).call(this,require('_process'))
},{"_process":10}],93:[function(require,module,exports){
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

var keys = objectKeys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  processNextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}
},{"./_stream_readable":95,"./_stream_writable":97,"core-util-is":36,"inherits":39,"process-nextick-args":92}],94:[function(require,module,exports){
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":96,"core-util-is":36,"inherits":39}],95:[function(require,module,exports){
(function (process){
'use strict';

module.exports = Readable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Readable.ReadableState = ReadableState;

var EE = require('events');

/*<replacement>*/
var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = require('st' + 'ream');
  } catch (_) {} finally {
    if (!Stream) Stream = require('events').EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = require('buffer').Buffer;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = undefined;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var StringDecoder;

util.inherits(Readable, Stream);

var Duplex;
function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

var Duplex;
function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options && typeof options.read === 'function') this._read = options.read;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;

  if (!state.objectMode && typeof chunk === 'string') {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      var skipAdd;
      if (state.decoder && !addToFront && !encoding) {
        chunk = state.decoder.write(chunk);
        skipAdd = !state.objectMode && chunk.length === 0;
      }

      if (!addToFront) state.reading = false;

      // Don't add to the buffer if we've decoded to an empty string chunk and
      // we're not in object mode
      if (!skipAdd) {
        // if we want the data now, just emit it.
        if (state.flowing && state.length === 0 && !state.sync) {
          stream.emit('data', chunk);
          stream.read(0);
        } else {
          // update the buffer info.
          state.length += state.objectMode ? 1 : chunk.length;
          if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

          if (state.needReadable) emitReadable(stream);
        }
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended) return 0;

  if (state.objectMode) return n === 0 ? 0 : 1;

  if (n === null || isNaN(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length) return state.buffer[0].length;else return state.length;
  }

  if (n <= 0) return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else {
      return state.length;
    }
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  var state = this._readableState;
  var nOrig = n;

  if (typeof n !== 'number' || n > 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  }

  if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read pushed data synchronously, then `reading` will be false,
  // and we need to re-evaluate how much data we can return to the user.
  if (doRead && !state.reading) n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended) state.needReadable = true;

  // If we tried to read() past the EOF, then emit end on the next tick.
  if (nOrig !== n && state.ended && state.length === 0) endReadable(this);

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    processNextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    if (false === ret) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      if (state.pipesCount === 1 && state.pipes[0] === dest && src.listenerCount('data') === 1 && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }
  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS.
  if (!dest._events || !dest._events.error) dest.on('error', onerror);else if (isArray(dest._events.error)) dest._events.error.unshift(onerror);else dest._events.error = [onerror, dest._events.error];

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var _i = 0; _i < len; _i++) {
      dests[_i].emit('unpipe', this);
    }return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1) return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  // If listening to data, and it has not explicitly been paused,
  // then call resume to start the flow of data on the next tick.
  if (ev === 'data' && false !== this._readableState.flowing) {
    this.resume();
  }

  if (ev === 'readable' && !this._readableState.endEmitted) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        processNextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    processNextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function (ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0) return null;

  if (length === 0) ret = null;else if (objectMode) ret = list.shift();else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode) ret = list.join('');else if (list.length === 1) ret = list[0];else ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode) ret = '';else ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode) ret += buf.slice(0, cpy);else buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length) list[0] = buf.slice(cpy);else list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    processNextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,require('_process'))
},{"./_stream_duplex":93,"_process":10,"buffer":4,"core-util-is":36,"events":5,"inherits":39,"isarray":40,"process-nextick-args":92,"string_decoder/":99,"util":3}],96:[function(require,module,exports){
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function TransformState(stream) {
  this.afterTransform = function (er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
  this.writeencoding = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined) stream.push(data);

  cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  this.once('prefinish', function () {
    if (typeof this._flush === 'function') this._flush(function (er) {
      done(stream, er);
    });else done(stream);
  });
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

function done(stream, er) {
  if (er) return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length) throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming) throw new Error('calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":93,"core-util-is":36,"inherits":39}],97:[function(require,module,exports){
(function (process){
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

module.exports = Writable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
/*</replacement>*/

/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = require('st' + 'ream');
  } catch (_) {} finally {
    if (!Stream) Stream = require('events').EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = require('buffer').Buffer;

util.inherits(Writable, Stream);

function nop() {}

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

var Duplex;
function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // create the two objects needed to store the corked requests
  // they are not a linked list, as no new elements are inserted in there
  this.corkedRequestsFree = new CorkedRequest(this);
  this.corkedRequestsFree.next = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function writableStateGetBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
    });
  } catch (_) {}
})();

var Duplex;
function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextTick(cb, er);
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;

  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    processNextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;
  if (sync) processNextTick(cb, er);else cb(er);

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
        afterWrite(stream, state, finished, cb);
      }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    while (entry) {
      buffer[count] = entry;
      entry = entry.next;
      count += 1;
    }

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    state.corkedRequestsFree = holder.next;
    holder.next = null;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequestCount = 0;
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else {
      prefinish(stream, state);
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) processNextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function (err) {
    var entry = _this.entry;
    _this.entry = null;
    while (entry) {
      var cb = entry.callback;
      state.pendingcb--;
      cb(err);
      entry = entry.next;
    }
    if (state.corkedRequestsFree) {
      state.corkedRequestsFree.next = _this;
    } else {
      state.corkedRequestsFree = _this;
    }
  };
}
}).call(this,require('_process'))
},{"./_stream_duplex":93,"_process":10,"buffer":4,"core-util-is":36,"events":5,"inherits":39,"process-nextick-args":92,"util-deprecate":100}],98:[function(require,module,exports){
var Stream = (function (){
  try {
    return require('st' + 'ream'); // hack to fix a circular dependency issue when used with browserify
  } catch(_){}
}());
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = Stream || exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":93,"./lib/_stream_passthrough.js":94,"./lib/_stream_readable.js":95,"./lib/_stream_transform.js":96,"./lib/_stream_writable.js":97}],99:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":4}],100:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[13])(13)
});