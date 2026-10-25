import type { Schema } from 'ajv';
import type { AircraftDisplay } from '../simulation/aircraft.js';
import type { AtmosphereOptions } from '../simulation/atmosphere.js';
import type { SimulationSettings } from '../simulation/state.js';
import type { ViewSettings } from '../view/state.js';

export type ConfigEditorDocument = 'config' | 'separation-practice';

export interface ConfigEditorData {
	configText: string;
	defaultConfigText: string;
	separationPracticeConfigText: string;
	defaultSeparationPracticeConfigText: string;
	configSchema: Schema;
	separationPracticeConfigSchema: Schema;
	sharedConfigSchema: Schema;
}

export interface Config {
	simSettings: SimulationSettings;
	viewSettings: ViewSettings;
	atmosphere: AtmosphereOptions;
	aircraftList: ConfigAircraft[];
	stats: ConfigStat[];
	proximities: ConfigProximity[];
}

export interface SeparationPracticeConfig {
	simSettings: Omit<SimulationSettings, 'startTimeMins' | 'mode'>;
	viewSettings: ViewSettings;
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

export type ConfigPosition =
	| { x: number; y: number }
	| { r: number; d: number };

interface ConfigRange {
	min: number;
	max: number;
}

export interface ConfigAircraft {
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

export interface ConfigStat {
	flid?: string;
	index?: number;
	label?: string;
}

export interface ConfigProximity {
	flid1?: string;
	index1?: number;
	flid2?: string;
	index2?: number;
	position?: ConfigPosition;
	label?: string;
}
