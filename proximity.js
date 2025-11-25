class Proximity {
	constructor(ac1, ac2) {
		this.ac1 = ac1;
		this.ac2 = ac2;
		this.proximity = Number.POSITIVE_INFINITY;
		this.previousProximity = Number.POSITIVE_INFINITY;
		this.lowestProximity = Number.POSITIVE_INFINITY;
		this.updateCalculated();
	}

	updateProximity() {
		this.previousProximity = this.proximity;
		this.proximity = p5.Vector.dist(
			aircraftList[this.ac1].pos,
			aircraftList[this.ac2].pos
		);

		if (this.proximity < this.previousProximity) {
			this.lowestProximity = Math.min(
				this.lowestProximity,
				this.proximity
			);
		} else {
			this.lowestProximity = Math.min(
				this.lowestProximity,
				this.lowestCalculated
			);
		}
	}

	updateCalculated() {
		this.lowestCalculated = closestApproach(
			aircraftList[this.ac1],
			aircraftList[this.ac2]
		);
	}
}
