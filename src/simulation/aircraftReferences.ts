import type { Aircraft } from './aircraft.js';

interface AircraftReference {
	flid?: string;
	index?: number;
}

export function resolveAircraftReference(
	aircraftList: readonly Aircraft[],
	{ flid, index }: AircraftReference,
): Aircraft | undefined {
	if (flid !== undefined) {
		const normalizedFlid = flid.trim().toUpperCase();
		return aircraftList.find(
			(aircraft) =>
				aircraft.cid === normalizedFlid ||
				aircraft.callsign === normalizedFlid,
		);
	}
	if (index !== undefined) return aircraftList[index];
	throw new Error('Aircraft lookup missing FLID or index.');
}
