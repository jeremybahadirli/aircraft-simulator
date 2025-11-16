class Wind {
	constructor({ from, speed }) {
		this.vel = ASVector.fromAngle(from + 180, speed);
	}
}
