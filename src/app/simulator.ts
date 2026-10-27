import { ConfigRepository } from '../config/repository.js';
import type { SimulationScenario } from '../config/scenario.js';
import type { ConfigEditorDocument } from '../config/types.js';
import { MILLIS_PER_HOUR } from '../constants.js';
import { formatStatusFrame } from '../logging/logging.js';
import { formatNumber } from '../math/formatNumber.js';
import {
	drawAircraft,
	drawCanvas,
	drawCrosshair,
	drawGrid,
	drawPausedBorder,
	drawRings,
	drawWind,
} from '../render/drawing.js';
import { createViewport } from '../render/viewport.js';
import { executeCommand } from '../simulation/commands.js';
import { updateSimulation } from '../simulation/engine.js';
import type { SimulationState } from '../simulation/state.js';
import {
	appendLogFrame,
	createLogPanelState,
	renderLogPanel,
	type LogPanelState,
} from '../ui/logPanel.js';
import { getPointerWorldPosition } from '../ui/pointer.js';
import type { SimulatorUI } from '../ui/state.js';
import {
	createUI,
	handleWindowResized,
	refreshUIForConfig,
	type SimulatorUIConfig,
} from '../ui/ui.js';
import {
	createViewState,
	type ViewPreferences,
	type ViewState,
} from '../view/state.js';

import type { ConfigEditorInitMessage } from '../ui/config-editor/protocol.js';

export interface SimulatorApp {
	setup(): void;
	draw(): void;
	windowResized(): void;
}

interface SimulationFrameClock {
	simulation: SimulationState;
	lastFrameTime: number;
}

export function createSimulatorApp(): SimulatorApp {
	const configRepository = new ConfigRepository();
	let simulation: SimulationState | null = null;
	let simulationFrameClock: SimulationFrameClock | null = null;
	let viewState: ViewState | null = null;
	let view: SimulatorUI | null = null;
	let logPanelState: LogPanelState | null = null;

	function resetSimulationFrameClock(
		state: SimulationState,
		baseline = performance.now(),
	): void {
		simulationFrameClock = { simulation: state, lastFrameTime: baseline };
	}

	function getSimulationFrameDelta(state: SimulationState): number {
		const now = performance.now();
		if (simulationFrameClock?.simulation !== state) {
			resetSimulationFrameClock(state, now);
			return 0;
		}

		const delta = Math.max(0, now - simulationFrameClock.lastFrameTime);
		simulationFrameClock.lastFrameTime = now;
		return delta;
	}

	function getSimulation(): SimulationState {
		if (!simulation)
			throw new Error('The simulator has not been initialized.');
		return simulation;
	}

	function getViewState(): ViewState {
		if (!viewState)
			throw new Error('The simulator view has not been initialized.');
		return viewState;
	}

	function getView(): SimulatorUI {
		if (!view)
			throw new Error('The simulator UI has not been initialized.');
		return view;
	}

	function getLogPanelState(): LogPanelState {
		if (!logPanelState)
			throw new Error('The log panel has not been initialized.');
		return logPanelState;
	}

	function setup(): void {
		angleMode(DEGREES);
		const scenario = configRepository.createScenario();
		simulation = scenario.simulation;
		viewState = createViewState(scenario.viewSettings);
		const createdView = createUI(
			getSimulatorUIConfig(getSimulation()),
			getViewState(),
			{
				getInitialMessage: (): ConfigEditorInitMessage => ({
					type: 'config-editor:init',
					mode: getSimulation().simSettings.mode,
					...configRepository.getEditorData(),
				}),
				save: applyEditedConfig,
			},
			{
				executeCommand: (command) =>
					executeCommand(getSimulation(), command),
				showPracticeAnswer: () => {
					const state = getSimulation();
					state.simSettings.playbackSpeed = 20;
					state.defaultPlaybackSpeed =
						state.simSettings.playbackSpeed;
					state.simSettings.secondsPerUpdate = 0;
					state.nextUpdate = state.time;
				},
			},
		);
		view = createdView;
		createdView.canvas = createCanvas().parent(createdView.canvasDiv!);
		logPanelState = createLogPanelState();
		handleWindowResized(createdView, getSimulatorUIConfig(getSimulation()));
		initializeSimulationRuntime(
			getSimulation(),
			getViewState(),
			logPanelState,
		);
		resetSimulationFrameClock(getSimulation());
		createdView.canvas!.mousePressed(handleCanvasMousePressed);
	}

	function handleCanvasMousePressed(): void {
		const simulation = getSimulation();
		const viewState = getViewState();
		const view = getView();
		if (view.rngBrgMode) {
			const viewport = createViewport(width, height, viewState.vRange);
			const position = getPointerWorldPosition(
				mouseX,
				mouseY,
				viewport,
				keyIsPressed,
			);
			if (view.rngBrgPos === null) {
				view.rngBrgPos = position;
			} else {
				const rngBrg = position.copy().sub(view.rngBrgPos);
				view.rngBrgLabel?.value(
					`${rngBrg.mag().toFixed(1)} NM / ${
						formatNumber(rngBrg.heading(), 0, 3).n
					}º`,
				);
				view.rngBrgMode = false;
				view.rngBrgPos = null;
				view.canvasDiv?.style('cursor', '');
			}
			return;
		}

		simulation.simSettings.playbackSpeed =
			simulation.simSettings.playbackSpeed === 0
				? simulation.defaultPlaybackSpeed
				: 0;
	}

	function initializeSimulationRuntime(
		state: SimulationState,
		stateView: ViewState,
		logPanel: LogPanelState,
	): void {
		const view = getView();
		refreshUIForConfig(view, getSimulatorUIConfig(state), stateView);
		state.events.forEach((event) => (event.armed = event.active));
		state.aircraftList.forEach((aircraft) => {
			aircraft.updatePosition(state.time);
		});
		state.proximities.forEach((proximity) => proximity.updateProximity(0));
		state.nextUpdate += state.simSettings.secondsPerUpdate / 60 / 60;
		appendLogFrame(
			logPanel,
			formatStatusFrame(state, stateView, state.time),
			view.logDiv?.elt ?? null,
		);
	}

	function applyEditedConfig(
		document: ConfigEditorDocument,
		configText: string,
	): {
		success: boolean;
		message: string;
		mode?: SimulationState['simSettings']['mode'];
	} {
		const configApplicationTime = performance.now();
		let configData: unknown;
		try {
			configData = JSON.parse(configText);
		} catch (error) {
			return {
				success: false,
				message: `Invalid JSON: ${getErrorMessage(error)}`,
			};
		}

		const previousSimulation = simulation;
		const previousViewState = getViewState();
		let candidate: SimulationScenario;
		try {
			candidate =
				document === 'config'
					? configRepository.createScenario(configData)
					: configRepository.createScenario(undefined, configData);
		} catch (error) {
			return { success: false, message: getErrorMessage(error) };
		}

		const candidateViewState = createViewState(
			candidate.viewSettings,
			getViewPreferences(previousViewState),
		);
		const candidateLogPanelState = createLogPanelState();
		try {
			initializeSimulationRuntime(
				candidate.simulation,
				candidateViewState,
				candidateLogPanelState,
			);
			Object.assign(previousViewState, candidateViewState);
			simulation = candidate.simulation;
			logPanelState = candidateLogPanelState;
			const wasPersisted = configRepository.commit(document, configData);
			resetSimulationFrameClock(
				candidate.simulation,
				configApplicationTime,
			);
			return {
				success: true,
				message: wasPersisted
					? ''
					: 'Browser storage unavailable; changes will not persist after reload.',
				mode: candidate.simulation.simSettings.mode,
			};
		} catch (error) {
			if (previousSimulation) {
				try {
					restoreSimulationUI(previousSimulation, previousViewState);
				} catch {
					// Keep the config error visible if recovery also fails.
				}
			}
			return { success: false, message: getErrorMessage(error) };
		}
	}

	function draw(): void {
		const simulation = getSimulation();
		const viewState = getViewState();
		const view = getView();
		const logPanelState = getLogPanelState();
		const deltaHours =
			(getSimulationFrameDelta(simulation) / MILLIS_PER_HOUR) *
			simulation.simSettings.playbackSpeed;
		const nextTime = simulation.time + deltaHours;
		updateSimulation(simulation, nextTime);

		appendLogFrame(
			logPanelState,
			formatStatusFrame(simulation, viewState, nextTime),
			view.logDiv?.elt ?? null,
		);

		const viewport = createViewport(width, height, viewState.vRange);
		drawCanvas(viewport);
		if (view.rngBrgMode) {
			drawCrosshair(
				viewport,
				getPointerWorldPosition(mouseX, mouseY, viewport, keyIsPressed),
			);
		}
		if (viewState.showGrid) {
			drawGrid(viewport, viewState.vRange);
		}
		if (viewState.showRings) {
			drawRings(viewport, viewState.vRange);
		}
		if (simulation.atmosphere.windVel.mag() > 0) {
			drawWind(
				viewport,
				simulation.atmosphere,
				viewState.statsDecimalPlaces,
			);
		}
		for (let i = simulation.aircraftList.length - 1; i >= 0; i--) {
			drawAircraft(
				simulation.aircraftList[i],
				viewport,
				viewState.vectorMinutes,
			);
		}
		if (simulation.simSettings.playbackSpeed === 0)
			drawPausedBorder(viewport);
		simulation.time = nextTime;
	}

	function restoreSimulationUI(
		state: SimulationState,
		stateView: ViewState,
	): void {
		const view = getView();
		const logPanelState = getLogPanelState();
		refreshUIForConfig(view, getSimulatorUIConfig(state), stateView);
		renderLogPanel(logPanelState, view.logDiv?.elt ?? null);
	}

	function windowResized(): void {
		if (view && simulation) {
			handleWindowResized(view, getSimulatorUIConfig(simulation));
		}
	}

	return { setup, draw, windowResized };
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function getSimulatorUIConfig(state: SimulationState): SimulatorUIConfig {
	return {
		mode: state.simSettings.mode,
		statsCount: state.stats.length,
		proximitiesCount: state.proximities.length,
	};
}

function getViewPreferences(state: ViewState): ViewPreferences {
	return {
		showGrid: state.showGrid,
		showRings: state.showRings,
		vectorMinutes: state.vectorMinutes,
	};
}
