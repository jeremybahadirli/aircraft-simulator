import type { ConfigEditorDocument } from '../../config/types.js';
import type { SimulationMode } from '../../simulation/state.js';
import type {
	ConfigEditorInitMessage,
	ConfigEditorSaveResult,
} from './protocol.js';
import { parseConfigEditorHostMessage } from './protocol.js';

export interface ConfigSaveResult {
	success: boolean;
	message: string;
	mode?: SimulationMode;
}

export interface ConfigEditorCallbacks {
	getInitialMessage(): ConfigEditorInitMessage;
	save(document: ConfigEditorDocument, text: string): ConfigSaveResult;
}

export class ConfigEditorHost {
	private popup: Window | null = null;

	constructor(private readonly callbacks: ConfigEditorCallbacks) {}

	connect(): void {
		window.addEventListener('message', this.handleWindowMessage);
	}

	open(): boolean {
		if (this.popup && !this.popup.closed) {
			this.popup.focus();
			return true;
		}
		this.popup = window.open(
			new URL('./config-editor.html', document.baseURI).href,
			'aircraft-simulator-config',
			'popup=yes,width=600,height=800',
		);
		return this.popup !== null;
	}

	private readonly handleWindowMessage = (event: MessageEvent): void => {
		if (event.origin !== window.location.origin) return;
		const popup = this.popup;
		if (!popup || event.source !== popup) return;

		const message = parseConfigEditorHostMessage(event.data);
		if (message?.type === 'config-editor:ready') {
			popup.postMessage(
				this.callbacks.getInitialMessage(),
				window.location.origin,
			);
			return;
		}
		if (message?.type !== 'config-editor:save') return;

		const result = this.callbacks.save(message.document, message.text);
		const response: ConfigEditorSaveResult = {
			type: 'config-editor:save-result',
			document: message.document,
			text: message.text,
			...result,
		};
		popup.postMessage(response, window.location.origin);
	};
}
