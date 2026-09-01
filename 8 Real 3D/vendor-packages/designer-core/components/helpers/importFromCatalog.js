import { getMonitor } from '../../helpers/monitor.js';

function importFromCatalog(
// Only `storage` is used — accepting the structural subset lets the legacy
// converter (which has no live core) call this with a bare storage context.
core, catalogPath) {
    const arr = catalogPath.split('/');
    let res = core.storage.get('catalog');
    for (let i = 0; i < arr.length; i += 1) {
        res = res[arr[i]];
        if (res === undefined) {
            const str = `Catalog path not found: ${catalogPath}, exact key: ${arr[i]}`;
            getMonitor().warn(str);
            throw new Error(str);
        }
    }
    return Array.isArray(res) ? JSON.parse(JSON.stringify(res)) : JSON.parse(JSON.stringify({ ...res, catalogPath }));
}

export { importFromCatalog };
