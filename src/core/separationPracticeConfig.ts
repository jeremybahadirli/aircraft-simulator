import { Ajv } from 'https://cdn.jsdelivr.net/npm/ajv@8.20.0/+esm';
import config from '../separation-practice-config.json' with { type: 'json' };
import configSchema from '../separation-practice-config.schema.json' with { type: 'json' };
import sharedConfigSchema from '../shared-config.schema.json' with { type: 'json' };
import type { Aircraft } from '../simulation/aircraft.js';
import { Proximity } from '../simulation/proximity.js';
import { Stat } from '../simulation/stat.js';
import { randBetween, resolveAircraftReference } from '../simulation/utils.js';
import { simState } from './state.js';

interface ConfigRange {
	min: number;
	max: number;
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

interface SeparationPracticeConfig {
	settings: {
		playbackSpeed: number;
		secondsPerUpdate: number;
		vRange: number;
		statsDecimalPlaces: number;
		proximityDecimalPlaced: number;
	};
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

function isConfig(
	data: unknown,
	validate: (data: unknown) => unknown,
): data is SeparationPracticeConfig {
	return validate(data) === true;
}

export function initSeparationPracticeConfig(): SeparationPracticeConfig {
	const ajv = new Ajv();
	ajv.addSchema(sharedConfigSchema);
	const validate = ajv.compile(configSchema);
	const configData: unknown = config;
	if (!isConfig(configData, validate)) {
		throw new Error('Invalid separation practice configuration');
	}

	const ranges = configData.separationPracticeSettings;
	simState.separationPracticeSettings = {
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

	simState.settings = { ...simState.settings, ...configData.settings };
	simState.settings.startTimeMins =
		simState.separationPracticeSettings.startTimeMins;

	return configData;
}

export function createSeparationPracticeStats(
	configuredStats: ConfigStat[],
	aircraftList: Aircraft[],
): Stat[] {
	return configuredStats.map((stat) => {
		const aircraft = resolveAircraftReference(aircraftList, {
			flid: stat.flid,
			index: stat.index,
		});
		return Stat.create(aircraft, stat.label);
	});
}

export function createSeparationPracticeProximities(
	configuredProximities: ConfigProximity[],
	aircraftList: Aircraft[],
): Proximity[] {
	return configuredProximities.map((configuredProximity) => {
		const ac1 = resolveAircraftReference(aircraftList, {
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
				ac2: resolveAircraftReference(aircraftList, {
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
	});
}
