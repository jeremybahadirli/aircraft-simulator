import { simState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import { SpeedConversions } from '../math/speedConversions.js';
import type { SpeedSpec } from './speed.js';
import { resolveTas } from './speed.js';
import { createVelocityDirect, createVelocityOnTrack } from './utils.js';

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
	datablockSlot: 1,
};
const MAX_CIDS = 1000;
const MAX_CALLSIGNS = MAX_CIDS * 26 * 26;
const RANDOM_ID_ATTEMPTS = 1000;
const allocatedCids = new Set<string>();
const allocatedCallsigns = new Set<string>();

interface BaseAircraftOptions {
	cid?: string;
	callsign?: string;
	datablockFourthLine?: string;
	pos: ASVector;
	alt?: number;
	display?: AircraftDisplayOptions;
}

type AircraftOptions = BaseAircraftOptions & {
	vel: ASVector;
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
	fix: ASVector;
	speed: SpeedSpec;
};

export class Aircraft {
	cid: string;
	callsign: string;
	fourthLine: string;
	pos: ASVector;
	vel: ASVector;
	alt: number;
	display: AircraftDisplay;
	prevPos?: ASVector;
	prevVel?: ASVector;

	constructor({
		cid,
		callsign,
		datablockFourthLine = 'KDFW',
		pos,
		vel,
		alt = 240,
		display,
	}: AircraftOptions) {
		const normalizedCid = cid === undefined ? generateCid() : normalizeCid(cid);
		const normalizedCallsign =
			callsign === undefined
				? generateCallsign()
				: normalizeDatablockText('Callsign', callsign, 3, 7);

		assertIdentityAvailable('CID', normalizedCid, allocatedCids);
		assertIdentityAvailable(
			'Callsign',
			normalizedCallsign,
			allocatedCallsigns,
		);
		allocatedCids.add(normalizedCid);
		allocatedCallsigns.add(normalizedCallsign);

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
	}: HeadingAircraftOptions): Aircraft {
		return new Aircraft({
			cid,
			callsign,
			datablockFourthLine,
			pos,
			vel: ASVector.fromAngle(heading, resolveTas(speed, alt ?? 240)),
			alt,
			display,
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
	}: TrackAircraftOptions): Aircraft {
		return new Aircraft({
			cid,
			callsign,
			datablockFourthLine,
			pos,
			vel: createVelocityOnTrack(track, resolveTas(speed, alt ?? 240)),
			alt,
			display,
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
	}: DirectAircraftOptions): Aircraft {
		return new Aircraft({
			cid,
			callsign,
			datablockFourthLine,
			pos,
			vel: createVelocityDirect(fix, pos, resolveTas(speed, alt ?? 240)),
			alt,
			display,
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

export function resetAircraftIdentityRegistry(): void {
	allocatedCids.clear();
	allocatedCallsigns.clear();
}

function generateCid(): string {
	if (allocatedCids.size >= MAX_CIDS) {
		throw new Error('No unique 3-digit CIDs remain.');
	}

	for (let i = 0; i < RANDOM_ID_ATTEMPTS; i++) {
		const cid = generateRandomDigits(3);
		if (!allocatedCids.has(cid)) return cid;
	}

	for (let i = 0; i < MAX_CIDS; i++) {
		const cid = i.toString().padStart(3, '0');
		if (!allocatedCids.has(cid)) return cid;
	}

	throw new Error('No unique 3-digit CIDs remain.');
}

function generateCallsign(): string {
	if (allocatedCallsigns.size >= MAX_CALLSIGNS) {
		throw new Error('No unique generated callsigns remain.');
	}

	for (let i = 0; i < RANDOM_ID_ATTEMPTS; i++) {
		const callsign = `N${generateRandomDigits(3)}${generateRandomLetters(2)}`;
		if (!allocatedCallsigns.has(callsign)) return callsign;
	}

	for (let number = 0; number < MAX_CIDS; number++) {
		for (let firstLetter = 0; firstLetter < 26; firstLetter++) {
			for (let secondLetter = 0; secondLetter < 26; secondLetter++) {
				const callsign = `N${number
					.toString()
					.padStart(3, '0')}${letterAt(firstLetter)}${letterAt(
					secondLetter,
				)}`;
				if (!allocatedCallsigns.has(callsign)) return callsign;
			}
		}
	}

	throw new Error('No unique generated callsigns remain.');
}

function generateRandomDigits(length: number): string {
	let value = '';
	for (let i = 0; i < length; i++) {
		value += Math.floor(Math.random() * 10).toString();
	}
	return value;
}

function generateRandomLetters(length: number): string {
	const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let value = '';
	for (let i = 0; i < length; i++) {
		value += letters[Math.floor(Math.random() * letters.length)];
	}
	return value;
}

function letterAt(index: number): string {
	return String.fromCharCode('A'.charCodeAt(0) + index);
}

function normalizeCid(cid: string): string {
	const normalized = cid.trim();
	if (!/^\d{3}$/.test(normalized)) {
		throw new Error('CID must be exactly 3 digits.');
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

function assertIdentityAvailable(
	label: string,
	value: string,
	allocatedValues: Set<string>,
): void {
	if (allocatedValues.has(value)) {
		throw new Error(`${label} ${value} is already assigned.`);
	}
}
