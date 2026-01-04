import { ASVector } from '../math/asvector.js';
import { Aircraft } from '../simulation/aircraft.js';
import { autoPosition } from '../simulation/positioning.js';
import { Proximity } from '../simulation/proximity.js';
import { Wind } from '../simulation/wind.js';
import { postConfig, preConfig, simState } from './state.js';

export function initConfig() {
	preConfig();

	simState.settings = {
		playbackSpeed: 10,
		startTimeMins: -8,
		vRange: 120,
		vectorMins: 1,
		logStats: false,
		statsDecimalPlaces: 0,
		proximityDecimalPlaces: 20,
	};

	simState.wind = new Wind({
		from: 215,
		speed: 0,
	});

	simState.aircraftList = [
		Aircraft.onHeading({
			pos: ASVector.fromAngle(0, 0),
			heading: 20,
			TAS: 360,
			halo: true,
		}),
		Aircraft.onTrack({
			pos: ASVector.fromAngle(0, 0),
			track: 360,
			TAS: 300,
			halo: false,
		}),
		Aircraft.onHeading({
			pos: ASVector.fromAngle(0, 0),
			heading: 20,
			TAS: 360,
			halo: true,
		}),
		Aircraft.onTrack({
			pos: ASVector.fromAngle(0, 0),
			track: 360,
			TAS: 300,
			halo: false,
		}),
	];

	autoPosition(0, 1);
	autoPosition(2, 3);

	simState.loggers = [
		Proximity.create(0, 1),
		Proximity.create(1, 2),
];

	simState.events = [
		{
			active: true,
			trigger: () => simState.aircraftList[2].pos.x > 0,
			actions: () => simState.aircraftList[2].turn(-20),
		},
	];

	postConfig();
}