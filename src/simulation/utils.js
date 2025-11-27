import { MAX_DIGITS } from '../core/constants.js';
import { haltWithError } from '../core/errors.js';
import { simState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';

export function createVelocityOnTrack(track, TAS, wind = simState.wind) {
	const groundUnitVector = ASVector.fromAngle(track);

	const crosswind = p5.Vector.cross(groundUnitVector, wind.vel).z;
	const tailwind = p5.Vector.dot(groundUnitVector, wind.vel);

	const alongTrackTAS = sqrt(TAS ** 2 - crosswind ** 2);
	if (!Number.isFinite(alongTrackTAS)) {
		haltWithError('Aircraft cannot maintain assigned track.');
	}
	const groundSpeed = alongTrackTAS + tailwind;

	const groundVector = p5.Vector.mult(groundUnitVector, groundSpeed);
	const airVector = p5.Vector.sub(groundVector, wind.vel);
	return airVector;
}

export function createVelocityDirect(fix, pos, TAS, wind = simState.wind) {
	const directVector = p5.Vector.sub(fix, pos);
	return createVelocityOnTrack(directVector.asHeading(), TAS, wind);
}

export function closestApproach(ac1, ac2) {
	const relativePosition = p5.Vector.sub(ac2.pos, ac1.pos);
	const relativeVelocity = p5.Vector.sub(ac2.vel, ac1.vel);

	if (relativeVelocity.mag() === 0) return relativePosition.mag();

	const t = max(
		-p5.Vector.dot(relativePosition, relativeVelocity) /
			relativeVelocity.magSq(),
		0
	);

	const closestP1 = p5.Vector.add(ac1.pos, p5.Vector.mult(ac1.vel, t));
	const closestP2 = p5.Vector.add(ac2.pos, p5.Vector.mult(ac2.vel, t));

	return p5.Vector.dist(closestP1, closestP2);
}

export function formatNumber(n, preferredDecimals = 0, leadingZeroes = 0) {
	if (!Number.isFinite(n)) return String(n);

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

	const isExact = Number(formatted) === n;

	return { n: formatted, isExact: isExact };
}
