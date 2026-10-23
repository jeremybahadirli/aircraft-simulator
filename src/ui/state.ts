import type { Vector2 } from '../math/vector2.js';

export interface SimulatorUI {
	canvas: P5CanvasElement | null;
	canvasDiv: P5DivElement | null;
	consoleDiv: P5DivElement | null;
	logDiv: P5DivElement | null;
	commandLineDiv: P5DivElement | null;
	commandOutputDiv: P5DivElement | null;
	commandInput: P5InputElement | null;
	controlsDiv: P5DivElement | null;
	gridCheckbox: P5CheckboxElement | null;
	ringsCheckbox: P5CheckboxElement | null;
	rngBrgButton: P5ButtonElement | null;
	rngBrgLabel: P5InputElement | null;
	vectorMinsInput: P5SelectElement | null;
	practiceAnswerButton: P5ButtonElement | null;
	configButton: P5ButtonElement | null;
	rngBrgMode: boolean;
	rngBrgPos: Vector2 | null;
}

export function createSimulatorUIState(): SimulatorUI {
	return {
		canvas: null,
		canvasDiv: null,
		consoleDiv: null,
		logDiv: null,
		commandLineDiv: null,
		commandOutputDiv: null,
		commandInput: null,
		controlsDiv: null,
		gridCheckbox: null,
		ringsCheckbox: null,
		rngBrgButton: null,
		rngBrgLabel: null,
		vectorMinsInput: null,
		practiceAnswerButton: null,
		configButton: null,
		rngBrgMode: false,
		rngBrgPos: null,
	};
}
