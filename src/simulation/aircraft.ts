import { CALLSIGN_REGEX, CID_REGEX } from '../constants.js';
import { SpeedConversions } from '../math/speedConversions.js';
import { Vector2 } from '../math/vector2.js';
import type { AircraftIdentityRegistry } from './aircraftIdentityRegistry.js';
import type { Atmosphere } from './atmosphere.js';
import { createVelocityDirect, createVelocityOnTrack } from './flightMath.js';
import type { SpeedSpec } from './speed.js';
import { resolveTas } from './speed.js';

export type DatablockSlot = 1 | 2 | 3 | 4 | 6 | 7 | 8 | 9;
export interface AircraftDisplay {
	color: string;
	halo: boolean;
	haloRadiusNm: number;
	showDatablock: boolean;
	datablockSlot: DatablockSlot;
}
type AircraftDisplayOptions = Partial<AircraftDisplay>;

const DEFAULT_AIRCRAFT_DISPLAY: AircraftDisplay = {
	color: 'yellow',
	halo: false,
	haloRadiusNm: 5,
	showDatablock: true,
	datablockSlot: 2,
};

interface BaseAircraftOptions {
	cid?: string;
	callsign?: string;
	datablockFourthLine?: string;
	pos: Vector2;
	alt?: number;
	display?: AircraftDisplayOptions;
	atmosphere: Atmosphere;
	identityRegistry: AircraftIdentityRegistry;
}

type AircraftOptions = BaseAircraftOptions & {
	vel: Vector2;
};

type HeadingAircraftOptions = BaseAircraftOptions & {
	heading: number;
	speed: SpeedSpec;
};

type TrackAircraftOptions = BaseAircraftOptions & {
	track: number;
	speed: SpeedSpec;
};

type DirectAircraftOptions = BaseAircraftOptions & {
	fix: Vector2;
	speed: SpeedSpec;
};

export class Aircraft {
	cid: string;
	callsign: string;
	fourthLine: string;
	pos: Vector2;
	vel: Vector2;
	alt: number;
	display: AircraftDisplay;
	prevPos?: Vector2;
	prevVel?: Vector2;
	histories: Vector2[] = [];
	private readonly atmosphere: Atmosphere;

	constructor({
		cid,
		callsign,
		datablockFourthLine = 'KDFW',
		pos,
		vel,
		alt = 240,
		display,
		atmosphere,
		identityRegistry,
	}: AircraftOptions) {
		const normalizedCid =
			cid === undefined
				? identityRegistry.createCid()
				: normalizeCid(cid);
		const normalizedCallsign =
			callsign === undefined
				? identityRegistry.createCallsign()
				: normalizeCallsign(callsign);

		identityRegistry.claim(normalizedCid, normalizedCallsign);

		this.cid = normalizedCid;
		this.callsign = normalizedCallsign;
		this.fourthLine = normalizeDatablockText(
			'Datablock fourth line',
			datablockFourthLine,
			1,
			8,
		);
		this.pos = pos;
		this.vel = vel;
		this.alt = alt;
		this.display = { ...DEFAULT_AIRCRAFT_DISPLAY, ...display };
		this.atmosphere = atmosphere;
	}

	static onHeading({
		cid,
		callsign,
		datablockFourthLine,
		pos,
		heading,
		speed,
		alt,
		display,
		atmosphere,
		identityRegistry,
	}: HeadingAircraftOptions): Aircraft {
		return new Aircraft({
			cid,
			callsign,
			datablockFourthLine,
			pos,
			vel: Vector2.fromAngle(
				heading,
				resolveTas(speed, alt ?? 240, atmosphere),
			),
			alt,
			display,
			atmosphere,
			identityRegistry,
		});
	}

	static onTrack({
		cid,
		callsign,
		datablockFourthLine,
		pos,
		track,
		speed,
		alt,
		display,
		atmosphere,
		identityRegistry,
	}: TrackAircraftOptions): Aircraft {
		return new Aircraft({
			cid,
			callsign,
			datablockFourthLine,
			pos,
			vel: createVelocityOnTrack(
				track,
				resolveTas(speed, alt ?? 240, atmosphere),
				atmosphere,
			),
			alt,
			display,
			atmosphere,
			identityRegistry,
		});
	}

	static direct({
		cid,
		callsign,
		datablockFourthLine,
		pos,
		fix,
		speed,
		alt,
		display,
		atmosphere,
		identityRegistry,
	}: DirectAircraftOptions): Aircraft {
		return new Aircraft({
			cid,
			callsign,
			datablockFourthLine,
			pos,
			vel: createVelocityDirect(
				fix,
				pos,
				resolveTas(speed, alt ?? 240, atmosphere),
				atmosphere,
			),
			alt,
			display,
			atmosphere,
			identityRegistry,
		});
	}

	get color(): string {
		return this.display.color;
	}

	set color(value: string) {
		this.display.color = value;
	}

	get halo(): boolean {
		return this.display.halo;
	}

	set halo(value: boolean) {
		this.display.halo = value;
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
			this.atmosphere.getTemperatureCAtAltitude(this.alt),
		);
	}

	set mach(value: number) {
		this.tas = resolveTas(
			{ unit: 'mach', value },
			this.alt,
			this.atmosphere,
		);
	}

	get ias(): number {
		return SpeedConversions.tasToIas(
			this.tas,
			this.atmosphere.getPressureAtAltitude(this.alt),
			this.atmosphere.getTemperatureCAtAltitude(this.alt),
		);
	}

	set ias(value: number) {
		this.tas = resolveTas(
			{ unit: 'ias', value },
			this.alt,
			this.atmosphere,
		);
	}

	get trk(): Vector2 {
		return this.vel.copy().add(this.atmosphere.windVel);
	}

	updatePosition(hours: number): void {
		const delta = this.trk.copy().mult(hours);
		this.pos.add(delta);
	}

	turn(degrees: number): void {
		this.vel.rotate(degrees);
	}

	flyHeading(heading: number): void {
		this.vel.setHeading(heading);
	}

	flyTrack(track: number): void {
		this.vel = createVelocityOnTrack(track, this.tas, this.atmosphere);
	}

	increaseSpeed(kt: number): void {
		this.tas += kt;
	}

	reduceSpeed(kt: number): void {
		this.tas -= kt;
	}

	maintain(speed: SpeedSpec): void {
		this.tas = resolveTas(speed, this.alt, this.atmosphere);
	}

	recordHistory(maxHistories: number): void {
		this.histories.push(this.pos.copy());
		if (this.histories.length > maxHistories) {
			this.histories.shift();
		}
	}
}

function normalizeCid(cid: string): string {
	const normalized = cid.trim();
	if (!CID_REGEX.test(normalized)) {
		throw new Error(
			'CID must be 3 characters and first character must be a number.',
		);
	}
	return normalized;
}

function normalizeCallsign(callsign: string): string {
	const normalized = callsign.trim();
	if (!CALLSIGN_REGEX.test(normalized)) {
		throw new Error(
			'Callsign must be 4-7 characters and first character must be a letter.',
		);
	}
	return normalized;
}

function normalizeDatablockText(
	label: string,
	value: string,
	minLength: number,
	maxLength: number,
): string {
	const normalized = value.trim().toUpperCase();
	if (normalized.length < minLength || normalized.length > maxLength) {
		throw new Error(
			`${label} must be ${minLength}-${maxLength} characters.`,
		);
	}
	return normalized;
}
