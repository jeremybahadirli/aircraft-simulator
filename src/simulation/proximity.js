import { simState } from '../core/state.js';
import { closestApproach } from './utils.js';

export class Proximity {
	constructor(ac1, ac2) {
		this.ac1 = ac1;
		this.ac2 = ac2;
		this.proximity = Number.POSITIVE_INFINITY;
		this.previousProximity = Number.POSITIVE_INFINITY;
		this.lowestProximity = Number.POSITIVE_INFINITY;
		this.updateCalculated();
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

	updateProximity() {
		this.previousProximity = this.proximity;
		this.proximity = p5.Vector.dist(
			simState.aircraftList[this.ac1].pos,
			simState.aircraftList[this.ac2].pos
		);

		if (this.proximity < this.lowestCalculated) return;
		if (this.proximity < this.previousProximity) {
			this.lowestProximity = min(this.lowestProximity, this.proximity);
		} else {
			this.lowestProximity = min(
				this.lowestProximity,
				this.lowestCalculated
			);
		}
	}

	updateCalculated() {
		this.lowestCalculated = closestApproach(
			simState.aircraftList[this.ac1],
			simState.aircraftList[this.ac2]
		);
	}
}
