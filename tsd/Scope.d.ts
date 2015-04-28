/// <reference path="Shell.d.ts"/>
/// <reference path="Balloon.d.ts"/>

declare module cuttlebone {
    export class Scope {
    constructor(scopeId: number, shell: Shell, balloon: Balloon);
    surface(surfaceId?: number): Surface;
    blimp(blimpId?: number): {
      talk: (text: string) => void;
      clear: () => void;
      br: () => void;
      choice: (text: string, id: string) => void;
      anchorBegin: (id: string) => void;
      anchorEnd: () => void;
    };
    element: HTMLElement;
  }
}
