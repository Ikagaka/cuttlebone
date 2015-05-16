/// <reference path="../../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts" />
/// <reference path="../../tsd/encoding-japanese/encoding.d.ts" />
declare module cuttlebone {
    interface SurfaceTreeNode {
        base: HTMLCanvasElement;
        elements: SurfaceLayerObject[];
        collisions: SurfaceRegion[];
        animations: SurfaceAnimation[];
    }
    class Shell {
        directory: {
            [path: string]: ArrayBuffer;
        };
        descript: {
            [key: string]: string;
        };
        surfaces: [HTMLCanvasElement, Surface][];
        surfacesTxt: SurfacesTxt;
        surfaceTree: SurfaceTreeNode[];
        canvasCache: {
            [key: string]: HTMLCanvasElement;
        };
        bindgroup: boolean[];
        isRegionVisible: boolean;
        constructor(directory: {
            [filepath: string]: ArrayBuffer;
        });
        load(): Promise<Shell>;
        loadDescript(): Promise<Shell>;
        loadBindGroup(): Promise<Shell>;
        loadSurfacesTxt(): Promise<Shell>;
        loadSurfaceTable(): Promise<Shell>;
        loadSurfacePNG(): Promise<Shell>;
        loadElements(): Promise<Shell>;
        loadCollisions(): Promise<Shell>;
        loadAnimations(): Promise<Shell>;
        hasFile(filename: string): boolean;
        getPNGFromDirectory(filename: string): Promise<HTMLCanvasElement>;
        attachSurface(canvas: HTMLCanvasElement, scopeId: number, surfaceId: number | string): Surface;
        detachSurface(canvas: HTMLCanvasElement): void;
        hasSurface(scopeId: number, surfaceId: number | string): boolean;
        bind(animationId: number): void;
        unbind(animationId: number): void;
        render(): void;
    }
}
