interface Balloons {
  sakura:     {descript: Descript; canvas: HTMLCanvasElement; }[];
  kero:       {descript: Descript; canvas: HTMLCanvasElement; }[];
  communicate:{descript: Descript; canvas: HTMLCanvasElement; }[];
  online:     {descript: Descript; canvas: HTMLCanvasElement; }[];
  arrow:      {descript: Descript; canvas: HTMLCanvasElement; }[];
  sstp:       {descript: Descript; canvas: HTMLCanvasElement; }[];
  thumbnail:  {descript: Descript; canvas: HTMLCanvasElement; }[];
}

declare class Balloon {
  constructor(directory: { [filePath: string]: ArrayBuffer; });
  load(): Promise<Balloon>;
  attachSurface(canvas: HTMLCanvasElement, scopeId: number, surfaceId: number): BalloonSurface;
  descript: { [key: string]: string; };
  balloons: Balloons;
}
