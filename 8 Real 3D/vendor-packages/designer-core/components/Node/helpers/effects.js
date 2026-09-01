import { untracked } from '@preact/signals-react';
import SetNodeAttributeValueCommand from '../../commands/SetNodeAttributeValueCommand.js';
import SetNodeParentCommand from '../../commands/SetNodeParentCommand.js';
import SetNodeVector3Command from '../../commands/SetNodeVector3Command.js';
import SetNodeVectorComponentCommand from '../../commands/SetNodeVectorComponentCommand.js';
import '../../../declarations/Attributes.js';
import { ContainerLayout } from '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import { FreeBoxContainerType } from '../../../declarations/FreeBoxContainer.js';
import { ItemType, MountType } from '../../../declarations/helpers.js';
import { V3Axes, VectorProps } from '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import '../../../declarations/Model.js';
import '../../../declarations/Molding.js';
import { NodeType } from '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import { MultiClosetStackType, PartType, SeparatorType } from '../../../declarations/Part.js';
import { MultiClosetsJointType } from '../../../declarations/ProjectSettings.js';
import '../../../declarations/Segment.js';
import { CeilingType } from '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';
import { computeFacetMountPose } from '../../../helpers/cathedral/facetMountPose.js';
import getAttributeValue from '../../../helpers/getAttributeValue.js';
import getExistsRecursively from '../../../helpers/getExistsRecursively.js';
import getMaterialById from '../../../helpers/getMaterialById.js';
import getMaterialsSetById from '../../../helpers/getMaterialsSetById.js';
import getPropertyValue from '../../../helpers/getPropertyValue.js';
import { generateId } from '../../../helpers/id.js';
import { getMonitor } from '../../../helpers/monitor.js';
import { nextRoomBasePoints } from '../../../helpers/roomBasePoints.js';
import { isMultiClosetStackPartType } from '../../../helpers/multiCloset/contentPartTypes.js';
import { layoutMultiClosetFreeBoxContainer, tileStackBands, shelfCompartmentInset } from '../../../helpers/multiCloset/stackLayout.js';
import { computeSegmentLength } from '../../../helpers/segmentMeasurements.js';
import { CreateNodeCommand, RemoveNodeCommand } from '../../commands/CreateNodeCommand.js';
import CreateNodeFromCatalogCommand from '../../commands/CreateNodeFromCatalogCommand.js';
import ReplaceNodeFromCatalogCommand from '../../commands/ReplaceNodeFromCatalogCommand.js';
import { defaultFirstHoleOffset, step32mm } from '../components/FreeBoxContainer/index.js';
import getRoomSegment from './getRoomSegment.js';
import { registerEffects } from './effectRegistry.js';
import getContentPart from './getContent.js';
import getNode from './getNode.js';
import getOptionalNode from './getOptionalNode.js';
import getOptionalParentItem from './getOptionalParentItem.js';
import getParentCarcass from './getParentCarcass.js';
import getParentItem from './getParentItem.js';
import getPart from './getPart.js';
import getWall2D from './getWall2D.js';

// Reactive effects for nodes Value changing
const getSectionSeparatorType = (section) => {
    const content = section.content.get();
    if (content.length < 1)
        return SeparatorType.Tall;
    const contentSeparatorType = getContentPart(section.core, content[0]).separatorType?.get();
    if (!contentSeparatorType)
        return SeparatorType.Tall;
    return contentSeparatorType;
};
const getSeparatorType = (left, right) => {
    switch (left) {
        case SeparatorType.Tall:
            return SeparatorType.Tall;
        case SeparatorType.Base:
            return [SeparatorType.Upper, SeparatorType.BaseUpper].includes(right) ? SeparatorType.BaseUpper : right;
        case SeparatorType.Upper:
            return [SeparatorType.Base, SeparatorType.BaseUpper].includes(right) ? SeparatorType.BaseUpper : right;
        case SeparatorType.BaseUpper:
            return right === SeparatorType.Tall ? SeparatorType.Tall : SeparatorType.BaseUpper;
        default:
            getMonitor().warn('getSeparatorType: unknown separator types: ', left, right);
            return SeparatorType.Tall;
    }
};
const getCatalogSeparator = (separatorType) => {
    switch (separatorType) {
        case SeparatorType.Tall:
            return 'private/Parts/General/MultiClosetSeparatorTall';
        case SeparatorType.Base:
            return 'private/Parts/General/MultiClosetSeparatorBase';
        case SeparatorType.Upper:
            return 'private/Parts/General/MultiClosetSeparatorUpper';
        case SeparatorType.BaseUpper:
            return 'private/Parts/General/MultiClosetSeparatorBaseUpper';
        default:
            getMonitor().warn('getCatalogSeparator: unknown separator type: ', separatorType);
            return 'private/Parts/General/MultiClosetSeparatorTall';
    }
};
/**
 * The 1-D span (start + length) a separator must cover to bracket its adjacent
 * sections on one axis: it starts at the lowest section start and spans to the
 * highest section end. Applied per axis — depth (z, top view) and height (y,
 * front view, where sections can differ in height). Pure — unit-tested; returns
 * `null` when there are no neighbouring sections (endpoint separator with a gap).
 */
const separatorSpan = (segments) => {
    if (segments.length === 0)
        return null;
    const start = Math.min(...segments.map((s) => s.start));
    const end = Math.max(...segments.map((s) => s.start + s.size));
    return { start, span: end - start };
};
const updateMultiClosetItemLayoutEffect = (node) => {
    if (node.type !== NodeType.Item || node.itemType.get() !== 'multiCloset') {
        return undefined;
    }
    try {
        let sections = node.sections.get().map((id) => getPart(node.core, id));
        let separators = node.separators.get().map((id) => getPart(node.core, id));
        // Early exit if no components yet - effect will re-run when components are added
        if (sections.length === 0 || separators.length < 2) {
            // console.warn('updateMultiClosetItemLayoutEffect: early exit on node: ', node.id);
            return undefined;
        }
        const commands = [];
        // Add separators to match sections count
        //index 1 means to add always as not first and not last separator
        if (sections.length >= separators.length) {
            for (let i = 0; i < sections.length - separators.length + 1; i += 1) {
                commands.push(new CreateNodeFromCatalogCommand('private/Parts/General/MultiClosetSeparatorTall', node.id, generateId(), {}, 'separators', separators.length - 1));
            }
        }
        // Remove separators to match sections count
        //index 1 means to add always as not first and not last separator
        if (sections.length < separators.length - 1) {
            const toRemove = separators.length - sections.length - 1;
            for (let i = 0; i < toRemove; i += 1) {
                // separators[i + 1] gives distinct ids for each command; never remove
                // the first or last separator (those are the endpoints).
                commands.push(new RemoveNodeCommand(separators[i + 1].id));
            }
        }
        node.core.runCommandsAsTransaction(commands, '', false);
        // adjust separators size and content
        commands.length = 0;
        sections = node.sections.get().map((id) => getPart(node.core, id));
        separators = node.separators.get().map((id) => getPart(node.core, id));
        for (let i = 0; i < separators.length; i += 1) {
            // const separator = separators[i];
            const leftSectionSeparatorType = i === 0 ? null : getSectionSeparatorType(sections[i - 1]);
            const rightSectionSeparatorType = i === separators.length - 1 ? null : getSectionSeparatorType(sections[i]);
            const separatorType = getSeparatorType((leftSectionSeparatorType || rightSectionSeparatorType), (rightSectionSeparatorType || leftSectionSeparatorType));
            const currentType = separators[i].separatorType?.get();
            if (currentType === separatorType)
                continue; // already correct, skip
            const separatorCatalog = getCatalogSeparator(separatorType);
            commands.push(new ReplaceNodeFromCatalogCommand(separators[i].id, separatorCatalog));
        }
        node.core.runCommandsAsTransaction(commands, '', false);
        // adjust sections size and content
        commands.length = 0;
        separators = node.separators.get().map((id) => getPart(node.core, id));
        const overallSize = node.size.x.get();
        // Reserve empty space on each side that abuts a neighbor multiCloset, so it
        // is not available for sections/separators. Two independent reservations per
        // side, each driven by a neighbor id + its width attribute (catalog-defined,
        // missing attribute => 0 => no reservation):
        //  - "bridge"      → side neighbor  (Left/RightMultiClosetNeighborId, Left/RightBridgeWidth)
        //  - "corner joint" → joint neighbor (Left/RightJointMultiClosetNeighborId, Left/RightCornerJointWidth)
        // Reading the neighbor ids + attributes here keeps the layout reactive to
        // neighbor changes. Both can be present on the same side, so they sum.
        const hasLeftNeighbor = !!getPropertyValue(node, 'LeftMultiClosetNeighborId');
        const leftNeighborNode = hasLeftNeighbor
            ? getOptionalNode(node.core, getPropertyValue(node, 'LeftMultiClosetNeighborId'))
            : undefined;
        // Reverse joint link + joint type on the left neighbor's facing (right) side.
        // The neighbor id is a `properties` entry; JointType is an attribute.
        const leftNeighborRightJoint = leftNeighborNode
            ? getPropertyValue(leftNeighborNode, 'RightJointMultiClosetNeighborId')
            : undefined;
        const leftNeighborRightJointType = leftNeighborNode
            ? getAttributeValue(leftNeighborNode, 'RightJointType')
            : undefined;
        const hasRightNeighbor = !!getPropertyValue(node, 'RightMultiClosetNeighborId');
        const rightNeighborNode = hasRightNeighbor
            ? getOptionalNode(node.core, getPropertyValue(node, 'RightMultiClosetNeighborId'))
            : undefined;
        const rightNeighborLeftJoint = rightNeighborNode
            ? getPropertyValue(rightNeighborNode, 'LeftJointMultiClosetNeighborId')
            : undefined;
        const rightNeighborLeftJointType = rightNeighborNode
            ? getAttributeValue(rightNeighborNode, 'LeftJointType')
            : undefined;
        const hasLeftJointNeighbor = !!getPropertyValue(node, 'LeftJointMultiClosetNeighborId');
        const hasRightJointNeighbor = !!getPropertyValue(node, 'RightJointMultiClosetNeighborId');
        // This node's own per-side joint type (defaults to project MultiClosetsJointType).
        const leftJointType = getAttributeValue(node, 'LeftJointType');
        const rightJointType = getAttributeValue(node, 'RightJointType');
        // Bridge gap: reserved when the side neighbor is jointed back to us AND that
        // neighbor's facing-side joint type is "bridge" — mirrors the bridge part's
        // catalog `exists` (Left ← left neighbor RightJointType, Right ← right neighbor LeftJointType).
        const leftBridge = leftNeighborRightJoint && leftNeighborRightJointType === MultiClosetsJointType.bridge
            ? getAttributeValue(node, 'LeftBridgeWidth')
            : 0;
        const rightBridge = rightNeighborLeftJoint && rightNeighborLeftJointType === MultiClosetsJointType.bridge
            ? getAttributeValue(node, 'RightBridgeWidth')
            : 0;
        // Corner-joint gap: reserved when a joint neighbor sits on that side AND this
        // node's own same-side joint type is a corner variant (cornerCorner/cornerDiagonal).
        const leftCornerJoint = hasLeftJointNeighbor &&
            (leftJointType === MultiClosetsJointType.cornerCorner || leftJointType === MultiClosetsJointType.cornerDiagonal)
            ? getAttributeValue(node, 'LeftCornerJointWidth')
            : 0;
        const rightCornerJoint = hasRightJointNeighbor &&
            (rightJointType === MultiClosetsJointType.cornerCorner || rightJointType === MultiClosetsJointType.cornerDiagonal)
            ? getAttributeValue(node, 'RightCornerJointWidth')
            : 0;
        const leftReserved = leftBridge + leftCornerJoint;
        const rightReserved = rightBridge + rightCornerJoint;
        const availableSize = overallSize - leftReserved - rightReserved;
        let sumSize = 0;
        let autoSizeCount = 0;
        for (let i = 0; i < sections.length; i += 1) {
            const isAutoSized = sections[i].isAutoSized?.get() ?? 0;
            if (isAutoSized) {
                autoSizeCount += 1;
            }
            else {
                sumSize += sections[i].size[V3Axes.x].get();
            }
        }
        for (let i = 0; i < separators.length; i += 1) {
            sumSize += separators[i].size[V3Axes.x].get();
        }
        // Guard the two pathological inputs. `autoSizeCount === 0` (no balance section — every
        // section pinned) would divide by zero; the value is never consumed in that case (the write
        // below is gated on the section's own `isAutoSized`), but it must not be NaN/Infinity either.
        // A NEGATIVE remainder means the pinned widths already exceed the closet — e.g. a lock-blind
        // plan, or locked sections surviving a recount — and writing it would render inverted
        // geometry, so the balance section collapses to 0 instead. `promoteMultiClosetAutoCarrier`
        // is what keeps the count from reaching 0 on the write paths that strip the flag.
        const autoSize = autoSizeCount > 0 ? Math.max(0, (availableSize - sumSize) / autoSizeCount) : 0;
        let sizeCounter = leftReserved;
        for (let i = 0; i < separators.length; i += 1) {
            //separator first
            commands.push(new SetNodeVectorComponentCommand(separators[i].id, VectorProps.position, V3Axes.x, sizeCounter));
            sizeCounter += separators[i].size[V3Axes.x].get();
            //section second if exists
            if (sections[i]) {
                commands.push(new SetNodeVectorComponentCommand(sections[i].id, VectorProps.position, V3Axes.x, sizeCounter));
                const isAutoSized = sections[i].isAutoSized?.get() ?? 0;
                if (isAutoSized) {
                    commands.push(new SetNodeVectorComponentCommand(sections[i].id, VectorProps.size, V3Axes.x, autoSize));
                    sizeCounter += autoSize;
                }
                else {
                    sizeCounter += sections[i].size[V3Axes.x].get();
                }
            }
        }
        // Per-edge resizability is not computed here — handle visibility is answered on demand by
        // the resize-capability oracle (`getResizableSides` in Node/helpers).
        // Adjust each separator to span its adjacent sections on BOTH the depth (z)
        // and height (y) axes: it starts at the lower edge and spans to the farther
        // edge, so the separator between two sections is as deep as the deeper
        // neighbour (top view) AND as tall as the taller neighbour (front /
        // wall-elevation view, where sections can differ in height). Reading the
        // sections' y here keeps this reactive — resizing a section's height re-runs
        // the effect and re-spans the separator.
        for (let i = 0; i < separators.length; i += 1) {
            const neighbours = [i > 0 ? sections[i - 1] : null, i < sections.length ? sections[i] : null].filter(Boolean);
            if (neighbours.length === 0)
                continue;
            // Reading each section's position/size per axis here keeps this reactive —
            // resizing a section's depth or height re-runs the effect and re-spans.
            for (const axis of [V3Axes.z, V3Axes.y]) {
                const span = separatorSpan(neighbours.map((s) => ({ start: s.position[axis].get(), size: s.size[axis].get() })));
                if (!span)
                    continue;
                commands.push(new SetNodeVectorComponentCommand(separators[i].id, VectorProps.position, axis, span.start));
                commands.push(new SetNodeVectorComponentCommand(separators[i].id, VectorProps.size, axis, span.span));
            }
        }
        node.core.runCommandsAsTransaction(commands, '', false);
        return undefined;
    }
    catch (error) {
        getMonitor().error('updateMultiClosetItemLayoutEffect', error instanceof Error ? error : null);
        return undefined;
    }
};
const updateBoxContainerInteriorLayoutEffect = (node) => {
    if (node.type !== NodeType.BoxContainer) {
        return undefined;
    }
    try {
        const interiorComponents = node.interiorComponents
            .get()
            .filter((id) => getExistsRecursively(getNode(node.core, id)))
            .map((id) => getNode(node.core, id));
        // Early exit if no components yet - effect will re-run when components are added
        if (interiorComponents.length === 0) {
            // console.warn('no interior components yet', node.id);
            return undefined;
        }
        const interiorLayout = node.interiorLayout.get();
        //const calcTypeInterior = true; //this.calculationType === 'Interior';
        // const extSize = {} as { [key: string]: exteriorData };
        switch (interiorLayout) {
            case ContainerLayout.WIDTH:
            case ContainerLayout.HEIGHT:
                {
                    let overallSize = interiorLayout === ContainerLayout.WIDTH ? node.size.x.get() : node.size.y.get();
                    let sumSize = 0;
                    let autoSizeCount = 0;
                    for (let i = 0; i < interiorComponents.length; i += 1) {
                        // if (!calcTypeInterior) {
                        //   extSize[interiorComponents[i].id] = interiorComponents[i].getExteriorData('x');
                        //   overallWidth +=
                        //     extSize[interiorComponents[i].id].plusOverhang - extSize[interiorComponents[i].uuid].minusOverhang;
                        // }
                        const isAutoSized = interiorComponents[i].isAutoSized?.get() ?? 0;
                        if (isAutoSized) {
                            autoSizeCount += 1;
                        }
                        else {
                            sumSize +=
                                /*calcTypeInterior ?*/ interiorComponents[i].size[interiorLayout === ContainerLayout.WIDTH ? V3Axes.x : V3Axes.y].get(); /*: extSize[interiorComponents[i].id].size*/
                        }
                    }
                    let autoSize = (overallSize - sumSize) / autoSizeCount;
                    let sizeCounter = 0;
                    for (let i = 0; i < interiorComponents.length; i += 1) {
                        const commands = [
                            new SetNodeVectorComponentCommand(interiorComponents[i].id, VectorProps.position, interiorLayout === ContainerLayout.WIDTH ? V3Axes.x : V3Axes.y, sizeCounter),
                            new SetNodeVectorComponentCommand(interiorComponents[i].id, VectorProps.size, interiorLayout === ContainerLayout.WIDTH ? V3Axes.y : V3Axes.x, node.size[interiorLayout === ContainerLayout.WIDTH ? V3Axes.y : V3Axes.x].get()),
                            new SetNodeVectorComponentCommand(interiorComponents[i].id, VectorProps.size, V3Axes.z, getAttributeValue(interiorComponents[i], 'InsetShelf')
                                ? [
                                    {
                                        type: 'boxContainerSize',
                                        value: V3Axes.z
                                    },
                                    {
                                        type: 'operator',
                                        value: '-'
                                    },
                                    {
                                        type: 'projectAttribute',
                                        value: 'InsetDoorGap'
                                    },
                                    {
                                        type: 'operator',
                                        value: '-'
                                    },
                                    {
                                        type: 'materialsSetMaterialAttributeN',
                                        value: ['door', 'thickness']
                                    }
                                ]
                                : getAttributeValue(interiorComponents[i], 'FixedDepth')
                                    ? [
                                        {
                                            type: 'attribute',
                                            value: 'FixedDepth'
                                        }
                                    ]
                                    : node.size.z.get() - 1e-6),
                            new SetNodeVectorComponentCommand(interiorComponents[i].id, VectorProps.position, V3Axes.z, getAttributeValue(interiorComponents[i], 'InsetShelf')
                                ? 0
                                : getAttributeValue(interiorComponents[i], 'FixedDepth')
                                    ? getAttributeValue(interiorComponents[i], 'FrontPosition')
                                        ? [
                                            {
                                                type: 'boxContainerSize',
                                                value: V3Axes.z
                                            },
                                            {
                                                type: 'operator',
                                                value: '-'
                                            },
                                            {
                                                type: 'attribute',
                                                value: 'FixedDepth'
                                            }
                                        ]
                                        : 0
                                    : 0)
                        ];
                        const isAutoSized = interiorComponents[i].isAutoSized?.get() ?? 0;
                        // console.warn(
                        //   interiorComponents.length,
                        //   i,
                        //   node.id,
                        //   interiorComponents[i].id,
                        //   isAutoSized,
                        //   'all size:',
                        //   node.size[interiorLayout === ContainerLayout.WIDTH ? V3Axes.x : V3Axes.y].get(),
                        //   'overallSize:',
                        //   overallSize,
                        //   'sumSize:',
                        //   sumSize,
                        //   'autoSizeCount:',
                        //   autoSizeCount,
                        //   'autoSize:',
                        //   autoSize,
                        //   'posCounter:',
                        //   sizeCounter,
                        //   node.toJSON(),
                        //   interiorComponents[i].toJSON()
                        // );
                        if (isAutoSized) {
                            commands.push(new SetNodeVectorComponentCommand(interiorComponents[i].id, VectorProps.size, interiorLayout === ContainerLayout.WIDTH ? V3Axes.x : V3Axes.y, autoSize));
                        }
                        if (i > 0) {
                            const faceFrameWidth = (getAttributeValue(interiorComponents[i], 'FaceFrameWidth') *
                                0.5);
                            commands.push(new SetNodeAttributeValueCommand(interiorComponents[i - 1].id, interiorLayout === ContainerLayout.WIDTH ? 'RightFaceFrameWidth' : 'TopFaceFrameWidth', faceFrameWidth));
                        }
                        if (i < interiorComponents.length - 1) {
                            const faceFrameWidth = (getAttributeValue(interiorComponents[i], 'FaceFrameWidth') *
                                0.5);
                            commands.push(new SetNodeAttributeValueCommand(interiorComponents[i + 1].id, interiorLayout === ContainerLayout.WIDTH ? 'LeftFaceFrameWidth' : 'BottomFaceFrameWidth', faceFrameWidth));
                        }
                        node.core.runCommandsAsTransaction(commands, '', false);
                        // const config = getObjectFromStore(interiorComponents[i].uuid) as _IPartConfig;
                        // isAutoSized = config.isAutoSized;
                        // const isAutoSized = ;
                        // const position = {
                        //   x: widthCounter,
                        //   y: config.position.y,
                        //   z: interiorComponents[i].getAttributeValue('InsetShelf')
                        //     ? 0
                        //     : interiorComponents[i].getAttributeValue('FixedDepth')
                        //       ? interiorComponents[i].getAttributeValue('FrontPosition')
                        //         ? [
                        //             {
                        //               type: 'boxContainerSize',
                        //               value: 'z'
                        //             },
                        //             {
                        //               type: 'operator',
                        //               value: '-'
                        //             },
                        //             {
                        //               type: 'attribute',
                        //               value: 'FixedDepth'
                        //             }
                        //           ]
                        //         : 0
                        //       : 0
                        // };
                        // const width = autoWidth;
                        /*calcTypeInterior
                      ?  autoWidth;
                    : autoWidth -
                        extSize[interiorComponents[i].id].plusOverhang +
                        extSize[interiorComponents[i].id].minusOverhang*/
                        if (isAutoSized) {
                            interiorComponents[i].size[interiorLayout === ContainerLayout.WIDTH ? V3Axes.x : V3Axes.y].set(autoSize);
                            sizeCounter += autoSize;
                        }
                        else {
                            sizeCounter +=
                                interiorComponents[i].size[interiorLayout === ContainerLayout.WIDTH ? V3Axes.x : V3Axes.y].get();
                        }
                    }
                }
                break;
            default:
                break;
        }
    }
    catch (error) {
        getMonitor().error('updateBoxContainerInteriorLayoutEffect', error instanceof Error ? error : null);
        return undefined;
    }
};
const updateBoxContainerExteriorLayoutEffect = (node) => {
    if (node.type !== NodeType.BoxContainer) {
        return undefined;
    }
    try {
        const exteriorComponents = node.exteriorComponents
            .get()
            .filter((id) => getExistsRecursively(getNode(node.core, id)))
            .map((id) => getNode(node.core, id));
        const exteriorLayout = node.exteriorLayout.get();
        switch (exteriorLayout) {
            case ContainerLayout.WIDTH:
            case ContainerLayout.HEIGHT:
                {
                    // let isAutoSized;
                    // const calcTypeInterior = ( this.calculationType === 'Interior' );
                    // const extSize = {} as { [key: string]: exteriorData};
                    const item = getParentItem(node.core, node.id);
                    const doorMaterial = getMaterialById(node.core, getMaterialsSetById(node.core, item.materialsSet.get()).door.get(), 'door');
                    const faceFramePresent = getAttributeValue(item, 'FaceFramePresent');
                    const FrameThickness = faceFramePresent *
                        (doorMaterial.doorStyle
                            ? doorMaterial.matchingVisiblePanel
                                ? getMaterialById(node.core, doorMaterial.matchingVisiblePanel, 'door').thickness
                                : doorMaterial.thickness || 0.625
                            : doorMaterial.thickness || 0.625);
                    const BumperGap = (node.core.projectSettings.projectAttributes.getValue('BumperGap')?.get() || 0);
                    const InsetDoor = (node.core.projectSettings.projectAttributes.getValue('InsetDoor')?.get() || 0);
                    let overallSize = exteriorLayout === ContainerLayout.WIDTH ? node.size.x.get() : node.size.y.get();
                    let sumSize = 0;
                    let autoSizeCount = 0;
                    for (let i = 0; i < exteriorComponents.length; i += 1) {
                        // console.warn(
                        //   'updateBoxContainerExteriorLayoutEffect',
                        //   node,
                        //   i,
                        //   '/',
                        //   exteriorComponents.length,
                        //   isAutoSized
                        // );
                        // if (!calcTypeInterior) {
                        //   extSize[exteriorComponents[i].uuid] = exteriorComponents[i].getExteriorData('x');
                        //   overallWidth +=
                        //     extSize[exteriorComponents[i].uuid].plusOverhang - extSize[exteriorComponents[i].uuid].minusOverhang;
                        // }
                        // exteriorComponents[i]._size.y = { type: 'value', value: this.size.y };
                        // exteriorComponents[i]._position.z = {
                        //   type: 'value',
                        //   value: this.size.z + BumperGap * (1 - InsetDoor || 1 - faceFramePresent) + FrameThickness
                        // };
                        const isAutoSized = exteriorComponents[i].isAutoSized?.get() ?? 0;
                        if (isAutoSized) {
                            autoSizeCount += 1;
                        }
                        else {
                            sumSize +=
                                exteriorComponents[i].size[exteriorLayout === ContainerLayout.WIDTH ? V3Axes.x : V3Axes.y].get();
                        }
                    }
                    let autoSize = (overallSize - sumSize) / autoSizeCount;
                    let sizeCounter = 0;
                    for (let i = 0; i < exteriorComponents.length; i += 1) {
                        // exteriorComponents[i]._position.x = { type: 'value', value: widthCounter };
                        // const config = getObjectFromStore(exteriorComponents[i].uuid) as _IPartConfig;
                        // isAutoSized = config.isAutoSized;
                        // const position = {
                        //   x: widthCounter,
                        //   y: config.position.y,
                        //   z: this.size.z + BumperGap * (1 - InsetDoor || 1 - faceFramePresent) + FrameThickness
                        // };
                        // const width = calcTypeInterior
                        //   ? autoWidth
                        //   : autoWidth -
                        //     extSize[exteriorComponents[i].uuid].plusOverhang +
                        //     extSize[exteriorComponents[i].uuid].minusOverhang;
                        // const size = {
                        //   x: isAutoSized ? width : config.size.x,
                        //   y: this.size.y,
                        //   z: config.size.z
                        // };
                        const commands = [
                            new SetNodeVectorComponentCommand(exteriorComponents[i].id, VectorProps.position, exteriorLayout === ContainerLayout.WIDTH ? V3Axes.x : V3Axes.y, sizeCounter),
                            new SetNodeVectorComponentCommand(exteriorComponents[i].id, VectorProps.size, exteriorLayout === ContainerLayout.WIDTH ? V3Axes.y : V3Axes.x, node.size[exteriorLayout === ContainerLayout.WIDTH ? V3Axes.y : V3Axes.x].get()),
                            new SetNodeVectorComponentCommand(exteriorComponents[i].id, VectorProps.position, V3Axes.z, node.size.z.get() + BumperGap * (1 - InsetDoor || 1 - faceFramePresent) + FrameThickness)
                        ];
                        const isAutoSized = exteriorComponents[i].isAutoSized?.get() ?? 0;
                        if (isAutoSized) {
                            commands.push(new SetNodeVectorComponentCommand(exteriorComponents[i].id, VectorProps.size, exteriorLayout === ContainerLayout.WIDTH ? V3Axes.x : V3Axes.y, autoSize));
                        }
                        node.core.runCommandsAsTransaction(commands, '', false);
                        if (isAutoSized) {
                            // exteriorComponents[i]._size.x = { type: 'value', value: width };
                            sizeCounter += autoSize;
                        }
                        else {
                            sizeCounter +=
                                exteriorComponents[i].size[exteriorLayout === ContainerLayout.WIDTH ? V3Axes.x : V3Axes.y].get();
                        }
                    }
                }
                break;
            default:
                break;
        }
    }
    catch (error) {
        getMonitor().error('updateBoxContainerExteriorLayoutEffect', error instanceof Error ? error : null);
        return undefined;
    }
};
const VEC3_EPSILON = 1e-5;
const vec3Equal = (a, b) => Math.abs(a.x.get() - b.x) < VEC3_EPSILON &&
    Math.abs(a.y.get() - b.y) < VEC3_EPSILON &&
    Math.abs(a.z.get() - b.z) < VEC3_EPSILON;
const FLAT_DESIRED = [
    { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }
];
/**
 * Keeps `Ceiling2D.children` in sync with the room's cathedral context:
 *
 * - Flat ceiling -> exactly one MountPlane child at identity pose. Polygon
 *   shape is derived on-the-fly by `getMountPlaneShape` from the room
 *   footprint (no pose needed beyond identity).
 * - Cathedral ceiling -> N MountPlane children, one per facet, each with the
 *   facet's local pose. The polygon shape is again derived on demand by
 *   `getMountPlaneShape` from `room.cathedralContext`.
 *
 * Behavior on facet-count changes:
 * - When `oldCount === newCount`, only `position` / `rotation` are updated
 *   in place via `SetNodeVector3Command`. No MountPlane is recreated and no
 *   item is reparented, so drag and item-position state remain stable on
 *   pose-only edits (e.g. moving a single `BaseWallPoints` knot).
 * - When `oldCount !== newCount`, items hosted on each old MountPlane are
 *   reparented to the new MountPlane at `clamp(i, 0, newCount-1)`, then the
 *   old MountPlanes are removed and fresh ones are created at the new
 *   poses. This guarantees no item is orphaned by a topology change.
 *
 * All mutations go through `runCommandsAsTransaction(..., '', false)` so
 * they stay off the undo stack — synchronization is bookkeeping, not a
 * user action. The idempotent count comparison plus `vec3Equal`
 * short-circuit prevents the effect from re-emitting commands once the
 * tree matches the desired state.
 */
const ceilingMountPlanesSyncEffect = (node) => {
    if (node.type !== NodeType.Ceiling2D)
        return undefined;
    const ceiling = node;
    let room;
    try {
        room = getNode(ceiling.core, ceiling.parent.get());
    }
    catch {
        return undefined;
    }
    if (room.type !== NodeType.Room)
        return undefined;
    const ctx = room.cathedralContext.value;
    let desired;
    if (ctx.type !== CeilingType.Flat) {
        desired = [];
        for (const facet of ctx.ceilingFacets) {
            const pose = computeFacetMountPose(facet);
            if (!pose)
                continue;
            desired.push({ position: pose.position, rotation: pose.rotation });
        }
        if (desired.length === 0)
            desired = FLAT_DESIRED;
    }
    else {
        desired = FLAT_DESIRED;
    }
    const oldIds = ceiling.children.get();
    const oldCount = oldIds.length;
    const newCount = desired.length;
    // Bail when the ceiling currently has no MountPlane children. This is a
    // *transient construction state*, not a real topology — `CreateNodeCommand`
    // strips a node's children before construction, so this effect's first run
    // (synchronous, fired by `registerNodeEffects` inside the constructor) would
    // otherwise see `children=[]` and start spawning MountPlanes before the
    // node's actual children have been recursively created. The effect would
    // then re-run with `oldCount = 1 (effect-spawned MP) + N (real MPs)`, take
    // the topology-rebuild branch again, and churn through reparent + remove
    // commands that can race with view construction and lose items.
    //
    // The contract is: every callsite that creates a `Ceiling2D`
    // (`floorplan.ts`, `1057To2000`, RoomPlan converter, …) must include at
    // least one `MountPlane` child. This effect only manages topology
    // *transitions* between non-empty states (e.g. flat ↔ cathedral, facet
    // count changes).
    if (oldCount === 0)
        return undefined;
    // Topology changed — rebuild children, reparenting items by clamped index.
    if (oldCount !== newCount) {
        const newIds = desired.map(() => generateId());
        const objects = {};
        for (let j = 0; j < newCount; j += 1) {
            objects[newIds[j]] = {
                uuid: newIds[j],
                type: NodeType.MountPlane,
                parent: ceiling.id,
                mountSlotTypes: [MountType.ceiling],
                children: [],
                attributes: {},
                position: desired[j].position,
                rotation: desired[j].rotation
            };
        }
        const commands = [];
        // Create new MountPlanes first so reparent commands have live targets.
        for (let j = 0; j < newCount; j += 1) {
            commands.push(new CreateNodeCommand(objects, newIds[j], ceiling.id, 'children'));
        }
        // Reparent items by clamped index.
        for (let i = 0; i < oldCount; i += 1) {
            let oldMp;
            try {
                oldMp = getNode(ceiling.core, oldIds[i]);
            }
            catch {
                continue;
            }
            if (oldMp.type !== NodeType.MountPlane)
                continue;
            const dst = newIds[Math.min(i, newCount - 1)];
            const itemIds = oldMp.children.get();
            for (const itemId of itemIds) {
                commands.push(new SetNodeParentCommand(itemId, dst));
            }
        }
        // Remove old MountPlanes once they have been drained.
        for (let i = 0; i < oldCount; i += 1) {
            commands.push(new RemoveNodeCommand(oldIds[i]));
        }
        if (commands.length > 0) {
            ceiling.core.runCommandsAsTransaction(commands, '', false);
        }
        return undefined;
    }
    // Topology unchanged — update poses in place, only when they actually drift.
    const commands = [];
    for (let i = 0; i < oldCount; i += 1) {
        let mp;
        try {
            mp = getNode(ceiling.core, oldIds[i]);
        }
        catch {
            continue;
        }
        if (mp.type !== NodeType.MountPlane)
            continue;
        if (!vec3Equal(mp.position, desired[i].position)) {
            commands.push(new SetNodeVector3Command(mp.id, VectorProps.position, desired[i].position));
        }
        if (!vec3Equal(mp.rotation, desired[i].rotation)) {
            commands.push(new SetNodeVector3Command(mp.id, VectorProps.rotation, desired[i].rotation));
        }
    }
    if (commands.length > 0) {
        ceiling.core.runCommandsAsTransaction(commands, '', false);
    }
    return undefined;
};
/**
 * Re-validates `room.CeilingBaseWallId` whenever `room.path` changes.
 *
 * The ceiling base wall must reference a `Wall2D` whose parent `RoomSegment`
 * is one of the room's current path segments. When the user edits the
 * footprint (adds, removes, or replaces a segment), the previously chosen
 * base wall can become stale — e.g. its parent segment may have been removed
 * from the path, or the wall itself may have been disposed.
 *
 * Behavior:
 * - If the current `CeilingBaseWallId` still points to a `Wall2D` whose
 *   parent is a `RoomSegment` in `path`, leave it untouched.
 * - Otherwise overwrite it with the first `Wall2D` reachable from the new
 *   path (walk segments in order, take the first non-null `wall2D`).
 *
 * The effect tracks ONLY `room.path`. All other reads happen inside
 * `untracked()` so unrelated wall / segment edits do not re-trigger it.
 * This matches the spec ("when path property is updated") and prevents the
 * effect from clobbering a manual dropdown selection mid-edit.
 *
 * Writes go through `runCommandsAsTransaction(..., '', false)` to stay off
 * the undo stack — synchronization is bookkeeping, not a user action.
 */
const updateCeilingBaseWallIdEffect = (node) => {
    if (node.type !== NodeType.Room)
        return undefined;
    const segmentIds = node.path.get();
    if (segmentIds.length === 0)
        return undefined;
    untracked(() => {
        const baseWallId = getAttributeValue(node, 'CeilingBaseWallId');
        let stillValid = false;
        if (baseWallId) {
            try {
                const baseWall = getNode(node.core, baseWallId);
                if (baseWall.type === NodeType.Wall2D) {
                    const parentId = baseWall.parent.get();
                    if (segmentIds.includes(parentId)) {
                        const parent = getNode(node.core, parentId);
                        if (parent.type === NodeType.RoomSegment)
                            stillValid = true;
                    }
                }
            }
            catch {
                // Stale UUID — treat as invalid and fall through to replacement.
            }
        }
        if (stillValid)
            return;
        let firstWallId = null;
        for (const segId of segmentIds) {
            try {
                const seg = getNode(node.core, segId);
                if (seg.type !== NodeType.RoomSegment)
                    continue;
                const wallId = seg.wall2D.get();
                if (wallId) {
                    firstWallId = wallId;
                    break;
                }
            }
            catch {
                continue;
            }
        }
        if (!firstWallId || firstWallId === baseWallId)
            return;
        node.core.runCommandsAsTransaction(new SetNodeAttributeValueCommand(node.id, 'CeilingBaseWallId', firstWallId), '', false);
    });
    return undefined;
};
const updateRoomBasePointsEffect = (node) => {
    if (node.type !== NodeType.Room)
        return undefined;
    const ceilingType = getAttributeValue(node, 'CeilingType');
    // An unset CeilingType reads as `0` (getAttributeValue's absent fallback), which
    // means "flat by default" — only Sloped / Cathedral rooms carry a base-wall
    // profile. Bail on both so a plain room never writes spurious BaseWallPoints.
    if (!ceilingType || ceilingType === CeilingType.Flat)
        return undefined;
    const baseWallId = getAttributeValue(node, 'CeilingBaseWallId');
    if (!baseWallId)
        return undefined;
    const baseWall = getWall2D(node.core, baseWallId);
    const segment = getRoomSegment(node.core, baseWall.parent.get());
    const length = computeSegmentLength(node.core, segment);
    if (!length)
        return undefined;
    untracked(() => {
        const existing = getAttributeValue(node, 'BaseWallPoints');
        const roomHeight = getAttributeValue(node, 'WallHeight');
        const points = nextRoomBasePoints(ceilingType, existing, length, roomHeight);
        node.core.runCommandsAsTransaction(new SetNodeAttributeValueCommand(node.id, 'BaseWallPoints', points), '', false);
    });
};
/**
 * Keeps each `RoomSegment.attributes['WallNumber']` in sync with its position
 * in the owning `Room`'s ordered segment list (outer `path` first, then each
 * hole flattened in declaration order). Numbering is 1-based and restarts per
 * Room.
 * Writes are skipped when the segment already holds the desired number,
 * making repeated runs idempotent. Mutations go through
 * `runCommandsAsTransaction(..., '', false)` so synchronization stays off the
 * undo stack — this is bookkeeping, not a user action.
 */
const updateRoomSegmentWallNumbersEffect = (node) => {
    if (node.type !== NodeType.Room)
        return undefined;
    const pathIds = node.path.get();
    const holesIds = node.holes.get();
    const initialSegmentId = node.attributes.get('InitialSegmentId')?.get();
    untracked(() => {
        let orderedIds = [...pathIds, ...holesIds.flat()];
        if (orderedIds.length === 0)
            return;
        // Boolean-falsy semantics: "" / undefined / 0 / null all mean "start at
        // index 0". Only rotate when we have a non-empty string AND it actually
        // occurs in the combined segment list.
        if (typeof initialSegmentId === 'string' && initialSegmentId) {
            const startIdx = orderedIds.indexOf(initialSegmentId);
            if (startIdx > 0) {
                orderedIds = [...orderedIds.slice(startIdx), ...orderedIds.slice(0, startIdx)];
            }
            // startIdx === -1 (stale/foreign id) or === 0 → no rotation needed.
        }
        const commands = [];
        for (let i = 0; i < orderedIds.length; i += 1) {
            const segId = orderedIds[i];
            let segment;
            try {
                segment = getRoomSegment(node.core, segId);
            }
            catch {
                continue;
            }
            const next = i + 1;
            const current = getAttributeValue(segment, 'WallNumber');
            if (current === next)
                continue;
            commands.push(new SetNodeAttributeValueCommand(segment.id, 'WallNumber', next));
        }
        if (commands.length === 0)
            return;
        node.core.runCommandsAsTransaction(commands, '', false);
    });
    return undefined;
};
/**
 * Stacks a multiCloset FreeBoxContainer's direct children (stacks + fix shelves)
 * bottom-to-top along Y and assigns each a cumulative `position.y`.
 *
 * Sizing: children flagged `isAutoSized` (the stacks) **fit the container** — they
 * split the height left after the fixed children (fix shelves, plus any stack that
 * is NOT auto-sized) evenly between them. Non-auto children keep their own `size.y`
 * (a fix shelf is body-thickness from its catalog formula; a fixed stack's size is
 * authoritative — e.g. snapped to the 32mm hole grid by the out-of-scope resize).
 * This mirrors the auto-size distribution in `updateBoxContainerInteriorLayoutEffect`.
 * Children size themselves on x/z via their own `freeBoxContainerSize` formulas;
 * there is no hole math here.
 *
 * Gated to the multiCloset flavor: the FreeBoxContainer class only registers this
 * effect when `freeBoxContainerType === multiCloset`, so plain containers are unaffected.
 */
const updateMultiClosetFreeBoxContainerLayoutEffect = (node) => {
    if (node.type !== NodeType.FreeBoxContainer || node.freeBoxContainerType.get() !== FreeBoxContainerType.multiCloset) {
        return undefined;
    }
    try {
        // Read (and track) the bays list first, so adding/removing a bay re-runs this.
        // multiCloset FreeBoxContainers hold their stacks + fix-shelf dividers in the
        // ordered `bays` slot (plain containers use `children`).
        const children = node.bays
            .get()
            .filter((id) => getExistsRecursively(getNode(node.core, id)))
            .map((id) => getNode(node.core, id));
        if (children.length === 0) {
            return undefined;
        }
        const item = getOptionalParentItem(node.core, node.id);
        if (!item) {
            return undefined;
        }
        const thickness = getMaterialById(node.core, getMaterialsSetById(node.core, item.materialsSet.get()).body.get(), 'body').thickness;
        // FirstHoleOffset from the enclosing Carcass (it inherits the project value);
        // fall back to the default when there is no carcass ancestor.
        let firstHoleOffset = defaultFirstHoleOffset;
        try {
            const carcass = getParentCarcass(node.core, node.id);
            firstHoleOffset = getAttributeValue(carcass, 'FirstHoleOffset') || defaultFirstHoleOffset;
        }
        catch {
            firstHoleOffset = defaultFirstHoleOffset;
        }
        // Fix shelves are dividers on the 32mm hole grid; stacks are the openings
        // (size = step·N − t). Auto stacks split the available holes; fixed stacks keep
        // their (grid-valid) size. size.y is read only for FIXED stacks (so writing the
        // auto sizes doesn't re-trigger this effect).
        const layouts = layoutMultiClosetFreeBoxContainer(children.map((child) => {
            const isStack = isMultiClosetStackPartType(child.partType.get());
            const isAutoSized = Boolean(child.isAutoSized?.get());
            return { isStack, isAutoSized, sizeY: isStack && !isAutoSized ? child.size.y.get() : 0 };
        }), node.size.y.get(), thickness, firstHoleOffset, step32mm);
        const commands = [];
        for (let i = 0; i < children.length; i += 1) {
            const child = children[i];
            if (Math.abs(layouts[i].posY - child.position.y.peek()) > 1e-3) {
                commands.push(new SetNodeVectorComponentCommand(child.id, VectorProps.position, V3Axes.y, layouts[i].posY));
            }
            if (isMultiClosetStackPartType(child.partType.get()) &&
                child.isAutoSized?.peek() &&
                Math.abs(layouts[i].sizeY - child.size.y.peek()) > 1e-3) {
                commands.push(new SetNodeVectorComponentCommand(child.id, VectorProps.size, V3Axes.y, layouts[i].sizeY));
            }
        }
        node.core.runCommandsAsTransaction(commands, '', false);
    }
    catch (error) {
        getMonitor().error('updateMultiClosetFreeBoxContainerLayoutEffect', error instanceof Error ? error : null);
        return undefined;
    }
    return undefined;
};
/**
 * Shared setup for the multiCloset stack layout effects: the live child Parts
 * (bottom-to-top, existing only), the stack height `H`, and the body panel
 * thickness `t`. Returns `undefined` when there is nothing to lay out.
 */
const getStackLayoutContext = (node) => {
    const item = getOptionalParentItem(node.core, node.id);
    if (!item) {
        return undefined;
    }
    const children = node.children
        .get()
        .filter((id) => getExistsRecursively(getNode(node.core, id)))
        .map((id) => getNode(node.core, id));
    if (children.length === 0) {
        return undefined;
    }
    const thickness = getMaterialById(node.core, getMaterialsSetById(node.core, item.materialsSet.get()).body.get(), 'body').thickness;
    return { children, height: node.size.y.get(), thickness };
};
/**
 * Drawers / hangers — children are item openings interleaved with real fix-shelf
 * dividers; lay them out with a straight bottom-to-top walk (`tileStackBands`). Each
 * divider is a `thickness` board; each item is a clean 32mm opening `step·N − thickness`
 * (auto items split the leftover holes, fixed items round their own `size.y` to the
 * nearest hole count). Writes `position.y` for every child and `size.y` for items only
 * — a divider keeps its own body-thickness formula (like a shelf board). Reading a
 * fixed item's `size.y` and rewriting the same clean opening is a fixed point, so the
 * re-trigger converges (no loop). The divider children themselves are baked into the stack
 * catalog templates (drawers, hangers, shelves), not created at runtime.
 */
const applyStackBandsLayout = (node) => {
    try {
        const ctx = getStackLayoutContext(node);
        if (!ctx) {
            return undefined;
        }
        // A stack interleaves item parts with real fix-shelf dividers
        // (`freeBoxContainerInteriorPart`). Dividers are `thickness` boards (no hole budget);
        // everything else is an item opening.
        const kinds = ctx.children.map((child) => child.partType.get() === PartType.freeBoxContainerInteriorPart ? 'divider' : 'item');
        // Shelves are adjustable and sit bottom-to-hole, so their compartments use a position-dependent
        // inset; drawers/hangers keep the uniform `step·N − thickness` (default inset).
        const isShelves = node.partType.get() === PartType.multiClosetStackPart &&
            node.multiClosetStackType?.get() === MultiClosetStackType.multiClosetShelvesStackPart;
        const layouts = tileStackBands(ctx.children.map((child, i) => ({
            isDivider: kinds[i] === 'divider',
            isAutoSized: Boolean(child.isAutoSized?.get()),
            // Read (and TRACK) a FIXED item's size.y with `.get()` so a hand-resize of a
            // compartment (e.g. moving a shelf board via `useShelfBoardMove`) re-runs this
            // layout and repositions the boards/items. Auto items read `0` (not their
            // size), and this effect only ever WRITES auto sizes + positions — never a
            // fixed size — so tracking fixed sizes cannot self-trigger a loop. Mirrors the
            // FreeBoxContainer layout effect, which likewise `.get()`s fixed stack sizes.
            sizeY: kinds[i] === 'item' && !child.isAutoSized?.get() ? child.size.y.get() : 0
        })), ctx.height, ctx.thickness, step32mm, isShelves ? (itemIndex, itemCount) => shelfCompartmentInset(itemIndex, itemCount, ctx.thickness) : undefined);
        const commands = [];
        for (let i = 0; i < ctx.children.length; i += 1) {
            const child = ctx.children[i];
            if (Math.abs(layouts[i].posY - child.position.y.peek()) > 1e-3) {
                commands.push(new SetNodeVectorComponentCommand(child.id, VectorProps.position, V3Axes.y, layouts[i].posY));
            }
            // Only items get their opening size written; a divider keeps its body-thickness formula.
            if (kinds[i] === 'item' && Math.abs(layouts[i].sizeY - child.size.y.peek()) > 1e-3 && child.isAutoSized?.peek()) {
                commands.push(new SetNodeVectorComponentCommand(child.id, VectorProps.size, V3Axes.y, layouts[i].sizeY));
            }
        }
        node.core.runCommandsAsTransaction(commands, '', false);
    }
    catch (error) {
        getMonitor().error('applyStackBandsLayout', error instanceof Error ? error : null);
    }
    return undefined;
};
/**
 * Shelves stack — same unified model as drawers/hangers: shelf COMPONENTS
 * (`multiClosetComponentType: multiClosetShelfPart`, empty openings) interleaved with real fix-shelf boards
 * (`fixShelfHorizontal`, `freeBoxContainerInteriorPart`). Delegates to the shared band-layout
 * walk, which sizes the compartments as 32mm openings and leaves each board its own
 * body-thickness `size.y` formula.
 */
const updateMultiClosetShelvesStackLayoutEffect = (node) => {
    if (node.type !== NodeType.Part ||
        node.partType.get() !== PartType.multiClosetStackPart ||
        node.multiClosetStackType?.get() !== MultiClosetStackType.multiClosetShelvesStackPart) {
        return undefined;
    }
    return applyStackBandsLayout(node);
};
/** SHORT-hanging stack (the double-hang half-height rod) — tiles bands (see
 *  `applyStackBandsLayout`). Split from the long-hang and drawer effects so each can grow its
 *  own rules (rod height, min garment clearance) later, even though all four bodies are
 *  identical today. */
const updateMultiClosetShortHangersStackLayoutEffect = (node) => {
    if (node.type !== NodeType.Part ||
        node.partType.get() !== PartType.multiClosetStackPart ||
        node.multiClosetStackType?.get() !== MultiClosetStackType.multiClosetShortHangersStackPart) {
        return undefined;
    }
    return applyStackBandsLayout(node);
};
/** LONG-hanging stack (the full-height rod) — tiles bands (see `applyStackBandsLayout`).
 *  Sibling of the short-hang effect above; see its note on why the two stay separate. */
const updateMultiClosetLongHangersStackLayoutEffect = (node) => {
    if (node.type !== NodeType.Part ||
        node.partType.get() !== PartType.multiClosetStackPart ||
        node.multiClosetStackType?.get() !== MultiClosetStackType.multiClosetLongHangersStackPart) {
        return undefined;
    }
    return applyStackBandsLayout(node);
};
/** Drawers stack — tiles bands like hangers (see `applyStackBandsLayout`): drawers fill the
 *  `M` openings, with `M−1` assumed invisible fix-shelf dividers between them. Separate effect
 *  from hangers so each can grow its own rules (drawer-box depth, min/max height) later. */
const updateMultiClosetDrawersStackLayoutEffect = (node) => {
    if (node.type !== NodeType.Part ||
        node.partType.get() !== PartType.multiClosetStackPart ||
        node.multiClosetStackType?.get() !== MultiClosetStackType.multiClosetDrawersStackPart) {
        return undefined;
    }
    return applyStackBandsLayout(node);
};
registerEffects(NodeType.BoxContainer, [
    updateBoxContainerInteriorLayoutEffect,
    updateBoxContainerExteriorLayoutEffect
]);
registerEffects(NodeType.Ceiling2D, [ceilingMountPlanesSyncEffect]);
registerEffects(ItemType.multiCloset, [updateMultiClosetItemLayoutEffect]);
// MultiCloset free-container stacker — registered by key; the FreeBoxContainer class
// opts in via getEffects() only when freeBoxContainerType === multiCloset.
registerEffects(FreeBoxContainerType.multiCloset, [updateMultiClosetFreeBoxContainerLayoutEffect]);
// MultiCloset stack-internal layout — one effect per stack CATEGORY, keyed by
// `MultiClosetStackType` rather than by `partType` (every stack shares the single
// `PartType.multiClosetStackPart`, so a partType key could not tell them apart). The `Part`
// constructor opts in via `getEffects(config.multiClosetStackType)`; a category registered here
// without that field on its catalog shell silently gets no layout.
registerEffects(MultiClosetStackType.multiClosetShelvesStackPart, [updateMultiClosetShelvesStackLayoutEffect]);
registerEffects(MultiClosetStackType.multiClosetShortHangersStackPart, [
    updateMultiClosetShortHangersStackLayoutEffect
]);
registerEffects(MultiClosetStackType.multiClosetLongHangersStackPart, [updateMultiClosetLongHangersStackLayoutEffect]);
registerEffects(MultiClosetStackType.multiClosetDrawersStackPart, [updateMultiClosetDrawersStackLayoutEffect]);
registerEffects(NodeType.Room, [
    updateRoomBasePointsEffect,
    updateCeilingBaseWallIdEffect,
    updateRoomSegmentWallNumbersEffect
]);

export { ceilingMountPlanesSyncEffect, separatorSpan, updateBoxContainerExteriorLayoutEffect, updateBoxContainerInteriorLayoutEffect, updateCeilingBaseWallIdEffect, updateMultiClosetDrawersStackLayoutEffect, updateMultiClosetFreeBoxContainerLayoutEffect, updateMultiClosetItemLayoutEffect, updateMultiClosetLongHangersStackLayoutEffect, updateMultiClosetShelvesStackLayoutEffect, updateMultiClosetShortHangersStackLayoutEffect, updateRoomBasePointsEffect, updateRoomSegmentWallNumbersEffect };
