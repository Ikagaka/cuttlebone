

interface SurfacesTxt {
  charset: string;
  descript: {
    version: number;
    maxwidth: number;
    "collision-sort": string;
    "animation-sort": string;
  };
  surfaces: { [key: string]: SurfaceDefinition; };
  aliases: { sakura: { [name: string]: number[]; }; };
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


interface SurfaceDefinition {
  is: number;
  characters: { sakura: string; };
  points: {
    centerx: number;
    centery: number;
    kinoko: { centerx: number; centery: number; },
    basepos: { x: number; y: number; };
  };
  balloons: {
    sakura: { offsetx: number; offsety: number; };
    offsetx: number;
    offsety: number;
  };
  regions: { [key: string]: SurfaceRegion; };
  animations: { [key: string]: SurfaceAnimation; };
  baseSurface: HTMLCanvasElement;
  base: string[];
}

interface SurfaceLayerObject {
  is: number;
  canvas: HTMLCanvasElement;
  type: string;
  x: number;
  y: number;
}

interface SurfaceAnimation {
  is: number;
  interval: string;
  option: string;
  patterns: SurfaceAnimationPattern[];
}

interface SurfaceAnimationPattern {
  type: string;
  surface: number;
  wait: string;
  x: number;
  y: number;
}

interface SurfaceRegion {
  is: number;
  name: string;
  type: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  radius: number;
  center_x: number;
  center_y: number;
  coordinates: { x: number; y: number; }[];
}



declare module SurfacesTxt2Yaml {
  export function txt_to_data(text: string, option?: {}): SurfacesTxt;
}
