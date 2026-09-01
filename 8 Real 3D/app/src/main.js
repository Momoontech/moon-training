import { CoreDesigner, CoreMode, GeneralViewMode, CreateNodeFromCatalogCommand, generateId } from '@moon/designer-core';
import { AreaDesigner3D } from '@moon/designer3d';

import sectionOptions from '../data/multiClosetSectionOptions.json';
import appData from '../data/appdata.json';
import settings from '../data/settings.json';
import systems from '../data/systems.json';
import areaHeader from '../data/areaHeader.json';
import materials from '../data/materials.json';
import looks from '../data/looks.json';
import catalogClassifications from '../data/catalogClassifications.json';
import masterCatalog from '../data/master.json';
import privateCatalog from '../data/private.json';
import models3D from '../data/models3D.json';

const statusEl = document.getElementById('status');
const setStatus = (msg) => { statusEl.textContent = msg; };

setStatus('Loading your closet…');

try {
  const root = document.getElementById('root');

  const core = new CoreDesigner(
    CoreMode.web,
    'training-room',
    root,
    appData,
    looks,
    materials,
    settings,
    models3D,
    catalogClassifications,
    privateCatalog,
    masterCatalog,
    {},
    areaHeader,
    null,
    systems
  );

  core.generalViewMode.set(GeneralViewMode.editor3D);

  const view = new AreaDesigner3D(root, core);
  core.addView(view);

  // Real system data (see systems.json): a MultiCloset system's shelves/
  // drawers/hangers are planned from the "needs" of the system it belongs
  // to - Office Desk System asks for double-hang, drawers, long-hang and
  // shelves, so fillMultiClosets() below has a real, varied brief to plan
  // against rather than an empty one.
  const REAL_SYSTEM_ID = '531ec37c-9ea4-4d8a-8492-dbf79014dc38';

  // ReachInCloset/MultiCloset catalog entries declare `mountTypes:['wall']`
  // - they attach to a WALL's MountPlane, not the floor's (a floor
  // MountPlane's local frame is not plain floor-plan x/y - confirmed by
  // testing). The MountPlane for a wall is the node created immediately
  // after that Wall2D in the node map's real insertion order.
  let wallMountPlaneId = null;
  for (const [id, node] of core.nodes) {
    if (node.type === 'Wall2D') {
      const ids = [...core.nodes.keys()];
      wallMountPlaneId = ids[ids.indexOf(id) + 1];
      break;
    }
  }

  const closetId = generateId();
  const cmd = new CreateNodeFromCatalogCommand('master/Products/Cabinets/MultiClosetTallProduct', wallMountPlaneId, closetId, {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    system: REAL_SYSTEM_ID
  });
  core.runCommandsAsTransaction([cmd], 'place-multi-closet', false);

  core.setSectionOptionsFromJSON(sectionOptions);
  core.fillMultiClosets();

  // AreaDesigner3D is "render on demand" - our nodes were created outside
  // any pointer/selection interaction, so ask for a fresh frame explicitly
  // rather than trusting one was already scheduled.
  view.requestRender();

  window.__core = core;
  window.__view = view;

  setStatus('');
  statusEl.style.display = 'none';
} catch (err) {
  setStatus('Could not load the 3D closet.');
  console.error(err);
}
