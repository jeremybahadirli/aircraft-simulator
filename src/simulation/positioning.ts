import { Vector2 } from '../math/vector2.js';
import { Aircraft } from './aircraft.js';

export function autoPosition(ac1: Aircraft, ac2: Aircraft): void {
	ac2.pos = Vector2.fromXY(ac1.pos.x, ac1.pos.y - getOffset(ac1, ac2));
}

export function getOffset(ac1: Aircraft, ac2: Aircraft, distance = 5): number {
	const relativeTrack = Vector2.fromXY(
		ac2.trk.x - ac1.trk.x,
		ac2.trk.y - ac1.trk.y,
	);
	return Math.abs(
		distance / Math.sin((relativeTrack.heading() * Math.PI) / 180),
	);
}
