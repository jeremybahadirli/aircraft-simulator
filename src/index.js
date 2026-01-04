import { initConfig } from './core/config.js';
import { MILLIS_PER_HOUR } from './core/constants.js';
import { simState, uiState } from './core/state.js';
import { printLogs } from './logging/logging.js';
import {
	drawAircraft,
	drawCanvas,
	drawGrid,
	drawRings,
	drawWind,
} from './render/drawing.js';
import { autoPosition } from './simulation/positioning.js';
import { createUI, handleWindowResized } from './ui/ui.js';

function setup() {
	angleMode(DEGREES);

	initConfig();
	createUI();
	uiState.canvas = createCanvas().parent(uiState.canvasDiv);
	handleWindowResized();

	const defaultPlaybackSpeed = simState.settings.playbackSpeed;
	uiState.canvas.mousePressed(() => {
		simState.settings.playbackSpeed =
			simState.settings.playbackSpeed === 0 ? defaultPlaybackSpeed : 0;
	});

	simState.events.forEach((e) => (e.armed = e.active));
	simState.aircraftList.forEach((a) => {
		a.updatePosition(simState.time);
	});
	simState.loggers.forEach((l) => l.updateProximity(0));

	printLogs(simState.time);
}

function draw() {
	const deltaHours =
		(deltaTime / MILLIS_PER_HOUR) * simState.settings.playbackSpeed;
	const nextTime = simState.time + deltaHours;

	if (simState.settings.playbackSpeed !== 0) {
		simState.events
			.filter((e) => e.armed && e.trigger())
			.forEach((e) => {
				e.armed = false;
				e.actions();
			});
		simState.aircraftList.forEach((a) => {
			a.prevPos = a.pos.copy();
			a.prevVel = a.vel.copy();
			a.updatePosition(deltaHours);
		});
		simState.loggers.forEach((l) => l.updateProximity(deltaHours));
		printLogs(nextTime);
	}

	drawCanvas();
	if (uiState.gridCheckbox.checked()) drawGrid();
	if (uiState.ringsCheckbox.checked()) drawRings();
	if (simState.wind.vel.mag() > 0) drawWind();
	simState.aircraftList.forEach((a) => drawAircraft(a));

	simState.time = nextTime;
}

function windowResized() {
	handleWindowResized();
}

window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
window.autoPosition = autoPosition;
