/// <reference path="../../tsd/jszip/jszip.d.ts" />
/// <reference path="../../tsd/Uint8ClampedArray/Uint8ClampedArray.d.ts" />
declare module cuttlebone {
    class PNGReader {
        bytes: Uint8Array;
        i: number;
        header: Uint8Array;
        dataChunks: Uint8Array[];
        png: PNG;
        constructor(data: ArrayBuffer);
        readBytes(length: number): Uint8Array;
        /**
         * http://www.w3.org/TR/2003/REC-PNG-20031110/#5PNG-file-signature
         */
        decodeHeader(): void;
        /**
         * http://www.w3.org/TR/2003/REC-PNG-20031110/#5Chunk-layout
         *
         * length =  4      bytes
         * type   =  4      bytes (IHDR, PLTE, IDAT, IEND or others)
         * chunk  =  length bytes
         * crc    =  4      bytes
         */
        decodeChunk(): string;
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
        decodeIHDR(chunk: Uint8Array): void;
        /**
         *
         * http://www.w3.org/TR/PNG/#11PLTE
         */
        decodePLTE(chunk: Uint8Array): void;
        /**
         * http://www.w3.org/TR/2003/REC-PNG-20031110/#11IDAT
         */
        decodeIDAT(chunk: Uint8Array): void;
        /**
         * http://www.w3.org/TR/2003/REC-PNG-20031110/#11IEND
         */
        decodeIEND(chunk: Uint8Array): void;
        /**
         * Uncompress IDAT chunks
         */
        decodePixels(): void;
        interlaceNone(data: Uint8Array): void;
        interlaceAdam7(data: Uint8Array): void;
        /**
         * No filtering, direct copy
         */
        unFilterNone(scanline: Uint8Array, pixels: Uint8Array, bpp: number, offset: number, length: number): void;
        /**
         * The Sub() filter transmits the difference between each byte and the value
         * of the corresponding byte of the prior pixel.
         * Sub(x) = Raw(x) + Raw(x - bpp)
         */
        unFilterSub(scanline: Uint8Array, pixels: Uint8Array, bpp: number, offset: number, length: number): void;
        /**
         * The Up() filter is just like the Sub() filter except that the pixel
         * immediately above the current pixel, rather than just to its left, is used
         * as the predictor.
         * Up(x) = Raw(x) + Prior(x)
         */
        unFilterUp(scanline: Uint8Array, pixels: Uint8Array, bpp: number, offset: number, length: number): void;
        /**
         * The Average() filter uses the average of the two neighboring pixels (left
         * and above) to predict the value of a pixel.
         * Average(x) = Raw(x) + floor((Raw(x-bpp)+Prior(x))/2)
         */
        unFilterAverage(scanline: Uint8Array, pixels: Uint8Array, bpp: number, offset: number, length: number): void;
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
        unFilterPaeth(scanline: Uint8Array, pixels: Uint8Array, bpp: number, offset: number, length: number): void;
        parse(options?: {
            data: boolean;
        }): PNG;
    }
}
