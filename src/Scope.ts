/// <reference path="./Shell"/>
/// <reference path="./Surface"/>
/// <reference path="./Balloon"/>
/// <reference path="./BalloonSurface"/>
/// <reference path="./SurfaceUtil"/>
/// <reference path="../typings/zepto/zepto.d.ts"/>

module cuttlebone {

  export class Scope {

    element: HTMLDivElement;
    shell: Shell;
    balloon: Balloon;
    currentSurface: Surface;
    currentBlimp: BalloonSurface;

    scopeId: number;

    scopeElm: HTMLDivElement;
    surfaceElm: HTMLDivElement;
    surfaceCanvasElm: HTMLCanvasElement;
    blimpElm: HTMLDivElement;

    constructor(scopeId: number, shell:Shell, balloon: Balloon){
      this.scopeId = scopeId;
      this.shell = shell;
      this.balloon = balloon;

      this.scopeElm = document.createElement("div");
      this.surfaceElm = document.createElement("div");
      this.surfaceCanvasElm = document.createElement("canvas");
      this.blimpElm = document.createElement("div");

      this.element = this.scopeElm;

      this.currentSurface = this.shell.attachSurface(this.surfaceCanvasElm, this.scopeId, 0);
      this.currentBlimp = this.balloon.attachBlimp(this.blimpElm, this.scopeId, 0);

      $(this.scopeElm).addClass("scope");
      $(this.surfaceElm).addClass("surface");
      $(this.surfaceCanvasElm).addClass("surfaceCanvas");
      $(this.blimpElm).addClass("blimp");

      $(this.surfaceElm).append(this.surfaceCanvasElm);
      $(this.scopeElm).append(this.surfaceElm);
      $(this.scopeElm).append(this.blimpElm);
    }

    /*style:
    .scope {
      position: absolute;
      pointer-events: none;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .surface {
    }
    .surfaceCanvas {
      pointer-events: auto;
    }
    */


    surface(surfaceId: number|string): Surface{
      if(Number(surfaceId) < 0){
        $(this.surfaceElm).hide();
        return this.currentSurface;
      }
      if(!this.shell.hasSurface(this.scopeId, surfaceId)){
        console.warn("Scope#surface > ReferenceError: surfaceId", surfaceId, "is not defined")
        return this.currentSurface;
      }
      this.shell.detachSurface(this.surfaceCanvasElm);
      this.shell.attachSurface(this.surfaceCanvasElm, this.scopeId, surfaceId);
      $(this.scopeElm).width(this.surfaceCanvasElm.width);
      $(this.scopeElm).height(this.surfaceCanvasElm.height);
      $(this.surfaceElm).show();
      return this.currentSurface;
    }

    blimp(balloonId: number): BalloonSurface{
      return this.currentBlimp;
    }
  }
}
