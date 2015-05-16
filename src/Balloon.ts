/// <reference path="./SurfaceUtil"/>
/// <reference path="./SurfaceRender"/>

module cuttlebone {

  export class Balloon {

    directory: { [path: string]: ArrayBuffer; };
    descript: { [key: string]: string; };
    blimps: [HTMLDivElement, Blimp][];

    constructor(directory: { [filepath: string]: ArrayBuffer; }) {
      this.directory = directory;
      this.descript = {};
      this.blimps = [];
    }

    load(): Promise<Balloon> {
      return Promise.resolve(this);
    }

    attachBlimp(div: HTMLDivElement, scopeId: number, surfaceId: number): Blimp{
      var blimp = new Blimp(div, scopeId, surfaceId, this);
      this.blimps.push([div, blimp]);
      return blimp;
    }

    detachBlimp(div: HTMLDivElement): void{
      var tuple = this.blimps.filter((tuple)=> tuple[0] === div)[0];
      if(!tuple) return;
      tuple[1].destructor();
      this.blimps.splice(this.blimps.indexOf(tuple), 1);
    }

  }

}
