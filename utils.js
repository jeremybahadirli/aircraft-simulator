function createVelocityOnTrack(track, TAS, wind) {
	const groundUnitVector = ASVector.fromAngle(track);

	const crosswind = p5.Vector.cross(groundUnitVector, wind.vel).z;
	const tailwind = p5.Vector.dot(groundUnitVector, wind.vel);

	const alongTrackTAS = sqrt(TAS ** 2 - crosswind ** 2);
	if (Number.isNaN(alongTrackTAS)) {
		print('Aircraft cannot maintain assigned track.');
		throw Error;
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
