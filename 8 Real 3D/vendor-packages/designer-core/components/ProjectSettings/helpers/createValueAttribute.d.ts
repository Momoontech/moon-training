import { Wrapped } from '..';
import { CoreDesigner } from '../../../';
import { attributesType } from '../../../declarations';
export declare const createAttributes: <ValueType>(core: CoreDesigner, attrList: readonly attributesType[], projectAttributesDB: any) => Record<attributesType, Wrapped<ValueType>>;
