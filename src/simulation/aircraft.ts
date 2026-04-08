import { simState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import { resolveTas } from './speed.js';
import { createVelocityDirect, createVelocityOnTrack } from './utils.js';
import type { SpeedSpec } from './speed.js';
import { SpeedConversions } from '../math/speedConversions.js';

interface AircraftOptions {
	pos: ASVector;
	vel: ASVector;
	alt?: number;
	halo?: boolean;
	color?: string;
}

interface HeadingAircraftOptions {
	pos: ASVector;
	heading: number;
	speed: SpeedSpec;
	alt?: number;
	halo?: boolean;
	color?: string;
}

interface TrackAircraftOptions {
	pos: ASVector;
	track: number;
	speed: SpeedSpec;
	alt?: number;
	halo?: boolean;
	color?: string;
}

interface DirectAircraftOptions {
	pos: ASVector;
	fix: ASVector;
	speed: SpeedSpec;
	alt?: number;
	halo?: boolean;
	color?: string;
}

export class Aircraft {
	pos: ASVector;
	vel: ASVector;
	alt: number;
	halo: boolean;
	color: string;
	prevPos?: ASVector;
	prevVel?: ASVector;

	constructor({
		pos,
		vel,
		alt = 24000,
		halo = false,
		color = 'yellow',
	}: AircraftOptions) {
		this.pos = pos;
		this.vel = vel;
		this.alt = alt;
		this.halo = halo;
		this.color = color;
	}

	static onHeading({
		pos,
		heading,
		speed,
		alt,
		halo,
		color,
	}: HeadingAircraftOptions): Aircraft {
		return new Aircraft({
			pos,
			vel: ASVector.fromAngle(heading, resolveTas(speed, alt ?? 24000)),
			alt,
			halo,
			color,
		});
	}

	static onTrack({
		pos,
		track,
		speed,
		alt,
		halo,
		color,
	}: TrackAircraftOptions): Aircraft {
		return new Aircraft({
			pos,
			vel: createVelocityOnTrack(track, resolveTas(speed, alt ?? 24000)),
			alt,
			halo,
			color,
		});
	}

	static direct({
		pos,
		fix,
		speed,
		alt,
		halo,
		color,
	}: DirectAircraftOptions): Aircraft {
		return new Aircraft({
			pos,
			vel: createVelocityDirect(
				fix,
				pos,
				resolveTas(speed, alt ?? 24000),
			),
			alt,
			halo,
			color,
		});
	}

	get tas(): number {
		return this.vel.mag();
	}

	set tas(value: number) {
		this.vel.setMag(value);
	}

	get mach(): number {
		return SpeedConversions.tasToMach(
			this.tas,
			simState.atmosphere.getTemperatureCAtAltitude(this.alt),
		);
	}

	set mach(value: number) {
		this.tas = resolveTas({ unit: 'mach', value }, this.alt);
	}

	get ias(): number {
		return SpeedConversions.tasToIas(
			this.tas,
			simState.atmosphere.getPressureAtAltitude(this.alt),
			simState.atmosphere.getTemperatureCAtAltitude(this.alt),
		);
	}

	set ias(value: number) {
		this.tas = resolveTas({ unit: 'ias', value }, this.alt);
	}

	get trk(): ASVector {
		return ASVector.fromXY(
			this.vel.x + simState.atmosphere.windVel.x,
			this.vel.y + simState.atmosphere.windVel.y,
		);
	}

	updatePosition(hours: number): void {
		const delta = this.trk.copy().mult(hours);
		this.pos.add(delta);
	}

	turn(degrees: number): void {
		this.vel.asRotate(degrees);
	}

	flyHeading(heading: number): void {
		this.vel.setASHeading(heading);
	}

	flyTrack(track: number): void {
		this.vel = createVelocityOnTrack(track, this.tas);
	}

	increaseSpeed(kt: number): void {
		this.tas += kt;
	}

	reduceSpeed(kt: number): void {
		this.tas -= kt;
	}

	maintain(speed: SpeedSpec): void {
		this.tas = resolveTas(speed, this.alt);
	}
}
