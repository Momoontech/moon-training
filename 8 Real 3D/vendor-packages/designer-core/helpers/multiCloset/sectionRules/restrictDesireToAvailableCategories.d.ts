import { MultiClosetComponentType } from '../../../declarations';
import { MultiClosetStackNumbers, SectionContentProfile } from '../types';
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
export declare const restrictDesireToAvailableCategories: (desired: MultiClosetStackNumbers, options: SectionContentProfile[]) => {
    desired: MultiClosetStackNumbers;
    droppedCategories: MultiClosetComponentType[];
};
export default restrictDesireToAvailableCategories;
