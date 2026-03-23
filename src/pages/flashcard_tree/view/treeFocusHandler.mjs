export class TreeFocusHandler {
    constructor(containerRef) {
        this.containerRef = containerRef;

        //Transforms are applied ontop of the existing frame
        this.currentFocusOffset = { x: 0, y: 0 };
        this.currentZoom = 1;

        this.chasingFocusOffset = { x: 0, y: 0 };
        this.chasingZoom = 1;

        this.isPanning = false;
        this.panCursorStartPos = { x: 0, y: 0 };

        this.initialRect = null;
        this.contentBounds = null;

        this.applyTransforms();
    }

    //Ensure the user can't pan outside the SVG content area
    clampOffset() {
        if (!this.initialRect || !this.contentBounds) return;
        const { left, right, top, bottom } = this.contentBounds;
        const W = this.initialRect.width;
        const H = this.initialRect.height;
        const k = this.currentZoom;
        this.currentFocusOffset = {
            x: Math.max(W - k * right, Math.min(-k * left, this.currentFocusOffset.x)),
            y: Math.max(H - k * bottom, Math.min(-k * top, this.currentFocusOffset.y)),
        };
    }

    applyTransforms() {
        const container = this.containerRef.current;
        //Bake the transform into a matrix (2x2 + affine component)
        const matrix = [
            //Unfortunatley eslint forces this spacing
            this.currentZoom,
            0,
            0,
            0,

            0,
            this.currentZoom,
            0,
            0,

            0,
            0,
            1,
            0,

            this.currentFocusOffset.x,
            this.currentFocusOffset.y,
            0,
            1,
        ];
        container.style.transform = `matrix3d(${matrix.join(",")})`;
    }

    onMouseDown(e) {
        this.isPanning = true;
        this.panCursorStartPos = { x: e.clientX, y: e.clientY };
    }

    onMouseMove(e) {
        if (!this.isPanning) return;
        const cursorCurrentPos = { x: e.clientX, y: e.clientY };
        const cursorDelta = {
            x: cursorCurrentPos.x - this.panCursorStartPos.x,
            y: cursorCurrentPos.y - this.panCursorStartPos.y,
        };
        this.currentFocusOffset = {
            x: this.currentFocusOffset.x + cursorDelta.x,
            y: this.currentFocusOffset.y + cursorDelta.y,
        };
        this.panCursorStartPos = cursorCurrentPos;
        this.clampOffset();
        this.applyTransforms();
    }

    onMouseUp(e) {
        this.isPanning = false;
    }

    onWheel(e) {
        e.preventDefault();
        // Cursor relative to container's natural (untransformed) top-left
        const cursorX = e.clientX - this.initialRect.left;
        const cursorY = e.clientY - this.initialRect.top;

        const zoomSensitivity = 0.001;
        const zoomDelta = 1 - e.deltaY * zoomSensitivity;
        const newZoom = Math.max(1, this.currentZoom * zoomDelta);

        //Calculate the new focus offset to keep the zoom centered on the cursor
        this.currentFocusOffset = {
            x: cursorX - (cursorX - this.currentFocusOffset.x) * (newZoom / this.currentZoom),
            y: cursorY - (cursorY - this.currentFocusOffset.y) * (newZoom / this.currentZoom),
        };
        this.currentZoom = newZoom;
        this.clampOffset();
        this.applyTransforms();
    }

    bind() {
        const container = this.containerRef.current;

        // Cache natural rect before any transforms; anchor scale to top-left
        this.initialRect = container.getBoundingClientRect();
        container.style.transformOrigin = '0 0';

        // Cache the SVG's visual bounds (after its own CSS transform) relative to container
        const contentEl = container.firstElementChild;
        const contentRect = contentEl ? contentEl.getBoundingClientRect() : this.initialRect;
        this.contentBounds = {
            left: contentRect.left - this.initialRect.left,
            right: contentRect.right - this.initialRect.left,
            top: contentRect.top - this.initialRect.top,
            bottom: contentRect.bottom - this.initialRect.top,
        };

        this.boundOnMouseDown = this.onMouseDown.bind(this);
        this.boundOnMouseMove = this.onMouseMove.bind(this);
        this.boundOnMouseUp = this.onMouseUp.bind(this);
        this.boundOnWheel = this.onWheel.bind(this);

        container?.addEventListener("mousedown", this.boundOnMouseDown);
        window.addEventListener("mousemove", this.boundOnMouseMove);
        window.addEventListener("mouseup", this.boundOnMouseUp);
        container?.addEventListener("wheel", this.boundOnWheel, {
            passive: false,
        });
    }

    unbind() {
        const container = this.containerRef.current;
        container?.removeEventListener("mousedown", this.boundOnMouseDown);
        window.removeEventListener("mousemove", this.boundOnMouseMove);
        window.removeEventListener("mouseup", this.boundOnMouseUp);
        container?.removeEventListener("wheel", this.boundOnWheel);
    }
}
