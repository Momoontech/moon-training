import { defaultTextureSize } from './defaultTextureSize.js';

const fallbackMaterial = {
    lookId: 'unknown',
    _id: 'unknown',
    thickness: 0.625,
    sheetLength: defaultTextureSize,
    sheetWidth: defaultTextureSize,
    lossFactor: 0,
    label: '',
    value: '',
    subCategory1: 'Sheet Stock',
    subCategory2: 'Melamine'
};

export { fallbackMaterial as default };
