

class SurfaceUtil

  constructor: (@cnv)->
    @ctx = @cnv.getContext("2d")

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

  overlayfast: (part, x, y)->
    @ctx.drawImage(part, x||0, y||0)
    @cnv
    undefined
  init: (cnv)->
    @cnv.width = cnv.width
    @cnv.height = cnv.height
    @overlayfast(cnv, 0, 0)
    undefined

  @clear = (cnv)->
    cnv.width = cnv.width
    undefined

  @copy = (cnv)->
    copy = document.createElement("canvas")
    ctx = copy.getContext("2d")
    copy.width  = cnv.width
    copy.height = cnv.height
    ctx.drawImage(cnv, 0, 0)
    copy



  @transImage = (img)->
    cnv = SurfaceUtil.copy(img)
    ctx = cnv.getContext("2d")
    imgdata = ctx.getImageData(0, 0, img.width, img.height)
    data = imgdata.data
    [r, g, b, a] = data
    i = 0
    if a isnt 0
      while i < data.length
        if r is data[i] and
           g is data[i+1] and
           b is data[i+2]
          data[i+3] = 0
        i += 4
    ctx.putImageData(imgdata, 0, 0)
    cnv

  @loadImage = (url, callback)->
    img = new Image
    img.src = url
    img.addEventListener "load", -> callback(null, img)
    img.addEventListener "error", (ev)-> console.error(ev); callback(ev.error, null)
    undefined
