import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import '../../../declarations/helpers.js';
import '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import '../../../declarations/Model.js';
import '../../../declarations/Molding.js';
import '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import { MultiClosetComponentType } from '../../../declarations/Part.js';
import '../../../declarations/ProjectSettings.js';
import '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';

/**
 * Drop desire for categories the content-option file cannot actually build.
 *
 * The option list is the CLOSED set of section types auto-fill may use: a category with no option
 * carrying it must not appear in the layout at all. Without this gate the ban is silently
 * violated — `pickBestOption` scores every option against the requested category and returns the
 * nearest one, so a desire for long hanging with no long-hang option in the file quietly becomes a
 * shelves section. The closet then looks filled while containing a section type the file never
 * offered, and nothing in the result says so.
 *
 * Zeroing the desire instead of patching the picker is deliberate: a `0` category can never be
 * handed a slot by `intensityToTargetCounts`, so the ban holds for every downstream step, and the
 * slots freed up are redistributed across the categories that CAN be built rather than being lost.
 *
 * "Carries the category" means `profile[category] > 0` — an option whose profile lists zero stacks
 * of a type does not offer that type, even though it is a valid section in its own right.
 */
const restrictDesireToAvailableCategories = (desired, options) => {
    const restricted = { ...desired };
    const droppedCategories = [];
    for (const category of Object.values(MultiClosetComponentType)) {
        if (restricted[category] <= 0)
            continue;
        if (options.some((option) => option[category] > 0))
            continue;
        restricted[category] = 0;
        droppedCategories.push(category);
    }
    return { desired: restricted, droppedCategories };
};

export { restrictDesireToAvailableCategories };
