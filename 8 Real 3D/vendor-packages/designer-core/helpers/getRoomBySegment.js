import getRoom from '../components/Node/helpers/getRoom.js';
import getStage from '../components/Node/helpers/getStage.js';

const getRoomBySegment = (core, segmentId) => {
    try {
        const stageId = core.currentStage.get();
        const stage = getStage(core, stageId);
        const stageRooms = stage.rooms.get();
        const room = stageRooms.find((room) => {
            return getRoom(core, room).path.get().includes(segmentId);
        });
        if (!room) {
            throw new Error(`Room not found for segment ${segmentId}`);
        }
        return room;
    }
    catch (error) {
        throw new Error(`Error getting room by segment ${segmentId}: ${error}`);
    }
};

export { getRoomBySegment as default };
