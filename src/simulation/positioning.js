import { simState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import { Aircraft } from './aircraft.js';

export function autoPosition(ac1, ac2) {
	// Intuitive formula: abs(5 / sin(p5.Vector.sub(ac2.trk, ac1.trk).asHeading()))
	// Replace abs with %180 to eliminate floating-point error at 90º

	simState.aircraftList[1] = new Aircraft({
		pos: ASVector.fromAngle(
			180,
			5 / sin(p5.Vector.sub(ac2.trk, ac1.trk).asHeading() % 180)
		),
		vel: ac2.vel,
		halo: ac2.halo,
		color: ac2.color,
	});
}
