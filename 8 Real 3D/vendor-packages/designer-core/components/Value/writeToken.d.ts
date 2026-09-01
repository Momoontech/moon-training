import { type ValueOptionsType } from '.';
import type { InterpretedLine } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import type { Command } from '../commands/core/Command';
export type WritableRawValue = string | number | boolean | {
    x: number;
    y: number;
}[];
type HandlerContext = {
    core: CoreDesigner;
    options: ValueOptionsType;
};
/**
 * Symmetric write counterpart to `evaluateToken`. Returns `null` for read-only
 * token types (operator/constant/position/formula). Callers wrap the result in
 * `core.runCommandsAsTransaction` for undo/redo integrity.
 */
export declare const writeToken: (token: InterpretedLine, raw: WritableRawValue, { core, options }: HandlerContext) => Command | null;
export {};
