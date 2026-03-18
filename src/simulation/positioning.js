import { simState, uiState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import { Aircraft } from './aircraft.js';
import { separationPracticeConfig } from '../core/separationPracticeConfig.js';
import { randBetween } from './utils.js';

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

export function separationPractice() {
	separationPracticeConfig();
	const leadTrack = randBetween(0, 360);

	simState.settings.startTimeMins =
		simState.separationPracticeSettings.startTime;

	const ac1 = Aircraft.onHeading({
		pos: ASVector.fromXY(0, 0),
		heading: simState.separationPracticeSettings.angle,
		TAS: simState.separationPracticeSettings.leadSpeed,
		halo: true,
	});
	const ac2 = Aircraft.onHeading({
		pos: ASVector.fromXY(0, 0),
		heading: 360,
		TAS:
			simState.separationPracticeSettings.leadSpeed -
			simState.separationPracticeSettings.speedDifference,
	});

	const offset = getOffset(
		ac1,
		ac2,
		simState.separationPracticeSettings.separation
	);

	ac1.flyTrack(leadTrack);
	ac2.pos = ASVector.fromAngle(
		leadTrack + simState.separationPracticeSettings.angle,
		-offset
	);
	ac2.flyTrack(leadTrack + simState.separationPracticeSettings.angle);

	simState.aircraftList = [
		ac1,
		ac2,
		Aircraft.stationary({
			pos: ASVector.fromXY(0, 0),
			color: 'gray',
		}),
	];
	simState.stats = simState.separationPracticeStats;
	simState.proximities = simState.separationPracticeProximities;
	simState.events = [];

	uiState.displayPracticeAnswerButton = true;
}

function getOffset(ac1, ac2, dist = 5) {
	return abs(dist / sin(p5.Vector.sub(ac2.trk, ac1.trk).asHeading()));
}
