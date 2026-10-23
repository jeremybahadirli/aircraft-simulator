import type { ConfigEditorDocument } from './config/types.js';
import type { ConfigEditorInitMessage } from './ui/config-editor/protocol.js';
import { parseConfigEditorClientMessage } from './ui/config-editor/protocol.js';
import type { SimulationMode } from './simulation/state.js';

interface MonacoModel {
	setValue(value: string): void;
}

interface MonacoEditor {
	addCommand(keybinding: number, handler: () => void): void;
	focus(): void;
	getValue(): string;
	onDidChangeModelContent(handler: () => void): void;
	setModel(model: MonacoModel | null): void;
	dispose(): void;
}

interface MonacoApi {
	KeyCode: { KeyS: number };
	KeyMod: { CtrlCmd: number };
	Uri: { parse(value: string): unknown };
	editor: {
		createModel(value: string, language: string, uri: unknown): MonacoModel;
		create(
			element: HTMLElement,
			options: Record<string, unknown>,
		): MonacoEditor;
	};
	languages: {
		json: {
			jsonDefaults: {
				setDiagnosticsOptions(options: {
					validate: boolean;
					enableSchemaRequest: boolean;
					schemas: Array<{
						uri: string;
						fileMatch?: string[];
						schema: unknown;
					}>;
				}): void;
			};
		};
	};
}

interface MonacoAmdRequire {
	config(options: { paths: Record<string, string> }): void;
	(modules: string[], callback: () => void): void;
}

declare global {
	interface Window {
		monaco?: MonacoApi;
		require?: MonacoAmdRequire;
	}
}

const CONFIG_MODEL_URI = 'inmemory://model/config.json';
const SEPARATION_PRACTICE_MODEL_URI =
	'inmemory://model/separation-practice-config.json';
const statusElement = document.getElementById('status')!;
const editorElement = document.getElementById('editor')!;
const saveButton = document.getElementById('save')!;
const loadDefaultButton = document.getElementById(
	'load-default',
)! as HTMLButtonElement;
const configTab = document.getElementById('tab-config')! as HTMLButtonElement;
const separationPracticeTab = document.getElementById(
	'tab-separation-practice',
)! as HTMLButtonElement;
let editor: MonacoEditor | null = null;
let configModel: MonacoModel | null = null;
let separationPracticeModel: MonacoModel | null = null;
let activeDocument: ConfigEditorDocument = 'config';
let simulatorMode: SimulationMode | null = null;
let defaultConfigText: string | null = null;
let defaultSeparationPracticeConfigText: string | null = null;
let editorDataLoaded = false;
const runningConfigTexts: Record<ConfigEditorDocument, string | null> = {
	config: null,
	'separation-practice': null,
};

saveButton.addEventListener('click', saveAndRun);
loadDefaultButton.addEventListener('click', loadDefaultConfig);
configTab.addEventListener('click', () => switchConfigDocument('config'));
separationPracticeTab.addEventListener('click', () =>
	switchConfigDocument('separation-practice'),
);
window.addEventListener('message', handleSimulatorMessage);
window.addEventListener('beforeunload', () => editor?.dispose());

loadMonaco();

function loadMonaco(): void {
	const loaderScript = document.createElement('script');
	loaderScript.src = new URL(
		'./dist/monaco/vs/loader.js',
		document.baseURI,
	).href;
	loaderScript.onload = () => {
		const amdRequire = window.require;
		if (!amdRequire) {
			setStatus('🔴 · Monaco loader did not initialize.', true);
			return;
		}

		amdRequire.config({
			paths: {
				vs: new URL('./dist/monaco/vs', document.baseURI).href,
			},
		});
		amdRequire(['vs/editor/editor.main'], initializeEditor);
	};
	loaderScript.onerror = () =>
		setStatus('🔴 · Could not load Monaco Editor from node_modules.', true);
	document.head.append(loaderScript);
}

function initializeEditor(): void {
	const monaco = window.monaco;
	if (!monaco) {
		setStatus('🔴 · Monaco Editor did not initialize.', true);
		return;
	}

	const model = monaco.editor.createModel(
		'',
		'json',
		monaco.Uri.parse(CONFIG_MODEL_URI),
	);
	configModel = model;
	separationPracticeModel = monaco.editor.createModel(
		'',
		'json',
		monaco.Uri.parse(SEPARATION_PRACTICE_MODEL_URI),
	);
	const activeEditor = monaco.editor.create(editorElement, {
		model,
		theme: 'vs-dark',
		automaticLayout: true,
		minimap: { enabled: false },
		fontSize: 14,
		scrollBeyondLastLine: false,
		tabSize: 4,
		insertSpaces: false,
		detectIndentation: false,
	});
	editor = activeEditor;
	activeEditor.addCommand(
		monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
		saveAndRun,
	);
	activeEditor.onDidChangeModelContent(() => {
		if (!editorDataLoaded) return;
		updateStatus();
		updateLoadDefaultButton();
	});

	setStatus('🟡 · Connecting to simulator…');
	window.opener?.postMessage(
		{ type: 'config-editor:ready' },
		window.location.origin,
	);
	activeEditor.focus();
}

function handleSimulatorMessage(event: MessageEvent): void {
	if (
		event.origin !== window.location.origin ||
		event.source !== window.opener
	) {
		return;
	}

	const message = parseConfigEditorClientMessage(event.data);
	if (message?.type === 'config-editor:init') {
		defaultConfigText = message.defaultConfigText;
		defaultSeparationPracticeConfigText =
			message.defaultSeparationPracticeConfigText;
		initializeConfigModel(message);
	} else if (message?.type === 'config-editor:save-result') {
		updateLoadDefaultButton();
		if (message.success) {
			runningConfigTexts[message.document] = message.text;
			if (message.mode) simulatorMode = message.mode;
			updateStatus(
				message.document === activeDocument ? message.message : '',
			);
		} else {
			setStatus(`🔴 · ${message.message}`, true);
		}
	}
}

function loadDefaultConfig(): void {
	const model = getActiveModel();
	const defaultText = getActiveDefaultConfigText();
	if (!defaultText || !model || !editor) return;
	if (hasDefaultConfig(editor.getValue(), defaultText)) {
		updateLoadDefaultButton();
		return;
	}

	model.setValue(defaultText);
	updateStatus();
	editor?.focus();
	updateLoadDefaultButton();
}

function initializeConfigModel(data: ConfigEditorInitMessage): void {
	const monaco = window.monaco;
	const activeEditor = editor;
	const mainModel = configModel;
	const practiceModel = separationPracticeModel;
	if (!monaco || !activeEditor || !mainModel || !practiceModel) return;

	const configSchemaUri = new URL(
		'./src/config/schemas/config.schema.json',
		document.baseURI,
	).href;
	const separationPracticeSchemaUri = new URL(
		'./src/config/schemas/separation-practice-config.schema.json',
		document.baseURI,
	).href;
	const sharedSchemaUri = new URL(
		'./src/config/schemas/shared-config.schema.json',
		document.baseURI,
	).href;
	monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
		validate: true,
		enableSchemaRequest: false,
		schemas: [
			{
				uri: configSchemaUri,
				fileMatch: [CONFIG_MODEL_URI],
				schema: data.configSchema,
			},
			{
				uri: separationPracticeSchemaUri,
				fileMatch: [SEPARATION_PRACTICE_MODEL_URI],
				schema: data.separationPracticeConfigSchema,
			},
			{
				uri: sharedSchemaUri,
				schema: data.sharedConfigSchema,
			},
		],
	});
	mainModel.setValue(data.configText);
	practiceModel.setValue(data.separationPracticeConfigText);
	runningConfigTexts.config = data.configText;
	runningConfigTexts['separation-practice'] =
		data.separationPracticeConfigText;
	simulatorMode = data.mode;
	editorDataLoaded = true;
	updateActiveDocumentUI();
	updateLoadDefaultButton();
	updateStatus();
	activeEditor.focus();
}

function updateLoadDefaultButton(): void {
	const model = getActiveModel();
	const defaultText = getActiveDefaultConfigText();
	loadDefaultButton.disabled =
		!defaultText ||
		!editor ||
		!model ||
		hasDefaultConfig(editor.getValue(), defaultText);
}

function hasDefaultConfig(configText: string, defaultText: string): boolean {
	return configsMatch(configText, defaultText);
}

function sortJsonKeys(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortJsonKeys);
	if (value !== null && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value)
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([key, child]) => [key, sortJsonKeys(child)]),
		);
	}
	return value;
}

function switchConfigDocument(document: ConfigEditorDocument): void {
	if (document === activeDocument) return;
	activeDocument = document;
	editor?.setModel(getActiveModel());
	updateActiveDocumentUI();
	updateLoadDefaultButton();
	updateStatus();
	editor?.focus();
}

function updateStatus(extraMessage = ''): void {
	if (!editorDataLoaded || !editor) return;

	const runningConfigText = runningConfigTexts[activeDocument];
	const configIsRunning =
		runningConfigText !== null &&
		configsMatch(editor.getValue(), runningConfigText);
	const isInactiveMainConfig =
		activeDocument === 'config' && simulatorMode === 'separation_practice';
	const isInactivePracticeConfig =
		activeDocument === 'separation-practice' &&
		simulatorMode !== 'separation_practice';
	const isNoSimulator = !editor || !window.opener || window.opener.closed;

	let message: string;
	let error = false;
	if (isNoSimulator) {
		message = '🔴 · Simulator window no longer available.';
		error = true;
	} else if (isInactiveMainConfig) {
		message = '🟡 · ';
		message += configIsRunning
			? 'Current config running. '
			: 'Unsaved changes. ';
		message +=
			"'separation_practice' mode ignores this file; use 'separation-practice-config.json'.";
	} else if (isInactivePracticeConfig) {
		message = '🟡 · ';
		message += configIsRunning
			? 'Current config running. '
			: 'Unsaved changes. ';
		message +=
			"This file is inactive; set 'separation_practice' mode in 'config.json'.";
	} else {
		message = configIsRunning
			? '🟢 · Current config running.'
			: '🟡 · Unsaved changes.';
	}

	if (extraMessage) message += ` ${extraMessage}`;
	setStatus(message, error);
}

function updateActiveDocumentUI(): void {
	const isMainConfig = activeDocument === 'config';
	configTab.setAttribute('aria-selected', String(isMainConfig));
	separationPracticeTab.setAttribute('aria-selected', String(!isMainConfig));
}

function getActiveModel(): MonacoModel | null {
	return activeDocument === 'config' ? configModel : separationPracticeModel;
}

function getActiveDefaultConfigText(): string | null {
	return activeDocument === 'config'
		? defaultConfigText
		: defaultSeparationPracticeConfigText;
}

function saveAndRun(): void {
	if (!editor || !window.opener || window.opener.closed) {
		setStatus('🔴 · Simulator window no longer available.', true);
		return;
	}

	setStatus('🟡 · Applying config…');
	window.opener.postMessage(
		{
			type: 'config-editor:save',
			document: activeDocument,
			text: editor.getValue(),
		},
		window.location.origin,
	);
}

function configsMatch(left: string, right: string): boolean {
	try {
		return (
			JSON.stringify(sortJsonKeys(JSON.parse(left))) ===
			JSON.stringify(sortJsonKeys(JSON.parse(right)))
		);
	} catch {
		return false;
	}
}

function setStatus(message: string, error = false): void {
	statusElement.textContent = message;
	statusElement.classList.toggle('error', error);
}
