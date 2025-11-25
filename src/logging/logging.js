import { MAX_LOG_LINES } from '../core/constants.js';
import { simState, uiState } from '../core/state.js';

export function printLogs(hours) {
	const minutes = Math.trunc(hours * 60);
	const seconds = Math.trunc((hours * 60 * 60) % 60)
		.toString()
		.padStart(2, '0');
	stageLog(`Time: ${minutes}m ${seconds}s`);
	for (const [i, ac] of simState.aircraftList.entries()) {
		const hdgString = ac.vel
			.asHeading()
			.toFixed(simState.settings.statsDecimalPlaces)
			.padStart(
				simState.settings.statsDecimalPlaces === 0
					? 3
					: 4 + simState.settings.statsDecimalPlaces,
				'0'
			);
		const trkString = ac.trk
			.asHeading()
			.toFixed(simState.settings.statsDecimalPlaces)
			.padStart(
				simState.settings.statsDecimalPlaces === 0
					? 3
					: 4 + simState.settings.statsDecimalPlaces,
				'0'
			);
		const gsString = ac.trk
			.mag()
			.toFixed(simState.settings.statsDecimalPlaces);
		stageLog(
			`Aircraft ${i}:\t` +
				`hdg = ${hdgString}°\t` +
				`trk = ${trkString}°\t` +
				`gs = ${gsString} KT`
		);
	}
	for (const pl of simState.loggers) {
		const proximityString = round(
			pl.proximity,
			simState.settings.proximityDecimalPlaces
		).toFixed(simState.settings.proximityDecimalPlaces);
		const lowestProximityString = round(
			pl.lowestProximity,
			simState.settings.proximityDecimalPlaces
		).toFixed(simState.settings.proximityDecimalPlaces);
		stageLog(
			`Aircraft ${pl.ac1}-${pl.ac2}:\t` +
				`proximity = ${proximityString} NM\t` +
				`nearest = ${lowestProximityString} NM`
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
