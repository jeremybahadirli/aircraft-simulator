export class FlidRegistry {
	private readonly cids = new Set<string>();
	private readonly callsigns = new Set<string>();

	private static readonly maxCids = 1000;
	private static readonly maxCallsigns = 1000 * 26 * 26;
	private static readonly randomAttempts = 1000;

	createCid(): string {
		if (this.cids.size >= FlidRegistry.maxCids) {
			throw new Error('No unique 3-digit CIDs remain.');
		}

		for (
			let attempt = 0;
			attempt < FlidRegistry.randomAttempts;
			attempt++
		) {
			const cid = randomDigits(3);
			if (!this.cids.has(cid)) return cid;
		}

		for (let value = 0; value < FlidRegistry.maxCids; value++) {
			const cid = value.toString().padStart(3, '0');
			if (!this.cids.has(cid)) return cid;
		}

		throw new Error('No unique 3-digit CIDs remain.');
	}

	createCallsign(): string {
		if (this.callsigns.size >= FlidRegistry.maxCallsigns) {
			throw new Error('No unique generated callsigns remain.');
		}

		for (
			let attempt = 0;
			attempt < FlidRegistry.randomAttempts;
			attempt++
		) {
			const callsign = `N${randomDigits(3)}${randomLetters(2)}`;
			if (!this.callsigns.has(callsign)) return callsign;
		}

		for (let number = 0; number < FlidRegistry.maxCids; number++) {
			for (let firstLetter = 0; firstLetter < 26; firstLetter++) {
				for (let secondLetter = 0; secondLetter < 26; secondLetter++) {
					const callsign = `N${number
						.toString()
						.padStart(
							3,
							'0',
						)}${letterAt(firstLetter)}${letterAt(secondLetter)}`;
					if (!this.callsigns.has(callsign)) return callsign;
				}
			}
		}

		throw new Error('No unique generated callsigns remain.');
	}

	claim(cid: string, callsign: string): void {
		if (this.cids.has(cid))
			throw new Error(`FLID ${cid} is already assigned.`);
		if (this.callsigns.has(callsign)) {
			throw new Error(`FLID ${callsign} is already assigned.`);
		}
		this.cids.add(cid);
		this.callsigns.add(callsign);
	}
}

function randomDigits(length: number): string {
	let value = '';
	for (let i = 0; i < length; i++) {
		value += Math.floor(Math.random() * 10).toString();
	}
	return value;
}

function randomLetters(length: number): string {
	const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let value = '';
	for (let i = 0; i < length; i++) {
		value += letters[Math.floor(Math.random() * letters.length)];
	}
	return value;
}

function letterAt(index: number): string {
	return String.fromCharCode('A'.charCodeAt(0) + index);
}
