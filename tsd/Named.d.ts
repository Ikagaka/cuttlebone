/// <reference path="Shell.d.ts"/>
/// <reference path="Balloon.d.ts"/>
/// <reference path="Scope.d.ts"/>

declare module cuttlebone {
  export class Named {
    constructor(shell: Shell, balloon: Balloon);
    load(): Promise<Named>;
    destructor(): void;
    scope(scopeId?: number): Scope;
    openInputBox(id: string, placeHolder?: string): void;
    openCommunicateBox(placeHolder?: string): void;

    element: HTMLElement;
    scopes: Scope[];
  }
}
