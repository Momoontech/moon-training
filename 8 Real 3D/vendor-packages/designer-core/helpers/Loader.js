// import { look, lookFromDB, looks, material, materials, materialType, model3D, models3D } from '../declarations';
// import { coreError } from './console';
// import serviceLooks from './service';
// export const mapLooks = (looksFromDB: any): looks => {
//   if (looksFromDB) {
//     const data = looksFromDB;
//     const obj = {} as looks['obj'];
//     const picture =
//       data && data.Decor
//         ? data.Decor.filter((look: lookFromDB) => look.subCategory1 === 'Walls' && look.subCategory2 === 'Art')
//         : [];
//     const countertop = data.Surfaces.filter((look: lookFromDB) => look.subCategory1 === 'Countertops');
//     const wall = data.Surfaces.filter((look: lookFromDB) => look.subCategory1 === 'Walls');
//     const floor = data.Surfaces.filter((look: lookFromDB) => look.subCategory1 === 'Floors');
//     const crownMolding = data.Mouldings.filter((look: lookFromDB) => look.subCategory1 === 'Crown Moulding');
//     const sheetStock = data.Materials.filter((look: lookFromDB) => look.subCategory1 === 'Sheet Stock');
//     const extrusionPull =
//       data && data.Hardware
//         ? data.Hardware.filter((mat: model3D) => mat.subCategory1 === 'Extrusions' && mat.subCategory2 === 'Handles')
//         : [];
//     const looks = countertop.concat(wall).concat(floor).concat(crownMolding).concat(sheetStock).concat(extrusionPull);
//     const arr = {
//       picture,
//       countertop: looks,
//       wall: looks,
//       floor: looks,
//       crownMolding: looks,
//       body: looks,
//       glass: looks,
//       windowGlass: looks,
//       doorGlass: looks,
//       mirror: looks,
//       service: serviceLooks
//     } as looks['arr'];
//     const emptyArr = [] as look[];
//     arr.pull = emptyArr;
//     arr.leg = emptyArr;
//     arr.hinge = emptyArr;
//     arr.hingeBlind = emptyArr;
//     arr.hingeCornerCorner = emptyArr;
//     arr.hingeCornerDiagonal = emptyArr;
//     arr.hingeLiftUp = emptyArr;
//     arr.drawerSystem = emptyArr;
//     arr.drawerSlide = emptyArr;
//     arr.accessory = emptyArr;
//     arr.ceiling = arr.wall;
//     arr.doorStyle = arr.body;
//     arr.door = arr.body;
//     arr.melamineBox = arr.body;
//     arr.melamineBoxBottom = arr.body;
//     arr.doorInsert = arr.body;
//     arr.laminate = arr.body;
//     arr.filler = arr.body;
//     arr.bottomFinishEnd = arr.body;
//     arr.finishEnd = arr.body;
//     arr.edgebanding = arr.body;
//     arr.toeKick = arr.body;
//     arr.visiblePanel = arr.body;
//     arr.visibleCarcass = arr.body;
//     arr.windowFrame = arr.body;
//     arr.gateFrame = arr.body;
//     arr.bodyEdgebanding = arr.edgebanding;
//     arr.melamineBoxEdgebanding = arr.edgebanding;
//     arr.doorEdgebanding = arr.edgebanding;
//     arr.doorInsertEdgebanding = arr.edgebanding;
//     arr.finishEndEdgebanding = arr.edgebanding;
//     arr.topValanceEdgebanding = arr.edgebanding;
//     arr.bottomValanceEdgebanding = arr.edgebanding;
//     arr.fillerEdgebanding = arr.edgebanding;
//     arr.visibleCarcassEdgebanding = arr.edgebanding;
//     arr.topValance = arr.body;
//     arr.bottomValance = arr.body;
//     arr.extrusionPull = arr.body;
//     arr.rod = arr.body;
//     arr.hangingRail = arr.body;
//     (Object.keys(arr) as materialType[]).forEach((type: materialType) => {
//       obj[type] = {};
//       const typeLooks = arr[type];
//       typeLooks.forEach((type2) => {
//         obj[type][type2._id] = { ...type2 };
//       });
//     });
//     return {
//       obj,
//       arr
//     };
//   }
//   coreError('Error while get Looks ', looksFromDB);
//   return { obj: {}, arr: {} } as looks;
// };
const mapMaterials = (materialsFromDB) => {
    const data = materialsFromDB;
    const obj = {};
    const arr = {
        countertop: data.Surfaces.filter((mat) => mat.subCategory1 === 'Countertops').concat(data.Materials.filter((mat) => mat.subCategory1 === 'Sheet Stock' && String(mat.subCategory2) === 'Melamine')),
        wall: data.Surfaces.filter((mat) => mat.subCategory1 === 'Walls'),
        floor: data.Surfaces.filter((mat) => mat.subCategory1 === 'Floors'),
        crownMolding: data.Mouldings.filter((mat) => mat.subCategory1 === 'Crown Moulding'),
        body: data.Materials.filter((mat) => mat.subCategory1 === 'Sheet Stock' &&
            [
                'MDF Paint',
                'MDF',
                'Melamine',
                'Wood',
                'Polymer',
                'Buildups',
                'Laminate',
                'Veneer',
                'Carcass',
                'Glass'
            ].includes(String(mat.subCategory2))),
        melamineBoxBottom: data.Materials.filter((mat) => mat.subCategory1 === 'Sheet Stock' && mat.subCategory2 === 'Quarter Thick'),
        door: data.Materials.filter((mat) => mat.subCategory1 === 'Sheet Stock' &&
            ['MDF Paint', 'MDF', 'Melamine', 'Wood', 'Polymer', 'Buildups', 'Laminate', 'Veneer', 'Glass'].includes(String(mat.subCategory2))),
        laminate: data.Surfaces.filter((mat) => mat.subCategory1 === 'Countertops' && mat.subCategory2 === 'Laminate'),
        glass: data.Materials.filter((mat) => mat.subCategory1 === 'Sheet Stock' && mat.subCategory2 === 'Glass'),
        windowGlass: data.Materials.filter((mat) => mat.subCategory1 === 'Sheet Stock' && mat.subCategory2 === 'Glass'),
        doorGlass: data.Materials.filter((mat) => mat.subCategory1 === 'Sheet Stock' && mat.subCategory2 === 'Glass'),
        mirror: data.Materials.filter((mat) => mat.subCategory1 === 'Sheet Stock' && mat.subCategory2 === 'Mirror'),
        edgebanding: data.Materials.filter((mat) => mat.subCategory1 === 'Edgebandings'),
        pull: data.Hardware.filter((mat) => mat.subCategory1 === 'Handles'),
        extrusionPull: data.Hardware.filter((mat) => mat.subCategory1 === 'Extrusions' && mat.subCategory2 === 'Handles'),
        rod: data.Hardware.filter((mat) => mat.subCategory1 === 'Extrusions' && mat.subCategory2 === 'Rods'),
        leg: data.Hardware.filter((mat) => mat.subCategory1 === 'Legs'),
        hingeBlind: data.Hardware.filter((mat) => mat.subCategory1 === 'Hinges' && mat.subCategory2 === 'Blind'),
        hingeCornerCorner: data.Hardware.filter((mat) => mat.subCategory1 === 'Hinges' && mat.subCategory2 === 'PieCut'),
        hingeCornerDiagonal: data.Hardware.filter((mat) => mat.subCategory1 === 'Hinges' && mat.subCategory2 === 'Diagonal'),
        hingeLiftUp: data.Hardware.filter((mat) => mat.subCategory1 === 'Hinges' && mat.subCategory2 === 'Lift-Up'),
        hingeBiFoldLift: data.Hardware.filter((mat) => mat.subCategory1 === 'Hinges' && mat.subCategory2 === 'Bi-Fold Lift'),
        hinge: data.Hardware.filter((mat) => mat.subCategory1 === 'Hinges' &&
            !['Blind', 'PieCut', 'Diagonal', 'Lift-Up', 'Bi-Fold Lift'].includes(mat.subCategory2)),
        camLock: data.Hardware.filter((mat) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Shelf Supports'),
        ovvoLock: data.Hardware.filter((mat) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'OVVO Connectors'),
        shoeFence: data.Hardware.filter((mat) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Shoe Fence'),
        heelCatch: data.Hardware.filter((mat) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Heel Catch'),
        // data.Hardware.filter( ( mat: material ) => mat.subCategory1 === 'Pins' ),
        drawerSystem: data.Hardware.filter((mat) => mat.subCategory1 === 'Drawer Systems'),
        drawerSlide: data.Hardware.filter((mat) => mat.subCategory1 === 'Drawer Slides' && mat.subCategory2 !== 'Undermount'),
        drawerSlideUndermount: data.Hardware.filter((mat) => mat.subCategory1 === 'Drawer Slides' && mat.subCategory2 === 'Undermount'),
        accessory: data.Hardware.filter((mat) => mat.subCategory1 === 'Accessories'),
        tieRack: data.Hardware.filter((mat) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Tie Racks'),
        stripLight: data.Hardware.filter((mat) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Strip Lights'),
        slideOutLaundry: data.Hardware.filter((mat) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Slide-out'),
        pole: data.Hardware.filter((mat) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Poles'),
        suspendedPole: data.Hardware.filter((mat) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Suspended Poles'),
        tiltOutHamper: data.Hardware.filter((mat) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Tilt-out Hampers'),
        scarfRack: data.Hardware.filter((mat) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Scarf Racks'),
        beltRack: data.Hardware.filter((mat) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Belt Racks'),
        hook: data.Hardware.filter((mat) => mat.subCategory1 === 'Accessories' && mat.subCategory2 === 'Hooks'),
        hangingRail: data.Hardware.filter((mat) => mat.subCategory1 === 'Extrusions' && mat.subCategory2 === 'Hanging Rails'),
        doorStyle: data.Materials.filter((mat) => mat.subCategory1 === 'Doors')
    };
    Object.keys(arr).forEach((type) => {
        obj[type] = {};
        arr[type].forEach((type2) => {
            if (['extrusionPull', 'rod'].includes(type)) {
                for (let i = 1; i <= 4; i += 1) {
                    type2[`subCategory${i}`] = type2[`subCategory${i + 1}`];
                    if (!type2[`subCategory${i}`]) {
                        Reflect.deleteProperty(type2, `subCategory${i}`);
                    }
                }
                Reflect.deleteProperty(type2, 'subCategory5');
            }
            obj[type][type2._id] = { ...type2 };
        });
    });
    arr.picture = [];
    arr.ceiling = arr.wall;
    arr.filler = arr.door;
    arr.melamineBox = arr.body;
    arr.doorInsert = arr.melamineBoxBottom;
    arr.finishEnd = arr.door;
    arr.bottomFinishEnd = arr.door;
    arr.toeKick = arr.door;
    arr.visiblePanel = arr.door;
    arr.visibleCarcass = arr.door;
    arr.windowFrame = arr.door;
    arr.gateFrame = arr.door;
    arr.bodyEdgebanding = arr.edgebanding;
    arr.melamineBoxEdgebanding = arr.edgebanding;
    arr.doorEdgebanding = arr.edgebanding;
    arr.finishEndEdgebanding = arr.edgebanding;
    arr.doorInsertEdgebanding = arr.edgebanding;
    arr.topValanceEdgebanding = arr.edgebanding;
    arr.bottomValanceEdgebanding = arr.edgebanding;
    arr.fillerEdgebanding = arr.edgebanding;
    arr.visibleCarcassEdgebanding = arr.edgebanding;
    arr.topValance = arr.door;
    arr.bottomValance = arr.door;
    obj.ceiling = obj.wall;
    obj.filler = obj.door;
    obj.melamineBox = obj.body;
    obj.finishEnd = obj.door;
    obj.doorInsert = obj.melamineBoxBottom;
    obj.bottomFinishEnd = obj.door;
    obj.toeKick = obj.door;
    obj.visiblePanel = obj.door;
    obj.visibleCarcass = obj.door;
    obj.windowFrame = obj.door;
    obj.gateFrame = obj.door;
    obj.bodyEdgebanding = obj.edgebanding;
    obj.melamineBoxEdgebanding = obj.edgebanding;
    obj.doorEdgebanding = obj.edgebanding;
    obj.doorInsertEdgebanding = obj.edgebanding;
    obj.finishEndEdgebanding = obj.edgebanding;
    obj.topValanceEdgebanding = obj.edgebanding;
    obj.bottomValanceEdgebanding = obj.edgebanding;
    obj.fillerEdgebanding = obj.edgebanding;
    obj.visibleCarcassEdgebanding = obj.edgebanding;
    obj.topValance = obj.door;
    obj.bottomValance = obj.door;
    obj.picture = {};
    return {
        obj,
        arr
    };
};
// export const mapModels3D = (modelsFromDB: any): models3D => {
//   const data = modelsFromDB;
//   const obj = {} as models3D['obj'];
//   const models3D = (data && data.Hardware ? data.Hardware : []).concat(data && data.Library ? data.Library : []);
//   const arr = {
//     pull: models3D,
//     // ( data && data.Hardware ) ? data.Hardware.filter( ( mat: model3D ) => mat.subCategory1 === 'Handles' ) : [],
//     leg: models3D,
//     // ( data && data.Hardware ) ? data.Hardware.filter( ( mat: model3D ) => mat.subCategory1 === 'Legs' ) : [],
//     applianceModel: models3D /* ( data && data.Library )
//         ? data.Library.filter( ( mat: model3D ) => mat.subCategory1 === 'Products' )
//         : [],*/,
//     accessory: models3D,
//     /* ( data && data.Hardware )
//         ? data.Hardware.filter( ( mat: model3D ) => mat.subCategory1 === 'Accessories' )
//         : [],*/
//     hook: models3D,
//     /* ( data && data.Hardware )
//         ? data.Hardware.filter( ( mat: model3D ) => mat.subCategory1 === 'Accessories' && mat.subCategory2 === 'Hooks' )
//         : [],*/
//     tieRack: models3D,
//     stripLight: models3D,
//     slideOutLaundry: models3D,
//     pole: models3D,
//     suspendedPole: models3D,
//     tiltOutHamper: models3D,
//     /* ( data && data.Hardware )
//         ? data.Hardware.filter( ( mat: model3D ) => mat.subCategory1 === 'Closets' &&
//         mat.subCategory2 === 'Tie Racks' )
//         : [],*/
//     scarfRack: models3D,
//     /* ( data && data.Hardware )
//         ? data.Hardware.filter( ( mat: model3D ) => mat.subCategory1 === 'Closets' &&
//         mat.subCategory2 === 'Scarf Racks' )
//         : [],*/
//     beltRack: models3D,
//     /* ( data && data.Hardware )
//         ? data.Hardware.filter( ( mat: model3D ) => mat.subCategory1 === 'Closets' &&
//         mat.subCategory2 === 'Belt Racks' )
//         : []*/
//     shoeFence: models3D,
//     heelCatch: models3D
//   } as models3D['arr'];
//   const types = Object.keys(arr) as materialType[];
//   types.forEach((type: materialType) => {
//     obj[type] = {};
//     arr[type].forEach((type2: model3D) => {
//       obj[type][type2._id] = { ...type2 };
//     });
//   });
//   return {
//     obj,
//     arr
//   };
// };

export { mapMaterials };
