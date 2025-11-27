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
		if (simState.settings.playbackSpeed === 0) {
			simState.settings.playbackSpeed = defaultPlaybackSpeed;
		} else {
			simState.settings.playbackSpeed = 0;
		}
	});

	for (const pl of simState.loggers) {
		pl.updateProximity();
	}

	for (const e of simState.events) {
		e.armed = e.active;
	}

	printLogs(simState.time);
	simState.nextLogTime += simState.settings.consoleFrequency / 60 / 60;
}

function draw() {
	translate(createVector(width, height).div(2));
	scale(height / simState.settings.vRange);
	scale(1, -1);

	const deltaHours =
		(deltaTime / MILLIS_PER_HOUR) * simState.settings.playbackSpeed;
	const nextTime = simState.time + deltaHours;

	if (simState.settings.playbackSpeed !== 0) {
		for (const event of simState.events) {
			if (event.armed && event.trigger()) {
				event.armed = false;
				event.actions();
				for (const logger of simState.loggers) {
					logger.updateCalculated();
				}
			}
		}

		for (const ac of simState.aircraftList) {
			ac.updateGroundTrack();
			ac.updatePosition(deltaHours);
		}

		for (const pl of simState.loggers) {
			pl.updateProximity();
		}

		if (abs(nextTime) >= simState.nextLogTime) {
			printLogs(nextTime);
			simState.nextLogTime +=
				simState.settings.consoleFrequency / 60 / 60;
		}
	}

	drawCanvas();
	if (uiState.gridCheckbox.checked()) drawGrid();
	if (uiState.ringsCheckbox.checked()) drawRings();
	if (simState.wind.vel.mag() > 0) drawWind(simState.wind);
	for (const ac of simState.aircraftList) {
		drawAircraft(ac);
	}

	simState.time = simState.time + deltaHours;
}

function windowResized() {
	handleWindowResized();
}

window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
window.autoPosition = autoPosition;
