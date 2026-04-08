import { simState, uiState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import { Aircraft } from './aircraft.js';
import { separationPracticeConfig } from '../core/separationPracticeConfig.js';
import { randBetween } from './utils.js';

export function autoPosition(i: number, j: number): void {
	const ac1 = simState.aircraftList[i];
	const ac2 = simState.aircraftList[j];

	simState.aircraftList[j] = new Aircraft({
		pos: ASVector.fromXY(ac1.pos.x, ac1.pos.y - getOffset(ac1, ac2)),
		vel: ac2.vel,
		halo: ac2.halo,
		color: ac2.color,
	});
}

export function separationPractice(): void {
	separationPracticeConfig();
	const settings = simState.separationPracticeSettings;

	if (!settings) return;

	const leadTrack = randBetween(0, 360);

	simState.settings.startTimeMins = settings.startTime;

	const ac1 = Aircraft.onHeading({
		pos: ASVector.fromXY(0, 0),
		heading: settings.angle,
		TAS: settings.leadSpeed,
		halo: true,
	});
	const ac2 = Aircraft.onHeading({
		pos: ASVector.fromXY(0, 0),
		heading: 360,
		TAS: settings.leadSpeed - settings.speedDifference,
	});

	const offset = getOffset(ac1, ac2, settings.separation);

	ac1.flyTrack(leadTrack);
	ac2.pos = ASVector.fromAngle(leadTrack + settings.angle, -offset);
	ac2.flyTrack(leadTrack + settings.angle);

	simState.aircraftList = [
		ac1,
		ac2,
	];
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
