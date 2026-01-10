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
		playbackSpeed: 1,
		updateFrequency: 12,
		startTimeMins: 0,
		vRange: 100,
		statsDecimalPlaces: 0,
		proximityDecimalPlaces: 1,
	};

	simState.wind = new Wind({
		from: 215,
		speed: 0,
	});

	simState.aircraftList = [
		Aircraft.onHeading({
			pos: ASVector.fromAngle(0, 0),
			heading: 45,
			TAS: 360,
			halo: true,
		}),
		Aircraft.onHeading({
			pos: ASVector.fromAngle(0, 0),
			heading: 360,
			TAS: 300,
			halo: false,
		}),
		// Aircraft.onHeading({
		// 	pos: ASVector.fromAngle(0, 0),
		// 	heading: 20,
		// 	TAS: 360,
		// 	halo: true,
		// }),
		// Aircraft.onTrack({
		// 	pos: ASVector.fromAngle(0, 0),
		// 	track: 360,
		// 	TAS: 300,
		// 	halo: false,
		// }),
	];

	simState.stats = [
	];

	simState.proximities = [
		Proximity.create(0, 1)
	];

	simState.events = [
		{
			active: false,
			trigger: () => simState.aircraftList[2].pos.x > 0,
			actions: () => simState.aircraftList[2].turn(-20),
		},
	];

	separationPractice();
	// autoPosition(0, 1);
	// autoPosition(2, 3);

	postConfig();
}
