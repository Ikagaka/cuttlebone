declare class BalloonSurface {
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
