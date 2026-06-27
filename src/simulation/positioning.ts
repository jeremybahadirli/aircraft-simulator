import { separationPracticeConfig } from '../core/separationPracticeConfig.js';
import { simState, uiState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import { Aircraft, resetAircraftIdentityRegistry } from './aircraft.js';
import { randBetween } from './utils.js';

export function autoPosition(i: number, j: number): void {
	const ac1 = simState.aircraftList[i];
	const ac2 = simState.aircraftList[j];

	ac2.pos = ASVector.fromXY(ac1.pos.x, ac1.pos.y - getOffset(ac1, ac2));
}

export function separationPractice(): void {
	separationPracticeConfig();
	const settings = simState.separationPracticeSettings;

	if (!settings) return;

	resetAircraftIdentityRegistry();

	const leadTrack = randBetween(0, 360);

	simState.settings.startTimeMins = settings.startTime;

	const ac1 = Aircraft.onHeading({
		pos: ASVector.fromXY(0, 0),
		heading: settings.angle,
		speed: { unit: 'tas', value: settings.leadSpeed },
		display: {
			halo: true,
		},
	});
	const ac2 = Aircraft.onHeading({
		pos: ASVector.fromXY(0, 0),
		heading: 360,
		speed: {
			unit: 'tas',
			value: settings.leadSpeed - settings.speedDifference,
		},
	});

	const offset = getOffset(ac1, ac2, settings.separation);

	ac1.flyTrack(leadTrack);
	ac2.pos = ASVector.fromAngle(leadTrack + settings.angle, -offset);
	ac2.flyTrack(leadTrack + settings.angle);

	simState.aircraftList = [ac1, ac2];
	simState.stats = simState.separationPracticeStats;
	simState.proximities = simState.separationPracticeProximities;
	simState.events = [];

	uiState.displayPracticeAnswerButton = true;
}

function getOffset(ac1: Aircraft, ac2: Aircraft, dist = 5): number {
	const relativeTrack = ASVector.fromXY(
		ac2.trk.x - ac1.trk.x,
		ac2.trk.y - ac1.trk.y,
	);
	return abs(dist / sin(relativeTrack.asHeading()));
}
