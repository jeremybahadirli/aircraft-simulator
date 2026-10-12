import { simState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import type { Aircraft } from './aircraft.js';

interface AcToAcOptions {
	ac1: Aircraft;
	ac2: Aircraft;
	name?: string;
}

interface AcToXYOptions {
	ac1: Aircraft;
	x: number;
	y: number;
	name?: string;
}

interface AcToFRDOptions {
	ac1: Aircraft;
	r: number;
	d: number;
	name?: string;
}

export class Proximity {
	name: string;
	ac1: Aircraft;
	ac2?: Aircraft;
	p?: ASVector;
	proximity: number;
	previousProximity: number;
	lowestProximity: number;

	constructor(name: string, ac1: Aircraft, ac2?: Aircraft, p?: ASVector) {
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
		name = `${ac1.callsign}-${ac2.callsign}`,
	}: AcToAcOptions): Proximity {
		return new Proximity(name, ac1, ac2, undefined);
	}

	static acToXY({
		ac1,
		x,
		y,
		name = `${ac1.callsign}-(${x}, ${y})`,
	}: AcToXYOptions): Proximity {
		return new Proximity(name, ac1, undefined, ASVector.fromXY(x, y));
	}

	static acToFRD({
		ac1,
		r,
		d,
		name = `${ac1.callsign}-(${r}° ${d} NM)`,
	}: AcToFRDOptions): Proximity {
		return new Proximity(name, ac1, undefined, ASVector.fromAngle(r, d));
	}

	updateProximity(dt: number): void {
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
			currentTargetPos = this.ac2!.pos;
			prevTargetPos = this.ac2!.prevPos ?? this.ac2!.pos;
			targetVel = this.ac2!.prevVel ?? this.ac2!.vel;
		} else {
			currentTargetPos = this.p!;
			prevTargetPos = this.p!;
			targetVel = ASVector.fromXY(0, 0);
		}

		this.proximity = p5.Vector.dist(this.ac1.pos, currentTargetPos);
		this.lowestProximity = Math.min(this.lowestProximity, this.proximity);

		const prevPos1 = this.ac1.prevPos ?? this.ac1.pos;
		const prevVel1 = this.ac1.prevVel ?? this.ac1.vel;

		const r0 = p5.Vector.sub(prevPos1, prevTargetPos);
		const v = p5.Vector.sub(prevVel1, targetVel);

		const vv = v.dot(v);
		if (vv < 1e-9) {
			return;
		}

		// tStar: time at closest approach
		let tStar = -r0.dot(v) / vv;
		tStar = constrain(tStar, 0, dt);

		// rStar: distance at tStar
		const rStar = v.copy().mult(tStar).add(r0);

		const minThisStep = rStar.mag();
		this.lowestProximity = Math.min(this.lowestProximity, minThisStep);
	}
}
