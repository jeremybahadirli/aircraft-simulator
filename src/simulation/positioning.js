import { simState, uiState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import { Aircraft } from './aircraft.js';
import { separationPracticeConfig } from '../core/separationPracticeConfig.js';

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

	simState.settings.startTimeMins =
		simState.separationPracticeSettings.startTime;

	const ac1 = Aircraft.onHeading({
		pos: ASVector.fromXY(0, 0),
		heading: simState.separationPracticeSettings.a,
		TAS: simState.separationPracticeSettings.ls,
		halo: true,
	});
	const ac2 = Aircraft.onHeading({
		pos: ASVector.fromXY(0, 0),
		heading: 360,
		TAS:
			simState.separationPracticeSettings.ls -
			simState.separationPracticeSettings.s,
	});

	const offset = getOffset(
		ac1,
		ac2,
		simState.separationPracticeSettings.separation
	);

	ac1.flyTrack(simState.separationPracticeSettings.lh);
	ac2.pos = ASVector.fromAngle(
		simState.separationPracticeSettings.lh +
			simState.separationPracticeSettings.a,
		-offset
	);
	ac2.flyTrack(
		simState.separationPracticeSettings.lh +
			simState.separationPracticeSettings.a
	);

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
