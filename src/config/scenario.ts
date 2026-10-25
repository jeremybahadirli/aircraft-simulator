import { Vector2 } from '../math/vector2.js';
import { Aircraft } from '../simulation/aircraft.js';
import { resolveAircraftReference } from '../simulation/aircraftReferences.js';
import { Atmosphere } from '../simulation/atmosphere.js';
import { FlidRegistry } from '../simulation/flidRegistry.js';
import { autoPosition, getOffset } from '../simulation/positioning.js';
import { Proximity } from '../simulation/proximity.js';
import { randBetween } from '../simulation/random.js';
import type { SpeedSpec } from '../simulation/speed.js';
import { Stat } from '../simulation/stat.js';
import type {
	SeparationPracticeSettings,
	SimulationMode,
	SimulationSettings,
	SimulationState,
} from '../simulation/state.js';
import type { ViewSettings } from '../view/state.js';
import configSchema from './schemas/config.schema.json' with { type: 'json' };
import separationPracticeConfigSchema from './schemas/separation-practice-config.schema.json' with { type: 'json' };
import type {
	Config,
	ConfigAircraft,
	ConfigPosition,
	ConfigProximity,
	ConfigStat,
	SeparationPracticeConfig,
} from './types.js';
import { validateSchema } from './validation.js';

export interface SimulationScenario {
	simulation: SimulationState;
	viewSettings: ViewSettings;
}

export function createScenario(
	configSource: unknown,
	separationPracticeConfigSource: unknown,
): SimulationScenario {
	const configData = validateSchema<Config>(
		configSource,
		configSchema,
		'Invalid config',
	);
	const separationPracticeConfigData =
		validateSchema<SeparationPracticeConfig>(
			separationPracticeConfigSource,
			separationPracticeConfigSchema,
			'Invalid separation practice config',
		);

	const flidRegistry = new FlidRegistry();
	const isSeparationPractice =
		configData.simSettings.mode === 'separation_practice';
	const state = isSeparationPractice
		? createSeparationPracticeState(
				configData.simSettings.mode,
				separationPracticeConfigData,
				flidRegistry,
			)
		: createConfiguredScenario(configData, flidRegistry);

	state.defaultPlaybackSpeed = state.simSettings.playbackSpeed;
	state.time = state.simSettings.startTimeMins / 60;
	state.lastUpdate = state.time;
	state.nextUpdate = state.time;
	return {
		simulation: state,
		viewSettings: isSeparationPractice
			? separationPracticeConfigData.viewSettings
			: configData.viewSettings,
	};
}

function positionToVector(position: ConfigPosition): Vector2 {
	if ('x' in position) return Vector2.fromXY(position.x, position.y);
	return Vector2.fromAngle(position.r, position.d);
}

function createAircraft(
	aircraft: ConfigAircraft,
	atmosphere: Atmosphere,
	flidRegistry: FlidRegistry,
): Aircraft {
	const options = {
		cid: aircraft.cid,
		callsign: aircraft.callsign,
		pos: positionToVector(aircraft.position),
		alt: aircraft.alt,
		speed: getSpeed(aircraft),
		datablockFourthLine: aircraft.fourthLine,
		display: aircraft.display,
		atmosphere,
		flidRegistry: flidRegistry,
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
	if (aircraft.tas !== undefined) return { unit: 'tas', value: aircraft.tas };
	if (aircraft.ias !== undefined) return { unit: 'ias', value: aircraft.ias };
	if (aircraft.mach !== undefined) {
		return { unit: 'mach', value: aircraft.mach };
	}
	throw new Error('Aircraft config must include tas, ias, or mach.');
}

function createStat(
	configuredStat: ConfigStat,
	aircraftList: readonly Aircraft[],
): Stat | undefined {
	let zeroIndex;
	if (configuredStat.index !== undefined) {
		zeroIndex = configuredStat.index - 1;
	}
	const aircraft = resolveAircraftReference(aircraftList, {
		flid: configuredStat.flid,
		index: zeroIndex,
	});
	return aircraft ? Stat.create(aircraft, configuredStat.label) : undefined;
}

function createProximity(
	configuredProximity: ConfigProximity,
	aircraftList: readonly Aircraft[],
): Proximity | undefined {
	let zeroIndex1, zeroIndex2;
	if (configuredProximity.index1 !== undefined) {
		zeroIndex1 = configuredProximity.index1 - 1;
	}
	if (configuredProximity.index2 !== undefined) {
		zeroIndex2 = configuredProximity.index2 - 1;
	}

	const ac1 = resolveAircraftReference(aircraftList, {
		flid: configuredProximity.flid1,
		index: zeroIndex1,
	});
	if (!ac1) return undefined;

	const name = configuredProximity.label;
	if (configuredProximity.flid2 !== undefined || zeroIndex2 !== undefined) {
		const ac2 = resolveAircraftReference(aircraftList, {
			flid: configuredProximity.flid2,
			index: zeroIndex2,
		});
		return ac2 ? Proximity.acToAc({ ac1, ac2, name }) : undefined;
	}
	if (configuredProximity.position !== undefined) {
		if ('x' in configuredProximity.position) {
			const { x, y } = configuredProximity.position;
			return Proximity.acToXY({ ac1, x, y, name });
		}
		const { r, d } = configuredProximity.position;
		return Proximity.acToFRD({ ac1, r, d, name });
	}
	throw new Error(
		`Proximity for "${configuredProximity.flid1}" must include flid2 or position.`,
	);
}

function createBaseState(
	simSettings: SimulationSettings,
	atmosphere: Atmosphere,
	flidRegistry: FlidRegistry,
	separationPracticeSettings: SeparationPracticeSettings | null,
): SimulationState {
	return {
		time: 0,
		lastUpdate: 0,
		nextUpdate: 0,
		nextLogTime: 0,
		simSettings: { ...simSettings },
		defaultPlaybackSpeed: simSettings.playbackSpeed,
		atmosphere,
		flidRegistry: flidRegistry,
		aircraftList: [],
		stats: [],
		proximities: [],
		events: [],
		logLines: ['  '],
		logDirty: false,
		separationPracticeSettings,
	};
}

function createConfiguredScenario(
	configData: Config,
	flidRegistry: FlidRegistry,
): SimulationState {
	const atmosphere = new Atmosphere(configData.atmosphere);
	const state = createBaseState(
		configData.simSettings,
		atmosphere,
		flidRegistry,
		null,
	);
	state.aircraftList = configData.aircraftList.map((aircraft) =>
		createAircraft(aircraft, atmosphere, flidRegistry),
	);
	state.stats = configData.stats
		.map((stat) => createStat(stat, state.aircraftList))
		.filter((stat): stat is Stat => stat !== undefined);
	state.proximities = configData.proximities
		.map((proximity) => createProximity(proximity, state.aircraftList))
		.filter((proximity): proximity is Proximity => proximity !== undefined);
	if (configData.simSettings.mode === 'auto_position') {
		autoPosition(state.aircraftList[0], state.aircraftList[1]);
	}
	return state;
}

function createSeparationPracticeState(
	configuredMode: SimulationMode,
	configData: SeparationPracticeConfig,
	flidRegistry: FlidRegistry,
): SimulationState {
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
	const simSettings: SimulationSettings = {
		...configData.simSettings,
		startTimeMins: practiceSettings.startTimeMins,
		mode: configuredMode,
	};
	const atmosphere = new Atmosphere({ wind: { from: 0, speed: 0 } });
	const state = createBaseState(
		simSettings,
		atmosphere,
		flidRegistry,
		practiceSettings,
	);

	const leadTrack = randBetween(0, 360);
	const ac1 = Aircraft.onHeading({
		pos: Vector2.fromXY(0, 0),
		heading: practiceSettings.angle,
		speed: { unit: 'tas', value: practiceSettings.leadSpeed },
		display: { halo: true },
		atmosphere,
		flidRegistry: flidRegistry,
	});
	const ac2 = Aircraft.onHeading({
		pos: Vector2.fromXY(0, 0),
		heading: 360,
		speed: {
			unit: 'tas',
			value:
				practiceSettings.leadSpeed - practiceSettings.speedDifference,
		},
		atmosphere,
		flidRegistry: flidRegistry,
	});

	const offset = getOffset(ac1, ac2, practiceSettings.separation);
	ac1.flyTrack(leadTrack);
	ac2.pos = Vector2.fromAngle(leadTrack + practiceSettings.angle, -offset);
	ac2.flyTrack(leadTrack + practiceSettings.angle);
	state.aircraftList = [ac1, ac2];
	state.stats = configData.stats
		.map((stat) => createStat(stat, state.aircraftList))
		.filter((stat): stat is Stat => stat !== undefined);
	state.proximities = configData.proximities
		.map((proximity) => createProximity(proximity, state.aircraftList))
		.filter((proximity): proximity is Proximity => proximity !== undefined);
	return state;
}
