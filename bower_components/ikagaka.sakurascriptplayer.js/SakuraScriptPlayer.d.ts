
declare class SakuraScriptPlayer {
  constructor(named: Named);
  play(sakuraScript: string, listener?: {[event_name: string]: () => void;}): void;
  break(): void;
  on( event:  string, callback:  () => void): SakuraScriptPlayer;
  off(event?: string, callback?: () => void): SakuraScriptPlayer;
  trigger(      event: string, ...args: any[]): SakuraScriptPlayer;
  trigger_local(event: string, listener?: {[event_name: string]: () => void;}, ...args: any[]): SakuraScriptPlayer;
  trigger_all(  event: string, listener?: {[event_name: string]: () => void;}, ...args: any[]): SakuraScriptPlayer;
  breakTid: number;
  playing: boolean;
}
