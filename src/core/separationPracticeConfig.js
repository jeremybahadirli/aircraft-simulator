import { simState } from './state.js';
import { randBetween } from '../simulation/utils.js';
import { Stat } from '../simulation/stat.js';
import { Proximity } from '../simulation/proximity.js';

export function separationPracticeConfig() {
	simState.separationPracticeSettings = {
		startTime: randBetween(-5.5, -6),
		separation: randBetween(4.5, 5.5),
		leadSpeed: randBetween(300, 600),
		angle: randBetween(15, 135),
		speedDifference: randBetween(-60, 60),
	};

	simState.separationPracticeStats = [
		Stat.create(0, 'Front Stats'),
		Stat.create(1, 'Back Stats'),
	];

	simState.separationPracticeProximities = [
		Proximity.create(0, 2, 'Front CRR'),
		Proximity.create(1, 2, 'Back CRR'),
		Proximity.create(0, 1, 'Separation'),
	];
}
