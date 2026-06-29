import { simState } from './state.js';
import type { Aircraft, DatablockSlot } from '../simulation/aircraft.js';

export interface CommandResult {
	ok: boolean;
	message: string;
}

const VALID_DATABLOCK_SLOTS: readonly DatablockSlot[] = [
	1, 2, 3, 4, 6, 7, 8, 9,
];
const DATABLOCK_SLOT_ALIASES: Readonly<Record<string, DatablockSlot>> = {
	Q: 1,
	W: 2,
	E: 3,
	A: 4,
	D: 6,
	Z: 7,
	X: 8,
	C: 9,
};

export function executeCommand(rawCommand: string): CommandResult {
	const command = rawCommand.trim();
	if (command.length === 0) {
		return { ok: false, message: 'NO COMMAND' };
	}

	const datablockMatch = command.match(/^([1-9QWEADZXC]) (\S+)$/i);
	if (datablockMatch) {
		return executeDatablockSlotCommand(
			parseDatablockSlot(datablockMatch[1]),
			datablockMatch[2],
		);
	}

	const haloMatch = command.match(/^QJ (?:(3) )?(\S+)$/i);
	if (haloMatch) {
		return executeHaloCommand(haloMatch[2], haloMatch[1] === '3' ? 3 : 5);
	}

	return { ok: false, message: 'INVALID COMMAND' };
}

function executeDatablockSlotCommand(slot: number, aid: string): CommandResult {
	if (!isDatablockSlot(slot)) {
		return {
			ok: false,
			message: `INVALID DATABLOCK SLOT ${slot}`,
		};
	}

	const aircraft = findAircraftByAid(aid);
	if (!aircraft) return unknownAid(aid);

	aircraft.display.datablockSlot = slot;
	return {
		ok: true,
		message: `${aircraft.callsign} DATABLOCK SLOT ${slot}`,
	};
}

function executeHaloCommand(aid: string, radiusNm: 3 | 5): CommandResult {
	const aircraft = findAircraftByAid(aid);
	if (!aircraft) return unknownAid(aid);

	if (aircraft.display.halo && aircraft.display.haloRadiusNm === radiusNm) {
		aircraft.display.halo = false;
		return {
			ok: true,
			message: `${aircraft.callsign} HALO OFF`,
		};
	}

	aircraft.display.halo = true;
	aircraft.display.haloRadiusNm = radiusNm;
	return {
		ok: true,
		message: `${aircraft.callsign} HALO ${radiusNm} NM`,
	};
}

function findAircraftByAid(aid: string): Aircraft | undefined {
	const normalizedAid = aid.trim().toUpperCase();
	return simState.aircraftList.find(
		(aircraft) =>
			aircraft.cid === normalizedAid || aircraft.callsign === normalizedAid,
	);
}

function isDatablockSlot(value: number): value is DatablockSlot {
	return VALID_DATABLOCK_SLOTS.includes(value as DatablockSlot);
}

function parseDatablockSlot(value: string): number {
	const normalizedValue = value.toUpperCase();
	return DATABLOCK_SLOT_ALIASES[normalizedValue] ?? Number(normalizedValue);
}

function unknownAid(aid: string): CommandResult {
	return {
		ok: false,
		message: `UNKNOWN AID ${aid.toUpperCase()}`,
	};
}
