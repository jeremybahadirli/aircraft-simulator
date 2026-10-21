import { Ajv } from 'https://cdn.jsdelivr.net/npm/ajv@8.20.0/+esm';
import type { Schema } from 'ajv';
import defaultConfig from './default-config.json' with { type: 'json' };
import configSchema from './schemas/config.schema.json' with { type: 'json' };
import defaultSeparationPracticeConfig from './default-separation-practice-config.json' with { type: 'json' };
import separationPracticeConfigSchema from './schemas/separation-practice-config.schema.json' with { type: 'json' };
import sharedConfigSchema from './schemas/shared-config.schema.json' with { type: 'json' };
import {
	simState,
	uiState,
	type SeparationPracticeSettings,
	type SimulationSettings,
} from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import {
	Aircraft,
	resetAircraftIdentityRegistry,
	type AircraftDisplay,
} from '../simulation/aircraft.js';
import {
	Atmosphere,
	type AtmosphereOptions,
} from '../simulation/atmosphere.js';
import { autoPosition, getOffset } from '../simulation/positioning.js';
import { Proximity } from '../simulation/proximity.js';
import type { SpeedSpec } from '../simulation/speed.js';
import { Stat } from '../simulation/stat.js';
import { randBetween, resolveAircraftReference } from '../simulation/utils.js';

const ACTIVE_CONFIG_STORAGE_KEY = 'aircraft-simulator.active-config';
const ACTIVE_SEPARATION_PRACTICE_CONFIG_STORAGE_KEY =
	'aircraft-simulator.active-separation-practice-config';

export type ConfigEditorDocument = 'config' | 'separation-practice';

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
	fourthLine?: string;
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

export interface ConfigEditorData {
	configText: string;
	defaultConfigText: string;
	separationPracticeConfigText: string;
	defaultSeparationPracticeConfigText: string;
	configSchema: Schema;
	separationPracticeConfigSchema: Schema;
	sharedConfigSchema: Schema;
}

function readStoredConfig(storageKey: string): unknown | undefined {
	try {
		const storedConfig = localStorage.getItem(storageKey);
		return storedConfig === null ? undefined : JSON.parse(storedConfig);
	} catch {
		return undefined;
	}
}

let activeConfigData: unknown = readStoredConfig(ACTIVE_CONFIG_STORAGE_KEY) ?? defaultConfig;
let activeSeparationPracticeConfigData: unknown =
	readStoredConfig(ACTIVE_SEPARATION_PRACTICE_CONFIG_STORAGE_KEY) ??
	defaultSeparationPracticeConfig;

export function getConfigEditorData(): ConfigEditorData {
	return {
		configText: JSON.stringify(activeConfigData, null, '\t'),
		defaultConfigText: JSON.stringify(defaultConfig, null, '\t'),
		separationPracticeConfigText: JSON.stringify(
			activeSeparationPracticeConfigData,
			null,
			'\t',
		),
		defaultSeparationPracticeConfigText: JSON.stringify(
			defaultSeparationPracticeConfig,
			null,
			'\t',
		),
		configSchema,
		separationPracticeConfigSchema,
		sharedConfigSchema,
	};
}

export function persistActiveConfig(
	document: ConfigEditorDocument,
): boolean {
	try {
		const storageKey =
			document === 'config'
				? ACTIVE_CONFIG_STORAGE_KEY
				: ACTIVE_SEPARATION_PRACTICE_CONFIG_STORAGE_KEY;
		const configData =
			document === 'config'
				? activeConfigData
				: activeSeparationPracticeConfigData;
		localStorage.setItem(
			storageKey,
			JSON.stringify(configData),
		);
		return true;
	} catch {
		return false;
	}
}

export function validateConfig(configData: unknown): void {
	validateConfigData<Config>(configData, configSchema, 'Invalid config');
}

export function validateSeparationPracticeConfig(configData: unknown): void {
	validateConfigData<SeparationPracticeConfig>(
		configData,
		separationPracticeConfigSchema,
		'Invalid separation practice config',
	);
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
		datablockFourthLine: aircraft.fourthLine,
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
	ajv.addKeyword('markdownDescription');
	ajv.addSchema(sharedConfigSchema);
	const validate = ajv.compile(schema);
	if (validate(data) !== true) {
		throw new Error(
			`${errorMessage}: ${ajv.errorsText(validate.errors)}`,
		);
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
	configData: SeparationPracticeConfig,
): void {
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

export function initConfig(
	configOverride?: unknown,
	separationPracticeConfigOverride?: unknown,
): void {
	const sourceConfig = configOverride === undefined
		? activeConfigData
		: configOverride;
	const sourceSeparationPracticeConfig =
		separationPracticeConfigOverride === undefined
			? activeSeparationPracticeConfigData
			: separationPracticeConfigOverride;
	const configData = validateConfigData<Config>(
		sourceConfig,
		configSchema,
		'Invalid config',
	);
	const separationPracticeConfigData = validateConfigData<SeparationPracticeConfig>(
		sourceSeparationPracticeConfig,
		separationPracticeConfigSchema,
		'Invalid separation practice config',
	);

	resetAircraftIdentityRegistry();

	simState.nextLogTime = 0;
	simState.logLines = ['  '];
	simState.logDirty = false;

	if (configData.settings.mode === 'separation_practice') {
		initializeSeparationPractice(
			configData.settings.mode,
			separationPracticeConfigData,
		);
	} else {
		initializeConfiguredScenario(configData);
	}
	activeConfigData = configData;
	activeSeparationPracticeConfigData = separationPracticeConfigData;

	simState.defaultPlaybackSpeed = simState.settings.playbackSpeed;
	simState.time = simState.settings.startTimeMins / 60;
	simState.lastUpdate = simState.time;
	simState.nextUpdate = simState.time;
}
