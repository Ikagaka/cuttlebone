// oriinal: https://github.com/arian/pngjs
// modified by legokichi.
// chenge:
//   typescriptnize
//   chenge zlib library stream.js to jszip(pako)
//   support bitdepth 1

module cuttlebone {

  function uInt8ToBitArray(uint8: number): number[] {// 170 -> [1,0,1,0,1,0,1,0]
    return (uint8+256).toString(2).split("").slice(1).map(Number);
  }

  function uInt8ArrayToBits(arr: Uint8Array): number[] {// new Uint8Array([170]) -> [1,0,1,0,1,0,1,0]
    var result:number[] = [];
    for (var i=0; arr.length>i; i++){
      result = result.concat(uInt8ToBitArray(arr[i]));
    }
    return result;
  }

  function bitsToNum(bits:number[]): number{// [1,0,1,0,1,0,1,0] -> 170
    //return bits.slice().reverse().reduce(function(sum,n,i){return sum+Math.pow(2,i)*n},0);
    return parseInt(bits.join(""), 2);
  }

  function readBits(buffer: Uint8Array, bitOffset: number, bitLength:number ): number[]{
    var _byteOffset = bitOffset / 8 | 0;
    var _bitOffset = bitOffset % 8;
    var _byteLength = bitLength / 8 | 0;
    var _bitLength = bitLength % 8;
    var _buf = buffer.subarray(_byteOffset, _byteOffset+_byteLength+1);
    return uInt8ArrayToBits(_buf).slice(_bitOffset, _bitOffset+bitLength);
  }


  export class PNG {
    width: number;
    height: number;
    bitDepth: number;
    colorType: number;
    compressionMethod: number;
    filterMethod: number;
    interlaceMethod: number;
    colors: number;
    alpha: boolean;
    pixelBits: number;
    palette: Uint8Array;
    pixels: Uint8Array;

    constructor(){
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

    getWidth(): number{
      return this.width;
    }

    setWidth(width: number){
      this.width = width;
    }

    getHeight(){
      return this.height;
    }

    setHeight(height: number){
      this.height = height;
    }

    getBitDepth(){
      return this.bitDepth;
    }

    setBitDepth(bitDepth: number){
      if ([1, 2, 4, 8, 16].indexOf(bitDepth) === -1){
        throw new Error("invalid bith depth " + bitDepth);
      }
      this.bitDepth = bitDepth;
    }

    getColorType(){
      return this.colorType;
    }

    setColorType(colorType: number){
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
      switch (colorType){
        case 0: colors = 1; break;
        case 2: colors = 3; break;
        case 3: colors = 1; break;
        case 4: colors = 2; alpha = true; break;
        case 6: colors = 4; alpha = true; break;
        default: throw new Error("invalid color type");
      }
      this.colors = colors;
      this.alpha = alpha;
      this.colorType = colorType;
    }

    getCompressionMethod(){
      return this.compressionMethod;
    }

    setCompressionMethod(compressionMethod: number){
      if (compressionMethod !== 0){
        throw new Error("invalid compression method " + compressionMethod);
      }
      this.compressionMethod = compressionMethod;
    }

    getFilterMethod(){
      return this.filterMethod;
    }

    setFilterMethod(filterMethod: number){
      if (filterMethod !== 0){
        throw new Error("invalid filter method " + filterMethod);
      }
      this.filterMethod = filterMethod;
    }

    getInterlaceMethod(){
      return this.interlaceMethod;
    }

    setInterlaceMethod(interlaceMethod: number){
      if (interlaceMethod !== 0 && interlaceMethod !== 1){
        throw new Error("invalid interlace method " + interlaceMethod);
      }
      this.interlaceMethod = interlaceMethod;
    }

    setPalette(palette: Uint8Array){
      if (palette.length % 3 !== 0){
        throw new Error("incorrect PLTE chunk length");
      }
      if (palette.length > (Math.pow(2, this.bitDepth) * 3)){
        throw new Error("palette has more colors than 2^bitdepth");
      }
      this.palette = palette;
    }

    getPalette(){
      return this.palette;
    }

    /**
     * get the pixel color on a certain location in a normalized way
     * result is an array: [red, green, blue, alpha]
     */
    getPixel(x:number, y:number): [number, number, number, number]{
      if (!this.pixels) throw new Error("pixel data is empty");
      if (x >= this.width || y >= this.height){
        throw new Error("x,y position out of bound");
      }
      var pixels = this.pixels;
      if(this.bitDepth < 8){
        //console.info(this.colors, this.bitDepth, pixels.length, this.width, this.height)
        var bitspp = this.colors * this.bitDepth; // bit
        var _scanlineLength = pixels.length / this.height; // byte
        var diff = _scanlineLength * 8 - this.width * bitspp; // bit
        var idbit = (y * (bitspp * this.width + diff) + bitspp * x); // x, y is zero origin
        switch (this.colorType){
          case 0:
            var tmp = bitsToNum(readBits(pixels, idbit, this.bitDepth));
            return [
              tmp,
              tmp,
              tmp,
              255];
          case 2: return [
            bitsToNum(readBits(pixels, idbit, this.bitDepth)),
            bitsToNum(readBits(pixels, idbit+1, this.bitDepth)),
            bitsToNum(readBits(pixels, idbit+2, this.bitDepth)),
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
              bitsToNum(readBits(pixels, idbit+1, this.bitDepth))];
          case 6: return [
            bitsToNum(readBits(pixels, idbit, this.bitDepth)),
            bitsToNum(readBits(pixels, idbit+1, this.bitDepth)),
            bitsToNum(readBits(pixels, idbit+2, this.bitDepth)),
            bitsToNum(readBits(pixels, idbit+3, this.bitDepth))
          ];
          default: throw new Error("invalid color type: " + this.colorType); break;
        }
      }else{
        var i = this.colors * this.bitDepth / 8 * (y * this.width + x);
        switch (this.colorType){
          case 0: return [pixels[i], pixels[i], pixels[i], 255];
          case 2: return [pixels[i], pixels[i + 1], pixels[i + 2], 255];
          case 3: return [
            this.palette[pixels[i] * 3 + 0],
            this.palette[pixels[i] * 3 + 1],
            this.palette[pixels[i] * 3 + 2],
            255];
          case 4: return [pixels[i], pixels[i], pixels[i], pixels[i + 1]];
          case 6: return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
          default: throw new Error("invalid color type: " + this.colorType); break;
        }
      }
    }
    
    getUint8ClampedArray(): Uint8ClampedArray {
      var width = this.width;
      var height = this.height;
      var arr = new Uint8ClampedArray(width * height * 4);
      var i = 0;
      for (var y = 0; y < height; y++){
        for (var x = 0; x < width; x++){
          var colors = this.getPixel(x, y);
          arr[i++] = colors[0];
          arr[i++] = colors[1];
          arr[i++] = colors[2];
          arr[i++] = colors[3];
        }
      }
      return arr;
    }
  }
}
