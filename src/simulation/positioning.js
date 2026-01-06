import { simState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import { Aircraft } from './aircraft.js';
import { Proximity } from '../simulation/proximity.js';

export function autoPosition(i, j) {
	const ac1 = simState.aircraftList[i];
	const ac2 = simState.aircraftList[j];

	simState.aircraftList[j] = new Aircraft({
		pos: p5.Vector.add(ac1.pos, ASVector.fromXY(0, -getOffset(ac1, ac2))),
		vel: ac2.vel,
		halo: ac2.halo,
		color: ac2.color,
	});
}

function getOffset(ac1, ac2) {
	return abs(5 / sin(p5.Vector.sub(ac2.trk, ac1.trk).asHeading()));
}

export function separationPractice() {
	const startTime = randIntBetween(-2, -8);
	const overSeparation = randBetween(-0.5, 0.5);
	const lh = randIntBetween(0, 359);
	const ls = randIntBetween(300, 600);
	const a = randIntBetween(15, 135);
	const s = randIntBetween(-60, 60);

	simState.settings.startTimeMins = startTime;

	const offset = getOffset(
		Aircraft.onHeading({
			pos: ASVector.fromXY(0, 0),
			heading: a,
			TAS: ls,
			halo: true,
		}),
		Aircraft.onHeading({
			pos: ASVector.fromXY(0, 0),
			heading: 360,
			TAS: ls - s,
		})
	);

	simState.aircraftList = [
		Aircraft.onHeading({
			pos: ASVector.fromAngle(0, 0),
			heading: lh,
			TAS: ls,
			halo: true,
		}),
		Aircraft.onHeading({
			pos: ASVector.fromAngle(lh + a, -offset + overSeparation),
			heading: lh + a,
			TAS: ls - s,
		}),
	];
	simState.loggers = [Proximity.create(0, 1)];
	simState.events = [];
}

function randIntBetween(min, max) {
	return Math.floor(randBetween(min, max));
}

function randBetween(min, max) {
	return Math.random() * (max - min + 1) + min;
}
