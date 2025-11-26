import { MAX_LOG_LINES } from '../core/constants.js';
import { simState, uiState } from '../core/state.js';
import { formatNumber } from '../simulation/utils.js';

export function printLogs(hours) {
	const minutes = Math.trunc(hours * 60);
	const seconds = Math.trunc((hours * 60 * 60) % 60)
		.toString()
		.padStart(2, '0');
	stageLog(`Time: ${minutes}m ${seconds}s`);
	for (const [i, ac] of simState.aircraftList.entries()) {
		const hdgFormatted = formatNumber(
			ac.vel.asHeading(),
			simState.settings.statsDecimalPlaces,
			3
		);
		const trkFormatted = formatNumber(
			ac.trk.asHeading(),
			simState.settings.statsDecimalPlaces,
			3
		);
		const gsFormatted = formatNumber(
			ac.trk.mag(),
			simState.settings.statsDecimalPlaces
		);
		stageLog(
			`Aircraft ${i}:\t` +
				`hdg ${hdgFormatted.isExact ? '=' : '≈'} ${hdgFormatted.n}°\t` +
				`trk ${trkFormatted.isExact ? '=' : '≈'} ${trkFormatted.n}°\t` +
				`gs ${gsFormatted.isExact ? '=' : '≈'} ${gsFormatted.n} KT`
		);
	}
	for (const pl of simState.loggers) {
		const proximityFormatted = formatNumber(
			pl.proximity,
			simState.settings.proximityDecimalPlaces
		);
		const lowestProximityFormatted = formatNumber(
			pl.lowestProximity,
			simState.settings.proximityDecimalPlaces
		);
		stageLog(
			`Aircraft ${pl.ac1}-${pl.ac2}:\t` +
				`proximity ${proximityFormatted.isExact ? '=' : '≈'} ${
					proximityFormatted.n
				} NM\t` +
				`nearest ${lowestProximityFormatted.isExact ? '=' : '≈'} ${
					lowestProximityFormatted.n
				} NM`
		);
	}
	stageLog('\n');
	flushLog();
}

export function stageLog(...args) {
	const msg = args.join(' ');
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
