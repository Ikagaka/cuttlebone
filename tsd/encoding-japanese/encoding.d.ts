// https://github.com/polygonplanet/encoding.js/blob/master/README_ja.md
declare module Encoding {
  /*
  function orders();
  function detect();
  */
  function convert(
    data: number[]|Uint8Array|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|ArrayBuffer,
    to_encoding: string,
    from_encoding: string): number[];
    function convert(
      data: number[]|Uint8Array|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|ArrayBuffer,
      options: {
        to: string,
        from: string,
        type: string,
        bom: boolean}): number[];
  function convert(data: string, to_encoding: string, from_encoding: string): string;
  function convert(
    data: string,
    options: {to: string,
      from: string,
      type: string,
      bom: boolean}): string;
  /*
  function urlEncode();
  function urlDecode();
  */
  function codeToString(
    data: number[]|Uint8Array|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|ArrayBuffer
  ): string;
  /*
  function stringToCode();
  function toHankakuCase();
  function toZenkakuCase();
  function toHiraganaCase();
  function toKatakanaCase();
  function toHankanaCase();
  function toZenkanaCase();
  function toHankakuSpace();
  function toZenkakuSpace();
  */
}
