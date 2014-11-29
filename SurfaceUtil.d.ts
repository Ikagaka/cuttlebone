interface SurfaceUtil {
  ctx: CanvasRenderingContext2D;
  composeElements(layers: {is: number; canvas: HTMLCanvasElement; type: string; x: number; y: number}[]): void;
  base(       part: HTMLCanvasElement, x: number, y: number): void;
  overlayfast(part: HTMLCanvasElement, x: number, y: number): void;
  interpolate(part: HTMLCanvasElement, x: number, y: number): void;
  replace(    part: HTMLCanvasElement, x: number, y: number): void;
  init(cnv: HTMLCanvasElement): void;
}

declare var SurfaceUtil: {
  new (cnv: HTMLCanvasElement): SurfaceUtil;
  choice<T>(arr: T[]): T;
  clear(cnv: HTMLCanvasElement): void;
  copy(cnv: HTMLCanvasElement): HTMLCanvasElement;
  transImage(img: HTMLImageElement): HTMLCanvasElement;
  loadImage(url: string, callback: (error: any, img: HTMLImageElement) => void ): void;
}
