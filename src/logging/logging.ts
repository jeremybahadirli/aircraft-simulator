import { MAX_LOG_LINES } from '../core/constants.js';
import { simState, uiState } from '../core/state.js';
import { formatNumber } from '../simulation/utils.js';

const NORMAL_LINE_HEIGHT_RATIO = 1.2;

export function printLogs(hours: number): void {
	const frameLines: string[] = [];
	const m = Math.trunc(hours * 60);
	const s = Math.trunc((hours * 60 * 60) % 60);
	const sStr = (s < 0 ? '-' : '') + abs(s).toString().padStart(2, '0');
	frameLines.push(`Time: ${m}m ${sStr}s`);

	for (const stat of simState.stats) {
		const hdgStr = formatNumber(
			stat.aircraft.vel.asHeading(),
			simState.settings.statsDecimalPlaces,
			3
		);
		const trkStr = formatNumber(
			stat.aircraft.trk.asHeading(),
			simState.settings.statsDecimalPlaces,
			3
		);
		const gsStr = formatNumber(
			stat.aircraft.trk.mag(),
			simState.settings.statsDecimalPlaces
		);
		frameLines.push(
			[
				`${stat.name}:\t`,
				`hdg ${hdgStr.p} ${hdgStr.n}°\t`,
				`trk ${trkStr.p} ${trkStr.n}°\t`,
				`gs ${gsStr.p} ${gsStr.n} KT`,
			].join('')
		);
	}

	for (const pl of simState.proximities) {
		const proximityStr = formatNumber(
			pl.proximity,
			simState.settings.proximityDecimalPlaces
		);
		const lowestProximityStr = formatNumber(
			pl.lowestProximity,
			simState.settings.proximityDecimalPlaces
		);
		frameLines.push(
			[
				`${pl.name}:\t`,
				`proximity ${proximityStr.p} ${proximityStr.n} NM\t`,
				`nearest ${lowestProximityStr.p} ${lowestProximityStr.n} NM`,
			].join('')
		);
	}
	padFrameToVisibleHeight(frameLines);
	for (const line of frameLines) stageLog(line);
	flushLog();
}

export function stageLog(...args: string[]): void {
	const msg = args.join('');
	simState.logLines.push('  ' + msg);
	if (simState.logLines.length > MAX_LOG_LINES) simState.logLines.shift();
	simState.logLines = dedupeFrames(simState.logLines);
	simState.logDirty = true;
}

function dedupeFrames(lines: string[]): string[] {
	const frames: string[][] = [];
	let cur: string[] = [];

	for (const line of lines) {
		if (line.startsWith('  Time:')) {
			if (cur.length) frames.push(cur);
			cur = [line];
		} else {
			cur.push(line);
		}
	}
	if (cur.length) frames.push(cur);

	const out: string[] = [];
	let lastKey: string | null = null;

	for (const frame of frames) {
		const key = frame.join('\n');
		if (key !== lastKey) {
			out.push(...frame);
		}
		lastKey = key;
	}

	return out;
}

function padFrameToVisibleHeight(frameLines: string[]): void {
	const visibleLineCount = getVisibleLogLineCount();
	if (visibleLineCount === null) return;

	const frameLineCount = getRenderedLineCount(frameLines);
	const paddingLineCount = Math.max(0, visibleLineCount - frameLineCount);
	for (let i = 0; i < paddingLineCount; i++) frameLines.push('');
}

function getVisibleLogLineCount(): number | null {
	const logDiv = uiState.logDiv?.elt;
	if (!logDiv) return null;

	const lineHeight = getLogLineHeight(logDiv);
	if (lineHeight <= 0 || logDiv.clientHeight <= 0) return null;

	return Math.floor(logDiv.clientHeight / lineHeight);
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

function getRenderedLineCount(lines: string[]): number {
	return lines.reduce(
		(count, line) => count + `  ${line}`.split('\n').length,
		0
	);
}

export function flushLog(): void {
	if (!simState.logDirty || !uiState.logDiv) return;
	uiState.logDiv.elt.textContent = simState.logLines.join('\n');
	uiState.logDiv.elt.scrollTop = uiState.logDiv.elt.scrollHeight;
	simState.logDirty = false;
}
