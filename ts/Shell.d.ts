/// <reference path="Surface.d.ts"/>
/// <reference path="Surfaces.d.ts"/>

declare module cuttlebone {
  export class Shell {
    constructor(directory: { [filepath: string]: ArrayBuffer; });
    load(): Promise<Shell>;
    attatchSurface(canvas: HTMLCanvasElement, scopeId: number, surfaceId: number): Surface;
    descript: { [key: string]: string; };
    surfaces: Surfaces;
  }
}
