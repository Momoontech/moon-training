import { Item } from '../../components/Node/components/Item';
import { ItemCalculation } from '../../declarations/calculation';
import { CoreDesigner } from '../../designer-core';
/**
 * Item → an `ItemCalculation` shell with empty category buckets. The buckets are
 * filled during grouping from the item's collected child `calculations`.
 *
 * `height` subtracts the toe-kick when the item has no separate toe-kick
 * present, matching vesta.
 *
 * TODO(phase2): `catalogPath`, `interiorOptions` and `extra.accessory` fan-out
 * are not sourced — those live on the vesta serialized config, not on the core
 * instantiated Item.
 */
export declare const getItemCalculation: (_core: CoreDesigner, node: Item) => ItemCalculation;
