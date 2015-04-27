
declare class Named {
  constructor(shell: Shell, balloon: Balloon);
  load(): Promise<Named>;
  destructor(): void;
  scope(scopeId?: number): Scope;
  openInputBox(id: string, placeHolder?: string): void;
  openCommunicateBox(placeHolder?: string): void;

  element: HTMLElement;
  scopes: Scope[];
}
