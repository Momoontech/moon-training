import { Node } from '..';
import { IAttributes } from '../../../declarations';
import { Floorplan } from '../components/Floorplan';
export declare const getNodeAttributesConfig: (node: Exclude<Node, Floorplan>) => IAttributes;
