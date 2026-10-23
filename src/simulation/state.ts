import type { Aircraft } from './aircraft.js';
import type { AircraftIdentityRegistry } from './aircraftIdentityRegistry.js';
import type { Atmosphere } from './atmosphere.js';
import type { Proximity } from './proximity.js';
import type { Stat } from './stat.js';

export type SimulationMode =
	| 'normal'
	| 'separation_practice'
	| 'auto_position';

export interface SimulationSettings {
	playbackSpeed: number;
	secondsPerUpdate: number;
	startTimeMins: number;
	mode: SimulationMode;
}

export interface SeparationPracticeSettings {
	startTimeMins: number;
	separation: number;
	leadSpeed: number;
	angle: number;
	speedDifference: number;
}

export interface SimulationEvent {
	active: boolean;
	armed: boolean;
	trigger: () => boolean;
	actions: () => void;
}

export interface SimulationState {
	time: number;
	lastUpdate: number;
	nextUpdate: number;
	nextLogTime: number;
	simSettings: SimulationSettings;
	defaultPlaybackSpeed: number;
	atmosphere: Atmosphere;
	aircraftIdentityRegistry: AircraftIdentityRegistry;
	aircraftList: Aircraft[];
	stats: Stat[];
	proximities: Proximity[];
	events: SimulationEvent[];
	logLines: string[];
	logDirty: boolean;
	separationPracticeSettings: SeparationPracticeSettings | null;
}
