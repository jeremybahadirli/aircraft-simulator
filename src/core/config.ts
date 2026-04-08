import { ASVector } from '../math/asvector.js';
import { SpeedConversions } from '../math/speedConversions.js';
import { Aircraft } from '../simulation/aircraft.js';
import { Atmosphere } from '../simulation/atmosphere.js';
import { autoPosition } from '../simulation/positioning.js';
import { Proximity } from '../simulation/proximity.js';
import { Stat } from '../simulation/stat.js';
import { postConfig, preConfig, simState } from './state.js';

export function initConfig(): void {
	preConfig();

	simState.settings = {
		playbackSpeed: 10,
		updateFrequency: 0,
		startTimeMins: 0,
		vRange: 100,
		statsDecimalPlaces: 1,
		proximityDecimalPlaces: 2,
	};

	simState.atmosphere = new Atmosphere({});

	simState.aircraftList = [
		Aircraft.onTrack({
			pos: ASVector.fromXY(0, 0),
			track: 270,
			alt: 20000,
			speed: { unit: 'ias', value: 300 },
			halo: true,
		}),
		Aircraft.onHeading({
			pos: ASVector.fromXY(-10, 0),
			heading: 270,
			alt: 20000,
			speed: { unit: 'ias', value: 290 },
		}),
	];

	simState.stats = [Stat.create(0), Stat.create(1)];

	simState.proximities = [
		Proximity.acToAc({ ac1: 0, ac2: 1 }),
		Proximity.acToFRD({ ac1: 1, r: 0, d: 10 }),
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
	autoPosition(0, 1);

	postConfig();
}
