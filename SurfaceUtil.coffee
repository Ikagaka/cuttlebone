

class SurfaceUtil
  # new SurfaceUtil(cnv:HTMLCanvasElement):SurfaceUtil
  constructor: (@cnv)->
    @ctx = @cnv.getContext("2d")
  # SurfaceUtil#composeElements([{canvas:HTMLCanvasElement, type:String, x:Number, y:Number}]):void
  composeElements: (elements)->
    if elements.length is 0 then return
    {canvas, type, x, y} = elements[0]
    offsetX = offsetY = 0
    switch type
      when "base"        then @overlayfast(canvas, offsetX,     offsetY)
      when "overlay"     then @overlayfast(canvas, offsetX + x, offsetY + y)
      when "overlayfast" then @overlayfast(canvas, offsetX + x, offsetY + y)
      when "replace"     then @overlayfast(canvas, offsetX + x, offsetY + y)
      when "move"
        offsetX = x
        offsetY = y
        copyed = SurfaceUtil.copy(@cnv)
        SurfaceUtil.clear(@cnv)
        @overlayfast(copyed, offsetX, offsetY)
      else console.error(elements[0]); @cnv
    @composeElements(elements.slice(1))
    undefined
  # SurfaceUtil#overlayfast(part:HTMLCanvasElement, x:Number|null, y:Number|null):void
  overlayfast: (part, x, y)->
    @ctx.drawImage(part, x||0, y||0)
    @cnv
    undefined
  init: (cnv)->
    @cnv.width = cnv.width
    @cnv.height = cnv.height
    @overlayfast(cnv, 0, 0)
    undefined
  # SurfaceUtil.clear(cnv:HTMLCanvasElement):HTMLCanvasElement
  @clear = (cnv)->
    cnv.width = cnv.width
    undefined
  # SurfaceUtil.copy(cnv:HTMLCanvasElement):HTMLCanvasElement
  @copy = (cnv)->
    copy = document.createElement("canvas")
    ctx = copy.getContext("2d")
    copy.width  = cnv.width
    copy.height = cnv.height
    ctx.drawImage(cnv, 0, 0)
    copy
