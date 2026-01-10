import { MAX_LOG_LINES } from '../core/constants.js';
import { simState, uiState } from '../core/state.js';
import { formatNumber } from '../simulation/utils.js';

export function printLogs(hours) {
	const m = Math.trunc(hours * 60);
	const s = Math.trunc((hours * 60 * 60) % 60);
	const sStr = (s < 0 ? '-' : '') + abs(s).toString().padStart(2, '0');
	stageLog(`Time: ${m}m ${sStr}s`);

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
		stageLog(
			`${stat.name}:\t`,
			`hdg ${hdgStr.p} ${hdgStr.n}°\t`,
			`trk ${trkStr.p} ${trkStr.n}°\t`,
			`gs ${gsStr.p} ${gsStr.n} KT`
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
		stageLog(
			`${pl.name}:\t`,
			`proximity ${proximityStr.p} ${proximityStr.n} NM\t`,
			`nearest ${lowestProximityStr.p} ${lowestProximityStr.n} NM`
		);
	}
	stageLog('\n');
	flushLog();
}

export function stageLog(...args) {
	const msg = args.join('');
	simState.logLines.push('  ' + msg);
	if (simState.logLines.length > MAX_LOG_LINES) simState.logLines.shift();
	simState.logLines = dedupeFrames(simState.logLines);
	simState.logDirty = true;
}

function dedupeFrames(lines) {
	const frames = [];
	let cur = [];

	for (const line of lines) {
		if (line.startsWith('  Time:')) {
			if (cur.length) frames.push(cur);
			cur = [line];
		} else {
			cur.push(line);
		}
	}
	if (cur.length) frames.push(cur);

	const out = [];
	let lastKey = null;

	for (const frame of frames) {
		const key = frame.join('\n');
		if (key !== lastKey) {
			out.push(...frame);
		}
		lastKey = key;
	}

	return out;
}

export function flushLog() {
	if (!simState.logDirty || !uiState.logDiv) return;
	uiState.logDiv.elt.textContent = simState.logLines.join('\n');
	uiState.logDiv.elt.scrollTop = uiState.logDiv.elt.scrollHeight;
	simState.logDirty = false;
}
