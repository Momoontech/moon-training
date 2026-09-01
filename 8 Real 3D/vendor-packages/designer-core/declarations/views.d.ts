import type { IViewsBySystem } from './PaperSpace';
export declare enum ViewType {
    designer3D = "designer3D",
    designerUI = "designerUI",
    calculation = "calculation"
}
export type View = {
    dispose(): void;
    setViewIndex: (index: number) => void;
    viewType: ViewType;
    /**
     * Optional capability: render per-system paperspace views for the whole scene.
     *
     * Implementers (typically 3D renderers like `AreaDesigner3D`) decide whether to provide it —
     * designer-core only declares the shape and dispatches through
     * `CoreDesigner.generatePaperSpaceViews`. The declaration is TYPE-LEVEL only: designer-core
     * has no runtime dependency on any renderer. Same pattern as `dispose` / `setViewIndex` —
     * designer-core knows the signature it may call, doesn't know how it's implemented.
     *
     * Non-3D views (e.g., `designerUI`) don't need to declare this — the optional marker lets them
     * satisfy the `View` contract without a rendering-specific method. A renderer that DOES provide
     * it (see `Designer3DView` in `@moon/designer3d`) declares it as required.
     */
    createAllViews?: (opts?: {
        maxSize?: number;
        wallDistance?: number;
    }) => Promise<IViewsBySystem>;
};
