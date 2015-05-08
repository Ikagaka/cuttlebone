/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="SurfaceUtil.d.ts" />
/// <reference path="SurfaceRender.d.ts" />
/// <reference path="../../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts" />
declare module cuttlebone {
    class SurfaceCacheManager {
        surfaces: SurfacesTxt;
        directory: {
            [filepath: string]: ArrayBuffer;
        };
        baseSurfaceImages: {
            [key: number]: HTMLImageElement;
        };
        baseSurfaceCaches: {
            [key: number]: HTMLCanvasElement;
        };
        constructor(surfaces: SurfacesTxt, directory: {
            [filepath: string]: ArrayBuffer;
        });
        load(): Promise<SurfaceCacheManager>;
        isCached(surfaceId: number): boolean;
        getSurfaceFilename(surfaceId: number): string;
        getPNAFilename(filename: string): string;
        getSurfaceDefinition(surfaceId: number): SurfaceDefinition;
        fetchSurfaceImage(filename: string): Promise<SurfaceRender>;
        fetchBaseSurface(surfaceId: number): Promise<HTMLCanvasElement>;
    }
}
