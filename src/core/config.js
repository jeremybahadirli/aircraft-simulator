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
		playbackSpeed: 10,
		updateFrequency: 12,
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
			pos: ASVector.fromXY(0, 20),
			track: 90,
			TAS: 300,
			halo: true,
		}),
		Aircraft.onHeading({
			pos: ASVector.fromXY(0, 0),
			heading: 0,
			TAS: 300,
		}),
	];

	simState.stats = [
		Stat.create(1, "Test")
	];

	simState.proximities = [
		Proximity.create(0, 1, '90 base'),
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

	// separationPractice();
	// autoPosition(0, 1);

	postConfig();
}
