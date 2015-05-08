/// <reference path="../../typings/tsd.d.ts" />
declare module cuttlebone {
    class SurfaceRender {
        cnv: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
        constructor(cnv: HTMLCanvasElement);
        composeElements(elements: SurfaceLayerObject[]): void;
        clear(): void;
        chromakey(): void;
        pna(pna: HTMLCanvasElement): void;
        base(part: HTMLCanvasElement, x: number, y: number): void;
        overlay(part: HTMLCanvasElement, x: number, y: number): void;
        overlayfast(part: HTMLCanvasElement, x: number, y: number): void;
        interpolate(part: HTMLCanvasElement, x: number, y: number): void;
        replace(part: HTMLCanvasElement, x: number, y: number): void;
        init(cnv: HTMLImageElement | HTMLCanvasElement): void;
        drawRegion(region: SurfaceRegion): void;
    }
}
