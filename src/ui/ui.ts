import type { SimulationMode } from '../simulation/state.js';
import {
	ConfigEditorHost,
	type ConfigEditorCallbacks,
} from './config-editor/host.js';
import {
	createSimulatorUIState,
	type SimulatorUI,
} from './state.js';
import type { ViewState } from '../view/state.js';

export interface SimulatorUIConfig {
	mode: SimulationMode;
	statsCount: number;
	proximitiesCount: number;
}

export interface SimulatorUIActions {
	executeCommand(command: string): { accept: boolean; message: string };
	showPracticeAnswer(): void;
}

const CONSOLE_HEIGHT_LH_PADDING = 3;
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

class SimulatorUIController {
	readonly view = createSimulatorUIState();
	private readonly configEditorHost: ConfigEditorHost;

	constructor(
		private readonly initialConfig: SimulatorUIConfig,
		private readonly viewState: ViewState,
		configEditor: ConfigEditorCallbacks,
		private readonly actions: SimulatorUIActions,
	) {
		this.configEditorHost = new ConfigEditorHost(configEditor);
	}

	create(): SimulatorUI {
		this.configEditorHost.connect();
		this.view.canvasDiv = createDiv()
			.style('flex', '1')
			.style('min-width', '0')
			.style('min-height', '0')
			.style('position', 'relative')
			.style('cursor', this.view.rngBrgMode ? 'none' : '');
		this.view.canvasDiv!.elt.classList.add('simulator-canvas');
		this.view.consoleDiv = createDiv()
			.style('display', 'flex')
			.style('width', '100%')
			.style('min-height', '96px')
			.style('background-color', '#111');
		this.view.consoleDiv!.elt.classList.add('simulator-console');
		this.view.logDiv = createDiv()
			.parent(this.view.consoleDiv!)
			.style('flex', '1 1 50%')
			.style('min-width', '0')
			.style('height', '100%')
			.style('box-sizing', 'border-box')
			.style('white-space', 'pre')
			.style('overflow', 'auto')
			.style('color', '#ccc')
			.style('background-color', '#111')
			.style('font-family', 'monospace, ui-monospace')
			.style('font-size', '16px');
		this.view.logDiv!.elt.classList.add('stats-panel');
		setConsoleHeight(this.view, this.initialConfig);
		this.view.commandLineDiv = createDiv()
			.parent(this.view.consoleDiv!)
			.style('flex', '1 1 50%')
			.style('min-width', '0')
			.style('max-width', '600px')
			.style('height', '100%')
			.style('box-sizing', 'border-box')
			.style('display', 'flex')
			.style('flex-direction', 'column')
			.style('border-left', '1px solid #333')
			.style('background-color', '#111')
			.style('color', '#ccc')
			.style('font-family', 'ERAMv300, monospace, ui-monospace')
			.style('font-size', '16px');
		this.view.commandLineDiv!.elt.classList.add('command-panel');
		this.view.commandOutputDiv = createDiv()
			.parent(this.view.commandLineDiv!)
			.style('flex', '1')
			.style('min-height', '0')
			.style('box-sizing', 'border-box')
			.style('padding', '4px 6px')
			.style('white-space', 'pre-wrap')
			.style('overflow', 'auto')
			.style('font-family', 'ERAMv300, monospace, ui-monospace')
			.style('font-size', '16px');
		this.view.commandOutputDiv!.elt.classList.add('command-output');
		this.view.commandInput = createInput()
			.parent(this.view.commandLineDiv!)
			.attribute('autocomplete', 'off')
			.attribute('spellcheck', 'false')
			.attribute('inputmode', 'text')
			.attribute('aria-label', 'Command line')
			.style('width', '100%')
			.style('box-sizing', 'border-box')
			.style('border', '0')
			.style('border-top', '1px solid #333')
			.style('padding', '3px 6px')
			.style('outline', 'none')
			.style('background-color', '#080808')
			.style('color', '#ccc')
			.style('font-family', 'ERAMv300, monospace, ui-monospace')
			.style('font-size', '16px');
		this.view.commandInput!.elt.classList.add('command-input');
		this.view.commandInput!.elt.addEventListener(
			'keydown',
			this.handleCommandKeyDown,
		);
		window.addEventListener(
			'keydown',
			this.handleGlobalCommandLineKeyDown,
			true,
		);
		this.view.controlsDiv = createDiv()
			.style('display', 'flex')
			.style('gap', '16px')
			.style('padding', '8px');
		this.view.controlsDiv!.elt.classList.add('simulator-controls');
		this.view.gridCheckbox = this.createPersistentCheckbox(
			'Grid',
			'showGrid',
			this.viewState.showGrid,
			(visible) => (this.viewState.showGrid = visible),
		);
		this.view.ringsCheckbox = this.createPersistentCheckbox(
			'Rings',
			'showRings',
			this.viewState.showRings,
			(visible) => (this.viewState.showRings = visible),
		);
		this.view.vectorMinsInput = createSelect().parent(
			this.view.controlsDiv!,
		);
		for (const vectorMinutes of VECTOR_MINS_OPTIONS) {
			this.view.vectorMinsInput!.option(vectorMinutes);
		}
		this.view.vectorMinsInput!.selected(this.viewState.vectorMinutes);
		this.view.vectorMinsInput!.changed(() => {
			this.viewState.vectorMinutes = Number(
				this.view.vectorMinsInput?.value() ??
					this.viewState.vectorMinutes,
			);
		});
		this.view.rngBrgButton = createButton('RNG/BRG')
			.parent(this.view.controlsDiv!)
			.mouseClicked(() => {
				this.view.rngBrgMode = true;
				this.view.canvasDiv?.style('cursor', 'none');
			});
		this.view.rngBrgButton!.elt.classList.add('rng-brg-button');
		this.view.rngBrgLabel = createInput()
			.parent(this.view.controlsDiv!)
			.size(100)
			.attribute('disabled', 'true')
			.style('color', 'black');
		this.view.rngBrgLabel!.elt.classList.add('rng-brg-label');
		this.view.practiceAnswerButton = createButton('Show Answer')
			.parent(this.view.controlsDiv!)
			.style(
				'display',
				this.initialConfig.mode === 'separation_practice' ? '' : 'none',
			)
			.mouseClicked(() => {
				this.actions.showPracticeAnswer();
			});
		this.view.configButton = createButton('Config...')
			.parent(this.view.controlsDiv!)
			.style('margin-left', 'auto')
			.mouseClicked(this.openConfigWindow);
		this.view.configButton!.elt.classList.add('config-button');
		return this.view;
	}

	private readonly openConfigWindow = (): void => {
		if (!this.configEditorHost.open()) {
			this.view.configButton?.attribute(
				'title',
				'Allow pop-ups to open the config editor.',
			);
		}
	};

	private readonly handleCommandKeyDown = (event: KeyboardEvent): void => {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		this.submitCommandInput();
	};

	private readonly handleGlobalCommandLineKeyDown = (
		event: KeyboardEvent,
	): void => {
		if (event.defaultPrevented) return;
		if (
			event.metaKey ||
			event.ctrlKey ||
			event.altKey ||
			event.isComposing
		) {
			return;
		}

		const input = this.view.commandInput?.elt;
		const mappedInputText = this.getShiftCommandInputText(event);
		if (input && mappedInputText !== null) {
			event.preventDefault();
			input.focus();
			this.appendCommandInputText(input, mappedInputText);
			return;
		}
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			event.preventDefault();
			this.stepVectorMins(event.key === 'ArrowUp' ? 1 : -1);
			return;
		}
		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			event.preventDefault();
			this.stepVRange(event.key === 'ArrowLeft' ? 25 : -25);
			return;
		}
		if (!input || event.target === input) return;
		if (event.key === 'Enter') {
			event.preventDefault();
			input.focus();
			this.submitCommandInput();
			return;
		}
		if (event.key === 'Backspace') {
			event.preventDefault();
			input.focus();
			this.deleteCommandInputTrailingCharacter(input);
			return;
		}
		if (event.key.length !== 1) return;
		event.preventDefault();
		input.focus();
		this.appendCommandInputText(input, event.key);
	};

	private stepVectorMins(direction: 1 | -1): void {
		const input = this.view.vectorMinsInput;
		if (!input) return;
		const currentIndex = VECTOR_MINS_OPTIONS.indexOf(
			this.viewState.vectorMinutes,
		);
		const baseIndex = currentIndex === -1 ? 0 : currentIndex;
		const nextIndex = Math.max(
			0,
			Math.min(VECTOR_MINS_OPTIONS.length - 1, baseIndex + direction),
		);
		this.viewState.vectorMinutes = VECTOR_MINS_OPTIONS[nextIndex];
		input.selected(this.viewState.vectorMinutes);
	}

	private stepVRange(nm: number): void {
		this.viewState.vRange = Math.max(
			25,
			Math.min(400, this.viewState.vRange + nm),
		);
	}

	private submitCommandInput(): void {
		const command = this.view.commandInput?.value() ?? '';
		if (command.trim().length === 0) {
			this.clearCommandOutput();
			return;
		}
		this.view.commandInput?.value('');
		const result = this.actions.executeCommand(command);
		this.setCommandOutput(result.accept, result.message);
	}

	private appendCommandInputText(
		input: HTMLInputElement,
		value: string,
	): void {
		const selectionStart = input.selectionStart ?? input.value.length;
		const selectionEnd = input.selectionEnd ?? selectionStart;
		input.setRangeText(value, selectionStart, selectionEnd, 'end');
	}

	private getShiftCommandInputText(event: KeyboardEvent): string | null {
		if (!event.shiftKey) return null;
		return SHIFT_COMMAND_INPUT_MAP[event.code] ?? null;
	}

	private deleteCommandInputTrailingCharacter(input: HTMLInputElement): void {
		if (input.value.length === 0) return;
		const deleteAt = input.value.length - 1;
		input.setRangeText('', deleteAt, input.value.length, 'end');
	}

	private setCommandOutput(accept: boolean, message: string): void {
		const output = this.view.commandOutputDiv?.elt;
		if (!output) return;
		const marker = document.createElement('span');
		marker.textContent = accept ? '✓' : '✕';
		marker.style.color = accept ? '#35d46b' : '#ff4d4d';
		output.replaceChildren(
			marker,
			document.createTextNode(
				` ${accept ? 'ACCEPT' : 'REJECT'}\n${message}`,
			),
		);
		output.scrollTop = output.scrollHeight;
	}

	private clearCommandOutput(): void {
		const output = this.view.commandOutputDiv?.elt;
		if (!output) return;
		output.replaceChildren();
		output.scrollTop = output.scrollHeight;
	}

	private createPersistentCheckbox(
		label: string,
		storageKey: string,
		initialChecked: boolean,
		setValue: (checked: boolean) => void,
	): P5CheckboxElement {
		const savedValue = localStorage.getItem(storageKey);
		const checked =
			savedValue === null ? initialChecked : savedValue === 'true';
		setValue(checked);
		const checkbox = createCheckbox(`\t${label}`, checked)
			.parent(this.view.controlsDiv!)
			.style('color', '#ccc')
			.style('font-family', 'system-ui');
		checkbox.elt.classList.add('simulator-checkbox');
		checkbox.changed(() => {
			const nextValue = checkbox.checked();
			setValue(nextValue);
			localStorage.setItem(storageKey, String(nextValue));
		});
		return checkbox;
	}
}

export function createUI(
	initialConfig: SimulatorUIConfig,
	viewState: ViewState,
	configEditor: ConfigEditorCallbacks,
	actions: SimulatorUIActions,
): SimulatorUI {
	return new SimulatorUIController(
		initialConfig,
		viewState,
		configEditor,
		actions,
	).create();
}

export function refreshUIForConfig(
	view: SimulatorUI,
	config: SimulatorUIConfig,
	viewState: ViewState,
): void {
	setConsoleHeight(view, config);
	view.gridCheckbox?.checked(viewState.showGrid);
	view.ringsCheckbox?.checked(viewState.showRings);
	view.vectorMinsInput?.selected(viewState.vectorMinutes);
	view.practiceAnswerButton?.style(
		'display',
		config.mode === 'separation_practice' ? '' : 'none',
	);
	view.rngBrgMode = false;
	view.rngBrgPos = null;
	view.canvasDiv?.style('cursor', '');
	view.rngBrgLabel?.value('');
	clearCommandOutput(view);
}

export function handleWindowResized(
	view: SimulatorUI,
	config: SimulatorUIConfig,
): void {
	if (!view.canvas || !view.canvasDiv || !view.logDiv) return;
	setConsoleHeight(view, config);
	resizeCanvas(
		view.canvasDiv.elt.clientWidth,
		view.canvasDiv.elt.clientHeight,
	);
	view.canvas.style('width', '100%');
	view.canvas.style('height', '100%');
	view.logDiv.elt.scrollTop = view.logDiv.elt.scrollHeight;
	if (view.commandOutputDiv) {
		view.commandOutputDiv.elt.scrollTop =
			view.commandOutputDiv.elt.scrollHeight;
	}
}

function setConsoleHeight(view: SimulatorUI, config: SimulatorUIConfig): void {
	const frameLineCount =
		config.statsCount + config.proximitiesCount + CONSOLE_HEIGHT_LH_PADDING;
	const outputLineCount = config.statsCount + config.proximitiesCount + 1;
	view.consoleDiv?.style('height', `${frameLineCount}lh`);
	const statsElement = view.logDiv?.elt;
	if (!statsElement) return;
	const style = getComputedStyle(statsElement);
	const fontSize = Number.parseFloat(style.fontSize);
	const lineHeight = style.lineHeight.endsWith('px')
		? Number.parseFloat(style.lineHeight)
		: Number.parseFloat(style.lineHeight) * fontSize;
	const lineHeightPx =
		Number.isFinite(lineHeight) && lineHeight > 0
			? lineHeight
			: fontSize * 1.2;
	statsElement.style.setProperty(
		'--stats-frame-height',
		`${outputLineCount * lineHeightPx}px`,
	);
}

function clearCommandOutput(view: SimulatorUI): void {
	const output = view.commandOutputDiv?.elt;
	if (!output) return;
	output.replaceChildren();
	output.scrollTop = output.scrollHeight;
}
