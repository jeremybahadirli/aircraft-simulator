import { MAX_LOG_LINES } from '../constants.js';

interface LogFrame {
	text: string;
	lineCount: number;
}

export interface LogPanelState {
	frames: LogFrame[];
	lastFrame: string | null;
	lineCount: number;
}

export function createLogPanelState(): LogPanelState {
	return { frames: [], lastFrame: null, lineCount: 0 };
}

export function appendLogFrame(
	panel: LogPanelState,
	frame: string,
	element: HTMLElement | null,
): void {
	if (frame === panel.lastFrame) return;

	const lineCount = frame.split('\n').length;
	panel.frames.push({ text: frame, lineCount });
	panel.lineCount += lineCount + (panel.frames.length > 1 ? 1 : 0);
	panel.lastFrame = frame;

	while (panel.frames.length > 1 && panel.lineCount > MAX_LOG_LINES) {
		const oldestFrame = panel.frames.shift()!;
		panel.lineCount -= oldestFrame.lineCount + 1;
	}

	renderLogPanel(panel, element);
}

export function renderLogPanel(
	panel: LogPanelState,
	element: HTMLElement | null,
): void {
	if (!element) return;
	const joinedFrames = panel.frames.map(({ text }) => text).join('\n\n\n');
	element.textContent = `\n\n${joinedFrames}\n\n`;
	element.scrollTop = element.scrollHeight;
}
