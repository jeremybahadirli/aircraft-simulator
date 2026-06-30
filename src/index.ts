import { initConfig } from './core/config.js';
import { MILLIS_PER_HOUR } from './core/constants.js';
import { simState, uiState } from './core/state.js';
import { createViewport } from './core/viewport.js';
import { printLogs } from './logging/logging.js';
import {
	drawAircraft,
	drawCanvas,
	drawCrosshair,
	drawGrid,
	drawPausedBorder,
	drawRings,
	drawWind,
} from './render/drawing.js';
import { autoPosition } from './simulation/positioning.js';
import { formatNumber, getMousePos } from './simulation/utils.js';
import { createUI, handleWindowResized } from './ui/ui.js';

declare global {
	interface Window {
		setup: typeof setup;
		draw: typeof draw;
		windowResized: typeof windowResized;
		autoPosition: typeof autoPosition;
	}
}

function setup(): void {
	angleMode(DEGREES);

	initConfig();
	createUI();
	uiState.canvas = createCanvas().parent(uiState.canvasDiv!);
	handleWindowResized();

	uiState.canvas!.mouseClicked(() => {
		if (simState.rngBrgMode) {
			if (simState.rngBrgPos === null) {
				simState.rngBrgPos = getMousePos(mouseX, mouseY);
			} else {
				const newPos = getMousePos(mouseX, mouseY);
				const rngBrg = newPos.copy().sub(simState.rngBrgPos);
				uiState.rngBrgLabel?.value(
					`${rngBrg.mag().toFixed(1)} NM / ${
						formatNumber(rngBrg.asHeading(), 0, 3).n
					}º`,
				);

				simState.rngBrgMode = false;
				simState.rngBrgPos = null;
				uiState.canvasDiv?.style('cursor', '');
			}
		} else {
			simState.settings.playbackSpeed =
				simState.settings.playbackSpeed === 0
					? simState.defaultPlaybackSpeed
					: 0;
		}
	});

	simState.events.forEach((e) => (e.armed = e.active));
	simState.aircraftList.forEach((a) => {
		a.updatePosition(simState.time);
	});
	simState.proximities.forEach((l) => l.updateProximity(0));

	printLogs(simState.time);
}

function draw(): void {
	const deltaHours =
		(deltaTime / MILLIS_PER_HOUR) * simState.settings.playbackSpeed;
	const nextTime = simState.time + deltaHours;

	if (nextTime > simState.nextUpdate) {
		simState.events
			.filter((e) => e.armed && e.trigger())
			.forEach((e) => {
				e.armed = false;
				e.actions();
			});
		simState.aircraftList.forEach((a) => {
			a.prevPos = a.pos.copy();
			a.prevVel = a.vel.copy();
			a.updatePosition(nextTime - simState.lastUpdate);
		});
		simState.proximities.forEach((l) =>
			l.updateProximity(nextTime - simState.lastUpdate),
		);

		simState.lastUpdate = nextTime;
		simState.nextUpdate += simState.settings.updateFrequency / 60 / 60;
	}
	if (simState.settings.playbackSpeed !== 0) printLogs(nextTime);

	const viewport = createViewport();

	drawCanvas(viewport);
	if (simState.rngBrgMode) drawCrosshair(viewport);
	if (uiState.gridCheckbox?.checked()) drawGrid(viewport);
	if (uiState.ringsCheckbox?.checked()) drawRings(viewport);
	if (simState.atmosphere.windVel.mag() > 0) drawWind(viewport);
	for (let i = simState.aircraftList.length - 1; i >= 0; i--) {
		drawAircraft(simState.aircraftList[i], i, viewport);
	}
	if (simState.settings.playbackSpeed === 0) drawPausedBorder();

	simState.time = nextTime;
}

function windowResized(): void {
	handleWindowResized();
}

window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
window.autoPosition = autoPosition;
