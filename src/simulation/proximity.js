import { simState } from '../core/state.js';
import { closestApproach } from './utils.js';

export class Proximity {
	constructor(ac1, ac2) {
		this.ac1 = ac1;
		this.ac2 = ac2;
		this.proximity = Number.POSITIVE_INFINITY;
		this.previousProximity = Number.POSITIVE_INFINITY;
		this.lowestProximity = Number.POSITIVE_INFINITY;
	}

	static create(ac1, ac2) {
		const allValidAircraft = (...idx) =>
			idx.every(
				(i) =>
					Number.isInteger(i) &&
					i >= 0 &&
					i < simState.aircraftList.length
			);

		if (allValidAircraft(ac1, ac2)) {
			return new Proximity(ac1, ac2);
		} else {
			return null;
		}
	}

	updateProximity(dt) {
		const a1 = simState.aircraftList[this.ac1];
		const a2 = simState.aircraftList[this.ac2];

		this.previousProximity = this.proximity;
		this.proximity = p5.Vector.dist(a1.pos, a2.pos);

		this.lowestProximity = min(this.lowestProximity, this.proximity);

		const r0 = p5.Vector.sub(a2.prevPos ?? a2.pos, a1.prevPos ?? a1.pos);
		const v = p5.Vector.sub(a2.prevVel ?? a2.vel, a1.prevVel ?? a1.vel);

		const vv = v.dot(v);
		if (vv > 1e-9) {
			let tStar = -r0.dot(v) / vv;
			tStar = constrain(tStar, 0, dt);

			const rStar = p5.Vector.add(r0, p5.Vector.mult(v, tStar));
			const minThisStep = rStar.mag();

			this.lowestProximity = min(this.lowestProximity, minThisStep);
		}
	}
}
