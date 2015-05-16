/// <reference path="../../typings/tsd.d.ts" />
declare module cuttlebone {
    module SurfaceUtil {
        function choice<T>(arr: T[]): T;
        function copy(cnv: HTMLCanvasElement | HTMLImageElement): HTMLCanvasElement;
        function fetchImageFromArrayBuffer(buffer: ArrayBuffer, mimetype?: string): Promise<HTMLImageElement>;
        function fetchImageFromURL(url: string): Promise<HTMLImageElement>;
        function random(callback: (callback: () => void) => void, probability: number): void;
        function periodic(callback: (callback: () => void) => void, sec: number): void;
        function always(callback: (callback: () => void) => void): void;
        function isHit(cnv: HTMLCanvasElement, x: number, y: number): boolean;
        function offset(element: Element): {
            left: number;
            top: number;
            width: number;
            height: number;
        };
        function createCanvas(): HTMLCanvasElement;
        function scope(scopeId: number): string;
        function elementFromPointWithout(element: HTMLElement, pageX: number, pageY: number): Element;
    }
}
