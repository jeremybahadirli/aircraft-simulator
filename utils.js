function createVelocityOnTrack(track, TAS, wind) {
	const groundUnitVector = ASVector.fromAngle(track);

	const crosswind = p5.Vector.cross(groundUnitVector, wind.vel).z;
	const tailwind = p5.Vector.dot(groundUnitVector, wind.vel);

	const alongTrackTAS = sqrt(TAS ** 2 - crosswind ** 2);
	if (Number.isNaN(alongTrackTAS)) {
		error('Aircraft cannot maintain assigned track.');
	}
	const groundSpeed = alongTrackTAS + tailwind;

	const groundVector = groundUnitVector.mult(groundSpeed);
	const airVector = groundVector.sub(wind.vel);
	return airVector;
}

function createVelocityDirect(fix, pos, TAS, wind) {
	const directVector = p5.Vector.sub(fix, pos);
	return createVelocityOnTrack(directVector.asHeading(), TAS, wind);
}

function autoPosition(ac1, ac2) {
	aircraftList[1] = Aircraft.onHeading({
		pos: ASVector.fromAngle(
			180,
			5 / sin(-ac2.trk.copy().sub(ac1.trk).asHeading())
		),
		heading: ac2.vel.asHeading(),
		TAS: ac2.vel.mag(),
	});
}

function closestApproach(ac1, ac2) {
	const relativePosition = p5.Vector.sub(ac2.pos, ac1.pos);
	const relativeVelocity = p5.Vector.sub(ac2.vel, ac1.vel);

	if (relativeVelocity.mag() === 0) return relativePosition.mag();

	const t = max(
		-relativePosition.dot(relativeVelocity) / relativeVelocity.magSq(),
		0
	);

	const closestP1 = p5.Vector.add(ac1.pos, p5.Vector.mult(ac1.vel, t));
	const closestP2 = p5.Vector.add(ac2.pos, p5.Vector.mult(ac2.vel, t));

	return p5.Vector.dist(closestP1, closestP2);
}

function error(msg) {
	frameRate(0);
	stageLog(msg);
}
