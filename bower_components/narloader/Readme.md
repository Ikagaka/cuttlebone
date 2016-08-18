NarLoader - Nanika ARchive Loader
==========================

[Nanika ARchive](http://usada.sakura.vg/contents/install.html) (*.nar) loader

Installation
--------------------------

    npm install narloader

    bower install narloader

If you want to use Promise in a environment not having build-in Promise, 'bluebird' required.

Usage
--------------------------

    var NarLoader = require('narloader').NarLoader;
    var buffer = (nar data ArrayBuffer);
    var directory = NarLoader.loadFromBuffer(buffer);

or use this on the browsers ...

    <script src="jszip.js"></script>
    <script src="encoding.js"></script>
    <script src="bluebird.js"></script>
    <script src="NarLoader.js"></script>
    ...
    var buffer = (nar data ArrayBuffer);
    var directory = NarLoader.loadFromBuffer(buffer);

API
--------------------------

see [API Document](api.md)

License
--------------------------

This is released under [MIT License](http://narazaka.net/license/MIT?2014).
