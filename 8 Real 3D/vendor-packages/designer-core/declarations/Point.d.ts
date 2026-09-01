import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { V2Axes } from './InterpretedLine';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
export type PointConfig = NodeSharedConfig & {
    type: NodeType.Point;
    exists?: number;
    parent: UUID;
    children: UUID[];
    position: Record<V2Axes, IValue<number>>;
    attributes: IAttributes;
    /**
     * Persisted **explicit** position-lock for this corner. When `true`,
     * the corner cannot be moved — direct point drag, perpendicular wall
     * drag of either adjacent segment, and length / angle edits that
     * would move this endpoint are all blocked by the effective-lock
     * helpers (`getEffectivePointPositionLocked`).
     *
     * Optional on the persisted shape so projects saved before the field
     * existed still deserialise — at runtime the value is materialised
     * into `point.properties` (see {@link IPointPropertyNamesValues}) by
     * the `withProperties` builder step, defaulting to `undefined` when
     * absent. The effective helper treats `undefined` and `false`
     * identically (only the literal `true` flips the flag), so the
     * persisted shape round-trips exactly.
     *
     * **Mutation channel.** Read through `point.properties.get('isLocked')?.get()`
     * and write through `SetNodePropertyValueCommand(pointId, 'isLocked',
     * next)` — the preferred command for `properties` writes. The
     * underlying `Value<boolean>` instance is also reachable through
     * `SetValueCommand`, but new callers should go through the
     * property-level command so the same channel covers serialization and
     * undo/redo for every property name. Never write `.set()` directly
     * outside a command. The corresponding "effective" position-locked state —
     * which **also flips to `true` when ANY adjacent segment is locked**
     * (one anchored wall is enough to remove the corner's translational
     * DoF) — is derived by `getEffectivePointPositionLocked`. Consumers
     * (RoomPoint drag gate, DimensionsUI direction-disabled wiring,
     * AnglesUI commit gate) read the **effective** value, not this raw
     * flag.
     */
    isLocked?: boolean;
    /**
     * Persisted **explicit** angle-lock for this corner. When `true`, the
     * angle between the two adjacent segments cannot be edited via the
     * angle badge (`AngularDimension`, rendered by `FloorPlanUI/AnglesUI`).
     *
     * Stored alongside `isLocked` in `point.properties` (see
     * {@link IPointPropertyNamesValues}). Mutated through
     * `SetNodePropertyValueCommand(pointId, 'isAngleLocked', next)` — the
     * preferred channel for `properties` writes. By the toolbar UX
     * contract, the "Lock Angle" button writes BOTH `isAngleLocked` and
     * `isLocked` inside a single `runCommandsAsTransaction` (one command
     * per flag) so the locked angle's vertex never drifts. The two flags
     * stay split on the persisted shape so a future "lock angle but allow
     * drag" mode can toggle them independently without re-architecting
     * the storage layer.
     *
     * Optional on the persisted shape; runtime materialises into the same
     * `properties` Map. The "effective" angle-locked state is derived by
     * `getEffectivePointAngleLocked`, which additionally treats a corner
     * with two locked adjacent segments as angle-locked even when the raw
     * flag is `false` — see that helper's JSDoc for the rationale.
     */
    isAngleLocked?: boolean;
};
export type PointCatalogConfig = Catalog<PointConfig>;
