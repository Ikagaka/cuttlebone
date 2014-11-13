

declare class Shell {
  constructor(nar:Nar);
  load(shell:string, callback:(err:any)=>void )=>void;
  getSurface(scopeId, surfaceId)->
}

declare module Shell {
  bufferToURL
  mergeSurfacesAndSurfacesFiles
  parseSurfaces(text:SurfacesTxtString):SurfacesYAMLObject
  parseSurfaces
}
