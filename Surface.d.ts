interface Surface {
  element: HTMLCanvasElement;
  layers: { [is: number]: {
    type: string;
    surface: number;
    wait: string;
    x: number;
    y: number;
  }; };
  regions: { [key: string]: {
    is: number;
    name: string;
    type: string;
    left: number;
    top: number;
    right: number;
    bottom: number;
    coordinates: { x: number; y: number; }[];
  }; };
  animations: { [key: string]: {
      is: number;
      interval: string;
      option : string;
      patterns: { type: string; surface: number; wait: string; x: number; y: number; }[];
  }; };
  destructor(): void;
  render(): void;
  talk(): void;
  yenE(): void;
  play(  animationId: number, callback?: () => void): void;
  stop(  animationId: number): void;
  bind(  animationId: number): void;
  unbind(animationId: number): void;
}

declare var Surface: {
  new (canvas: HTMLCanvasElement, scopeId: number, surfaceName: string, surfaces: Surfaces): Surface;
  random(  callback: (callback: () => void) => void, probability: Number): void;
  periodic(callback: (callback: () => void) => void, sec: Number): void;
  always(  callback: (callback: () => void) => void): void;
  isHit(cnv: HTMLCanvasElement, x: number, y: number ): boolean;
}
