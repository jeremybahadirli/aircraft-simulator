import { ASVector } from '../math/asvector.js';
import { Aircraft } from '../simulation/aircraft.js';
import { Wind } from '../simulation/wind.js';
import { simState } from './state.js';

export function initConfig() {
	simState.time = 0;
	simState.nextLogTime = 0;
	simState.logLines = [];
	simState.logDirty = false;

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

	simState.loggers = [];

	simState.events = [
		{
			active: true,
			trigger: () => true,
			actions: () => {},
		},
	];
}
