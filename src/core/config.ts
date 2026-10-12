import { Ajv } from 'https://cdn.jsdelivr.net/npm/ajv@8.20.0/+esm';
import config from '../config.json' with { type: 'json' };
import settingsSchema from '../config.schema.json' with { type: 'json' };
import { ASVector } from '../math/asvector.js';
import sharedConfigSchema from '../shared-config.schema.json' with { type: 'json' };
import { Aircraft } from '../simulation/aircraft.js';
import { Atmosphere } from '../simulation/atmosphere.js';
import { Proximity } from '../simulation/proximity.js';
import type { SpeedSpec } from '../simulation/speed.js';
import { Stat } from '../simulation/stat.js';
import {
	postConfig,
	preConfig,
	simState,
	type SimulationSettings,
} from './state.js';
import { resolveAircraftReference } from '../simulation/utils.js';

type ConfigPosition = { x: number; y: number } | { r: number; d: number };

interface ConfigAircraft {
	cid?: string;
	callsign?: string;
	xyPosition?: { x: number; y: number };
	frdPosition?: { r: number; d: number };
	heading?: number;
	track?: number;
	directFix?: ConfigPosition;
	alt: number;
	tas?: number;
	ias?: number;
	mach?: number;
	display: Partial<AircraftDisplay>;
}

interface ConfigStat {
	flid?: string;
	index?: number;
	label?: string;
}

interface ConfigProximity {
	flid1?: string;
	index1?: number;
	flid2?: string;
	index2?: number;
	xyPosition?: { x: number; y: number };
	frdPosition?: { r: number; d: number };
	label?: string;
}

interface Config {
	settings: SimulationSettings;
	atmosphere: AtmosphereOptions;
	aircraftList: ConfigAircraft[];
	stats: ConfigStat[];
	proximities: ConfigProximity[];
}

function isConfig(
	data: unknown,
	validate: (data: unknown) => unknown,
): data is Config {
	return validate(data) === true;
}

function positionToVector(position: ConfigPosition): ASVector {
	if ('x' in position) {
		return ASVector.fromXY(position.x, position.y);
	}
	return ASVector.fromAngle(position.r, position.d);
}

function createAircraft(aircraft: ConfigAircraft): Aircraft {
	const configuredPosition = aircraft.xyPosition ?? aircraft.frdPosition;
	if (configuredPosition === undefined) {
		throw new Error(
			'Aircraft config must include xyPosition or frdPosition.',
		);
	}

	const speed = getSpeed(aircraft);
	const options = {
		cid: aircraft.cid,
		callsign: aircraft.callsign,
		pos: positionToVector(configuredPosition),
		alt: aircraft.alt,
		display: aircraft.display,
		speed,
	};

	if (aircraft.heading !== undefined) {
		return Aircraft.onHeading({ ...options, heading: aircraft.heading });
	}
	if (aircraft.track !== undefined) {
		return Aircraft.onTrack({ ...options, track: aircraft.track });
	}
	if (aircraft.directFix !== undefined) {
		return Aircraft.direct({
			...options,
			fix: positionToVector(aircraft.directFix),
		});
	}
	throw new Error(
		'Aircraft config must include heading, track, or directFix.',
	);
}

function getSpeed(aircraft: ConfigAircraft): SpeedSpec {
	if (aircraft.tas !== undefined) {
		return { unit: 'tas', value: aircraft.tas };
	}
	if (aircraft.ias !== undefined) {
		return { unit: 'ias', value: aircraft.ias };
	}
	if (aircraft.mach !== undefined) {
		return { unit: 'mach', value: aircraft.mach };
	}
	throw new Error('Aircraft config must include tas, ias, or mach.');
}

function createStat(stat: ConfigStat): Stat {
	const aircraft = resolveAircraftReference(simState.aircraftList, {
		flid: stat.flid,
		index: stat.index,
	});
	return Stat.create(aircraft, stat.label);
}

function createProximity(configuredProximity: ConfigProximity): Proximity {
	const ac1 = resolveAircraftReference(simState.aircraftList, {
		flid: configuredProximity.flid1,
		index: configuredProximity.index1,
	});
	const name = configuredProximity.label;

	if (
		configuredProximity.flid2 !== undefined ||
		configuredProximity.index2 !== undefined
	) {
		return Proximity.acToAc({
			ac1,
			ac2: resolveAircraftReference(simState.aircraftList, {
				flid: configuredProximity.flid2,
				index: configuredProximity.index2,
			}),
			name,
		});
	}
	if (configuredProximity.xyPosition !== undefined) {
		const { x, y } = configuredProximity.xyPosition;
		return Proximity.acToXY({ ac1, x, y, name });
	}
	if (configuredProximity.frdPosition !== undefined) {
		const { r, d } = configuredProximity.frdPosition;
		return Proximity.acToFRD({ ac1, r, d, name });
	}
	throw new Error(
		`Proximity for "${configuredProximity.flid1}" must include flid2, xyPosition, or frdPosition.`,
	);
}

export function initConfig(): void {
	const ajv = new Ajv();
	ajv.addSchema(sharedConfigSchema);
	const validate = ajv.compile(settingsSchema);
	const configData: unknown = config;
	if (!isConfig(configData, validate)) {
		throw new Error('Invalid configuration');
	}

	preConfig();

	simState.settings = configData.settings;
	simState.atmosphere = new Atmosphere(configData.atmosphere);
	simState.aircraftList = configData.aircraftList.map(createAircraft);
	simState.stats = configData.stats.map(createStat);
	simState.proximities = configData.proximities.map(createProximity);
	simState.events = [];

	postConfig();
}
