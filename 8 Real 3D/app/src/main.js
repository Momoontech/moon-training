import { CoreDesigner, CoreMode, GeneralViewMode, CreateNodeFromCatalogCommand, generateId, SetMaterialsClosetSetValueCommand, SetValueCommand, SetNodeSignalCommand } from '@moon/designer-core';
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

  // Live material wiring for the training hub's Customize panel. The parent
  // page (index.html) calls this directly on this iframe's contentWindow -
  // it's same-origin (a relative path within the same site), so no
  // postMessage plumbing is needed, just a plain function call.
  //
  // materialType/materialId must be REAL @moon/designer-core values (see
  // app/data/materials.json and index.html's CLOSET_FINISH_3D table for
  // where they come from - never invented placeholders).
  //
  // Three different real mechanisms apply depending on materialType,
  // confirmed by inspecting a live core instance rather than assumed from
  // the .d.ts alone:
  // - CLOSET_SET_TYPES: keys of a closet "materials set" (body/door/etc).
  //   This scene's placed closet Item never assigns itself its own
  //   materialsSet (it's ''), so it always reads the project's one default
  //   closet set - that's the set these commands target.
  // - PROJECT_VALUE_TYPES: simple project-wide values (wall/floor/etc).
  //   Every Wall2D/Floor2D node in this scene has an empty materialId, so
  //   they all fall back to this project-wide value - changing it is
  //   enough to change what's rendered.
  // - everything else (pole/rod/hook/...): despite appearing in
  //   `materialVariants`, these are NOT resolved from project settings -
  //   designer-core's getDefaultMaterialId() hard-codes them to "the first
  //   item in that category's catalog array" and ignores project settings
  //   entirely. The only real way to change one is per placed Model node,
  //   via SetNodeSignalCommand on that node's own materialId.
  const CLOSET_SET_TYPES = ['body', 'door', 'finishEnd', 'melamineBox', 'edgebanding', 'visiblePanel', 'filler', 'toeKick', 'topValance', 'bottomValance', 'visibleCarcass', 'bodyEdgebanding', 'doorEdgebanding', 'finishEndEdgebanding', 'topValanceEdgebanding', 'bottomValanceEdgebanding', 'fillerEdgebanding', 'visibleCarcassEdgebanding', 'melamineBoxEdgebanding'];
  const PROJECT_VALUE_TYPES = ['wall', 'floor', 'ceiling', 'countertop', 'crownMolding', 'windowFrame', 'gateFrame', 'drawerSystem', 'laminate', 'pull', 'extrusionPull', 'mirror', 'glass', 'windowGlass', 'doorGlass', 'leg'];

  window.applyClosetMaterial = function applyClosetMaterial(materialType, materialId) {
    try {
      const cmds = [];
      if (CLOSET_SET_TYPES.includes(materialType)) {
        const setId = core.projectSettings.materials.get('defaultClosetMaterialsSet').get();
        cmds.push(new SetMaterialsClosetSetValueCommand(setId, materialType, materialId, false));
      } else if (PROJECT_VALUE_TYPES.includes(materialType)) {
        cmds.push(new SetValueCommand(core.projectSettings.materials.get(materialType), materialId));
      } else {
        for (const [nodeId, node] of core.nodes) {
          if (node.type === 'Model' && node.modelType === materialType) {
            cmds.push(new SetNodeSignalCommand(nodeId, 'materialId', materialId));
          }
        }
      }
      if (!cmds.length) {
        console.warn('applyClosetMaterial: nothing in this scene matches materialType', materialType);
        return false;
      }
      core.runCommandsAsTransaction(cmds, 'apply-closet-material', false);
      // Same reason as the initial view.requestRender() above - this runs
      // outside any pointer/selection interaction, so ask for a fresh frame
      // explicitly rather than trusting one was already scheduled.
      view.requestRender();
      return true;
    } catch (err) {
      console.error('applyClosetMaterial failed', err);
      return false;
    }
  };

  setStatus('');
  statusEl.style.display = 'none';
} catch (err) {
  setStatus('Could not load the 3D closet.');
  console.error(err);
}
