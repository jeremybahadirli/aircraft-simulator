import { simState, uiState } from '../core/state.js';

export function createUI() {
	uiState.canvasDiv = createDiv()
		.style('flex', '1')
		.style('min-width', '0')
		.style('min-height', '0')
		.style('position', 'relative');
	uiState.logDiv = createDiv()
		.style('width', '100%')
		.style(
			'height',
			`${
				(simState.settings.logStats
					? simState.aircraftList.length
					: 0) +
				simState.loggers.length +
				3
			}lh`
		)
		.style('white-space', 'pre')
		.style('overflow', 'auto')
		.style('color', '#ccc')
		.style('background-color', '#111')
		.style('font-family', 'ui-monospace')
		.style('font-size', '16px');
	uiState.controlsDiv = createDiv()
		.style('display', 'flex')
		.style('gap', '16px')
		.style('padding', '8px');
	uiState.gridCheckbox = createPersistentCheckbox('Show Grid', 'showGrid');
	uiState.ringsCheckbox = createPersistentCheckbox('Show Rings', 'showRings');

	uiState.vectorMinsInput = createSelect().parent(uiState.controlsDiv);
	for (let i of [0, 1, 2, 4, 8]) {
		uiState.vectorMinsInput.option(i);
	}
	uiState.vectorMinsInput.selected(1);

	uiState.rngBrgButton = createButton('RNG/BRG')
		.parent(uiState.controlsDiv)
		.mousePressed(() => (simState.rngBrgMode = true));

	uiState.rngBrgLabel = createInput()
		.parent(uiState.controlsDiv)
		.size(80)
		.attribute('disabled', 'true');
}

export function handleWindowResized() {
	resizeCanvas(
		uiState.canvasDiv.elt.clientWidth,
		uiState.canvasDiv.elt.clientHeight
	);
	uiState.canvas.style('width', '100%');
	uiState.canvas.style('height', '100%');
	uiState.logDiv.elt.scrollTop = uiState.logDiv.elt.scrollHeight;
}

function createPersistentCheckbox(label, storageKey) {
	const checked = localStorage.getItem(storageKey) === 'true';
	const checkbox = createCheckbox(`\t${label}`, checked)
		.parent(uiState.controlsDiv)
		.style('color', '#ccc')
		.style('font-family', 'system-ui');
	checkbox.changed(() => {
		localStorage.setItem(storageKey, checkbox.checked());
	});
	return checkbox;
}
