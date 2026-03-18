import { ASVector } from '../math/asvector.js';
import { Aircraft } from '../simulation/aircraft.js';
import { autoPosition, separationPractice } from '../simulation/positioning.js';
import { Wind } from '../simulation/wind.js';
import { postConfig, preConfig, simState } from './state.js';
import { Stat } from '../simulation/stat.js';
import { Proximity } from '../simulation/proximity.js';

export function initConfig() {
	preConfig();

	simState.settings = {
		playbackSpeed: 0,
		updateFrequency: 0,
		startTimeMins: 0,
		vRange: 100,
		statsDecimalPlaces: 1,
		proximityDecimalPlaces: 2,
	};

	simState.wind = new Wind({
		from: 0,
		speed: 0,
	});

	simState.aircraftList = [
		Aircraft.onTrack({
			pos: ASVector.fromXY(0, 0),
			track: 45,
			TAS: 300,
			halo: true,
		}),
		Aircraft.onHeading({
			pos: ASVector.fromXY(0, 0),
			heading: 270,
			TAS: 300,
		}),
	];

	simState.stats = [
		Stat.create(0),
		Stat.create(1)
	];

	simState.proximities = [
		Proximity.create(0, 1),
	];

	simState.events = [
	// 	{
	// 		active: true,
	// 		trigger: () => simState.time > 2 / 60,
	// 		actions: () => {
	// 			((simState.aircraftList[0] = Aircraft.direct({
	// 				pos: simState.aircraftList[0].pos,
	// 				fix: ASVector.fromXY(-30, 0),
	// 				TAS: simState.aircraftList[0].vel.mag(),
	// 			})),
	// 				(simState.aircraftList[1] = Aircraft.direct({
	// 					pos: simState.aircraftList[1].pos,
	// 					fix: ASVector.fromXY(-30, 0),
	// 					TAS: simState.aircraftList[1].vel.mag(),
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
