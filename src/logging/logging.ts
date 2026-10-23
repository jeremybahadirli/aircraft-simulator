import { MAX_LOG_LINES } from '../constants.js';
import { formatNumber } from '../math/formatNumber.js';
import type { SimulationState } from '../simulation/state.js';
import type { ViewState } from '../view/state.js';

export function printLogs(
	state: SimulationState,
	viewState: ViewState,
	hours: number,
	visibleLineCount: number | null = null,
): void {
	const frameLineComponents: string[][] = [];
	const minutes = Math.trunc(hours * 60);
	const seconds = Math.trunc((hours * 60 * 60) % 60);
	const secondsText =
		(seconds < 0 ? '-' : '') +
		Math.abs(seconds).toString().padStart(2, '0');
	frameLineComponents.push(['Time:', `${minutes}m ${secondsText}s`]);

	for (const stat of state.stats) {
		const heading = formatNumber(
			stat.ac.vel.heading(),
			viewState.statsDecimalPlaces,
			3,
		);
		const track = formatNumber(
			stat.ac.trk.heading(),
			viewState.statsDecimalPlaces,
			3,
		);
		const groundSpeed = formatNumber(
			stat.ac.trk.mag(),
			viewState.statsDecimalPlaces,
		);
		frameLineComponents.push([
			`${stat.name}:`,
			[
				`hdg ${heading.p} ${heading.n}°  `,
				`trk ${track.p} ${track.n}°  `,
				`gs ${groundSpeed.p} ${groundSpeed.n} KT`,
			].join(''),
		]);
	}

	for (const proximity of state.proximities) {
		const distance = formatNumber(
			proximity.proximity,
			viewState.proximityDecimalPlaces,
		);
		const nearest = formatNumber(
			proximity.lowestProximity,
			viewState.proximityDecimalPlaces,
		);
		frameLineComponents.push([
			`${proximity.name}:`,
			[
				`proximity ${distance.p} ${distance.n} NM  `,
				`nearest ${nearest.p} ${nearest.n} NM`,
			].join(''),
		]);
	}

	const longestLabelLength = frameLineComponents.reduce((max, [label]) => {
		return Math.max(max, label.length);
	}, 0);

	const frameLines: string[] = frameLineComponents.map(
		([label, value]) => `${label.padEnd(longestLabelLength + 2)}${value}`,
	);

	padFrameToVisibleHeight(frameLines, visibleLineCount);
	for (const line of frameLines) stageLog(state, line);
}

export function stageLog(state: SimulationState, ...args: string[]): void {
	state.logLines.push(`  ${args.join('')}`);
	if (state.logLines.length > MAX_LOG_LINES) state.logLines.shift();
	state.logLines = dedupeFrames(state.logLines);
	state.logDirty = true;
}

function padFrameToVisibleHeight(
	frameLines: string[],
	visibleLineCount: number | null,
): void {
	if (visibleLineCount === null) return;
	const paddingLineCount = Math.max(
		0,
		visibleLineCount - getRenderedLineCount(frameLines),
	);
	for (let i = 0; i < paddingLineCount; i++) frameLines.push('');
}

function dedupeFrames(lines: string[]): string[] {
	const frames: string[][] = [];
	let currentFrame: string[] = [];
	for (const line of lines) {
		if (line.startsWith('  Time:')) {
			if (currentFrame.length) frames.push(currentFrame);
			currentFrame = [line];
		} else {
			currentFrame.push(line);
		}
	}
	if (currentFrame.length) frames.push(currentFrame);

	const output: string[] = [];
	let previousFrameKey: string | null = null;
	for (const frame of frames) {
		const key = frame.join('\n');
		if (key !== previousFrameKey) output.push(...frame);
		previousFrameKey = key;
	}
	return output;
}

function getRenderedLineCount(lines: string[]): number {
	return lines.reduce(
		(count, line) => count + `  ${line}`.split('\n').length,
		0,
	);
}
