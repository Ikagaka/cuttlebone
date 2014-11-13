
declare module Nar {
  function loadFromBuffer(buffer: ArrayBuffer, callback: (error: any) => void ): void;
  function loadFromURL(src: string, callback: (error: any) => void ): void;
  function unzip(buffer: ArrayBuffer): any;
  function convert(buffer: ArrayBuffer): string;
  function wget(url: string, responseType: string, callback: (error: any, response: any) => void): void;
  function parseDescript(text: string): { [key: string]: string; };
}

declare module "nar" {
  export = Nar;
}
