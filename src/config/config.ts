import { Ajv } from 'https://cdn.jsdelivr.net/npm/ajv@8.20.0/+esm';
import type { Schema } from 'ajv';
import config from './config.json' with { type: 'json' };
import configSchema from './schemas/config.schema.json' with { type: 'json' };
import separationPracticeConfig from './separation-practice-config.json' with { type: 'json' };
import separationPracticeConfigSchema from './schemas/separation-practice-config.schema.json' with { type: 'json' };
import sharedConfigSchema from './schemas/shared-config.schema.json' with { type: 'json' };
import {
	postConfig,
	preConfig,
	simState,
	uiState,
	type SeparationPracticeSettings,
	type SimulationSettings,
} from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import { Aircraft, type AircraftDisplay } from '../simulation/aircraft.js';
import {
	Atmosphere,
	type AtmosphereOptions,
} from '../simulation/atmosphere.js';
import { autoPosition, getOffset } from '../simulation/positioning.js';
import { Proximity } from '../simulation/proximity.js';
import type { SpeedSpec } from '../simulation/speed.js';
import { Stat } from '../simulation/stat.js';
import { randBetween, resolveAircraftReference } from '../simulation/utils.js';

type ConfigPosition = { x: number; y: number } | { r: number; d: number };

interface ConfigRange {
	min: number;
	max: number;
}

interface ConfigAircraft {
	cid?: string;
	callsign?: string;
	position: ConfigPosition;
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
	position?: ConfigPosition;
	label?: string;
}

interface Config {
	settings: SimulationSettings;
	atmosphere: AtmosphereOptions;
	aircraftList: ConfigAircraft[];
	stats: ConfigStat[];
	proximities: ConfigProximity[];
}

interface SeparationPracticeConfig {
	settings: Omit<SimulationSettings, 'startTimeMins' | 'mode'>;
	separationPracticeSettings: {
		startTimeRange: ConfigRange;
		minSeparationRange: ConfigRange;
		leadSpeedRange: ConfigRange;
		angleRange: ConfigRange;
		speedDifferenceRange: ConfigRange;
	};
	stats: ConfigStat[];
	proximities: ConfigProximity[];
}

function positionToVector(position: ConfigPosition): ASVector {
	if ('x' in position) {
		return ASVector.fromXY(position.x, position.y);
	}
	return ASVector.fromAngle(position.r, position.d);
}

function createAircraft(aircraft: ConfigAircraft): Aircraft {
	const options = {
		cid: aircraft.cid,
		callsign: aircraft.callsign,
		pos: positionToVector(aircraft.position),
		alt: aircraft.alt,
		speed: getSpeed(aircraft),
		display: aircraft.display,
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

function createStat(stat: ConfigStat): Stat | undefined {
	const aircraft = resolveAircraftReference(simState.aircraftList, {
		flid: stat.flid,
		index: stat.index,
	});
	if (!aircraft) return undefined;
	return Stat.create(aircraft, stat.label);
}

function createProximity(
	configuredProximity: ConfigProximity,
): Proximity | undefined {
	const ac1 = resolveAircraftReference(simState.aircraftList, {
		flid: configuredProximity.flid1,
		index: configuredProximity.index1,
	});
	if (!ac1) return undefined;

	const name = configuredProximity.label;
	if (
		configuredProximity.flid2 !== undefined ||
		configuredProximity.index2 !== undefined
	) {
		const ac2 = resolveAircraftReference(simState.aircraftList, {
			flid: configuredProximity.flid2,
			index: configuredProximity.index2,
		});
		if (!ac2) return undefined;
		return Proximity.acToAc({ ac1, ac2, name });
	}
	if (configuredProximity.position !== undefined) {
		if ('x' in configuredProximity.position) {
			const { x, y } = configuredProximity.position;
			return Proximity.acToXY({ ac1, x, y, name });
		} else {
			const { r, d } = configuredProximity.position;
			return Proximity.acToFRD({ ac1, r, d, name });
		}
	}
	throw new Error(
		`Proximity for "${configuredProximity.flid1}" must include flid2 or position.`,
	);
}

function validateConfigData<T>(
	data: unknown,
	schema: Schema,
	errorMessage: string,
): T {
	const ajv = new Ajv();
	ajv.addSchema(sharedConfigSchema);
	const validate = ajv.compile(schema);
	if (validate(data) !== true) {
		throw new Error(errorMessage);
	}
	return data as T;
}

function initializeConfiguredScenario(configData: Config): void {
	simState.settings = configData.settings;
	simState.atmosphere = new Atmosphere(configData.atmosphere);
	simState.aircraftList = configData.aircraftList.map(createAircraft);
	simState.stats = configData.stats
		.map(createStat)
		.filter((stat): stat is Stat => stat !== undefined);
	simState.proximities = configData.proximities
		.map(createProximity)
		.filter((proximity): proximity is Proximity => proximity !== undefined);
	simState.events = [];
	simState.separationPracticeSettings = null;
	uiState.displayPracticeAnswerButton = false;

	if (configData.settings.mode === 'auto_position') {
		autoPosition(simState.aircraftList[0], simState.aircraftList[1]);
	}
}

function initializeSeparationPractice(
	configuredMode: SimulationSettings['mode'],
): void {
	const configData = validateConfigData<SeparationPracticeConfig>(
		separationPracticeConfig,
		separationPracticeConfigSchema,
		'Invalid separation practice configuration',
	);
	const ranges = configData.separationPracticeSettings;
	const practiceSettings: SeparationPracticeSettings = {
		startTimeMins: randBetween(
			ranges.startTimeRange.min,
			ranges.startTimeRange.max,
		),
		separation: randBetween(
			ranges.minSeparationRange.min,
			ranges.minSeparationRange.max,
		),
		leadSpeed: randBetween(
			ranges.leadSpeedRange.min,
			ranges.leadSpeedRange.max,
		),
		angle: randBetween(ranges.angleRange.min, ranges.angleRange.max),
		speedDifference: randBetween(
			ranges.speedDifferenceRange.min,
			ranges.speedDifferenceRange.max,
		),
	};

	simState.separationPracticeSettings = practiceSettings;
	simState.settings = {
		...configData.settings,
		startTimeMins: practiceSettings.startTimeMins,
		mode: configuredMode,
	};
	simState.atmosphere = new Atmosphere({ wind: { from: 0, speed: 0 } });

	const leadTrack = randBetween(0, 360);
	const ac1 = Aircraft.onHeading({
		pos: ASVector.fromXY(0, 0),
		heading: practiceSettings.angle,
		speed: { unit: 'tas', value: practiceSettings.leadSpeed },
		display: { halo: true },
	});
	const ac2 = Aircraft.onHeading({
		pos: ASVector.fromXY(0, 0),
		heading: 360,
		speed: {
			unit: 'tas',
			value:
				practiceSettings.leadSpeed - practiceSettings.speedDifference,
		},
	});

	const offset = getOffset(ac1, ac2, practiceSettings.separation);
	ac1.flyTrack(leadTrack);
	ac2.pos = ASVector.fromAngle(leadTrack + practiceSettings.angle, -offset);
	ac2.flyTrack(leadTrack + practiceSettings.angle);

	simState.aircraftList = [ac1, ac2];
	simState.stats = configData.stats
		.map(createStat)
		.filter((stat): stat is Stat => stat !== undefined);
	simState.proximities = configData.proximities
		.map(createProximity)
		.filter((proximity): proximity is Proximity => proximity !== undefined);
	simState.events = [];
	uiState.displayPracticeAnswerButton = true;
}

export function initConfig(): void {
	preConfig();
	const configData = validateConfigData<Config>(
		config,
		configSchema,
		'Invalid config',
	);

	if (configData.settings.mode === 'separation_practice') {
		initializeSeparationPractice(configData.settings.mode);
	} else {
		initializeConfiguredScenario(configData);
	}

	postConfig();
}
