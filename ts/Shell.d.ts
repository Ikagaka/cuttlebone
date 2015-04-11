interface Surfaces {
  charset: string;
  descript: {
    version: number;
    maxwidth: number;
    "collision-sort": string;
    "animation-sort": string;
  };
  surfaces: {
    [key: string]: {
      is: number;
      characters: { sakura: string; };
      points: {
        centerx: number;
        centery: number;
        kinoko: { centerx: number; centery: number; };
        basepos:{ x: number; y: number; };
      };
      balloons: {
        sakura: { offsetx: number; offsety: number;};
        offsetx: number;
        offsety: number;
      };
      regions: {
        [key: string]: {
          is: number;
          name: string;
          type: string;
          left: number;
          top: number;
          right: number;
          bottom: number;
          coordinates: {x: number; y: number;}[];
        };
      };
      animations: {
        [key: string]: {
          is: number;
          interval: string;
          option : string;
          patterns: { type: string; surface: number; wait: string; x: number; y: number; }[];
        };
      };
      base: string[];
      baseSurface: HTMLCanvasElement;
    };
  };
  aliases: {
    sakura: {
      [name: string]: number[];
    };
  };
  regions: {
    sakura: {
      bust: {
        tooltip: string;
        cursor: {
          mouseup: string;
          mousedown: string;
        };
      };
    };
  };
}

interface Shell {
  load(): Promise<Shell>;
  attatchSurface(canvas: HTMLCanvasElement, scopeId: number, surfaceId: number): Surface;
  descript: { [key: string]: string; };
  surfaces: Surfaces;
}

declare var Shell: {
  new (directory: { [filepath: string]: ArrayBuffer; }): Shell;
  SurfaceUtil: SurfaceUtil
}
