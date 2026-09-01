import { DEG2RAD } from './math/constants.js';
import { Matrix4 } from './math/Matrix4.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';

const m4 = new Matrix4();
/**
 * Builds a projection matrix from camera data.
 *
 * When `out` is supplied the result is written directly into it (no allocation).
 * When omitted the internal singleton is cloned for backward compatibility.
 */
const getProjectionMatrix = (cameraData, out) => {
    if ('left' in cameraData) {
        const dx = (cameraData.right - cameraData.left) / (2 * cameraData.zoom);
        const dy = (cameraData.top - cameraData.bottom) / (2 * cameraData.zoom);
        const cx = (cameraData.right + cameraData.left) / 2;
        const cy = (cameraData.top + cameraData.bottom) / 2;
        let left = cx - dx;
        let right = cx + dx;
        let top = cy + dy;
        let bottom = cy - dy;
        // if (this.view !== null && this.view.enabled) {
        //   const scaleW = (this.right - this.left) / this.view.fullWidth / this.zoom;
        //   const scaleH = (this.top - this.bottom) / this.view.fullHeight / this.zoom;
        //   left += scaleW * this.view.offsetX;
        //   right = left + scaleW * this.view.width;
        //   top -= scaleH * this.view.offsetY;
        //   bottom = top - scaleH * this.view.height;
        // }
        m4.makeOrthographic(left, right, top, bottom, cameraData.near, cameraData.far
        /* this.coordinateSystem, this.reversedDepth*/
        );
    }
    else {
        const near = cameraData.near;
        let top = (near * Math.tan(DEG2RAD * 0.5 * cameraData.fov)) / cameraData.zoom;
        let height = 2 * top;
        let width = cameraData.aspect * height;
        let left = -0.5 * width;
        // const view = cameraData.view;
        // if (cameraData.view !== null && cameraData.view.enabled) {
        //   const fullWidth = view.fullWidth,
        //     fullHeight = view.fullHeight;
        //   left += (view.offsetX * width) / fullWidth;
        //   top -= (view.offsetY * height) / fullHeight;
        //   width *= view.width / fullWidth;
        //   height *= view.height / fullHeight;
        // }
        // const skew = this.filmOffset;
        // if (skew !== 0) left += (near * skew) / this.getFilmWidth();
        m4.makePerspective(left, left + width, top, top - height, near, cameraData.far /* this.coordinateSystem, this.reversedDepth*/);
    }
    return out ? out.copy(m4) : m4.clone();
};

export { getProjectionMatrix };
