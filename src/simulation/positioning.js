import { simState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import { Aircraft } from './aircraft.js';

export function autoPosition(ac1, ac2) {
	simState.aircraftList[1] = Aircraft.onHeading({
		pos: ASVector.fromAngle(
			180,
			5 / sin(-ac2.trk.copy().sub(ac1.trk).asHeading())
		),
		heading: ac2.vel.asHeading(),
		TAS: ac2.vel.mag(),
	});
}
