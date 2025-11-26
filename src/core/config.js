import { ASVector } from '../math/asvector.js';
import { Aircraft } from '../simulation/aircraft.js';
import { Proximity } from '../simulation/proximity.js';
import { Wind } from '../simulation/wind.js';
import { simState, resetRuntimeState } from './state.js';

export function initConfig() {
	simState.settings = {
		vRange: 100,
		playbackSpeed: 1,
		vectorMins: 1,
		logFrequency: 0,
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
			heading: 0,
			TAS: 300,
			halo: true,
		}),
	];

	simState.loggers = [Proximity.create(0, 1), Proximity.create(0, 2)];

	simState.events = [
		{
			active: true,
			trigger: () => true,
			actions: () => {},
		},
	];

	resetRuntimeState();
}
