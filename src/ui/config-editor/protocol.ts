import type {
	ConfigEditorData,
	ConfigEditorDocument,
} from '../../config/types.js';
import type { SimulationMode } from '../../simulation/state.js';

export interface ConfigEditorReadyMessage {
	type: 'config-editor:ready';
}

export interface ConfigEditorSaveMessage {
	type: 'config-editor:save';
	document: ConfigEditorDocument;
	text: string;
}

export interface ConfigEditorInitMessage extends ConfigEditorData {
	type: 'config-editor:init';
	mode: SimulationMode;
}

export interface ConfigEditorSaveResult {
	type: 'config-editor:save-result';
	document: ConfigEditorDocument;
	text: string;
	success: boolean;
	message: string;
	mode?: SimulationMode;
}

export type ConfigEditorHostMessage =
	| ConfigEditorReadyMessage
	| ConfigEditorSaveMessage;

export type ConfigEditorClientMessage =
	| ConfigEditorInitMessage
	| ConfigEditorSaveResult;

export function parseConfigEditorHostMessage(
	value: unknown,
): ConfigEditorHostMessage | null {
	if (!isRecord(value)) return null;
	if (value.type === 'config-editor:ready') {
		return { type: 'config-editor:ready' };
	}
	if (
		value.type === 'config-editor:save' &&
		isConfigEditorDocument(value.document) &&
		typeof value.text === 'string'
	) {
		return {
			type: 'config-editor:save',
			document: value.document,
			text: value.text,
		};
	}
	return null;
}

export function parseConfigEditorClientMessage(
	value: unknown,
): ConfigEditorClientMessage | null {
	if (!isRecord(value)) return null;
	if (
		value.type === 'config-editor:init' &&
		isSimulationMode(value.mode) &&
		typeof value.configText === 'string' &&
		typeof value.defaultConfigText === 'string' &&
		typeof value.separationPracticeConfigText === 'string' &&
		typeof value.defaultSeparationPracticeConfigText === 'string'
	) {
		return value as unknown as ConfigEditorInitMessage;
	}
	if (
		value.type === 'config-editor:save-result' &&
		isConfigEditorDocument(value.document) &&
		typeof value.text === 'string' &&
		typeof value.success === 'boolean' &&
		typeof value.message === 'string' &&
		(value.mode === undefined || isSimulationMode(value.mode))
	) {
		return value as unknown as ConfigEditorSaveResult;
	}
	return null;
}

export function isConfigEditorDocument(
	value: unknown,
): value is ConfigEditorDocument {
	return value === 'config' || value === 'separation-practice';
}

function isSimulationMode(value: unknown): value is SimulationMode {
	return (
		value === 'normal' ||
		value === 'separation_practice' ||
		value === 'auto_position'
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
