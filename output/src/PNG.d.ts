declare module cuttlebone {
    class PNG {
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
        constructor();
        getWidth(): number;
        setWidth(width: number): void;
        getHeight(): number;
        setHeight(height: number): void;
        getBitDepth(): number;
        setBitDepth(bitDepth: number): void;
        getColorType(): number;
        setColorType(colorType: number): void;
        getCompressionMethod(): number;
        setCompressionMethod(compressionMethod: number): void;
        getFilterMethod(): number;
        setFilterMethod(filterMethod: number): void;
        getInterlaceMethod(): number;
        setInterlaceMethod(interlaceMethod: number): void;
        setPalette(palette: Uint8Array): void;
        getPalette(): Uint8Array;
        /**
         * get the pixel color on a certain location in a normalized way
         * result is an array: [red, green, blue, alpha]
         */
        getPixel(x: number, y: number): [number, number, number, number];
        getUint8ClampedArray(): Uint8ClampedArray;
    }
}
