import { ItemType } from './helpers.js';

function isCabinetCatalog(c) {
    return c.itemType === ItemType.cabinet;
}
function isApplianceCatalog(c) {
    return c.itemType === ItemType.appliance;
}
function isWindowCatalog(c) {
    return c.itemType === ItemType.window;
}
function isGateCatalog(c) {
    return c.itemType === ItemType.gate;
}
function isUpperCabinetCatalog(c) {
    return c.cabinetType === 'upper';
}
function isBaseCabinetCatalog(c) {
    return c.cabinetType === 'base';
}
function isTallCabinetCatalog(c) {
    return c.cabinetType === 'tall';
}
function isUpperApplianceCatalog(c) {
    return c.applianceType === 'upper';
}
function isBaseApplianceCatalog(c) {
    return c.applianceType === 'base';
}
function isTallApplianceCatalog(c) {
    return c.applianceType === 'tall';
}
function isSinkApplianceCatalog(c) {
    return c.applianceType === 'sink';
}
function isCeilingApplianceCatalog(c) {
    return c.applianceType === 'ceiling';
}
function isReachInClosetCatalog(c) {
    return c.itemType === ItemType.reachInCloset;
}

export { isApplianceCatalog, isBaseApplianceCatalog, isBaseCabinetCatalog, isCabinetCatalog, isCeilingApplianceCatalog, isGateCatalog, isReachInClosetCatalog, isSinkApplianceCatalog, isTallApplianceCatalog, isTallCabinetCatalog, isUpperApplianceCatalog, isUpperCabinetCatalog, isWindowCatalog };
