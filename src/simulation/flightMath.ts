import { Vector2 } from '../math/vector2.js';
import type { Aircraft } from './aircraft.js';
import type { Atmosphere } from './atmosphere.js';

export function createVelocityOnTrack(
	track: number,
	trueAirspeed: number,
	atmosphere: Atmosphere,
): Vector2 {
	const groundUnitVector = Vector2.fromAngle(track);
	const crosswind = Vector2.cross(groundUnitVector, atmosphere.windVel);
	const tailwind = Vector2.dot(groundUnitVector, atmosphere.windVel);
	const alongTrackAirspeed = Math.sqrt(trueAirspeed ** 2 - crosswind ** 2);
	if (!Number.isFinite(alongTrackAirspeed)) {
		throw new Error('Aircraft cannot maintain assigned track.');
	}

	const groundSpeed = alongTrackAirspeed + tailwind;
	return groundUnitVector.copy().mult(groundSpeed).sub(atmosphere.windVel);
}

export function createVelocityDirect(
	fix: Vector2,
	position: Vector2,
	trueAirspeed: number,
	atmosphere: Atmosphere,
): Vector2 {
	const directVector = fix.copy().sub(position);
	return createVelocityOnTrack(
		directVector.heading(),
		trueAirspeed,
		atmosphere,
	);
}

export function closestApproach(ac1: Aircraft, ac2: Aircraft): number {
	const relativePosition = ac2.pos.copy().sub(ac1.pos);
	const relativeVelocity = ac2.vel.copy().sub(ac1.vel);
	const relativeVelocityMagnitudeSq = relativeVelocity.magSq();
	if (relativeVelocityMagnitudeSq === 0) return relativePosition.mag();

	const time = Math.max(
		-Vector2.dot(relativePosition, relativeVelocity) /
			relativeVelocityMagnitudeSq,
		0,
	);
	const closestPosition1 = ac1.pos.copy().add(ac1.vel.copy().mult(time));
	const closestPosition2 = ac2.pos.copy().add(ac2.vel.copy().mult(time));
	return Vector2.distance(closestPosition1, closestPosition2);
}
