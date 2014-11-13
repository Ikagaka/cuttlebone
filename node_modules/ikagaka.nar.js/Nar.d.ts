
declare module Nar {
  function loadFromBuffer(buffer: ArrayBuffer, callback: (error: any, tree: any) => void ): void; // unstable
  function loadFromURL(src: string, callback: (error: any, tree: any) => void ): void; // unstable
  function unzip(buffer: ArrayBuffer): any; // stable
  function convert(buffer: ArrayBuffer): string; // unstable
  function wget(url: string, responseType: string, callback: (error: any, response: any) => void): void; // stable
  function parseDescript(text: string): { [key: string]: string; }; // stable
}

declare module "nar" {
  export = Nar;
}
