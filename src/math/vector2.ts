export class Vector2 {
	x: number;
	y: number;

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	static fromXY(x: number, y: number): Vector2 {
		if (!Number.isFinite(x) || !Number.isFinite(y)) {
			throw new RangeError(
				`Could not create vector with coords: (${x}, ${y})`,
			);
		}
		return new Vector2(x, y);
	}

	static fromAngle(headingDeg: number, magnitude = 1): Vector2 {
		if (!Number.isFinite(headingDeg) || !Number.isFinite(magnitude)) {
			throw new RangeError(
				`Could not create vector with heading/magnitude: (${headingDeg}, ${magnitude})`,
			);
		}
		return new Vector2(1, 0).setHeading(headingDeg).mult(magnitude);
	}

	static dot(left: Vector2, right: Vector2): number {
		return left.x * right.x + left.y * right.y;
	}

	static cross(left: Vector2, right: Vector2): number {
		return left.x * right.y - left.y * right.x;
	}

	static distance(left: Vector2, right: Vector2): number {
		return Math.hypot(left.x - right.x, left.y - right.y);
	}

	copy(): Vector2 {
		return new Vector2(this.x, this.y);
	}

	set(x: number, y: number): this {
		this.x = x;
		this.y = y;
		return this;
	}

	add(vector: Vector2): this {
		this.x += vector.x;
		this.y += vector.y;
		return this;
	}

	sub(vector: Vector2): this {
		this.x -= vector.x;
		this.y -= vector.y;
		return this;
	}

	mult(scalar: number): this {
		this.x *= scalar;
		this.y *= scalar;
		return this;
	}

	dot(vector: Vector2): number {
		return Vector2.dot(this, vector);
	}

	magSq(): number {
		return this.x * this.x + this.y * this.y;
	}

	mag(): number {
		return Math.hypot(this.x, this.y);
	}

	setMag(magnitude: number): this {
		const currentMagnitude = this.mag();
		if (currentMagnitude === 0) return this;
		return this.mult(magnitude / currentMagnitude);
	}

	heading(): number {
		const heading =
			(90 - (Math.atan2(this.y, this.x) * 180) / Math.PI) % 360;
		return (heading + 360) % 360;
	}

	setHeading(heading: number): this {
		const normalizedHeading = ((heading % 360) + 360) % 360;
		const magnitude = this.mag();

		if (normalizedHeading === 0) return this.set(0, magnitude);
		if (normalizedHeading === 90) return this.set(magnitude, 0);
		if (normalizedHeading === 180) return this.set(0, -magnitude);
		if (normalizedHeading === 270) return this.set(-magnitude, 0);

		const headingRad = ((90 - normalizedHeading) * Math.PI) / 180;

		this.x = Math.cos(headingRad) * magnitude;
		this.y = Math.sin(headingRad) * magnitude;

		return this;
	}

	rotate(degrees: number): this {
		const angleRad = (-degrees * Math.PI) / 180;
		const cosine = Math.cos(angleRad);
		const sine = Math.sin(angleRad);
		const x = this.x * cosine - this.y * sine;
		this.y = this.x * sine + this.y * cosine;
		this.x = x;
		return this;
	}
}
