import { simState } from './state.js';
import { randBetween, randIntBetween } from '../simulation/utils.js';
import { Stat } from '../simulation/stat.js';
import { Proximity } from '../simulation/proximity.js';

export function separationPracticeConfig() {
	simState.separationPracticeSettings = {
		startTime: randBetween(-5.5, -6),
		separation: randBetween(4.5, 5.5),
		lh: randIntBetween(0, 359),
		ls: randIntBetween(300, 600),
		a: randIntBetween(15, 130),
		s: randIntBetween(-60, 60),
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
