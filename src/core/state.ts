import type { ASVector } from '../math/asvector.js';
import type { Aircraft } from '../simulation/aircraft.js';
import type { Atmosphere } from '../simulation/atmosphere.js';
import type { Proximity } from '../simulation/proximity.js';
import type { Stat } from '../simulation/stat.js';

export interface SimulationSettings {
	playbackSpeed: number;
	updateFrequency: number;
	startTimeMins: number;
	vRange: number;
	statsDecimalPlaces: number;
	proximityDecimalPlaces: number;
}

export interface SeparationPracticeSettings {
	startTime: number;
	separation: number;
	leadSpeed: number;
	angle: number;
	speedDifference: number;
}

export interface SimulationEvent {
	active: boolean;
	armed?: boolean;
	trigger: () => boolean;
	actions: () => void;
}

export interface SimulationState {
	time: number;
	lastUpdate: number;
	nextUpdate: number;
	nextLogTime: number;
	settings: SimulationSettings;
	atmosphere: Atmosphere;
	aircraftList: Aircraft[];
	stats: Stat[];
	proximities: Proximity[];
	events: SimulationEvent[];
	logLines: string[];
	logDirty: boolean;
	rngBrgMode: boolean;
	rngBrgPos: ASVector | null;
	separationPracticeSettings: SeparationPracticeSettings | null;
	separationPracticeStats: Stat[];
	separationPracticeProximities: Proximity[];
}

export interface UIState {
	canvas: P5CanvasElement | null;
	canvasDiv: P5DivElement | null;
	logDiv: P5DivElement | null;
	controlsDiv: P5DivElement | null;
	gridCheckbox: P5CheckboxElement | null;
	ringsCheckbox: P5CheckboxElement | null;
	rngBrgButton: P5ButtonElement | null;
	rngBrgLabel: P5InputElement | null;
	vectorMinsInput: P5SelectElement | null;
	practiceAnswerButton: P5ButtonElement | null;
	displayPracticeAnswerButton: boolean;
}

export const simState: SimulationState = {
	time: 0,
	lastUpdate: 0,
	nextUpdate: 0,
	nextLogTime: 0,
	settings: {} as SimulationSettings,
	atmosphere: {} as Atmosphere,
	aircraftList: [],
	stats: [],
	proximities: [],
	events: [],
	logLines: [],
	logDirty: false,
	rngBrgMode: false,
	rngBrgPos: null,
	separationPracticeSettings: null,
	separationPracticeStats: [],
	separationPracticeProximities: [],
};

export const uiState: UIState = {
	canvas: null,
	canvasDiv: null,
	logDiv: null,
	controlsDiv: null,
	gridCheckbox: null,
	ringsCheckbox: null,
	rngBrgButton: null,
	rngBrgLabel: null,
	vectorMinsInput: null,
	practiceAnswerButton: null,
	displayPracticeAnswerButton: false,
};

export function preConfig(): void {
	simState.nextLogTime = 0;
	simState.logLines = ['\n'];
	simState.logDirty = false;
}

export function postConfig(): void {
	simState.time = simState.settings.startTimeMins / 60;
	simState.lastUpdate = simState.time;
	simState.nextUpdate = simState.time;
}
