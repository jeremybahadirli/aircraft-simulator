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

function closestApproach(ac1, ac2) {
	const p1 = ac1.pos;
	const v1 = ac1.vel;
	const p2 = ac2.pos;
	const v2 = ac2.vel;

	const relativePosition = p5.Vector.sub(p2, p1);
	const relativeVelocity = p5.Vector.sub(v2, v1);

	if (relativeVelocity.magSq() === 0) {
		return {
			t: 0,
			d: relativePosition.mag(),
		};
	}

	let t = -relativePosition.dot(relativeVelocity) / relativeVelocity.magSq();

	if (t < 0) t = 0;

	const p1At = p5.Vector.add(p1, p5.Vector.mult(v1, t));
	const p2At = p5.Vector.add(p2, p5.Vector.mult(v2, t));

	return {
		t,
		d: p5.Vector.dist(p1At, p2At),
	};
}

function error(msg) {
	frameRate(0);
	Logger.log(msg);
}
