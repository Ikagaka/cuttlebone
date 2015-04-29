/// <reference path="Shell.d.ts"/>
/// <reference path="Balloon.d.ts"/>
/// <reference path="Named.d.ts"/>

declare module cuttlebone {
    export class NamedManager {
    constructor();
    destructor(): void;
    materialize(shell: Shell, balloon: Balloon): number;
    vanish(namedId: number): void;
    named(namedId: number): Named;
    element: HTMLElement;
  }
}
