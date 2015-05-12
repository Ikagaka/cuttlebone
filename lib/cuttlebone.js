/// <reference path="../tsd/jszip/jszip.d.ts"/>
/// <reference path="../tsd/Uint8ClampedArray/Uint8ClampedArray.d.ts"/>
// oriinal: https://github.com/arian/pngjs
// modified by legokichi.
// chenge:
//   typescriptnize
//   chenge zlib library stream.js to jszip(pako)
//   support bitdepth 1
var cuttlebone;
(function (cuttlebone) {
    function equalBytes(a, b) {
        if (a.length != b.length)
            return false;
        for (var l = a.length; l--;)
            if (a[l] != b[l])
                return false;
        return true;
    }
    function readUInt32(buffer, offset) {
        return (buffer[offset] << 24) +
            (buffer[offset + 1] << 16) +
            (buffer[offset + 2] << 8) +
            (buffer[offset + 3] << 0);
    }
    function readUInt16(buffer, offset) {
        return (buffer[offset + 1] << 8) + (buffer[offset] << 0);
    }
    function readUInt8(buffer, offset) {
        return buffer[offset] << 0;
    }
    function bufferToString(buffer) {
        var str = '';
        for (var i = 0; i < buffer.length; i++) {
            str += String.fromCharCode(buffer[i]);
        }
        return str;
    }
    function uInt8ToBitArray(uint8) {
        return (uint8 + 256).toString(2).split("").slice(1).map(Number);
    }
    function uInt8ArrayToBits(arr) {
        var result = [];
        for (var i = 0; arr.length > i; i++) {
            result = result.concat(uInt8ToBitArray(arr[i]));
        }
        return result;
    }
    function bitsToNum(bits) {
        //return bits.slice().reverse().reduce(function(sum,n,i){return sum+Math.pow(2,i)*n},0);
        return parseInt(bits.join(""), 2);
    }
    function readBits(buffer, bitOffset, bitLength) {
        var _byteOffset = bitOffset / 8 | 0;
        var _bitOffset = bitOffset % 8;
        var _byteLength = bitLength / 8 | 0;
        var _bitLength = bitLength % 8;
        var _buf = buffer.subarray(_byteOffset, _byteOffset + _byteLength + 1);
        return uInt8ArrayToBits(_buf).slice(_bitOffset, _bitOffset + bitLength);
    }
    var PNGReader = (function () {
        function PNGReader(data) {
            // bytes buffer
            this.bytes = new Uint8Array(data);
            // current pointer
            this.i = 0;
            this.dataChunks = [];
            // Output object
            this.png = new PNG();
        }
        PNGReader.prototype.readBytes = function (length) {
            var end = this.i + length;
            if (end > this.bytes.length) {
                throw new Error('Unexpectedly reached end of file');
            }
            var bytes = this.bytes.subarray(this.i, end);
            this.i = end;
            return bytes;
        };
        /**
         * http://www.w3.org/TR/2003/REC-PNG-20031110/#5PNG-file-signature
         */
        PNGReader.prototype.decodeHeader = function () {
            if (this.i !== 0) {
                throw new Error('file pointer should be at 0 to read the header');
            }
            var header = this.readBytes(8);
            if (!equalBytes(header, new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
                throw new Error('invalid PNGReader file (bad signature)');
            }
            this.header = header;
        };
        /**
         * http://www.w3.org/TR/2003/REC-PNG-20031110/#5Chunk-layout
         *
         * length =  4      bytes
         * type   =  4      bytes (IHDR, PLTE, IDAT, IEND or others)
         * chunk  =  length bytes
         * crc    =  4      bytes
         */
        PNGReader.prototype.decodeChunk = function () {
            var length = readUInt32(this.readBytes(4), 0);
            if (length < 0) {
                throw new Error('Bad chunk length ' + (0xFFFFFFFF & length));
            }
            var type = bufferToString(this.readBytes(4));
            var chunk = this.readBytes(length);
            var crc = this.readBytes(4);
            switch (type) {
                case 'IHDR':
                    this.decodeIHDR(chunk);
                    break;
                case 'PLTE':
                    this.decodePLTE(chunk);
                    break;
                case 'IDAT':
                    this.decodeIDAT(chunk);
                    break;
                case 'IEND':
                    this.decodeIEND(chunk);
                    break;
                default:
                    console.warn("PNGReader: ", type, " is not support chunk type.");
                    break;
            }
            return type;
        };
        /**
         * http://www.w3.org/TR/2003/REC-PNG-20031110/#11IHDR
         * http://www.libpng.org/pub/png/spec/1.2/png-1.2-pdg.html#C.IHDR
         *
         * Width               4 bytes
         * Height              4 bytes
         * Bit depth           1 byte
         * Colour type         1 byte
         * Compression method  1 byte
         * Filter method       1 byte
         * Interlace method    1 byte
         */
        PNGReader.prototype.decodeIHDR = function (chunk) {
            var png = this.png;
            png.setWidth(readUInt32(chunk, 0));
            png.setHeight(readUInt32(chunk, 4));
            png.setBitDepth(readUInt8(chunk, 8));
            png.setColorType(readUInt8(chunk, 9));
            png.setCompressionMethod(readUInt8(chunk, 10));
            png.setFilterMethod(readUInt8(chunk, 11));
            png.setInterlaceMethod(readUInt8(chunk, 12));
        };
        /**
         *
         * http://www.w3.org/TR/PNG/#11PLTE
         */
        PNGReader.prototype.decodePLTE = function (chunk) {
            this.png.setPalette(chunk);
        };
        /**
         * http://www.w3.org/TR/2003/REC-PNG-20031110/#11IDAT
         */
        PNGReader.prototype.decodeIDAT = function (chunk) {
            // multiple IDAT chunks will concatenated
            this.dataChunks.push(chunk);
        };
        /**
         * http://www.w3.org/TR/2003/REC-PNG-20031110/#11IEND
         */
        PNGReader.prototype.decodeIEND = function (chunk) {
        };
        /**
         * Uncompress IDAT chunks
         */
        PNGReader.prototype.decodePixels = function () {
            var png = this.png;
            var length = 0;
            var i = 0;
            var j = 0;
            var k = 0;
            var l = 0;
            for (l = this.dataChunks.length; l--;)
                length += this.dataChunks[l].length;
            var data = new Uint8Array(new ArrayBuffer(length));
            for (i = 0, k = 0, l = this.dataChunks.length; i < l; i++) {
                var chunk = this.dataChunks[i];
                for (j = 0; j < chunk.length; j++)
                    data[k++] = chunk[j];
            }
            // http://www.fileformat.info/format/png/corion.htm
            // Deflate-compressed datastreams within PNG are stored in the "zlib"
            // format, which has the structure:
            // Compression method/flags code: 1 byte
            // Additional flags/check bits:   1 byte
            // Compressed data blocks:        n bytes
            // Checksum:                      4 bytes
            var rawdata = data.subarray(2, data.length - 4);
            try {
                var _data = JSZip.compressions.DEFLATE.uncompress(rawdata);
            }
            catch (err) {
                throw new Error(err || "pako: zlib inflate error");
            }
            if (png.getInterlaceMethod() === 0) {
                this.interlaceNone(_data);
            }
            else {
                this.interlaceAdam7(_data);
            }
        };
        // Different interlace methods
        PNGReader.prototype.interlaceNone = function (data) {
            var png = this.png;
            if (png.bitDepth < 8) {
                // bits per pixel
                var bitspp = png.colors * png.bitDepth;
                var scanlineLength = data.length / png.height;
                var pixels = new Uint8Array(new ArrayBuffer((scanlineLength - 1) * png.height));
                //console.info(png.bitDepth, png.colors, png.colorType, scanlineLength, bitspp * png.width, png.width, png.height, data.length);
                var offset = 0;
                for (var i = 0; i < data.length; i += scanlineLength) {
                    var scanline = data.subarray(i, i + scanlineLength);
                    var filtertype = readUInt8(scanline, i);
                    var _scanline = scanline.subarray(1, scanline.length);
                    switch (filtertype) {
                        case 0:
                            pixels.set(_scanline, offset);
                            break;
                        default:
                            throw new Error("unsupport filtered scanline: " + filtertype + ":" + offset + ":" + i);
                            break;
                    }
                    offset += scanlineLength - 1;
                }
            }
            else {
                // bytes per pixel
                var bpp = Math.max(1, png.colors * png.bitDepth / 8);
                // color bytes per row
                var cpr = bpp * png.width;
                var pixels = new Uint8Array(new ArrayBuffer(bpp * png.width * png.height));
                var offset = 0;
                for (var i = 0; i < data.length; i += cpr + 1) {
                    var scanline = data.subarray(i + 1, i + cpr + 1);
                    var filtertype = readUInt8(data, i);
                    switch (filtertype) {
                        case 0:
                            this.unFilterNone(scanline, pixels, bpp, offset, cpr);
                            break;
                        case 1:
                            this.unFilterSub(scanline, pixels, bpp, offset, cpr);
                            break;
                        case 2:
                            this.unFilterUp(scanline, pixels, bpp, offset, cpr);
                            break;
                        case 3:
                            this.unFilterAverage(scanline, pixels, bpp, offset, cpr);
                            break;
                        case 4:
                            this.unFilterPaeth(scanline, pixels, bpp, offset, cpr);
                            break;
                        default:
                            throw new Error("unkown filtered scanline: " + filtertype + ":" + bpp + ":" + offset + ":" + cpr + ":" + i);
                            break;
                    }
                    offset += cpr;
                }
            }
            png.pixels = pixels;
        };
        PNGReader.prototype.interlaceAdam7 = function (data) {
            throw new Error("Adam7 interlacing is not implemented yet");
        };
        // Unfiltering
        /**
         * No filtering, direct copy
         */
        PNGReader.prototype.unFilterNone = function (scanline, pixels, bpp, offset, length) {
            for (var i = 0, to = length; i < to; i++) {
                pixels[offset + i] = scanline[i];
            }
        };
        /**
         * The Sub() filter transmits the difference between each byte and the value
         * of the corresponding byte of the prior pixel.
         * Sub(x) = Raw(x) + Raw(x - bpp)
         */
        PNGReader.prototype.unFilterSub = function (scanline, pixels, bpp, offset, length) {
            var i = 0;
            for (; i < bpp; i++)
                pixels[offset + i] = scanline[i];
            for (; i < length; i++) {
                // Raw(x) + Raw(x - bpp)
                pixels[offset + i] = (scanline[i] + pixels[offset + i - bpp]) & 0xFF;
            }
        };
        /**
         * The Up() filter is just like the Sub() filter except that the pixel
         * immediately above the current pixel, rather than just to its left, is used
         * as the predictor.
         * Up(x) = Raw(x) + Prior(x)
         */
        PNGReader.prototype.unFilterUp = function (scanline, pixels, bpp, offset, length) {
            var i = 0;
            var byte;
            var prev;
            // Prior(x) is 0 for all x on the first scanline
            if ((offset - length) < 0)
                for (; i < length; i++) {
                    pixels[offset + i] = scanline[i];
                }
            else
                for (; i < length; i++) {
                    // Raw(x)
                    byte = scanline[i];
                    // Prior(x)
                    prev = pixels[offset + i - length];
                    pixels[offset + i] = (byte + prev) & 0xFF;
                }
        };
        /**
         * The Average() filter uses the average of the two neighboring pixels (left
         * and above) to predict the value of a pixel.
         * Average(x) = Raw(x) + floor((Raw(x-bpp)+Prior(x))/2)
         */
        PNGReader.prototype.unFilterAverage = function (scanline, pixels, bpp, offset, length) {
            var i = 0;
            var byte;
            var prev;
            var prior;
            if ((offset - length) < 0) {
                // Prior(x) == 0 && Raw(x - bpp) == 0
                for (; i < bpp; i++) {
                    pixels[offset + i] = scanline[i];
                }
                // Prior(x) == 0 && Raw(x - bpp) != 0 (right shift, prevent doubles)
                for (; i < length; i++) {
                    pixels[offset + i] = (scanline[i] + (pixels[offset + i - bpp] >> 1)) & 0xFF;
                }
            }
            else {
                // Prior(x) != 0 && Raw(x - bpp) == 0
                for (; i < bpp; i++) {
                    pixels[offset + i] = (scanline[i] + (pixels[offset - length + i] >> 1)) & 0xFF;
                }
                // Prior(x) != 0 && Raw(x - bpp) != 0
                for (; i < length; i++) {
                    byte = scanline[i];
                    prev = pixels[offset + i - bpp];
                    prior = pixels[offset + i - length];
                    pixels[offset + i] = (byte + (prev + prior >> 1)) & 0xFF;
                }
            }
        };
        /**
         * The Paeth() filter computes a simple linear function of the three
         * neighboring pixels (left, above, upper left), then chooses as predictor
         * the neighboring pixel closest to the computed value. This technique is due
         * to Alan W. Paeth.
         * Paeth(x) = Raw(x) +
         *            PaethPredictor(Raw(x-bpp), Prior(x), Prior(x-bpp))
         *  function PaethPredictor (a, b, c)
         *  begin
         *       ; a = left, b = above, c = upper left
         *       p := a + b - c        ; initial estimate
         *       pa := abs(p - a)      ; distances to a, b, c
         *       pb := abs(p - b)
         *       pc := abs(p - c)
         *       ; return nearest of a,b,c,
         *       ; breaking ties in order a,b,c.
         *       if pa <= pb AND pa <= pc then return a
         *       else if pb <= pc then return b
         *       else return c
         *  end
         */
        PNGReader.prototype.unFilterPaeth = function (scanline, pixels, bpp, offset, length) {
            var i = 0;
            var raw;
            var a;
            var b;
            var c;
            var p;
            var pa;
            var pb;
            var pc;
            var pr;
            if ((offset - length) < 0) {
                // Prior(x) == 0 && Raw(x - bpp) == 0
                for (; i < bpp; i++) {
                    pixels[offset + i] = scanline[i];
                }
                // Prior(x) == 0 && Raw(x - bpp) != 0
                // paethPredictor(x, 0, 0) is always x
                for (; i < length; i++) {
                    pixels[offset + i] = (scanline[i] + pixels[offset + i - bpp]) & 0xFF;
                }
            }
            else {
                // Prior(x) != 0 && Raw(x - bpp) == 0
                // paethPredictor(x, 0, 0) is always x
                for (; i < bpp; i++) {
                    pixels[offset + i] = (scanline[i] + pixels[offset + i - length]) & 0xFF;
                }
                // Prior(x) != 0 && Raw(x - bpp) != 0
                for (; i < length; i++) {
                    raw = scanline[i];
                    a = pixels[offset + i - bpp];
                    b = pixels[offset + i - length];
                    c = pixels[offset + i - length - bpp];
                    p = a + b - c;
                    pa = Math.abs(p - a);
                    pb = Math.abs(p - b);
                    pc = Math.abs(p - c);
                    if (pa <= pb && pa <= pc)
                        pr = a;
                    else if (pb <= pc)
                        pr = b;
                    else
                        pr = c;
                    pixels[offset + i] = (raw + pr) & 0xFF;
                }
            }
        };
        PNGReader.prototype.parse = function (options) {
            options = options || { data: true };
            this.decodeHeader();
            while (this.i < this.bytes.length) {
                var type = this.decodeChunk();
                // stop after IHDR chunk, or after IEND
                if (type == 'IHDR' && options.data === false || type == 'IEND')
                    break;
            }
            var png = this.png;
            this.decodePixels();
            return this.png;
        };
        return PNGReader;
    })();
    cuttlebone.PNGReader = PNGReader;
    ////
    var PNG = (function () {
        function PNG() {
            this.width = 0;
            this.height = 0;
            this.bitDepth = 0;
            this.colorType = 0;
            this.compressionMethod = 0;
            this.filterMethod = 0;
            this.interlaceMethod = 0;
            this.colors = 0;
            this.alpha = false;
            this.pixelBits = 0;
            this.palette = null;
            this.pixels = null;
        }
        PNG.prototype.getWidth = function () {
            return this.width;
        };
        PNG.prototype.setWidth = function (width) {
            this.width = width;
        };
        PNG.prototype.getHeight = function () {
            return this.height;
        };
        PNG.prototype.setHeight = function (height) {
            this.height = height;
        };
        PNG.prototype.getBitDepth = function () {
            return this.bitDepth;
        };
        PNG.prototype.setBitDepth = function (bitDepth) {
            if ([1, 2, 4, 8, 16].indexOf(bitDepth) === -1) {
                throw new Error("invalid bith depth " + bitDepth);
            }
            this.bitDepth = bitDepth;
        };
        PNG.prototype.getColorType = function () {
            return this.colorType;
        };
        PNG.prototype.setColorType = function (colorType) {
            //   Color    Allowed    Interpretation
            //   Type    Bit Depths
            //
            //   0       1,2,4,8,16  Each pixel is a grayscale sample.
            //
            //   2       8,16        Each pixel is an R,G,B triple.
            //
            //   3       1,2,4,8     Each pixel is a palette index;
            //                       a PLTE chunk must appear.
            //
            //   4       8,16        Each pixel is a grayscale sample,
            //                       followed by an alpha sample.
            //
            //   6       8,16        Each pixel is an R,G,B triple,
            //                       followed by an alpha sample.
            var colors = 0, alpha = false;
            switch (colorType) {
                case 0:
                    colors = 1;
                    break;
                case 2:
                    colors = 3;
                    break;
                case 3:
                    colors = 1;
                    break;
                case 4:
                    colors = 2;
                    alpha = true;
                    break;
                case 6:
                    colors = 4;
                    alpha = true;
                    break;
                default: throw new Error("invalid color type");
            }
            this.colors = colors;
            this.alpha = alpha;
            this.colorType = colorType;
        };
        PNG.prototype.getCompressionMethod = function () {
            return this.compressionMethod;
        };
        PNG.prototype.setCompressionMethod = function (compressionMethod) {
            if (compressionMethod !== 0) {
                throw new Error("invalid compression method " + compressionMethod);
            }
            this.compressionMethod = compressionMethod;
        };
        PNG.prototype.getFilterMethod = function () {
            return this.filterMethod;
        };
        PNG.prototype.setFilterMethod = function (filterMethod) {
            if (filterMethod !== 0) {
                throw new Error("invalid filter method " + filterMethod);
            }
            this.filterMethod = filterMethod;
        };
        PNG.prototype.getInterlaceMethod = function () {
            return this.interlaceMethod;
        };
        PNG.prototype.setInterlaceMethod = function (interlaceMethod) {
            if (interlaceMethod !== 0 && interlaceMethod !== 1) {
                throw new Error("invalid interlace method " + interlaceMethod);
            }
            this.interlaceMethod = interlaceMethod;
        };
        PNG.prototype.setPalette = function (palette) {
            if (palette.length % 3 !== 0) {
                throw new Error("incorrect PLTE chunk length");
            }
            if (palette.length > (Math.pow(2, this.bitDepth) * 3)) {
                throw new Error("palette has more colors than 2^bitdepth");
            }
            this.palette = palette;
        };
        PNG.prototype.getPalette = function () {
            return this.palette;
        };
        /**
         * get the pixel color on a certain location in a normalized way
         * result is an array: [red, green, blue, alpha]
         */
        PNG.prototype.getPixel = function (x, y) {
            if (!this.pixels)
                throw new Error("pixel data is empty");
            if (x >= this.width || y >= this.height) {
                throw new Error("x,y position out of bound");
            }
            var pixels = this.pixels;
            if (this.bitDepth < 8) {
                //console.info(this.colors, this.bitDepth, pixels.length, this.width, this.height)
                var bitspp = this.colors * this.bitDepth; // bit
                var _scanlineLength = pixels.length / this.height; // byte
                var diff = _scanlineLength * 8 - this.width * bitspp; // bit
                var idbit = (y * (bitspp * this.width + diff) + bitspp * x); // x, y is zero origin
                switch (this.colorType) {
                    case 0:
                        var tmp = bitsToNum(readBits(pixels, idbit, this.bitDepth));
                        return [
                            tmp,
                            tmp,
                            tmp,
                            255];
                    case 2: return [
                        bitsToNum(readBits(pixels, idbit, this.bitDepth)),
                        bitsToNum(readBits(pixels, idbit + 1, this.bitDepth)),
                        bitsToNum(readBits(pixels, idbit + 2, this.bitDepth)),
                        255];
                    case 3:
                        var tmp = bitsToNum(readBits(pixels, idbit, this.bitDepth)) * 3;
                        return [
                            this.palette[tmp + 0],
                            this.palette[tmp + 1],
                            this.palette[tmp + 2],
                            255];
                    case 4:
                        var tmp = bitsToNum(readBits(pixels, idbit, this.bitDepth));
                        return [
                            tmp,
                            tmp,
                            tmp,
                            bitsToNum(readBits(pixels, idbit + 1, this.bitDepth))];
                    case 6: return [
                        bitsToNum(readBits(pixels, idbit, this.bitDepth)),
                        bitsToNum(readBits(pixels, idbit + 1, this.bitDepth)),
                        bitsToNum(readBits(pixels, idbit + 2, this.bitDepth)),
                        bitsToNum(readBits(pixels, idbit + 3, this.bitDepth))
                    ];
                    default:
                        throw new Error("invalid color type: " + this.colorType);
                        break;
                }
            }
            else {
                var i = this.colors * this.bitDepth / 8 * (y * this.width + x);
                switch (this.colorType) {
                    case 0: return [pixels[i], pixels[i], pixels[i], 255];
                    case 2: return [pixels[i], pixels[i + 1], pixels[i + 2], 255];
                    case 3: return [
                        this.palette[pixels[i] * 3 + 0],
                        this.palette[pixels[i] * 3 + 1],
                        this.palette[pixels[i] * 3 + 2],
                        255];
                    case 4: return [pixels[i], pixels[i], pixels[i], pixels[i + 1]];
                    case 6: return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
                    default:
                        throw new Error("invalid color type: " + this.colorType);
                        break;
                }
            }
        };
        PNG.prototype.getUint8ClampedArray = function () {
            var width = this.width;
            var height = this.height;
            var arr = new Uint8ClampedArray(width * height * 4);
            var i = 0;
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var colors = this.getPixel(x, y);
                    arr[i++] = colors[0];
                    arr[i++] = colors[1];
                    arr[i++] = colors[2];
                    arr[i++] = colors[3];
                }
            }
            return arr;
        };
        return PNG;
    })();
    cuttlebone.PNG = PNG;
})(cuttlebone || (cuttlebone = {}));
/// <reference path="Surface.ts"/>
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="SurfaceRender.ts"/>
/// <reference path="../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts"/>
/// <reference path="../tsd/encoding-japanese/encoding.d.ts"/>
var cuttlebone;
(function (cuttlebone) {
    function extend(target, source) {
        for (var key in source) {
            if (typeof source[key] === "object" && Object.getPrototypeOf(source[key]) === Object.prototype) {
                target[key] = target[key] || {};
                extend(target[key], source[key]);
            }
            else if (Array.isArray(source[key])) {
                target[key] = target[key] || [];
                extend(target[key], source[key]);
            }
            else if (source[key] !== undefined) {
                target[key] = source[key];
            }
        }
    }
    function parseDescript(text) {
        text = text.replace(/(?:\r\n|\r|\n)/g, "\n"); // CRLF->LF
        while (true) {
            var match = (/(?:(?:^|\s)\/\/.*)|^\s+?$/g.exec(text) || ["", ""])[0];
            if (match.length === 0)
                break;
            text = text.replace(match, "");
        }
        var lines = text.split("\n");
        lines = lines.filter(function (line) { return line.length !== 0; }); // remove no content line
        var dic = lines.reduce(function (dic, line) {
            var tmp = line.split(",");
            var key = tmp[0];
            var vals = tmp.slice(1);
            key = key.trim();
            var val = vals.join(",").trim();
            dic[key] = val;
            return dic;
        }, {});
        return dic;
    }
    function convert(buffer) {
        return Encoding.codeToString(Encoding.convert(new Uint8Array(buffer), 'UNICODE', 'AUTO'));
    }
    function find(paths, filename) {
        filename = filename.split("\\").join("/");
        if (filename.slice(0, 2) === "./")
            filename = filename.slice(2);
        var reg = new RegExp("^" + filename.replace(".", "\.") + "$", "i");
        var hits = paths.filter(function (key) { return reg.test(key); });
        return hits;
    }
    var Shell = (function () {
        function Shell(directory) {
            this.directory = directory;
            this.descript = {};
            this.surfaces = {};
            this.surfaceTree = {};
            this.canvasCache = {};
        }
        Shell.prototype.load = function () {
            var _this = this;
            var prm = Promise.resolve(this)
                .then(function () { return _this.loadDescript(); })
                .then(function () { return _this.loadSurfacesTxt(); })
                .then(function () { return _this.loadSurfaceTable(); })
                .then(function () { return _this.loadSurfacePNG(); })
                .then(function () { return _this.loadCollisions(); })
                .then(function () { return _this.loadAnimations(); })
                .then(function () { return _this.loadElements(); });
            return prm;
        };
        // load descript
        Shell.prototype.loadDescript = function () {
            var descript_name = Object.keys(this.directory).filter(function (name) { return /^descript\.txt$/i.test(name); })[0] || "";
            if (descript_name) {
                this.descript = parseDescript(convert(this.directory[descript_name]));
            }
            else {
                console.warn("descript.txt is not found");
            }
            return Promise.resolve(this);
        };
        // load surfaces.txt
        // TODO: alias.txt
        Shell.prototype.loadSurfacesTxt = function () {
            var _this = this;
            var surfaces_text_names = Object.keys(this.directory).filter(function (name) { return /surfaces.*\.txt$/i.test(name); });
            if (surfaces_text_names.length === 0) {
                console.warn("surfaces.txt is not found");
            }
            else {
                surfaces_text_names.forEach(function (filename) {
                    var text = convert(_this.directory[filename]);
                    var srfs = SurfacesTxt2Yaml.txt_to_data(text, { compatible: 'ssp-lazy' });
                    /// TODO: dirty
                    Object.keys(srfs.surfaces).forEach(function (name) {
                        if (!!srfs.surfaces[name].is && Array.isArray(srfs.surfaces[name].base)) {
                            srfs.surfaces[name].base.forEach(function (key) {
                                extend(srfs.surfaces[name], srfs.surfaces[key]);
                            });
                            delete srfs.surfaces[name].base;
                        }
                    });
                    Object.keys(srfs.surfaces).forEach(function (name) {
                        if (!srfs.surfaces[name].is) {
                            delete srfs.surfaces[name];
                        }
                    });
                    ///
                    extend(_this.surfaces, srfs);
                });
            }
            return Promise.resolve(this);
        };
        // load surfacetable.txt
        Shell.prototype.loadSurfaceTable = function () {
            // TODO
            return Promise.resolve(this);
        };
        // load surface*.png surface*.pna
        Shell.prototype.loadSurfacePNG = function () {
            var _this = this;
            var surface_names = Object.keys(this.directory).filter(function (filename) { return /^surface(\d+)\.png$/i.test(filename); });
            var prms = surface_names.map(function (filename) {
                var n = Number(/^surface(\d+)\.png$/i.exec(filename)[1]);
                _this.getPNGFromDirectory(filename).then(function (cnv) {
                    _this.canvasCache[filename] = cnv;
                    if (!_this.surfaceTree[n]) {
                        _this.surfaceTree[n] = {
                            base: _this.canvasCache[filename],
                            elements: [],
                            collisions: [],
                            animations: []
                        };
                    }
                    else {
                        _this.surfaceTree[n].base = _this.canvasCache[filename];
                    }
                }).catch(function (err) {
                    console.warn("Shell#loadSurfacePNG > " + err);
                    return Promise.resolve();
                });
            });
            return Promise.all(prms).then(function () { return Promise.resolve(_this); });
        };
        // load elements
        Shell.prototype.loadElements = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var srfs = _this.surfaces.surfaces;
                Object.keys(srfs).filter(function (name) { return !!srfs[name].elements; }).forEach(function (defname) {
                    var n = srfs[defname].is;
                    var elms = srfs[defname].elements;
                    Object.keys(elms).forEach(function (elmname) {
                        var _a = elms[elmname], is = _a.is, type = _a.type, file = _a.file, x = _a.x, y = _a.y;
                        _this.getPNGFromDirectory(file).then(function (canvas) {
                            if (!_this.surfaceTree[n]) {
                                _this.surfaceTree[n] = {
                                    base: cuttlebone.SurfaceUtil.createCanvas(),
                                    elements: [],
                                    collisions: [],
                                    animations: []
                                };
                            }
                            _this.surfaceTree[n].elements[is] = { type: type, canvas: canvas, x: x, y: y };
                            resolve(Promise.resolve(_this));
                        }).catch(function (err) {
                            console.warn("Shell#loadElements > " + err);
                            resolve(Promise.resolve(_this));
                        });
                    });
                });
            });
        };
        // load collisions
        Shell.prototype.loadCollisions = function () {
            var _this = this;
            var srfs = this.surfaces.surfaces;
            Object.keys(srfs).filter(function (name) { return !!srfs[name].regions; }).forEach(function (defname) {
                var n = srfs[defname].is;
                var regions = srfs[defname].regions;
                Object.keys(regions).forEach(function (regname) {
                    if (!_this.surfaceTree[n]) {
                        _this.surfaceTree[n] = {
                            base: cuttlebone.SurfaceUtil.createCanvas(),
                            elements: [],
                            collisions: [],
                            animations: []
                        };
                    }
                    var is = regions[regname].is;
                    _this.surfaceTree[n].collisions[is] = regions[regname];
                });
            });
            return Promise.resolve(this);
        };
        // load animations
        Shell.prototype.loadAnimations = function () {
            var _this = this;
            var srfs = this.surfaces.surfaces;
            Object.keys(srfs).filter(function (name) { return !!srfs[name].animations; }).forEach(function (defname) {
                var n = srfs[defname].is;
                var animations = srfs[defname].animations;
                Object.keys(animations).forEach(function (animname) {
                    if (!_this.surfaceTree[n]) {
                        _this.surfaceTree[n] = {
                            base: cuttlebone.SurfaceUtil.createCanvas(),
                            elements: [],
                            collisions: [],
                            animations: []
                        };
                    }
                    var is = animations[animname].is;
                    _this.surfaceTree[n].animations[is] = animations[animname];
                });
            });
            return Promise.resolve(this);
        };
        Shell.prototype.hasFile = function (filename) {
            return find(Object.keys(this.directory), filename).length > 0;
        };
        Shell.prototype.getPNGFromDirectory = function (filename) {
            var _this = this;
            var hits = find(Object.keys(this.canvasCache), filename);
            if (hits.length > 0) {
                return Promise.resolve(this.canvasCache[hits[0]]);
            }
            var render = new cuttlebone.SurfaceRender(document.createElement("canvas"));
            return cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(this.directory[find(Object.keys(this.directory), filename)[0]]).then(function (img) {
                render.init(img);
                var pnafilename = filename.replace(/\.png$/i, ".pna");
                var hits = find(Object.keys(_this.directory), pnafilename);
                if (hits.length === 0) {
                    render.chromakey();
                    return Promise.resolve(render.cnv);
                }
                return cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(_this.directory[hits[0]]).then(function (pnaimg) {
                    render.pna(cuttlebone.SurfaceUtil.copy(pnaimg));
                    return Promise.resolve(render.cnv);
                });
            }).catch(function (err) {
                return Promise.reject("getPNGFromDirectory(" + filename + ") > " + err);
            });
        };
        Shell.prototype.attachSurface = function (canvas, scopeId, surfaceId) {
            var type = cuttlebone.SurfaceUtil.scope(scopeId);
            if (typeof surfaceId === "string") {
                if (!!this.surfaces.aliases && !!this.surfaces.aliases[type] && !!this.surfaces.aliases[type][surfaceId]) {
                    var _surfaceId = cuttlebone.SurfaceUtil.choice(this.surfaces.aliases[type][surfaceId]);
                }
                else {
                    throw new Error("RuntimeError: surface alias scope:" + type + ", id:" + surfaceId + " is not defined.");
                }
            }
            else if (typeof surfaceId === "number") {
                var _surfaceId = surfaceId;
            }
            else
                throw new Error("TypeError: surfaceId: number|string is not match " + typeof surfaceId);
            return new cuttlebone.Surface(canvas, scopeId, _surfaceId, this);
        };
        return Shell;
    })();
    cuttlebone.Shell = Shell;
})(cuttlebone || (cuttlebone = {}));
/// <reference path="SurfaceRender.ts"/>
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="Shell.ts"/>
var cuttlebone;
(function (cuttlebone) {
    var Surface = (function () {
        function Surface(canvas, scopeId, surfaceId, shell) {
            this.element = canvas;
            this.scopeId = scopeId;
            this.surfaceId = surfaceId;
            this.shell = shell;
            this.surfaceTreeNode = shell.surfaceTree[surfaceId];
            this.bufferCanvas = cuttlebone.SurfaceUtil.createCanvas();
            this.bufRender = new cuttlebone.SurfaceRender(this.bufferCanvas);
            this.elmRender = new cuttlebone.SurfaceRender(this.element);
            this.destructed = false;
            this.layers = {};
            this.stopFlags = {};
            this.talkCount = 0;
            this.talkCounts = {};
            this.isRegionVisible = false;
            this.initAnimation();
            this.render();
        }
        Surface.prototype.initAnimation = function () {
            var _this = this;
            this.surfaceTreeNode.animations.forEach(function (arg) {
                var is = arg.is, interval = arg.interval, patterns = arg.patterns;
                interval = interval || "";
                var tmp = interval.split(",");
                interval = tmp[0];
                var n = Number(tmp.slice(1).join(","));
                switch (interval) {
                    case "sometimes":
                        cuttlebone.SurfaceUtil.random((function (callback) { if (!_this.destructed && !_this.stopFlags[is]) {
                            _this.play(is, callback);
                        } }), 2);
                        break;
                    case "rarely":
                        cuttlebone.SurfaceUtil.random((function (callback) { if (!_this.destructed && !_this.stopFlags[is]) {
                            _this.play(is, callback);
                        } }), 4);
                        break;
                    case "random":
                        cuttlebone.SurfaceUtil.random((function (callback) { if (!_this.destructed && !_this.stopFlags[is]) {
                            _this.play(is, callback);
                        } }), n);
                        break;
                    case "periodic":
                        cuttlebone.SurfaceUtil.periodic((function (callback) { if (!_this.destructed && !_this.stopFlags[is]) {
                            _this.play(is, callback);
                        } }), n);
                        break;
                    case "always":
                        cuttlebone.SurfaceUtil.always((function (callback) { if (!_this.destructed && !_this.stopFlags[is]) {
                            _this.play(is, callback);
                        } }));
                        break;
                    case "runonce":
                        _this.play(is);
                        break;
                    case "never": break;
                    case "bind": break;
                    case "yen-e": break;
                    case "talk":
                        _this.talkCounts[is] = n;
                        break;
                    default:
                        if (/^bind(?:\+(\d+))/.test(interval)) {
                        }
                        else {
                            console.warn(_this.surfaceTreeNode.animations[is]);
                        }
                }
            });
        };
        Surface.prototype.destructor = function () {
            this.elmRender.clear();
            this.destructed = true;
            this.layers = {};
        };
        Surface.prototype.render = function () {
            this.bufRender.init(this.surfaceTreeNode.base);
            this.bufRender.composeElements(this.surfaceTreeNode.elements);
            this.elmRender.init(this.bufRender.cnv);
        };
        Surface.prototype.play = function (animationId, callback) {
        };
        Surface.prototype.stop = function (animationId) {
            this.stopFlags[animationId] = true;
        };
        Surface.prototype.talk = function () {
            var _this = this;
            var animations = this.surfaceTreeNode.animations;
            this.talkCount++;
            var hits = animations.filter(function (anim) {
                return /^talk/.test(anim.interval) && _this.talkCount % _this.talkCounts[anim.is] === 0;
            });
            hits.forEach(function (anim) {
                _this.play(anim.is);
            });
        };
        Surface.prototype.yenE = function () {
            var _this = this;
            var animations = this.surfaceTreeNode.animations;
            var hits = animations.filter(function (anim) {
                return anim.interval === "yen-e" && _this.talkCount % _this.talkCounts[anim.is] === 0;
            });
            hits.forEach(function (anim) {
                _this.play(anim.is);
            });
        };
        Surface.prototype.bind = function (animationId) {
            var _this = this;
            var animations = this.surfaceTreeNode.animations;
            var anim = animations.filter(function (_anim) { return _anim.is === animationId; })[0];
            if (!anim)
                return;
            if (anim.patterns.length === 0)
                return;
            var interval = anim.interval;
            var pattern = anim.patterns[anim.patterns.length - 1];
            this.layers[anim.is] = pattern;
            this.render();
            if (/^bind(?:\+(\d+))/.test(interval)) {
                var animIds = interval.split("+").slice(1);
                animIds.forEach(function (animId) { return _this.play(Number(animId)); });
            }
        };
        Surface.prototype.unbind = function (animationId) {
            delete this.layers[animationId];
        };
        return Surface;
    })();
    cuttlebone.Surface = Surface;
})(cuttlebone || (cuttlebone = {}));
/// <reference path="../typings/tsd.d.ts"/>
var cuttlebone;
(function (cuttlebone) {
    var SurfaceRender = (function () {
        function SurfaceRender(cnv) {
            this.cnv = cnv;
            this.ctx = cnv.getContext("2d");
        }
        SurfaceRender.prototype.composeElements = function (elements) {
            if (elements.length === 0) {
                return;
            }
            var _a = elements[0], canvas = _a.canvas, type = _a.type, x = _a.x, y = _a.y;
            var offsetX = 0;
            var offsetY = 0;
            switch (type) {
                case "base":
                    this.base(canvas, offsetX, offsetY);
                    break;
                case "overlay":
                    this.overlay(canvas, offsetX + x, offsetY + y);
                    break;
                case "overlayfast":
                    this.overlayfast(canvas, offsetX + x, offsetY + y);
                    break;
                case "replace":
                    this.replace(canvas, offsetX + x, offsetY + y);
                    break;
                case "add":
                    this.overlayfast(canvas, offsetX + x, offsetY + y);
                    break;
                case "bind":
                    this.overlayfast(canvas, offsetX + x, offsetY + y);
                    break;
                case "interpolate":
                    this.interpolate(canvas, offsetX + x, offsetY + y);
                    break;
                case "move":
                    offsetX = x;
                    offsetY = y;
                    var copyed = cuttlebone.SurfaceUtil.copy(this.cnv);
                    this.base(copyed, offsetX, offsetY);
                    break;
                default:
                    console.error(elements[0]);
            }
            this.composeElements(elements.slice(1));
        };
        SurfaceRender.prototype.clear = function () {
            this.cnv.width = this.cnv.width;
        };
        SurfaceRender.prototype.chromakey = function () {
            var ctx = this.cnv.getContext("2d");
            var imgdata = ctx.getImageData(0, 0, this.cnv.width, this.cnv.height);
            var data = imgdata.data;
            var r = data[0], g = data[1], b = data[2], a = data[3];
            var i = 0;
            if (a !== 0) {
                while (i < data.length) {
                    if (r === data[i] && g === data[i + 1] && b === data[i + 2]) {
                        data[i + 3] = 0;
                    }
                    i += 4;
                }
            }
            ctx.putImageData(imgdata, 0, 0);
        };
        SurfaceRender.prototype.pna = function (pna) {
            var ctxB = pna.getContext("2d");
            var imgdataA = this.ctx.getImageData(0, 0, this.cnv.width, this.cnv.height);
            var imgdataB = ctxB.getImageData(0, 0, pna.width, pna.height);
            var dataA = imgdataA.data;
            var dataB = imgdataB.data;
            var i = 0;
            while (i < dataA.length) {
                dataA[i + 3] = dataB[i];
                i += 4;
            }
            this.ctx.putImageData(imgdataA, 0, 0);
        };
        SurfaceRender.prototype.base = function (part, x, y) {
            this.clear();
            this.init(part);
        };
        SurfaceRender.prototype.overlay = function (part, x, y) {
            if (this.cnv.width < part.width || this.cnv.height < part.height) {
                this.base(part, x, y); // 下のレイヤ消えてpartから描画されるんじゃね？
            }
            else {
                this.overlayfast(part, x, y);
            }
        };
        SurfaceRender.prototype.overlayfast = function (part, x, y) {
            this.ctx.globalCompositeOperation = "source-over";
            this.ctx.drawImage(part, x, y);
        };
        SurfaceRender.prototype.interpolate = function (part, x, y) {
            this.ctx.globalCompositeOperation = "destination-over";
            this.ctx.drawImage(part, x, y);
        };
        SurfaceRender.prototype.replace = function (part, x, y) {
            this.ctx.clearRect(x, y, part.width, part.height);
            this.overlayfast(part, x, y);
        };
        SurfaceRender.prototype.init = function (cnv) {
            this.cnv.width = cnv.width;
            this.cnv.height = cnv.height;
            this.overlayfast(cnv, 0, 0); // type hack
        };
        SurfaceRender.prototype.drawRegion = function (region) {
            var type = region.type, name = region.name, left = region.left, top = region.top, right = region.right, bottom = region.bottom, coordinates = region.coordinates, radius = region.radius, center_x = region.center_x, center_y = region.center_y;
            this.ctx.strokeStyle = "#00FF00";
            switch (type) {
                case "rect":
                    this.ctx.rect(left, top, right - left, bottom - top);
                    break;
                case "ellipse":
                    this.ctx.rect(left, top, right - left, bottom - top);
                    break;
                case "circle":
                    this.ctx.rect(left, top, right - left, bottom - top);
                    break;
                case "polygon":
                    this.ctx.rect(left, top, right - left, bottom - top);
            }
            this.ctx.stroke();
            this.ctx.font = "35px";
            this.ctx.strokeStyle = "white";
            this.ctx.strokeText(type + ":" + name, left + 5, top + 10);
            this.ctx.fillStyle = "black";
            this.ctx.fillText(type + ":" + name, left + 5, top + 10);
        };
        return SurfaceRender;
    })();
    cuttlebone.SurfaceRender = SurfaceRender;
})(cuttlebone || (cuttlebone = {}));
/// <reference path="../typings/tsd.d.ts"/>
var cuttlebone;
(function (cuttlebone) {
    var SurfaceUtil;
    (function (SurfaceUtil) {
        function choice(arr) {
            return arr[Math.round(Math.random() * (arr.length - 1))];
        }
        SurfaceUtil.choice = choice;
        function copy(cnv) {
            var copy = document.createElement("canvas");
            var ctx = copy.getContext("2d");
            copy.width = cnv.width;
            copy.height = cnv.height;
            ctx.drawImage(cnv, 0, 0); // type hack
            return copy;
        }
        SurfaceUtil.copy = copy;
        function fetchImageFromArrayBuffer(buffer, mimetype) {
            var url = URL.createObjectURL(new Blob([buffer], { type: mimetype || "image/png" }));
            return fetchImageFromURL(url).then(function (img) {
                URL.revokeObjectURL(url);
                return Promise.resolve(img);
            }).catch(function (err) {
                return Promise.reject("fetchImageFromArrayBuffer > " + err);
            });
        }
        SurfaceUtil.fetchImageFromArrayBuffer = fetchImageFromArrayBuffer;
        function fetchImageFromURL(url) {
            var img = new Image;
            img.src = url;
            return new Promise(function (resolve, reject) {
                img.addEventListener("load", function () {
                    resolve(Promise.resolve(img)); // type hack
                });
                img.addEventListener("error", function (ev) {
                    reject("fetchImageFromURL");
                });
            });
        }
        SurfaceUtil.fetchImageFromURL = fetchImageFromURL;
        function random(callback, probability) {
            var ms = 1;
            while (Math.round(Math.random() * 1000) > 1000 / probability) {
                ms++;
            }
            setTimeout((function () {
                return callback(function () { return random(callback, probability); });
            }), ms * 1000);
        }
        SurfaceUtil.random = random;
        function periodic(callback, sec) {
            setTimeout((function () {
                return callback(function () {
                    return periodic(callback, sec);
                });
            }), sec * 1000);
        }
        SurfaceUtil.periodic = periodic;
        function always(callback) {
            callback(function () { return always(callback); });
        }
        SurfaceUtil.always = always;
        function isHit(cnv, x, y) {
            var ctx = cnv.getContext("2d");
            var imgdata = ctx.getImageData(0, 0, x + 1, y + 1);
            var data = imgdata.data;
            return data[data.length - 1] !== 0;
        }
        SurfaceUtil.isHit = isHit;
        function offset(element) {
            var obj = element.getBoundingClientRect();
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset,
                width: Math.round(obj.width),
                height: Math.round(obj.height)
            };
        }
        SurfaceUtil.offset = offset;
        function createCanvas() {
            var cnv = document.createElement("canvas");
            cnv.width = 1;
            cnv.height = 1;
            return cnv;
        }
        SurfaceUtil.createCanvas = createCanvas;
        function scope(scopeId) {
            return scopeId === 0 ? "sakura"
                : scopeId === 1 ? "kero"
                    : "char" + scopeId;
        }
        SurfaceUtil.scope = scope;
        function elementFromPointWithout(element, pageX, pageY) {
            var tmp = element.style.display;
            element.style.display = "none";
            // elementを非表示にして直下の要素を調べる
            var elm = document.elementFromPoint(pageX, pageY);
            // 直下の要素がcanvasなら透明かどうか調べる
            // todo: cuttlebone管理下の要素かどうかの判定必要
            if (elm instanceof HTMLCanvasElement) {
                var _a = offset(elm), top = _a.top, left = _a.left;
                // 不透明ならヒット
                if (isHit(elm, pageX - left, pageY - top)) {
                    element.style.display = tmp;
                    return elm;
                }
            }
            // elementの非表示のままさらに下の要素を調べにいく
            if (elm instanceof HTMLElement) {
                var _elm = elementFromPointWithout(elm, pageX, pageY);
                element.style.display = tmp;
                return _elm;
            }
            // 解決できなかった！ザンネン!
            console.warn(elm);
            element.style.display = tmp;
            return null;
        }
        SurfaceUtil.elementFromPointWithout = elementFromPointWithout;
    })(SurfaceUtil = cuttlebone.SurfaceUtil || (cuttlebone.SurfaceUtil = {}));
})(cuttlebone || (cuttlebone = {}));
