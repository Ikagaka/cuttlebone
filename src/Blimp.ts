

module cuttlebone {
  export class Blimp {

    element: HTMLDivElement;
    scopeId: number;
    surfaceId: number;
    balloon: Balloon;

    constructor(div: HTMLDivElement, scopeId: number, surfaceId: number, balloon: Balloon) {

      this.element = div;
      this.scopeId = scopeId;
      this.surfaceId = surfaceId;
      this.balloon = balloon;

    }

    destructor(): void{}

    anchorBegin(): void{}
    anchorEnd(): void{}
    choice(): void{}
    choiceBegin():void{}
    choiceEnd(): void{}
    talk(): void{}
    talkraw(): void{}
    marker(): void{}
    clear(): void{}
    br(): void{}
    showWait(): void{}
    font(): void{}
    _blimpTextCSS(): void{}
    _blimpClickableTextCSS(): void{}
    _initializeCurrentStyle(): void{}
    _getFontColor(): void{}
    
  }
}
