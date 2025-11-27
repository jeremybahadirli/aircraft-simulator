import { haltWithError } from '../core/errors.js';

export class ASVector extends p5.Vector {
	constructor(x = 0, y = 0) {
		super(x, y);
	}

	asHeading() {
		const heading = degrees(this.heading());
		let asHeading = 90 - heading;
		asHeading = ((asHeading % 360) + 360) % 360;
		return asHeading;
	}

	setASHeading(asHeading) {
		const h = ((asHeading % 360) + 360) % 360;
		const mag = this.mag();

		if (h === 0) {
			this.set(0, mag);
		} else if (h === 90) {
			this.set(mag, 0);
		} else if (h === 180) {
			this.set(0, -mag);
		} else if (h === 270) {
			this.set(-mag, 0);
		} else {
			this.setHeading(radians(90 - asHeading));
		}

		return this;
	}

	setASHeading2(asHeading) {
		const heading = radians(90 - asHeading);
		this.setHeading(heading);
		return this;
	}

	asRotate(asDegrees) {
		const rad = radians(-asDegrees);
		this.rotate(rad);
		return this;
	}

	static fromXY(x, y) {
		if (!Number.isFinite(x) || !Number.isFinite(y)) {
			haltWithError(`Could not create vector with coords: (${x}, ${y})`);
		}

		return new ASVector(x, y);
	}

	static fromAngle(headingDeg, magnitude = 1) {
		if (!Number.isFinite(magnitude)) {
			haltWithError(`Could not create vector with mag: ${magnitude}`);
		}

		const v = new ASVector(1, 0);
		v.setASHeading(headingDeg);
		v.setMag(magnitude);
		return v;
	}

	copy() {
		return new ASVector(this.x, this.y);
	}
}
