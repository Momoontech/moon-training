import { CoreDesigner } from '../../';
import { InterpretedShape, IShapeValue } from '../../declarations';
import { ValueOptionsType } from '../Value';
declare const calculateShape: (value: IShapeValue, core: CoreDesigner, options: ValueOptionsType) => InterpretedShape;
export { calculateShape };
