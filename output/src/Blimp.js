var cuttlebone;
(function (cuttlebone) {
    var Blimp = (function () {
        function Blimp(div, scopeId, surfaceId, balloon) {
            this.element = div;
            this.scopeId = scopeId;
            this.surfaceId = surfaceId;
            this.balloon = balloon;
        }
        Blimp.prototype.destructor = function () { };
        Blimp.prototype.anchorBegin = function () { };
        Blimp.prototype.anchorEnd = function () { };
        Blimp.prototype.choice = function () { };
        Blimp.prototype.choiceBegin = function () { };
        Blimp.prototype.choiceEnd = function () { };
        Blimp.prototype.talk = function () { };
        Blimp.prototype.talkraw = function () { };
        Blimp.prototype.marker = function () { };
        Blimp.prototype.clear = function () { };
        Blimp.prototype.br = function () { };
        Blimp.prototype.showWait = function () { };
        Blimp.prototype.font = function () { };
        Blimp.prototype._blimpTextCSS = function () { };
        Blimp.prototype._blimpClickableTextCSS = function () { };
        Blimp.prototype._initializeCurrentStyle = function () { };
        Blimp.prototype._getFontColor = function () { };
        return Blimp;
    })();
    cuttlebone.Blimp = Blimp;
})(cuttlebone || (cuttlebone = {}));
