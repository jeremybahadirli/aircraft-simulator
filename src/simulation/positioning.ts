import {
	createSeparationPracticeProximities,
	createSeparationPracticeStats,
	initSeparationPracticeConfig,
} from '../core/separationPracticeConfig.js';
import { simState, uiState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import { Aircraft, resetAircraftIdentityRegistry } from './aircraft.js';
import { Atmosphere } from './atmosphere.js';
import { randBetween } from './utils.js';

export function autoPosition(ac1: Aircraft, ac2: Aircraft): void {
	ac2.pos = ASVector.fromXY(ac1.pos.x, ac1.pos.y - getOffset(ac1, ac2));
}

export function separationPractice(): void {
	const config = initSeparationPracticeConfig();

	if (!simState.separationPracticeSettings) return;

	resetAircraftIdentityRegistry();

	const leadTrack = randBetween(0, 360);

	const ac1 = Aircraft.onHeading({
		pos: ASVector.fromXY(0, 0),
		heading: simState.separationPracticeSettings.angle,
		speed: {
			unit: 'tas',
			value: simState.separationPracticeSettings.leadSpeed,
		},
		display: {
			halo: true,
		},
	});
	const ac2 = Aircraft.onHeading({
		pos: ASVector.fromXY(0, 0),
		heading: 360,
		speed: {
			unit: 'tas',
			value:
				simState.separationPracticeSettings.leadSpeed -
				simState.separationPracticeSettings.speedDifference,
		},
	});

	const offset = getOffset(
		ac1,
		ac2,
		simState.separationPracticeSettings.separation,
	);

	ac1.flyTrack(leadTrack);
	ac2.pos = ASVector.fromAngle(
		leadTrack + simState.separationPracticeSettings.angle,
		-offset,
	);
	ac2.flyTrack(leadTrack + simState.separationPracticeSettings.angle);

	simState.atmosphere = new Atmosphere({ wind: { from: 0, speed: 0 } });
	simState.aircraftList = [ac1, ac2];
	simState.stats = createSeparationPracticeStats(
		config.stats,
		simState.aircraftList,
	);
	simState.proximities = createSeparationPracticeProximities(
		config.proximities,
		simState.aircraftList,
	);
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
