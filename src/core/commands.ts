import type { DatablockSlot } from '../simulation/aircraft.js';
import { resolveAircraftReference } from '../simulation/utils.js';
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

function executeDatablockSlotCommand(
	slot: number,
	flid: string,
): CommandResult {
	if (!isDatablockSlot(slot)) {
		return {
			accept: false,
			message: `INVALID DATABLOCK SLOT ${slot}`,
		};
	}

	const aircraft = resolveAircraftReference(simState.aircraftList, {
		flid: flid,
	});
	console.log(aircraft)
	if (!aircraft) return unknownFlid(flid);

	aircraft.display.datablockSlot = slot;
	return {
		accept: true,
		message: `OFFSET DATA BLK\n${aircraft.callsign}/${aircraft.cid}`,
	};
}

function executeHaloCommand(flid: string, radiusNm: 3 | 5): CommandResult {
	const aircraft = resolveAircraftReference(simState.aircraftList, {
		flid: flid,
	});
	if (!aircraft) return unknownFlid(flid);

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

function isDatablockSlot(value: number): value is DatablockSlot {
	return VALID_DATABLOCK_SLOTS.includes(value as DatablockSlot);
}

function unknownFlid(flid: string): CommandResult {
	return {
		accept: false,
		message: `UNKNOWN FLID ${flid.toUpperCase()}`,
	};
}
