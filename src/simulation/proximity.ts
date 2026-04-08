import { simState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';

interface AcToAcOptions {
	ac1: number;
	ac2: number;
	name?: string;
}

interface AcToXYOptions {
	ac1: number;
	x: number;
	y: number;
	name?: string;
}

interface AcToFRDOptions {
	ac1: number;
	r: number;
	d: number;
	name?: string;
}

export class Proximity {
	name: string;
	ac1: number;
	ac2?: number;
	p?: ASVector;
	proximity: number;
	previousProximity: number;
	lowestProximity: number;

	constructor(name: string, ac1: number, ac2?: number, p?: ASVector) {
		this.name = name;
		this.ac1 = ac1;
		this.ac2 = ac2;
		this.p = p;
		this.proximity = Number.POSITIVE_INFINITY;
		this.previousProximity = Number.POSITIVE_INFINITY;
		this.lowestProximity = Number.POSITIVE_INFINITY;
	}

	static acToAc({
		ac1,
		ac2,
		name = `Aircraft ${ac1}-${ac2}`,
	}: AcToAcOptions): Proximity {
		return new Proximity(name, ac1, ac2, undefined);
	}

	static acToXY({
		ac1,
		x,
		y,
		name = `Aircraft ${ac1}-(${x}, ${y})`,
	}: AcToXYOptions): Proximity {
		return new Proximity(name, ac1, undefined, ASVector.fromXY(x, y));
	}

	static acToFRD({
		ac1,
		r,
		d,
		name = `Aircraft ${ac1}-(${r}º ${d} NM)`,
	}: AcToFRDOptions): Proximity {
		return new Proximity(name, ac1, undefined, ASVector.fromAngle(r, d));
	}

	updateProximity(dt: number): void {
		const a1 = simState.aircraftList[this.ac1];

		const isAcTarget = this.ac2 !== undefined;
		const isPointTarget = this.p !== undefined;

		if (!isAcTarget && !isPointTarget) {
			throw new Error(`Proximity "${this.name}" has no valid target.`);
		}

		this.previousProximity = this.proximity;

		let currentTargetPos: ASVector;
		let prevTargetPos: ASVector;
		let targetVel: ASVector;

		if (isAcTarget) {
			const a2 = simState.aircraftList[this.ac2!];
			currentTargetPos = a2.pos;
			prevTargetPos = a2.prevPos ?? a2.pos;
			targetVel = a2.prevVel ?? a2.vel;
		} else {
			currentTargetPos = this.p!;
			prevTargetPos = this.p!;
			targetVel = ASVector.fromXY(0, 0);
		}

		this.proximity = p5.Vector.dist(a1.pos, currentTargetPos);
		this.lowestProximity = min(this.lowestProximity, this.proximity);

		const prevPos1 = a1.prevPos ?? a1.pos;
		const prevVel1 = a1.prevVel ?? a1.vel;

		const r0 = ASVector.fromXY(
			prevTargetPos.x - prevPos1.x,
			prevTargetPos.y - prevPos1.y,
		);

		const v = ASVector.fromXY(
			targetVel.x - prevVel1.x,
			targetVel.y - prevVel1.y,
		);

		const vv = v.dot(v);
		if (vv > 1e-9) {
			let tStar = -r0.dot(v) / vv;
			tStar = constrain(tStar, 0, dt);

			const rStar = ASVector.fromXY(
				r0.x + v.x * tStar,
				r0.y + v.y * tStar,
			);

			const minThisStep = rStar.mag();
			this.lowestProximity = min(this.lowestProximity, minThisStep);
		}
	}
}
