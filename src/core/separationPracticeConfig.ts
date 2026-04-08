import { simState } from './state.js';
import { randBetween } from '../simulation/utils.js';
import { Stat } from '../simulation/stat.js';
import { Proximity } from '../simulation/proximity.js';
import { ASVector } from '../math/asvector.js';

export function separationPracticeConfig(): void {
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
		Proximity.acToXY({ ac1: 0, x: 0, y: 0, name: 'Front CRR' }),
		Proximity.acToXY({ ac1: 1, x: 0, y: 0, name: 'Back CRR' }),
		Proximity.acToAc({ ac1: 0, ac2: 1, name: 'Separation' }),
	];
}
