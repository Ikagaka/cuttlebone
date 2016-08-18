# class NarLoader

All methods bellow is static methods.

## loadFromBuffer(buffer), loadFromURL(url), loadFromBlob(blob) {static method}

    NarLoader.loadFromBuffer(buffer).then(...);

load nar from ArrayBuffer, URL, Blob

### param

- **buffer** [ArrayBuffer] nar
- **url** [URL] nar
- **blob** [Blob] nar

### return

[NanikaDirectory] files in nar

## unzip(buffer) {static method}

internal

## wget(url, type) {static method}

internal

# class NanikaFile

    var nf = new NanikaFile(file);

file object that has jszip file object or ArrayBuffer

## constructor(file)

### param

- **file** [ArrayBuffer|ZipObject] file contents

## buffer()

    var arraybuf = nf.buffer();

first call: extract jszip file object to ArrayBuffer and cache it

second call: returns cache

### return

[ArrayBuffer] file content

## toString()

    var str = nf.toString();

get JavaScript native str by using encoding-japanese

### return

[string] file content

## valueOf()

same as buffer()

# class NanikaDirectory

    var nd = new NanikaDirectory({'path/to/file.txt': nanikafile, ...}, {has_install: true, has_descript: false});

directory object that has filepath hash of NanikaFile or NanikaFile's buffer type

## constructor(files, options)

### param

- **files** [Hash<string, NanikaFile|ArrayBuffer|ZipObject>] directory contents
- **options** [Hash] options

### options

- **has_install** [Boolean] if true: throw if dir does not have "install.txt"
- **has_descript** [Boolean] if true: throw if dir does not have "descript.txt"
- **do_throw_descript** [Boolean] if true: throw if parse was failed
- **is_root_dir** [Boolean] unwrap directory `ghostname/install.txt` -> `install.txt`

## files

Hash<string, NanikaFile>

## install

`install.txt`'s contents Hash<string, string> if exists

## descript

`descript.txt`'s contents Hash<string, string> if exists

## parse(options)

internal

## asArrayBuffer()

returns all files as ArrayBuffer

### return

[Hash<string, ArrayBuffer>] directory contents

## listChildren()

returns children list (like readdir)

### return

[Array] names of elements

## addDirectory(dir, options)

    var new_nd = nd.addDirectory(dir);

get new NanikaDirectory that has contents merged with given dir.

### param

- **dir** [NanikaDirectory|Hash<string, NanikaFile|ArrayBuffer|ZipObject>] directory path
- **options** [Hash] options for new NanikaDirectory

### return

[NanikaDirectory] new NanikaDirectory

## getDirectory(dirpath, options)

    var new_nd = nd.getDirectory('ghost/master', {has_descript: true});

get new NanikaDirectory that has contents in dirpath.

contents paths are trimed. ex. 'ghost/master/dict/events.kis' -> getDirectory('ghost/master') -> 'dict/events.kis'

### param

- **dirpath** [string] directory path
- **options** [Hash] options for new NanikaDirectory

### return

[NanikaDirectory] new NanikaDirectory

## wrapDirectory(dirpath, options)

    var new_nd = nd.wrapDirectory('ghost/master');

get new NanikaDirectory that has same contents as old but has prepended path.

contents paths are prepended. ex. 'dict/events.kis' -> wrapDirectory('ghost/master') -> 'ghost/master/dict/events.kis'

### param

- **dirpath** [string] directory path
- **options** [Hash] options for new NanikaDirectory

### return

[NanikaDirectory] new NanikaDirectory

## getElements(elempaths, options)

    var new_nd = nd.getElements(['ghost', 'shell']);

get new NanikaDirectory that has contents in elempaths (like filter).

contents paths are same as old.

### param

- **elempaths** [Array<string>] element paths
- **options** [Hash] options for new NanikaDirectory

### return

[NanikaDirectory] new NanikaDirectory

## removeElements(elempaths, options)

    var new_nd = nd.removeElements(['myballoon']);

get new NanikaDirectory that has contents excluding elempaths (like negative filter).

contents paths are same as old.

### param

- **elempaths** [Array<string>] element paths
- **options** [Hash] options for new NanikaDirectory

### return

[NanikaDirectory] new NanikaDirectory

## hasElement(elempath)

    var exists = nd.hasElement('shell/hoge');

the "exists"

### param

- **elempath** [string] element path

### return

[Boolean] true if exists else false

## pathToRegExp(path)

internal

## path.canonical(path)

internal

# class NarDescript

    var keyVal = NarDescript.parse(descript_str);

parse descript.txt format

## parse(text, do_throw)

### param

- **descript_str** [string] descript.txt format string
- **do_throw** [Boolean] if true: throw if parse was failed

### return

[{[key:string]: string;}] key-value Object

this will have "_errors" key if parse was failed
