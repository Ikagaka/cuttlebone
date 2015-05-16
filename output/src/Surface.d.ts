/// <reference path="SurfaceRender.d.ts" />
/// <reference path="SurfaceUtil.d.ts" />
/// <reference path="Shell.d.ts" />
declare module cuttlebone {
    class Surface {
        element: HTMLCanvasElement;
        scopeId: number;
        surfaceId: number;
        shell: Shell;
        surfaceTreeNode: SurfaceTreeNode;
        bufferCanvas: HTMLCanvasElement;
        bufRender: SurfaceRender;
        elmRender: SurfaceRender;
        destructed: boolean;
        layers: {
            [is: number]: SurfaceAnimationPattern;
        };
        stopFlags: {
            [key: string]: boolean;
        };
        talkCount: number;
        talkCounts: {
            [key: string]: number;
        };
        constructor(canvas: HTMLCanvasElement, scopeId: number, surfaceId: number, shell: Shell);
        initAnimations(): void;
        initAnimation(anim: SurfaceAnimation): void;
        updateBind(): void;
        initBind(anim: SurfaceAnimation): void;
        destructor(): void;
        render(): void;
        play(animationId: number, callback?: () => void): void;
        stop(animationId: number): void;
        talk(): void;
        yenE(): void;
        getRegion(offsetX: number, offsetY: number): {
            isHit: boolean;
            name: string;
        };
    }
}
