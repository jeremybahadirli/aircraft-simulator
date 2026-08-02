import { ASVector } from '../math/asvector.js';
import {
	Aircraft,
	resetAircraftIdentityRegistry,
} from '../simulation/aircraft.js';
import { Atmosphere } from '../simulation/atmosphere.js';
import { separationPractice } from '../simulation/positioning.js';
import { Proximity } from '../simulation/proximity.js';
import { postConfig, preConfig, simState } from './state.js';

export function initConfig(): void {
	preConfig();
	resetAircraftIdentityRegistry();

	simState.settings = {
		playbackSpeed: 2,
		updateFrequency: 0,
		startTimeMins: -0.5,
		vRange: 100,
		statsDecimalPlaces: 0,
		proximityDecimalPlaces: 1,
	};

	simState.atmosphere = new Atmosphere({});

	simState.aircraftList = [
		Aircraft.onTrack({
			pos: ASVector.fromXY(0, -6),
			track: 360,
			alt: 200,
			speed: { unit: 'tas', value: 300 },
			display: {
				halo: false,
				datablockSlot: 4,
			},
		}),
		Aircraft.onTrack({
			pos: ASVector.fromXY(0, 0),
			track: 90,
			alt: 200,
			speed: { unit: 'tas', value: 300 },
			display: {
				halo: true,
				datablockSlot: 2,
			},
		}),
	];

	// simState.stats = [Stat.create(0), Stat.create(1)];

	simState.proximities = [
		Proximity.acToAc({ ac1: 0, ac2: 1 }),
		// Proximity.acToFRD({ ac1: 1, r: 0, d: 10 }),
	];

	simState.events = [
		// 	{
		// 		active: true,
		// 		trigger: () => simState.time > 2 / 60,
		// 		actions: () => {
		// 			((simState.aircraftList[0] = Aircraft.direct({
		// 				pos: simState.aircraftList[0].pos,
		// 				fix: ASVector.fromXY(-30, 0),
		// 				speed: { unit: 'tas', value: simState.aircraftList[0].tas },
		// 			})),
		// 				(simState.aircraftList[1] = Aircraft.direct({
		// 					pos: simState.aircraftList[1].pos,
		// 					fix: ASVector.fromXY(-30, 0),
		// 					speed: { unit: 'tas', value: simState.aircraftList[1].tas },
		// 				})));
		// 		},
		// 	},
	];

	// Ignores config.js, uses separationPracticeConfig.js
	// separationPractice();

	// Normally, ac0 starts at (0,0) with a hdg
	// ac1 placed at (0,0) to be autopositioned with hdg=0
	// autoPosition(0, 1);

	postConfig();
}
