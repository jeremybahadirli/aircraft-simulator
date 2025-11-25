function createUI() {
	canvasDiv = createDiv()
		.style('flex', '1')
		.style('min-width', '0')
		.style('min-height', '0')
		.style('position', 'relative');
	logDiv = createDiv()
		.style('width', '100%')
		.style('height', `${aircraftList.length + loggers.length + 3}lh`)
		.style('white-space', 'pre')
		.style('overflow', 'auto')
		.style('color', '#ccc')
		.style('background-color', '#111')
		.style('font-family', 'ui-monospace')
		.style('font-size', '16px');
	checkboxDiv = createDiv()
		.style('display', 'flex')
		.style('gap', '16px')
		.style('padding', '8px');
	gridCheckbox = createPersistentCheckbox('Show Grid', 'showGrid');
	ringsCheckbox = createPersistentCheckbox('Show Rings', 'showRings');
}

function createPersistentCheckbox(label, storageKey) {
	const checked = localStorage.getItem(storageKey) === 'true';
	const checkbox = createCheckbox(`\t${label}`, checked)
		.parent(checkboxDiv)
		.style('color', '#ccc')
		.style('font-family', 'system-ui');
	checkbox.changed(() => {
		localStorage.setItem(storageKey, checkbox.checked());
	});
	return checkbox;
}

function windowResized() {
	resizeCanvas(canvasDiv.elt.clientWidth, canvasDiv.elt.clientHeight);
	canvas.style('width', '100%');
	canvas.style('height', '100%');
	logDiv.elt.scrollTop = logDiv.elt.scrollHeight;
}
