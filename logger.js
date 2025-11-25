class Logger {
	constructor(ac1, ac2) {
		this.ac1 = ac1;
		this.ac2 = ac2;
		this.proximity = Number.POSITIVE_INFINITY;
		this.lowestProximity = Number.POSITIVE_INFINITY;
	}

	updateProximity() {
		this.proximity = p5.Vector.dist(
			aircraftList[this.ac1].pos,
			aircraftList[this.ac2].pos
		);
		if (this.proximity < this.lowestProximity) {
			this.lowestProximity = this.proximity;
		}
	}

	static printLogs(hours) {
		const minutes = floor(hours * 60);
		const seconds = floor((hours * 60 * 60) % 60)
			.toString()
			.padStart(2, '0');
		Logger.log(`Time: ${minutes}m ${seconds}s`);
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
			Logger.log(
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
			Logger.log(
				`Aircraft ${pl.ac1}-${pl.ac2}:\t` +
					`proximity = ${proximityString} NM\t` +
					`nearest = ${lowestProximityString} NM`
			);
		}
		Logger.log('\n');
		Logger.flushLog();
	}

	static log(...args) {
		const msg = args.join(' ');
		logLines.push('  ' + msg);
		if (logLines.length > MAX_LOG_LINES) {
			logLines.shift();
		}
		logDirty = true;
	}

	static flushLog() {
		if (!logDirty) return;
		logDiv.elt.textContent = logLines.join('\n');
		logDiv.elt.scrollTop = logDiv.elt.scrollHeight;
		logDirty = false;
	}
}
