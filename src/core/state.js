export const simState = {
	time: 0,
	lastUpdate: 0,
	nextUpdate: 0,
	settings: null,
	wind: null,
	aircraftList: [],
	stats: [],
	proximities: [],
	events: [],
	logLines: [],
	logDirty: false,
	rngBrgMode: false,
	rngBrgPos: null,
};

export const uiState = {
	canvas: null,
	canvasDiv: null,
	logDiv: null,
	controlsDiv: null,
	gridCheckbox: null,
	ringsCheckbox: null,
	rngBrgButton: null,
	rngBrgLabel: null,
	vectorMinsInput: null,
	displayPracticeAnswerButton: false,
};

export function preConfig() {
	simState.nextLogTime = 0;
	simState.logLines = ['\n'];
	simState.logDirty = false;
}

export function postConfig() {
	simState.time = simState.settings.startTimeMins / 60;
	simState.lastUpdate = simState.time;
	simState.nextUpdate = simState.time;
}
