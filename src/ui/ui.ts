import { executeCommand } from '../core/commands.js';
import { simState, uiState } from '../core/state.js';

const CONSOLE_FONT_SIZE = '16px';
const CONSOLE_HEIGHT_LH_PADDING = 3;
const COMMAND_PANEL_FONT = 'ERAMv300, monospace, ui-monospace';
const VECTOR_MINS_OPTIONS: readonly number[] = [0, 1, 2, 4, 8];
const SHIFT_COMMAND_INPUT_MAP: Readonly<Record<string, string>> = {
	Digit8: '1',
	Digit9: '2',
	Digit0: '3',
	KeyI: '4',
	KeyO: '5',
	KeyP: '6',
	KeyK: '7',
	KeyL: '8',
	Semicolon: '9',
	Comma: '0',
	Period: '0',
	Slash: '/',
};

export function createUI(): void {
	uiState.canvasDiv = createDiv()
		.style('flex', '1')
		.style('min-width', '0')
		.style('min-height', '0')
		.style('position', 'relative')
		.style('cursor', simState.rngBrgMode ? 'none' : '');
	uiState.consoleDiv = createDiv()
		.style('display', 'flex')
		.style('width', '100%')
		.style(
			'height',
			`${
				simState.stats.length +
				simState.proximities.length +
				CONSOLE_HEIGHT_LH_PADDING
			}lh`,
		)
		.style('min-height', '96px')
		.style('background-color', '#111');
	uiState.logDiv = createDiv()
		.parent(uiState.consoleDiv)
		.style('flex', '1 1 50%')
		.style('min-width', '0')
		.style('height', '100%')
		.style('box-sizing', 'border-box')
		.style('white-space', 'pre')
		.style('overflow', 'auto')
		.style('color', '#ccc')
		.style('background-color', '#111')
		.style('font-family', 'monospace, ui-monospace')
		.style('font-size', CONSOLE_FONT_SIZE);
	uiState.commandLineDiv = createDiv()
		.parent(uiState.consoleDiv)
		.style('flex', '1 1 50%')
		.style('min-width', '0')
		.style('height', '100%')
		.style('box-sizing', 'border-box')
		.style('display', 'flex')
		.style('flex-direction', 'column')
		.style('border-left', '1px solid #333')
		.style('background-color', '#111')
		.style('color', '#ccc')
		.style('font-family', COMMAND_PANEL_FONT)
		.style('font-size', CONSOLE_FONT_SIZE);
	uiState.commandOutputDiv = createDiv()
		.parent(uiState.commandLineDiv)
		.style('flex', '1')
		.style('min-height', '0')
		.style('box-sizing', 'border-box')
		.style('padding', '4px 6px')
		.style('white-space', 'pre-wrap')
		.style('overflow', 'auto')
		.style('font-family', COMMAND_PANEL_FONT)
		.style('font-size', CONSOLE_FONT_SIZE);
	uiState.commandInput = createInput()
		.parent(uiState.commandLineDiv)
		.attribute('autocomplete', 'off')
		.attribute('spellcheck', 'false')
		.attribute('aria-label', 'Command line')
		.style('width', '100%')
		.style('box-sizing', 'border-box')
		.style('border', '0')
		.style('border-top', '1px solid #333')
		.style('padding', '3px 6px')
		.style('outline', 'none')
		.style('background-color', '#080808')
		.style('color', '#ccc')
		.style('font-family', COMMAND_PANEL_FONT)
		.style('font-size', CONSOLE_FONT_SIZE);
	uiState.commandInput.elt.addEventListener('keydown', handleCommandKeyDown);
	window.addEventListener('keydown', handleGlobalCommandLineKeyDown, true);
	uiState.controlsDiv = createDiv()
		.style('display', 'flex')
		.style('gap', '16px')
		.style('padding', '8px');
	uiState.gridCheckbox = createPersistentCheckbox('Show Grid', 'showGrid');
	uiState.ringsCheckbox = createPersistentCheckbox('Show Rings', 'showRings');

	uiState.vectorMinsInput = createSelect().parent(uiState.controlsDiv!);
	for (const vectorMins of VECTOR_MINS_OPTIONS) {
		uiState.vectorMinsInput!.option(vectorMins);
	}
	uiState.vectorMinsInput!.selected(1);

	uiState.rngBrgButton = createButton('RNG/BRG')
		.parent(uiState.controlsDiv!)
		.mouseClicked(() => {
			simState.rngBrgMode = true;
			uiState.canvasDiv?.style('cursor', 'none');
		});

	uiState.rngBrgLabel = createInput()
		.parent(uiState.controlsDiv!)
		.size(100)
		.attribute('disabled', 'true')
		.style('color', 'black');

	uiState.practiceAnswerButton = createButton('Show Answer')
		.parent(uiState.controlsDiv!)
		.style('display', uiState.displayPracticeAnswerButton ? '' : 'none')
		.mouseClicked(() => {
			simState.settings.playbackSpeed = 20;
			simState.defaultPlaybackSpeed = simState.settings.playbackSpeed;
			simState.settings.updateFrequency = 0;
			simState.nextUpdate = simState.time;
		});
}

export function handleWindowResized(): void {
	if (!uiState.canvas || !uiState.canvasDiv || !uiState.logDiv) return;

	resizeCanvas(
		uiState.canvasDiv.elt.clientWidth,
		uiState.canvasDiv.elt.clientHeight,
	);
	uiState.canvas.style('width', '100%');
	uiState.canvas.style('height', '100%');
	uiState.logDiv.elt.scrollTop = uiState.logDiv.elt.scrollHeight;
	if (uiState.commandOutputDiv) {
		uiState.commandOutputDiv.elt.scrollTop =
			uiState.commandOutputDiv.elt.scrollHeight;
	}
}

function handleCommandKeyDown(event: KeyboardEvent): void {
	if (event.key !== 'Enter') return;

	event.preventDefault();
	submitCommandInput();
}

function handleGlobalCommandLineKeyDown(event: KeyboardEvent): void {
	if (event.defaultPrevented) return;
	if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) {
		return;
	}

	const input = uiState.commandInput?.elt;
	const mappedInputText = getShiftCommandInputText(event);
	if (input && mappedInputText !== null) {
		event.preventDefault();
		input.focus();
		appendCommandInputText(input, mappedInputText);
		return;
	}

	if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
		event.preventDefault();
		stepVectorMins(event.key === 'ArrowUp' ? 1 : -1);
		return;
	}

	if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
		event.preventDefault();
		stepVRange(event.key === 'ArrowLeft' ? 25 : -25);
		return;
	}

	if (!input || event.target === input) return;

	if (event.key === 'Enter') {
		event.preventDefault();
		input.focus();
		submitCommandInput();
		return;
	}

	if (event.key === 'Backspace') {
		event.preventDefault();
		input.focus();
		deleteCommandInputTrailingCharacter(input);
		return;
	}

	if (event.key.length !== 1) return;

	event.preventDefault();
	input.focus();
	appendCommandInputText(input, event.key);
}

function stepVectorMins(direction: 1 | -1): void {
	const vectorMinsInput = uiState.vectorMinsInput;
	if (!vectorMinsInput) return;

	const currentValue = Number(vectorMinsInput.value());
	const currentIndex = VECTOR_MINS_OPTIONS.indexOf(currentValue);
	const baseIndex = currentIndex === -1 ? 0 : currentIndex;
	const nextIndex = Math.max(
		0,
		Math.min(VECTOR_MINS_OPTIONS.length - 1, baseIndex + direction),
	);
	vectorMinsInput.selected(VECTOR_MINS_OPTIONS[nextIndex]);
}

function stepVRange(nm: number): void {
	simState.settings.vRange = Math.max(
		25,
		Math.min(400, simState.settings.vRange + nm),
	);
}

function submitCommandInput(): void {
	const command = uiState.commandInput?.value() ?? '';
	if (command.trim().length === 0) return;

	uiState.commandInput?.value('');
	const result = executeCommand(command);
	setCommandOutput(result.accept, result.message);
}

function appendCommandInputText(input: HTMLInputElement, value: string): void {
	const selectionStart = input.selectionStart ?? input.value.length;
	const selectionEnd = input.selectionEnd ?? selectionStart;
	input.setRangeText(value, selectionStart, selectionEnd, 'end');
}

function getShiftCommandInputText(event: KeyboardEvent): string | null {
	if (!event.shiftKey) return null;

	return SHIFT_COMMAND_INPUT_MAP[event.code] ?? null;
}

function deleteCommandInputTrailingCharacter(input: HTMLInputElement): void {
	if (input.value.length === 0) return;

	const deleteAt = input.value.length - 1;
	input.setRangeText('', deleteAt, input.value.length, 'end');
}

function setCommandOutput(accept: boolean, message: string): void {
	if (!uiState.commandOutputDiv) return;

	const marker = document.createElement('span');
	marker.textContent = accept ? '✓' : '✕';
	marker.style.color = accept ? '#35d46b' : '#ff4d4d';

	uiState.commandOutputDiv.elt.replaceChildren(
		marker,
		document.createTextNode(` ${accept ? 'ACCEPT' : 'REJECT'}\n${message}`),
	);
	uiState.commandOutputDiv.elt.scrollTop =
		uiState.commandOutputDiv.elt.scrollHeight;
}

function createPersistentCheckbox(
	label: string,
	storageKey: string,
): P5CheckboxElement {
	const checked = localStorage.getItem(storageKey) === 'true';
	const checkbox = createCheckbox(`\t${label}`, checked)
		.parent(uiState.controlsDiv!)
		.style('color', '#ccc')
		.style('font-family', 'system-ui');
	checkbox.changed(() => {
		localStorage.setItem(storageKey, String(checkbox.checked()));
	});
	return checkbox;
}
