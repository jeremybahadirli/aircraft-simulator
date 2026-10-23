import { createSimulatorApp } from './app/simulator.js';
import { autoPosition } from './simulation/positioning.js';

const simulator = createSimulatorApp();

declare global {
	interface Window {
		setup: typeof setup;
		draw: typeof draw;
		windowResized: typeof windowResized;
		autoPosition: typeof autoPosition;
	}
}

function setup(): void {
	simulator.setup();
}

function draw(): void {
	simulator.draw();
}

function windowResized(): void {
	simulator.windowResized();
}

window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
window.autoPosition = autoPosition;
