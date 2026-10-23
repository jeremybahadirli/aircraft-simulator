import type { DatablockSlot } from './aircraft.js';
import { resolveAircraftReference } from './aircraftReferences.js';
import type { SimulationState } from './state.js';

export interface CommandResult {
	accept: boolean;
	message: string;
}

const VALID_DATABLOCK_SLOTS: readonly DatablockSlot[] = [
	1, 2, 3, 4, 6, 7, 8, 9,
];

export function executeCommand(
	state: SimulationState,
	rawCommand: string,
): CommandResult {
	const command = rawCommand.trim();
	if (command.length === 0) {
		return { accept: false, message: 'NO COMMAND' };
	}

	const datablockMatch = command.match(/^(\d) (\S+)$/);
	if (datablockMatch) {
		return executeDatablockSlotCommand(
			state,
			Number(datablockMatch[1]),
			datablockMatch[2],
		);
	}

	const haloMatch = command.match(/^QP J (?:(3) )?(\S+)$/i);
	if (haloMatch) {
		return executeHaloCommand(
			state,
			haloMatch[1] === '3' ? 3 : 5,
			haloMatch[2],
		);
	}

	const fourthLineMatch = command.match(/^QS (`?)([A-Z0-9/+-]{1,8}) (\S+)$/i);
	if (fourthLineMatch) {
		return executeFourthLineCommand(
			state,
			fourthLineMatch[1] === '`',
			fourthLineMatch[2],
			fourthLineMatch[3],
		);
	}

	const altitudeMatch = command.match(/^QZ (\d{3}) (\S+)$/i);
	if (altitudeMatch) {
		return executeAltitudeCommand(
			state,
			Number(altitudeMatch[1]),
			altitudeMatch[2],
		);
	}

	return { accept: false, message: `${rawCommand}` };
}

function executeDatablockSlotCommand(
	state: SimulationState,
	slot: number,
	flid: string,
): CommandResult {
	if (!isDatablockSlot(slot)) {
		return {
			accept: false,
			message: `INVALID DATABLOCK SLOT ${slot}`,
		};
	}

	const aircraft = resolveAircraftReference(state.aircraftList, {
		flid: flid,
	});
	if (!aircraft) return unknownFlid(flid);

	aircraft.display.datablockSlot = slot;
	return {
		accept: true,
		message: `OFFSET DATA BLK\n${aircraft.callsign}/${aircraft.cid}`,
	};
}

function executeHaloCommand(
	state: SimulationState,
	radiusNm: 3 | 5,
	flid: string,
): CommandResult {
	const aircraft = resolveAircraftReference(state.aircraftList, {
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

function executeFourthLineCommand(
	state: SimulationState,
	isFreeText: boolean,
	text: string,
	flid: string,
): CommandResult {
	const aircraft = resolveAircraftReference(state.aircraftList, {
		flid: flid,
	});
	if (!aircraft) return unknownFlid(flid);

	if (isFreeText) {
		aircraft.fourthLine = text;
		return {
			accept: true,
			message: `4TH LINE ENTRY`,
		};
	}

	const invalidResult = {
		accept: false,
		message: `INVALID 4TH LINE FORMAT`,
	};

	const hdgSpdMatch = text.match(
		/^(?:(?<first>\d{3})(?:\/(?<second>\d{2,3})?)?|\/(?<secondOnly>\d{2,3}))$/,
	);
	if (!hdgSpdMatch || !hdgSpdMatch.groups) {
		return invalidResult;
	}

	const values = {
		left: Number(hdgSpdMatch.groups.first),
		right: Number(
			hdgSpdMatch.groups.second ?? hdgSpdMatch.groups.secondOnly,
		),
	};

	// TODO: Get actual hdg/spd formatting
	if (
		values.left <= 0 ||
		values.left > 360 ||
		values.right < 50 ||
		values.right > 400
	) {
		return invalidResult;
	}

	let h;
	let s;
	if (values.left) {
		aircraft.flyHeading(values.left);
		h = `H${values.left}`;
	}
	if (values.right < 100) {
		aircraft.maintain({ unit: 'mach', value: values.right / 100 });
		s = `M${values.right}`;
	} else if (values.right >= 100) {
		aircraft.maintain({ unit: 'ias', value: values.right });
		s = `S${values.right}`;
	}

	aircraft.fourthLine = `${h ?? '    '} ${s ?? ''}`.trimEnd();

	// TODO: Get actual command output
	return {
		accept: true,
		message: `4TH LINE ENTRY`,
	};
}

function executeAltitudeCommand(
	state: SimulationState,
	alt: number,
	flid: string,
): CommandResult {
	const aircraft = resolveAircraftReference(state.aircraftList, {
		flid: flid,
	});
	if (!aircraft) return unknownFlid(flid);

	aircraft.alt = alt;

	// TODO: Get actual command output
	return {
		accept: true,
		message: `FLIGHT PLAN ALTITUDE`,
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
