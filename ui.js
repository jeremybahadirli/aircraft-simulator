function createUI() {
	consoleContainer = createDiv()
		.style('resize', 'vertical')
		.style('overflow', 'auto')
		.style('min-height', '60px')
		.style('max-height', '70vh')
		.style('width', settings.displaySize.x + 'px')
		.style('font-size', '14px')
		.style('height', `${aircraftList.length + loggers.length + 3}lh`)
		.style('color', '#ccc')
		.style('background', '#111');
	logDiv = createDiv()
		.parent(consoleContainer)
		.style('font-family', 'ui-monospace')
		.style('font-size', '14px')
		.style('white-space', 'pre')
		.style('padding-left', '8px')
		.style('padding-right', '8px')
		.style('background', '#111');
	gridCheckbox = createPersistentCheckbox('Show Grid', 'showGrid');
	ringsCheckbox = createPersistentCheckbox('Show Rings', 'showRings');
}

function createPersistentCheckbox(label, storageKey) {
	const checked = localStorage.getItem(storageKey) === 'true';
	const checkbox = createCheckbox(`\t${label}`, checked)
		.style('display', 'inline')
		.style('padding', '8px')
		.style('color', '#ccc')
		.style('font-family', 'system-ui');
	checkbox.changed(() => {
		localStorage.setItem(storageKey, checkbox.checked());
	});
	return checkbox;
}
