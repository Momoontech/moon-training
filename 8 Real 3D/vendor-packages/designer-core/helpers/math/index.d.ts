/**
 * Custom math library to replace Three.js math classes
 * All classes are independent of Three.js and only depend on each other
 */
export { Box2 } from './Box2';
export { Box3 } from './Box3';
export { clamp } from './clamp';
export { DEG2RAD, RAD2DEG } from './constants';
export { DefaultEulerOrder, Euler, type EulerOrder } from './Euler';
export { isCCW } from './isCCW';
export { Line3 } from './Line3';
export { Matrix3 } from './Matrix3';
export { Matrix4 } from './Matrix4';
export { Plane } from './Plane';
export { isPointInPolygon } from './plane/isPointInPolygon';
export { pointToSegmentDistance } from './plane/pointToSegmentDistance';
export { projectUnitBoxToBox3 } from './plane/projectUnitBoxToBox3';
export { convexHull2D, projectUnitBoxToFootprint2D } from './plane/projectUnitBoxToFootprint2D';
export { raycastClearances2D, type PlanarBlocker2D, type PlanarPoint2D, type RayClearance2D, type RayClearances2D } from './plane/raycastClearances2D';
export { segmentsIntersect } from './plane/segmentsIntersect';
export { segmentsIntersection } from './plane/segmentsIntersection';
export { segmentToSegmentDistance } from './plane/segmentToSegmentDistance';
export { UNIT_BOX_CORNERS } from './plane/unitBoxCorners';
export { Quaternion } from './Quaternion';
export { Ray } from './Ray';
export { Sphere } from './Sphere';
export { Triangle } from './Triangle';
export { Vector2 } from './Vector2';
export { Vector3 } from './Vector3';
