import { MAX_DIGITS } from '../core/constants.js';
import { haltWithError } from '../core/errors.js';
import { simState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import type { Aircraft } from './aircraft.js';
import type { Atmosphere } from './atmosphere.js';

export function createVelocityOnTrack(
	track: number,
	TAS: number,
	wind: Atmosphere = simState.atmosphere,
): ASVector {
	const groundUnitVector = ASVector.fromAngle(track);

	const crosswind = p5.Vector.cross(groundUnitVector, wind.windVel).z;
	const tailwind = p5.Vector.dot(groundUnitVector, wind.windVel);

	const alongTrackTAS = sqrt(TAS ** 2 - crosswind ** 2);
	if (!Number.isFinite(alongTrackTAS)) {
		haltWithError('Aircraft cannot maintain assigned track.');
	}
	const groundSpeed = alongTrackTAS + tailwind;

	const groundVector = groundUnitVector.copy().mult(groundSpeed);
	return ASVector.fromXY(
		groundVector.x - wind.windVel.x,
		groundVector.y - wind.windVel.y,
	);
}

export function createVelocityDirect(
	fix: ASVector,
	pos: ASVector,
	TAS: number,
	wind: Atmosphere = simState.atmosphere,
): ASVector {
	const directVector = ASVector.fromXY(fix.x - pos.x, fix.y - pos.y);
	return createVelocityOnTrack(directVector.asHeading(), TAS, wind);
}

export function closestApproach(ac1: Aircraft, ac2: Aircraft): number {
	const relativePosition = ASVector.fromXY(
		ac2.pos.x - ac1.pos.x,
		ac2.pos.y - ac1.pos.y,
	);
	const relativeVelocity = ASVector.fromXY(
		ac2.vel.x - ac1.vel.x,
		ac2.vel.y - ac1.vel.y,
	);

	if (relativeVelocity.mag() === 0) return relativePosition.mag();

	const t = max(
		-p5.Vector.dot(relativePosition, relativeVelocity) /
			relativeVelocity.magSq(),
		0,
	);

	const closestP1 = ASVector.fromXY(
		ac1.pos.x + ac1.vel.x * t,
		ac1.pos.y + ac1.vel.y * t,
	);
	const closestP2 = ASVector.fromXY(
		ac2.pos.x + ac2.vel.x * t,
		ac2.pos.y + ac2.vel.y * t,
	);

	return p5.Vector.dist(closestP1, closestP2);
}

export function formatNumber(
	n: number,
	preferredDecimals = 0,
	leadingZeroes = 0,
): { n: string; p: string } {
	if (!Number.isFinite(n)) {
		return {
			n: String(n),
			p: '=',
		};
	}

	let [intPart, fracPart = ''] = abs(n).toFixed(preferredDecimals).split('.');
	intPart = intPart.padStart(leadingZeroes, '0');

	const maxDecimals = max(0, MAX_DIGITS - intPart.length);
	const cappedDecimals = min(preferredDecimals, maxDecimals);

	if (cappedDecimals !== preferredDecimals) {
		[intPart, fracPart = ''] = abs(n).toFixed(cappedDecimals).split('.');
		intPart = intPart.padStart(leadingZeroes, '0');
	} else {
		fracPart = fracPart.slice(0, cappedDecimals);
	}

	const formatted =
		(n < 0 ? '-' : '') +
		intPart +
		(cappedDecimals > 0 ? '.' + fracPart : '');

	const precisionChar =
		Number(formatted) === round(n, MAX_DIGITS) ? '=' : '≈';

	return { n: formatted, p: precisionChar };
}

export function getMousePos(x = mouseX, y = mouseY): ASVector {
	const posX = ((x - width / 2) * simState.settings.vRange) / height;
	const posY = (-(y - height / 2) * simState.settings.vRange) / height;

	const roundedX = Math.round(posX * 10) / 10;
	const roundedY = Math.round(posY * 10) / 10;

	return keyIsPressed
		? ASVector.fromXY(roundedX, roundedY)
		: ASVector.fromXY(posX, posY);
}

export function randBetween(minValue: number, maxValue: number): number {
	return Math.random() * (maxValue - minValue) + minValue;
}

export function tempCToK(tempC: number): number {
	return tempC + 273.15;
}
