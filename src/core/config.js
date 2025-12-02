import { ASVector } from '../math/asvector.js';
import { Aircraft } from '../simulation/aircraft.js';
import { autoPosition } from '../simulation/positioning.js';
import { Proximity } from '../simulation/proximity.js';
import { Wind } from '../simulation/wind.js';
import { postConfig, preConfig, simState } from './state.js';

export function initConfig() {
	preConfig();

	simState.settings = {
		vRange: 100,
		playbackSpeed: 10,
		vectorMins: 1,
		logStats: true,
		statsDecimalPlaces: 0,
		proximityDecimalPlaces: 3,
	};

	simState.wind = new Wind({
		from: 67.5,
		speed: 0,
	});

	simState.aircraftList = [
		Aircraft.onHeading({
			pos: ASVector.fromAngle(90, 0),
			heading: 90,
			TAS: 300,
			halo: true,
		}),
		Aircraft.onHeading({
			pos: ASVector.fromAngle(0, 0),
			heading: 0,
			TAS: 300,
		}),
	];

	autoPosition(simState.aircraftList[0], simState.aircraftList[1]);

	simState.loggers = [Proximity.create(0, 1), Proximity.create(0, 2)];

	simState.events = [
		{
			active: true,
			trigger: () => true,
			actions: () => {},
		},
	];

	postConfig();
}
