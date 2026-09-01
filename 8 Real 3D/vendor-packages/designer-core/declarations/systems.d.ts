import { UUID } from './core';
export type SystemNeeds = {
    done: boolean;
    name: string;
    systemTypeNeedId: UUID;
};
export type SystemTodos = {
    id: UUID;
    todo: string;
    done: boolean;
};
export type SystemData = {
    id: UUID;
    name: string;
    needs?: SystemNeeds[];
    systemTypeEntityId?: UUID;
    state: SystemStatus;
    systemTypeName?: string;
    todos?: SystemTodos[];
};
export type SystemsAPI = SystemData[];
export declare enum SystemStatus {
    Draft = "DRAFT",
    Plot = "PLOT",
    Design = "DESIGN",
    Present = "PRESENT",
    FinishingTouches = "FINISHING_TOUCHES",
    Estimated = "ESTIMATED",
    SavedForLater = "SAVED_FOR_LATER",
    Signed = "SIGNED"
}
