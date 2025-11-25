import { ASVector } from '../math/asvector.js';

export class Wind {
	constructor({ from, speed }) {
		this.vel = ASVector.fromAngle(from + 180, speed);
	}
}
