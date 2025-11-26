import { MAX_LOG_LINES } from '../core/constants.js';
import { simState, uiState } from '../core/state.js';
import { formatNumber } from '../simulation/utils.js';

export function printLogs(hours) {
	const m = Math.trunc(hours * 60);
	const s = Math.trunc((hours * 60 * 60) % 60);
	const sStr = (s < 0 ? '-' : '') + abs(s).toString().padStart(2, '0');
	stageLog(`Time: ${m}m ${sStr}s`);
	for (const [i, ac] of simState.aircraftList.entries()) {
		const hdgStr = formatNumber(
			ac.vel.asHeading(),
			simState.settings.statsDecimalPlaces,
			3
		);
		const trkStr = formatNumber(
			ac.trk.asHeading(),
			simState.settings.statsDecimalPlaces,
			3
		);
		const gsStr = formatNumber(
			ac.trk.mag(),
			simState.settings.statsDecimalPlaces
		);
		stageLog(
			`Aircraft ${i}:\t`,
			`hdg ${hdgStr.isExact ? '=' : '≈'} ${hdgStr.n}°\t`,
			`trk ${trkStr.isExact ? '=' : '≈'} ${trkStr.n}°\t`,
			`gs ${gsStr.isExact ? '=' : '≈'} ${gsStr.n} KT`
		);
	}
	for (const pl of simState.loggers) {
		const proximityStr = formatNumber(
			pl.proximity,
			simState.settings.proximityDecimalPlaces
		);
		const lowestProximityStr = formatNumber(
			pl.lowestProximity,
			simState.settings.proximityDecimalPlaces
		);
		stageLog(
			`Aircraft ${pl.ac1}-${pl.ac2}:\t`,
			`proximity ${proximityStr.isExact ? '=' : '≈'} ${
				proximityStr.n
			} NM\t`,
			`nearest ${lowestProximityStr.isExact ? '=' : '≈'} ${
				lowestProximityStr.n
			} NM`
		);
	}
	stageLog('\n');
	flushLog();
}

export function stageLog(...args) {
	const msg = args.join('');
	simState.logLines.push('  ' + msg);
	if (simState.logLines.length > MAX_LOG_LINES) {
		simState.logLines.shift();
	}
	simState.logDirty = true;
}

export function flushLog() {
	if (!simState.logDirty || !uiState.logDiv) return;
	uiState.logDiv.elt.textContent = simState.logLines.join('\n');
	uiState.logDiv.elt.scrollTop = uiState.logDiv.elt.scrollHeight;
	simState.logDirty = false;
}
