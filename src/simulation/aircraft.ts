import { simState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import { SpeedConversions } from '../math/speedConversions.js';
import { createVelocityDirect, createVelocityOnTrack } from './utils.js';

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
	TAS: number;
	alt?: number;
	halo?: boolean;
	color?: string;
}

interface TrackAircraftOptions {
	pos: ASVector;
	track: number;
	TAS: number;
	alt?: number;
	halo?: boolean;
	color?: string;
}

interface DirectAircraftOptions {
	pos: ASVector;
	fix: ASVector;
	TAS: number;
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
		TAS,
		alt,
		halo,
		color,
	}: HeadingAircraftOptions): Aircraft {
		return new Aircraft({
			pos,
			vel: ASVector.fromAngle(heading, TAS),
			alt,
			halo,
			color,
		});
	}

	static onTrack({
		pos,
		track,
		TAS,
		alt,
		halo,
		color,
	}: TrackAircraftOptions): Aircraft {
		return new Aircraft({
			pos,
			vel: createVelocityOnTrack(track, TAS),
			alt,
			halo,
			color,
		});
	}

	static direct({
		pos,
		fix,
		TAS,
		alt,
		halo,
		color,
	}: DirectAircraftOptions): Aircraft {
		return new Aircraft({
			pos,
			vel: createVelocityDirect(fix, pos, TAS),
			alt,
			halo,
			color,
		});
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
		this.vel = createVelocityOnTrack(track, this.vel.mag());
	}

	increaseSpeed(kt: number): void {
		this.vel.setMag(this.vel.mag() + kt);
	}

	reduceSpeed(kt: number): void {
		this.vel.setMag(this.vel.mag() - kt);
	}

	maintain(TAS: number): void {
		this.vel.setMag(TAS);
	}

	getMach(): number {
		const tempC = simState.atmosphere.getTemperatureCAtAltitude(this.alt);
		return SpeedConversions.tasToMach(this.vel.mag(), tempC);
	}

	getIas(): number {
		const pressure = simState.atmosphere.getPressureAtAltitude(this.alt);
		const tempC = simState.atmosphere.getTemperatureCAtAltitude(this.alt);
		return SpeedConversions.tasToCas(this.vel.mag(), pressure, tempC);
	}
}
