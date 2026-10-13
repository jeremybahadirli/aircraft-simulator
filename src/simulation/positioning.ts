import { ASVector } from '../math/asvector.js';
import { Aircraft } from './aircraft.js';

export function autoPosition(ac1: Aircraft, ac2: Aircraft): void {
	ac2.pos = ASVector.fromXY(ac1.pos.x, ac1.pos.y - getOffset(ac1, ac2));
}

export function getOffset(
	ac1: Aircraft,
	ac2: Aircraft,
	distance = 5,
): number {
	const relativeTrack = ASVector.fromXY(
		ac2.trk.x - ac1.trk.x,
		ac2.trk.y - ac1.trk.y,
	);
	return abs(distance / sin(relativeTrack.asHeading()));
}
