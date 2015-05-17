declare module cuttlebone {
    class Balloon {
        directory: {
            [path: string]: ArrayBuffer;
        };
        descript: {
            [key: string]: string;
        };
        blimps: [HTMLDivElement, BalloonSurface][];
        constructor(directory: {
            [filepath: string]: ArrayBuffer;
        });
        load(): Promise<Balloon>;
        attachBlimp(div: HTMLDivElement, scopeId: number, surfaceId: number): BalloonSurface;
        detachBlimp(div: HTMLDivElement): void;
    }
}
