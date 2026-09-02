import { CoreDesigner, CoreMode, GeneralViewMode, CreateNodeFromCatalogCommand, generateId, SetMaterialsClosetSetValueCommand, SetValueCommand, SetNodeSignalCommand, applyMultiClosetSections, MultiClosetComponentType, replaceSectionContent, canReplaceSectionContent, scoreOptionAgainstTarget, SetSelectedNodeIdCommand } from '@moon/designer-core';
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

  // Live "Layout" wiring for the training hub's Customize panel (the
  // Layouts sub-tab under Hardware: Shelves, Long Hang, Double Hang,
  // Bottom Hang + Shelves, 3 Drawer + Shelves, 4 Drawer + Shelves).
  //
  // Unlike materials (applyClosetMaterial above), this is a real structural
  // change - it reconfigures the placed multiCloset's section layout via
  // applyMultiClosetSections, the same first-class, undoable helper the
  // real app uses to redo an already-placed closet's sections at runtime.
  // `desired` is a partial MultiClosetStackNumbers bag (0-5 desire scale per
  // category - see MultiClosetComponentType) - missing categories default
  // to 0, so the parent page only needs to name the categories it actually
  // wants emphasized. `sectionOptions` (loaded above from the real
  // multiClosetSectionOptions.json) is reused as-is - it is the same
  // self-describing option list the initial fillMultiClosets() call above
  // already planned against, so no separate catalog lookup is needed here.
  window.applyClosetLayout = function applyClosetLayout(desired) {
    try {
      const full = {
        [MultiClosetComponentType.multiClosetShelfPart]: 0,
        [MultiClosetComponentType.multiClosetShortHangerPart]: 0,
        [MultiClosetComponentType.multiClosetLongHangerPart]: 0,
        [MultiClosetComponentType.multiClosetDrawerPart]: 0,
        ...desired
      };
      const plan = applyMultiClosetSections(core, closetId, full, sectionOptions);
      view.requestRender();
      return !!(plan && plan.sections && plan.sections.length);
    } catch (err) {
      console.error('applyClosetLayout failed', err);
      return false;
    }
  };

  // ── Live "drag one Layout card onto one section" wiring ──
  //
  // The Layouts click flow above (applyClosetLayout) always re-plans the
  // WHOLE closet from a desire vector via applyMultiClosetSections. Mo asked
  // for something narrower: drag a Layout card and drop it onto ONE section
  // of the 3D view, changing just that section. The real engine already has
  // the building block for this - replaceSectionContent (helpers/replace/
  // replaceNode.d.ts), whose own doc comment says it "mirrors Phase B of
  // applyMultiClosetSections (and dragOnPart)" - dragOnPart being the real
  // app's own in-scene drag-a-catalog-item-onto-a-part handler (found by
  // grepping the vendored designer3d bundle for that name, per this
  // session's investigation). That handler confirmed two things empirically
  // (live core/node inspection, not assumed from the .d.ts):
  //   1. A "section" is a Part node with partType 'multiClosetSection' - it
  //      has its own `.content` array (the shelf/hanger/drawer pieces
  //      actually rendered). replaceSectionContent's `nodeId` is THIS
  //      node's id, not the content piece under it.
  //   2. A raycast from the camera never lands on the section's own Part
  //      directly (it isn't rendered) - it lands on one of its CONTENT
  //      meshes (a shelf board, a hanging garment Model, an Edgebanding
  //      strip, a Panel...). Resolving "which section is under this pixel"
  //      means raycasting via the engine's own view.handlers.doRaycast
  //      (confirmed to be real and exposed on the live AreaDesigner3D
  //      instance - no need to build a separate Three.js Raycaster/camera
  //      lookup), then walking the HIT NODE's `.parent` chain up through
  //      the core node graph until a multiClosetSection Part is found.
  //
  // Section ids are NOT stable across a boot - confirmed empirically by
  // booting this app twice and diffing core.nodes: fillMultiClosets() calls
  // applyMultiClosetSections(), whose Phase A creates each section via
  // CreateNodeFromCatalogCommand(..., generateId(), ...) - a fresh id every
  // time, since this is a brand-new CoreDesigner instance on every page
  // load. So per-section state can't key off the section's own id; it keys
  // off its LEFT-TO-RIGHT INDEX in the closet's own `sections` array
  // instead, which is deterministic for the same fill inputs (same system,
  // same available width, same options).
  const sectionIndexOf = (sectionId) => core.nodes.get(closetId).sections.get().indexOf(sectionId);
  const sectionIdAt = (index) => core.nodes.get(closetId).sections.get()[index];

  // Walk the RENDER graph (Three.js Object3D ancestors) from a raycast hit
  // back to the core node id it represents. Mirrors designer3d's own
  // `getNodeGroup`/hit-resolution logic exactly (instanced meshes resolve
  // via the view's instanceManagers, everything else via the nearest
  // ancestor flagged `isNodeGroup`, whose `.uuid` is the node id) - found by
  // reading designer3d/index.js's dragCatalogNode/dragExistingNode, not
  // reinvented.
  function resolveNodeIdFromObject(object, instanceId) {
    if (object && object.isInstancedMesh) {
      const manager = view.instanceManagers && view.instanceManagers.getManager(object);
      const nodeView = manager && manager.getNodeView(instanceId || 0);
      return (nodeView && nodeView.id) || null;
    }
    let cur = object;
    while (cur) {
      if (cur.isNodeGroup) return cur.uuid;
      cur = cur.parent;
    }
    return null;
  }

  // Walk the CORE node graph (parent chain, not the render graph) from
  // whatever got hit (a shelf board, a hanging Model, an Edgebanding strip,
  // ...) up to its owning multiClosetSection Part. Bounded so a stray hit
  // outside the closet (a wall, the floor) can never loop or throw.
  function resolveSectionIdFromNodeId(nodeId, maxHops = 40) {
    let cur = nodeId;
    for (let i = 0; i < maxHops && cur; i += 1) {
      const node = core.nodes.get(cur);
      if (!node) return null;
      if (node.type === 'Part' && node.partType && node.partType.get() === 'multiClosetSection') return cur;
      if (cur === closetId) return null;
      const parentId = node.parent && node.parent.get ? node.parent.get() : null;
      if (!parentId || parentId === cur) return null;
      cur = parentId;
    }
    return null;
  }

  // clientX/clientY are CSS pixels in THIS iframe's own viewport (the
  // parent page is responsible for translating its pointer event's
  // clientX/clientY into this frame's coordinate space by subtracting the
  // iframe element's own getBoundingClientRect() offset - same-origin, so a
  // plain function call carries these across with no postMessage needed,
  // same pattern as applyClosetMaterial/applyClosetLayout above).
  function sectionAtPoint(clientX, clientY) {
    const rect = view.canvas.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
    const intersects = view.handlers.doRaycast({ x: ndcX, y: ndcY });
    if (!intersects || !intersects.length) return null;
    const hit = intersects[0];
    if (!hit.object || !hit.object.isMesh) return null;
    const nodeId = resolveNodeIdFromObject(hit.object, hit.instanceId);
    if (!nodeId) return null;
    const sectionId = resolveSectionIdFromNodeId(nodeId);
    if (!sectionId) return null;
    const sectionIndex = sectionIndexOf(sectionId);
    if (sectionIndex < 0) return null;
    return { sectionId, sectionIndex };
  }
  window.getClosetSectionAtPoint = function getClosetSectionAtPoint(clientX, clientY) {
    return sectionAtPoint(clientX, clientY);
  };

  // Hover feedback while dragging (nice-to-have, cheap given the above):
  // reuse the engine's OWN real selection outline - the same one a normal
  // click already renders - rather than hand-rolling a highlight mesh.
  // `addToHistory: false` keeps this out of undo, matching how the real
  // dragOnPart/dragOnItem handlers select their drop target live.
  let preDragSelection;
  window.previewClosetSectionAtPoint = function previewClosetSectionAtPoint(clientX, clientY) {
    if (preDragSelection === undefined) preDragSelection = core.selectedNodeId.get();
    const hit = clientX == null ? null : sectionAtPoint(clientX, clientY);
    core.runCommandsAsTransaction(new SetSelectedNodeIdCommand(hit ? hit.sectionId : null), '', false);
    view.requestRender();
    return hit ? hit.sectionIndex : -1;
  };
  window.endClosetSectionPreview = function endClosetSectionPreview() {
    if (preDragSelection !== undefined) {
      core.runCommandsAsTransaction(new SetSelectedNodeIdCommand(preDragSelection), '', false);
      preDragSelection = undefined;
      view.requestRender();
    }
  };

  // Same 0-5 desire-vector shape as applyClosetLayout's `desired` above,
  // reused as-is rather than inventing a second per-item vector table. Only
  // difference: instead of feeding the whole-closet planner
  // (applyMultiClosetSections), this picks the SINGLE real content option
  // from `sectionOptions` whose own category profile is the closest match -
  // via scoreOptionAgainstTarget, the exact same L2-normalized distance
  // metric the real closest-fit planner uses internally (exported by
  // @moon/designer-core, not reimplemented here) - and applies it to one
  // section via replaceSectionContent, never touching the planner.
  function bestFitContentPath(desired) {
    const full = {
      [MultiClosetComponentType.multiClosetShelfPart]: 0,
      [MultiClosetComponentType.multiClosetShortHangerPart]: 0,
      [MultiClosetComponentType.multiClosetLongHangerPart]: 0,
      [MultiClosetComponentType.multiClosetDrawerPart]: 0,
      ...desired
    };
    let best = null;
    let bestScore = Infinity;
    for (const option of sectionOptions) {
      const score = scoreOptionAgainstTarget(option, full);
      if (score < bestScore) {
        bestScore = score;
        best = option;
      }
    }
    return best ? best.path : null;
  }

  // THE call for "apply this Layout to section N" - by stable index, not by
  // (unstable) node id. Used both for a live drop (dropLayoutOnSection
  // below, once it has resolved a screen point to an index) and for
  // re-asserting a previously-dropped section's content after something
  // else re-renders the closet (see index.html's apply3DClosetSectionOverrides).
  window.applyClosetSectionLayout = function applyClosetSectionLayout(sectionIndex, desired) {
    try {
      const sectionId = sectionIdAt(sectionIndex);
      if (!sectionId || !canReplaceSectionContent(core, sectionId)) return false;
      const path = bestFitContentPath(desired);
      if (!path) return false;
      const commands = replaceSectionContent(core, sectionId, path);
      if (!commands) return false;
      core.runCommandsAsTransaction(commands, 'apply-closet-section-layout', true);
      view.requestRender();
      return true;
    } catch (err) {
      console.error('applyClosetSectionLayout failed', err);
      return false;
    }
  };

  // THE drop call - clientX/clientY are this iframe's own viewport
  // coordinates (see sectionAtPoint above). Returns which section (if any)
  // was actually changed so the parent page can persist/charge for exactly
  // that section, never the whole closet.
  window.dropLayoutOnSection = function dropLayoutOnSection(clientX, clientY, desired) {
    try {
      const hit = sectionAtPoint(clientX, clientY);
      if (!hit) return { ok: false, reason: 'no-section' };
      const applied = window.applyClosetSectionLayout(hit.sectionIndex, desired);
      return applied
        ? { ok: true, sectionIndex: hit.sectionIndex }
        : { ok: false, reason: 'blocked', sectionIndex: hit.sectionIndex };
    } catch (err) {
      console.error('dropLayoutOnSection failed', err);
      return { ok: false, reason: 'error' };
    }
  };

  setStatus('');
  statusEl.style.display = 'none';
} catch (err) {
  setStatus('Could not load the 3D closet.');
  console.error(err);
}
