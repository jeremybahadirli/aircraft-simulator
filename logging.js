function printLogs(hours) {
	const minutes = Math.trunc(hours * 60);
	const seconds = Math.trunc((hours * 60 * 60) % 60)
		.toString()
		.padStart(2, '0');
	stageLog(`Time: ${minutes}m ${seconds}s`);
	for (const [i, ac] of aircraftList.entries()) {
		const hdgString = ac.vel
			.asHeading()
			.toFixed(settings.statsDecimalPlaces)
			.padStart(
				settings.statsDecimalPlaces === 0
					? 3
					: 4 + settings.statsDecimalPlaces,
				'0'
			);
		const trkString = ac.trk
			.asHeading()
			.toFixed(settings.statsDecimalPlaces)
			.padStart(
				settings.statsDecimalPlaces === 0
					? 3
					: 4 + settings.statsDecimalPlaces,
				'0'
			);
		const gsString = ac.trk.mag().toFixed(settings.statsDecimalPlaces);
		stageLog(
			`Aircraft ${i}:\t` +
				`hdg = ${hdgString}°\t` +
				`trk = ${trkString}°\t` +
				`gs = ${gsString} KT`
		);
	}
	for (const pl of loggers) {
		const proximityString = round(
			pl.proximity,
			settings.proximityDecimalPlaces
		).toFixed(settings.proximityDecimalPlaces);
		const lowestProximityString = round(
			pl.lowestProximity,
			settings.proximityDecimalPlaces
		).toFixed(settings.proximityDecimalPlaces);
		stageLog(
			`Aircraft ${pl.ac1}-${pl.ac2}:\t` +
				`proximity = ${proximityString} NM\t` +
				`nearest = ${lowestProximityString} NM`
		);
	}
	stageLog('\n');
	flushLog();
}

function stageLog(...args) {
	const msg = args.join(' ');
	logLines.push('  ' + msg);
	if (logLines.length > MAX_LOG_LINES) {
		logLines.shift();
	}
	logDirty = true;
}

function flushLog() {
	if (!logDirty) return;
	logDiv.elt.textContent = logLines.join('\n');
	logDiv.elt.scrollTop = logDiv.elt.scrollHeight;
	logDirty = false;
}
