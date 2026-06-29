import type { Aircraft, DatablockSlot } from '../simulation/aircraft.js';
import { simState } from './state.js';

export interface CommandResult {
	accept: boolean;
	message: string;
}

const VALID_DATABLOCK_SLOTS: readonly DatablockSlot[] = [
	1, 2, 3, 4, 6, 7, 8, 9,
];

export function executeCommand(rawCommand: string): CommandResult {
	const command = rawCommand.trim();
	if (command.length === 0) {
		return { accept: false, message: 'NO COMMAND' };
	}

	const datablockMatch = command.match(/^(\d) (\S+)$/);
	if (datablockMatch) {
		return executeDatablockSlotCommand(
			Number(datablockMatch[1]),
			datablockMatch[2],
		);
	}

	const haloMatch = command.match(/^QP J (?:(3) )?(\S+)$/i);
	if (haloMatch) {
		return executeHaloCommand(haloMatch[2], haloMatch[1] === '3' ? 3 : 5);
	}

	return { accept: false, message: `${rawCommand}` };
}

function executeDatablockSlotCommand(slot: number, aid: string): CommandResult {
	if (!isDatablockSlot(slot)) {
		return {
			accept: false,
			message: `INVALID DATABLOCK SLOT ${slot}`,
		};
	}

	const aircraft = findAircraftByAid(aid);
	if (!aircraft) return unknownAid(aid);

	aircraft.display.datablockSlot = slot;
	return {
		accept: true,
		message: `OFFSET DATA BLK\n${aircraft.callsign}/${aircraft.cid}`,
	};
}

function executeHaloCommand(aid: string, radiusNm: 3 | 5): CommandResult {
	const aircraft = findAircraftByAid(aid);
	if (!aircraft) return unknownAid(aid);

	if (aircraft.display.halo && aircraft.display.haloRadiusNm === radiusNm) {
		aircraft.display.halo = false;
	} else {
		aircraft.display.halo = true;
		aircraft.display.haloRadiusNm = radiusNm;
	}
	return {
		accept: true,
		message: `REQ/DELETE DRI\n${aircraft.callsign}/${aircraft.cid}`,
	};
}

function findAircraftByAid(aid: string): Aircraft | undefined {
	const normalizedAid = aid.trim().toUpperCase();
	return simState.aircraftList.find(
		(aircraft) =>
			aircraft.cid === normalizedAid ||
			aircraft.callsign === normalizedAid,
	);
}

function isDatablockSlot(value: number): value is DatablockSlot {
	return VALID_DATABLOCK_SLOTS.includes(value as DatablockSlot);
}

function unknownAid(aid: string): CommandResult {
	return {
		accept: false,
		message: `UNKNOWN AID ${aid.toUpperCase()}`,
	};
}
