import { haltWithError } from '../core/errors.js';

export class ASVector extends p5.Vector {
	constructor(x = 0, y = 0, z = 0) {
		super(x, y, z);
	}

	asHeading() {
		const heading = degrees(this.heading());
		let asHeading = 90 - heading;
		asHeading = ((asHeading % 360) + 360) % 360;
		return asHeading;
	}

	setASHeading(asHeading) {
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
		return new ASVector(x, y);
	}

	static fromAngle(headingDeg, magnitude = 1) {
		if (Number.isNaN(magnitude) || !Number.isFinite(magnitude)) {
			haltWithError(
				`Could not create vector with magnitude: ${magnitude}`
			);
		}

		const v = new ASVector(1, 0);
		v.setASHeading(headingDeg);
		v.setMag(magnitude);
		return v;
	}

	copy() {
		return new ASVector(this.x, this.y, this.z);
	}
}
