import { simState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import { Aircraft } from './aircraft.js';

export function autoPosition(i, j) {
	const ac1 = simState.aircraftList[i];
	const ac2 = simState.aircraftList[j];

	const offset = abs(5 / sin(p5.Vector.sub(ac2.trk, ac1.trk).asHeading()));

	simState.aircraftList[j] = new Aircraft({
		pos: p5.Vector.add(ac1.pos, ASVector.fromXY(0, -offset)),
		vel: ac2.vel,
		halo: ac2.halo,
		color: ac2.color,
	});
}
