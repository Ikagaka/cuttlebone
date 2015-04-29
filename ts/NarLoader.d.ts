// https://github.com/Ikagaka/NarLoader

declare module NarLoader {
  function loadFromBuffer(buffer: ArrayBuffer): Promise<NanikaDirectory>;
  function loadFromURL(url: string): Promise<NanikaDirectory>;
  function loadFromBlob(blob: Blob): Promise<NanikaDirectory>;
}

declare class NanikaFile {
  constructor(file: ArrayBuffer);
  //constructor(file: JSZipObject);
  toString(): string;
  buffer(): ArrayBuffer;
  valueOf(): ArrayBuffer;
}

declare class NanikaDirectory {
  constructor(
    files: {[path_to_file: string]: NanikaFile;},
    options?: {has_install?: boolean, has_descript?: boolean});
  files: {[path_to_file: string]: NanikaFile;};
  install: {[key: string]: string;};
  descript: {[key: string]: string;};
  asArrayBuffer(): {[path_to_file: string]: ArrayBuffer;};
  listChildren(): string[];
  addDirectory(dir: NanikaDirectory, options?: {has_descript: boolean}): NanikaDirectory;
  getDirectory(dirpath: string, options?: {has_descript: boolean}): NanikaDirectory;
  wrapDirectory(dirpath: string, options?: {has_descript: boolean}): NanikaDirectory;
  getElements(elempaths: string[], options?: {has_descript: boolean}): NanikaDirectory;
  removeElements(elmpaths: string[], options?: {has_descript: boolean}): NanikaDirectory;
  hasElement(elempath: string[]): boolean;
}
