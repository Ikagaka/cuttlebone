/// <reference path="./PNG"/>
/// <reference path="../typings/jszip/jszip.d.ts"/>
/// <reference path="../tsd/Uint8ClampedArray/Uint8ClampedArray.d.ts"/>

// oriinal: https://github.com/arian/pngjs
// modified by legokichi.
// chenge:
//   typescriptnize
//   chenge zlib library stream.js to jszip(pako)
//   support bitdepth 1


module cuttlebone {

  function equalBytes(a: Uint8Array, b: Uint8Array): boolean{
    if (a.length != b.length) return false;
    for (var l = a.length; l--;) if (a[l] != b[l]) return false;
    return true;
  }

  function readUInt32(buffer: Uint8Array, offset: number): number{
    return (buffer[offset] << 24) +
           (buffer[offset + 1] << 16) +
           (buffer[offset + 2] << 8) +
           (buffer[offset + 3] << 0);
  }

  function readUInt16(buffer: Uint8Array, offset: number): number{
    return (buffer[offset + 1] << 8) + (buffer[offset] << 0);
  }

  function readUInt8(buffer: Uint8Array, offset: number): number{
    return buffer[offset] << 0;
  }

  function bufferToString(buffer: Uint8Array): string{
    var str = '';
    for (var i = 0; i < buffer.length; i++){
      str += String.fromCharCode(buffer[i]);
    }
    return str;
  }

  export class PNGReader {

    bytes: Uint8Array;
    i: number;
    header: Uint8Array;
    dataChunks: Uint8Array[];
    png: PNG;

    constructor(data: ArrayBuffer){
      // bytes buffer
      this.bytes = new Uint8Array(data);
      // current pointer
      this.i = 0;
      this.dataChunks = [];
      // Output object
      this.png = new PNG();
    }

    readBytes(length: number): Uint8Array{
      var end = this.i + length;
      if (end > this.bytes.length){
        throw new Error('Unexpectedly reached end of file');
      }
      var bytes = this.bytes.subarray(this.i, end);
      this.i = end;
      return bytes;
    }

    /**
     * http://www.w3.org/TR/2003/REC-PNG-20031110/#5PNG-file-signature
     */
    decodeHeader():void {
      if (this.i !== 0){
        throw new Error('file pointer should be at 0 to read the header');
      }
      var header = this.readBytes(8);
      if (!equalBytes(header, new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))){
        throw new Error('invalid PNGReader file (bad signature)');
      }
      this.header = header;
    }

    /**
     * http://www.w3.org/TR/2003/REC-PNG-20031110/#5Chunk-layout
     *
     * length =  4      bytes
     * type   =  4      bytes (IHDR, PLTE, IDAT, IEND or others)
     * chunk  =  length bytes
     * crc    =  4      bytes
     */
    decodeChunk(): string{
      var length = readUInt32(this.readBytes(4), 0);
      if (length < 0){
        throw new Error('Bad chunk length ' + (0xFFFFFFFF & length));
      }
      var type = bufferToString(this.readBytes(4));
      var chunk = this.readBytes(length);
      var crc = this.readBytes(4);
      switch (type){
        case 'IHDR': this.decodeIHDR(chunk); break;
        case 'PLTE': this.decodePLTE(chunk); break;
        case 'IDAT': this.decodeIDAT(chunk); break;
        case 'IEND': this.decodeIEND(chunk); break;
        default: console.warn("PNGReader: ", type, " is not support chunk type."); break;
      }
      return type;
    }

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
    decodeIHDR(chunk: Uint8Array): void{
      var png = this.png;
      png.setWidth(             readUInt32(chunk, 0));
      png.setHeight(            readUInt32(chunk, 4));
      png.setBitDepth(          readUInt8(chunk,  8));
      png.setColorType(         readUInt8(chunk,  9));
      png.setCompressionMethod( readUInt8(chunk, 10));
      png.setFilterMethod(      readUInt8(chunk, 11));
      png.setInterlaceMethod(   readUInt8(chunk, 12));
    }

    /**
     *
     * http://www.w3.org/TR/PNG/#11PLTE
     */
    decodePLTE(chunk: Uint8Array): void {
      this.png.setPalette(chunk);
    }

    /**
     * http://www.w3.org/TR/2003/REC-PNG-20031110/#11IDAT
     */
    decodeIDAT(chunk: Uint8Array): void {
      // multiple IDAT chunks will concatenated
      this.dataChunks.push(chunk);
    }

    /**
     * http://www.w3.org/TR/2003/REC-PNG-20031110/#11IEND
     */
    decodeIEND(chunk: Uint8Array): void {
    }

    /**
     * Uncompress IDAT chunks
     */
    decodePixels(): void {
      var png = this.png;
      var length = 0;
      var i = 0;
      var j = 0;
      var k = 0;
      var l = 0;
      for (l = this.dataChunks.length; l--;) length += this.dataChunks[l].length;
      var data = new Uint8Array(new ArrayBuffer(length));
      for (i = 0, k = 0, l = this.dataChunks.length; i < l; i++){
        var chunk = this.dataChunks[i];
        for (j = 0; j < chunk.length; j++) data[k++] = chunk[j];
      }
      // http://www.fileformat.info/format/png/corion.htm
      // Deflate-compressed datastreams within PNG are stored in the "zlib"
      // format, which has the structure:
      // Compression method/flags code: 1 byte
      // Additional flags/check bits:   1 byte
      // Compressed data blocks:        n bytes
      // Checksum:                      4 bytes
      var rawdata = data.subarray(2, data.length - 4);
      try{
        var _data = JSZip.compressions.DEFLATE.uncompress(rawdata);
      }catch(err){
        throw new Error(err || "pako: zlib inflate error");
      }

      if (png.getInterlaceMethod() === 0){
        this.interlaceNone(_data);
      } else {
        this.interlaceAdam7(_data);
      }
    }

    // Different interlace methods
    interlaceNone(data:Uint8Array): void {
      var png = this.png;
      if(png.bitDepth < 8){
        // bits per pixel
        var bitspp = png.colors * png.bitDepth;
        var scanlineLength = data.length / png.height;
        var pixels = new Uint8Array(new ArrayBuffer((scanlineLength - 1) * png.height));
        //console.info(png.bitDepth, png.colors, png.colorType, scanlineLength, bitspp * png.width, png.width, png.height, data.length);
        var offset = 0;
        for (var i = 0; i < data.length; i += scanlineLength){
          var scanline = data.subarray(i, i + scanlineLength);
          var filtertype = readUInt8(scanline, i);
          var _scanline = scanline.subarray(1, scanline.length);
          switch (filtertype){
            case 0: pixels.set(_scanline, offset); break;
            default: throw new Error("unsupport filtered scanline: " + filtertype+ ":"+offset+":"+i); break;
          }
          offset += scanlineLength - 1;
        }
      } else {
        // bytes per pixel
        var bpp = Math.max(1, png.colors * png.bitDepth / 8);
        // color bytes per row
        var cpr = bpp * png.width;
        var pixels = new Uint8Array(new ArrayBuffer(bpp * png.width * png.height));
        var offset = 0;
        for (var i = 0; i < data.length; i += cpr + 1){
          var scanline = data.subarray(i + 1, i + cpr + 1);
          var filtertype = readUInt8(data, i);
          switch (filtertype){
            case 0: this.unFilterNone(   scanline, pixels, bpp, offset, cpr); break;
            case 1: this.unFilterSub(    scanline, pixels, bpp, offset, cpr); break;
            case 2: this.unFilterUp(     scanline, pixels, bpp, offset, cpr); break;
            case 3: this.unFilterAverage(scanline, pixels, bpp, offset, cpr); break;
            case 4: this.unFilterPaeth(  scanline, pixels, bpp, offset, cpr); break;
            default: throw new Error("unkown filtered scanline: " + filtertype+ ":"+bpp+":"+offset+":"+cpr+":"+i); break;
          }
          offset += cpr;
        }
      }
      png.pixels = pixels;
    }

    interlaceAdam7(data: Uint8Array): void {
      throw new Error("Adam7 interlacing is not implemented yet");
    }

    // Unfiltering
    /**
     * No filtering, direct copy
     */
    unFilterNone(scanline:Uint8Array, pixels:Uint8Array, bpp:number, offset: number, length: number): void {
      for (var i = 0, to = length; i < to; i++){
        pixels[offset + i] = scanline[i];
      }
    }

    /**
     * The Sub() filter transmits the difference between each byte and the value
     * of the corresponding byte of the prior pixel.
     * Sub(x) = Raw(x) + Raw(x - bpp)
     */
    unFilterSub(scanline:Uint8Array, pixels:Uint8Array, bpp:number, offset: number, length: number): void {
      var i = 0;
      for (; i < bpp; i++) pixels[offset + i] = scanline[i];
      for (; i < length; i++){
        // Raw(x) + Raw(x - bpp)
        pixels[offset + i] = (scanline[i] + pixels[offset + i - bpp]) & 0xFF;
      }
    }

    /**
     * The Up() filter is just like the Sub() filter except that the pixel
     * immediately above the current pixel, rather than just to its left, is used
     * as the predictor.
     * Up(x) = Raw(x) + Prior(x)
     */
     unFilterUp(scanline:Uint8Array, pixels:Uint8Array, bpp:number, offset: number, length: number): void {
      var i = 0
      var byte: number;
      var prev: number;
      // Prior(x) is 0 for all x on the first scanline
      if ((offset - length) < 0) for (; i < length; i++){
        pixels[offset + i] = scanline[i];
      } else for (; i < length; i++){
        // Raw(x)
        byte = scanline[i];
        // Prior(x)
        prev = pixels[offset + i - length];
        pixels[offset + i] = (byte + prev) & 0xFF;
      }
    }

    /**
     * The Average() filter uses the average of the two neighboring pixels (left
     * and above) to predict the value of a pixel.
     * Average(x) = Raw(x) + floor((Raw(x-bpp)+Prior(x))/2)
     */
    unFilterAverage(scanline:Uint8Array, pixels:Uint8Array, bpp:number, offset: number, length: number): void {
      var i = 0
      var byte: number;
      var prev: number;
      var prior: number;
      if ((offset - length) < 0){
        // Prior(x) == 0 && Raw(x - bpp) == 0
        for (; i < bpp; i++){
          pixels[offset + i] = scanline[i];
        }
        // Prior(x) == 0 && Raw(x - bpp) != 0 (right shift, prevent doubles)
        for (; i < length; i++){
          pixels[offset + i] = (scanline[i] + (pixels[offset + i - bpp] >> 1)) & 0xFF;
        }
      } else {
        // Prior(x) != 0 && Raw(x - bpp) == 0
        for (; i < bpp; i++){
          pixels[offset + i] = (scanline[i] + (pixels[offset - length + i] >> 1)) & 0xFF;
        }
        // Prior(x) != 0 && Raw(x - bpp) != 0
        for (; i < length; i++){
          byte = scanline[i];
          prev = pixels[offset + i - bpp];
          prior = pixels[offset + i - length];
          pixels[offset + i] = (byte + (prev + prior >> 1)) & 0xFF;
        }
      }
    }

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
    unFilterPaeth(scanline:Uint8Array, pixels:Uint8Array, bpp:number, offset: number, length: number): void {
      var i = 0
      var raw: number;
      var a: number;
      var b: number;
      var c: number;
      var p: number;
      var pa: number;
      var pb: number;
      var pc: number;
      var pr: number;
      if ((offset - length) < 0){
        // Prior(x) == 0 && Raw(x - bpp) == 0
        for (; i < bpp; i++){
          pixels[offset + i] = scanline[i];
        }
        // Prior(x) == 0 && Raw(x - bpp) != 0
        // paethPredictor(x, 0, 0) is always x
        for (; i < length; i++){
          pixels[offset + i] = (scanline[i] + pixels[offset + i - bpp]) & 0xFF;
        }
      } else {
        // Prior(x) != 0 && Raw(x - bpp) == 0
        // paethPredictor(x, 0, 0) is always x
        for (; i < bpp; i++){
          pixels[offset + i] = (scanline[i] + pixels[offset + i - length]) & 0xFF;
        }
        // Prior(x) != 0 && Raw(x - bpp) != 0
        for (; i < length; i++){
          raw = scanline[i];
          a = pixels[offset + i - bpp];
          b = pixels[offset + i - length];
          c = pixels[offset + i - length - bpp];
          p = a + b - c;
          pa = Math.abs(p - a);
          pb = Math.abs(p - b);
          pc = Math.abs(p - c);
          if (pa <= pb && pa <= pc) pr = a;
          else if (pb <= pc) pr = b;
          else pr = c;
          pixels[offset + i] = (raw + pr) & 0xFF;
        }
      }
    }

    parse(options?:{data:boolean}): PNG {
      options = options || {data: true};
      this.decodeHeader();
      while (this.i < this.bytes.length){
        var type = this.decodeChunk();
        // stop after IHDR chunk, or after IEND
        if (type == 'IHDR' && options.data === false || type == 'IEND') break;
      }
      var png = this.png;
      this.decodePixels();
      return this.png;
    }
  }
}
