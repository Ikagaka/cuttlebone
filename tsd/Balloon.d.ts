/// <reference path="Descript.d.ts"/>
/// <reference path="Balloons.d.ts"/>

declare module cuttlebone {
  export class Balloon {
    constructor(directory: { [filePath: string]: ArrayBuffer; });
    load(): Promise<Balloon>;
    attachSurface(canvas: HTMLCanvasElement, scopeId: number, surfaceId: number): BalloonSurface;
    descript: Descript;
    balloons: Balloons;
  }
}
