/// <reference path="Balloons.d.ts"/>

declare module cuttlebone {
  export class BalloonSurface {
    constructor(
      canvas: HTMLCanvasElement,
      scopeId: number,
      balloon: {
        descript: { [key: string]: string; };
        canvas: HTMLCanvasElement;
      },
      balloons: Balloons);
    destructor(): void;
    render(): void;
    element: HTMLCanvasElement;
  }
}
