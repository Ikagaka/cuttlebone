/// <reference path="../../typings/zepto/zepto.d.ts" />
declare module cuttlebone {
    class Scope {
        element: HTMLDivElement;
        shell: Shell;
        balloon: Balloon;
        currentSurface: Surface;
        currentBlimp: Blimp;
        scopeId: number;
        scopeElm: HTMLDivElement;
        surfaceElm: HTMLDivElement;
        surfaceCanvasElm: HTMLCanvasElement;
        blimpElm: HTMLDivElement;
        constructor(scopeId: number, shell: Shell, balloon: Balloon);
        surface(surfaceId: number | string): Surface;
        blimp(balloonId: number): Blimp;
    }
}
