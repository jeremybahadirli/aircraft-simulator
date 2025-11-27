export const simState = {
	time: 0,
	nextLogTime: 0,
	settings: null,
	wind: null,
	aircraftList: [],
	loggers: [],
	events: [],
	logLines: [],
	logDirty: false,
};

export const uiState = {
	canvas: null,
	canvasDiv: null,
	logDiv: null,
	checkboxDiv: null,
	gridCheckbox: null,
	ringsCheckbox: null,
};

export function preConfig() {
	simState.time = 0;
	simState.nextLogTime = 0;
	simState.logLines = ['\n'];
	simState.logDirty = false;
}

export function postConfig() {
	simState.loggers = simState.loggers.filter(Boolean);
}
