import { ValueOptionsType } from '.';
import { IValue } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
/**
 * Resolve a `Value<T>`'s stored `IValue<T>` — plain literal, interpreted token array, or catalog
 * path — into a concrete `T`. Formula-bearing branches (`isInterpretedValue`, `isCatalogPath`)
 * dereference through `core`; the plain-literal branch ignores it. `Value<T>` guarantees a real
 * core at construction, so this function never receives `null`. Coreless callers (e.g. the
 * standalone paperspace state) must use `CoreSignal<T>` instead — that primitive skips this path
 * entirely.
 */
declare const calculateValue: <T>(value: IValue<T>, core: CoreDesigner, options: ValueOptionsType) => T;
export { calculateValue };
