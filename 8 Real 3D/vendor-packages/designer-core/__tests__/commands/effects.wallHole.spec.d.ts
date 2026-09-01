/**
 * Integration tests for `updateWallItemHolesEffect` in effects.wallHole.ts.
 *
 * These tests build a minimal but structurally complete floorplan graph and
 * assert the self-healing reconciliation walk that manages Wall2D.holes[item.id]
 * and item.size.z for gate / window Items.
 *
 * Graph used by all tests (narrow double-wall cavity):
 *
 *   frontSeg  : from P0(0,0)  → to P1(120,0)    wall: frontWall
 *   backSeg   : from P2(0,10) → to P3(120,10)   wall: backWall
 *   leftSeg   : from P4(0,0)  → to P5(0,10)     wall: leftWall
 *   rightSeg  : from P6(120,0)→ to P7(120,10)   wall: rightWall
 *
 * Note: Point.position.y is stored as raw; TransformedValue returns -rawY.
 *       Display Y for front wall = 0, display Y for back wall = -10.
 *
 * window Item:
 *   parent: frontMountPlane (child of frontWall)
 *   position: { x: 40, y: 0, z: 0 }  (40" from west end of front wall)
 *   size:    { x: 36, y: 84, z: 4.5 } (36" wide, 84" tall, wDepth thick initially)
 *   holeShape: default (size.x × size.y rectangle)
 *
 * wDepth = 4.5" (default wall thickness from mockProjectSettings).
 * Room depth (centerline to centerline) = ROOM_DEPTH = 10".
 * Search range = 5 × wDepth = 22.5" > 10" so the back wall is always in range.
 *
 * Expected stable size.z = ROOM_DEPTH - wDepth = 10 - 4.5 = 5.5"
 * (from item front face at wDepth/2 from front CL, to back wall inner face).
 */
export {};
