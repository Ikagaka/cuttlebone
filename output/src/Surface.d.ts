/// <reference path="SurfaceRender.d.ts" />
/// <reference path="SurfaceUtil.d.ts" />
declare module cuttlebone {
    class Surface {
        element: HTMLCanvasElement;
        scopeId: number;
        surfaceId: number;
        surfaceName: string;
        surfaces: {
            [key: string]: SurfaceDefinition;
        };
        isRegionVisible: boolean;
        baseSurface: HTMLCanvasElement;
        regions: {
            [key: string]: SurfaceRegion;
        };
        animations: {
            [key: string]: SurfaceAnimation;
        };
        bufferCanvas: HTMLCanvasElement;
        stopFlags: {
            [key: string]: boolean;
        };
        layers: {
            [is: number]: SurfaceAnimationPattern;
        };
        destructed: boolean;
        talkCount: number;
        talkCounts: {
            [key: string]: number;
        };
        isPointerEventsShimed: boolean;
        lastEventType: string;
        constructor(canvas: HTMLCanvasElement, scopeId: number, surfaceId: number, surfaceName: string, surfaces: {
            [key: string]: SurfaceDefinition;
        });
        destructor(): void;
        render(): void;
        talk(): void;
        yenE(): void;
        play(animationId: number, callback?: () => void): void;
        stop(animationId: number): void;
        bind(animationId: number): void;
        unbind(animationId: number): void;
        processMouseEvent(ev: any, eventName: string, callback: (ev: any) => void): void;
    }
}
