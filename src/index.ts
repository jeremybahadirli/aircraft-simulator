import {
	getConfigEditorData,
	initConfig,
	persistActiveConfig,
	validateConfig,
	validateSeparationPracticeConfig,
	type ConfigEditorDocument,
} from './config/config.js';
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
import {
	createUI,
	handleWindowResized,
	refreshUIForConfig,
} from './ui/ui.js';

interface ConfigSaveResult {
	success: boolean;
	message: string;
	mode?: 'normal' | 'separation_practice' | 'auto_position';
}

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
	createUI(applyEditedConfig);
	uiState.canvas = createCanvas().parent(uiState.canvasDiv!);
	handleWindowResized();
	initializeSimulationRuntime();

	uiState.canvas!.mousePressed(() => {
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

}

function initializeSimulationRuntime(): void {
	simState.rngBrgMode = false;
	simState.rngBrgPos = null;
	uiState.canvasDiv?.style('cursor', '');
	uiState.rngBrgLabel?.value('');
	refreshUIForConfig();

	simState.events.forEach((event) => (event.armed = event.active));
	simState.aircraftList.forEach((aircraft) => {
		aircraft.updatePosition(simState.time);
	});
	simState.proximities.forEach((proximity) => proximity.updateProximity(0));
	simState.nextUpdate += simState.settings.secondsPerUpdate / 60 / 60;
	printLogs(simState.time);
}

function applyEditedConfig(
	document: ConfigEditorDocument,
	configText: string,
): ConfigSaveResult {
	let configData: unknown;
	try {
		configData = JSON.parse(configText);
	} catch (error) {
		return {
			success: false,
			message: `Invalid JSON: ${getErrorMessage(error)}`,
		};
	}

	try {
		if (document === 'config') {
			validateConfig(configData);
		} else {
			validateSeparationPracticeConfig(configData);
		}
	} catch (error) {
		return { success: false, message: getErrorMessage(error) };
	}

	const previousConfig = getConfigEditorData();
	try {
		if (document === 'config') {
			initConfig(configData);
		} else {
			initConfig(undefined, configData);
		}
		initializeSimulationRuntime();
		const wasPersisted = persistActiveConfig(document);
		return {
			success: true,
			message: wasPersisted
				? ''
				: 'Browser storage unavailable; changes will not persist after reload.',
			mode: simState.settings.mode,
		};
	} catch (error) {
		try {
			initConfig(
				JSON.parse(previousConfig.configText),
				JSON.parse(previousConfig.separationPracticeConfigText),
			);
			initializeSimulationRuntime();
		} catch {
			// Keep the original config error visible if recovery also fails.
		}
		return { success: false, message: getErrorMessage(error) };
	}
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
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
			a.recordHistory();
			a.updatePosition(nextTime - simState.lastUpdate);
		});
		simState.proximities.forEach((l) =>
			l.updateProximity(nextTime - simState.lastUpdate),
		);

		simState.lastUpdate = nextTime;
		simState.nextUpdate += simState.settings.secondsPerUpdate / 60 / 60;
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
