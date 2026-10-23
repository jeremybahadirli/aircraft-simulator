const NORMAL_LINE_HEIGHT_RATIO = 1.2;

interface LogBuffer {
	logLines: string[];
	logDirty: boolean;
}

export function getVisibleLogLineCount(
	element: HTMLElement | null,
): number | null {
	if (!element) return null;
	const lineHeight = getLogLineHeight(element);
	if (lineHeight <= 0 || element.clientHeight <= 0) return null;
	return Math.floor(element.clientHeight / lineHeight);
}

export function flushLog(
	state: LogBuffer,
	element: HTMLElement | null,
	force = false,
): void {
	if ((!state.logDirty && !force) || !element) return;
	element.textContent = state.logLines.join('\n');
	element.scrollTop = element.scrollHeight;
	state.logDirty = false;
}

function getLogLineHeight(element: HTMLElement): number {
	const style = getComputedStyle(element);
	const fontSize = parseCssPixels(style.fontSize);
	return (
		parseCssPixels(style.lineHeight) ??
		measureLineHeight(style) ??
		(fontSize === null ? 0 : fontSize * NORMAL_LINE_HEIGHT_RATIO)
	);
}

function measureLineHeight(style: CSSStyleDeclaration): number | null {
	const probe = document.createElement('div');
	probe.textContent = 'X\nX';
	probe.style.position = 'absolute';
	probe.style.visibility = 'hidden';
	probe.style.whiteSpace = 'pre';
	probe.style.font = style.font;
	probe.style.lineHeight = style.lineHeight;
	document.body.append(probe);
	const lineHeight = probe.getBoundingClientRect().height / 2;
	probe.remove();
	return Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : null;
}

function parseCssPixels(value: string): number | null {
	const pixels = Number.parseFloat(value);
	return Number.isFinite(pixels) ? pixels : null;
}
