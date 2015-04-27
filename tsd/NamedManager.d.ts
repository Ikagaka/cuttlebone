
declare class NamedManager {
  constructor();
  destructor(): void;
  materialize(shell: Shell, balloon: Balloon): number;
  vanish(namedId: number): void;
  named(namedId: number): Named;
  element: HTMLElement;
}
