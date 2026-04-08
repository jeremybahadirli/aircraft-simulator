import { GAMMA, KNOTS_PER_MPS, P0, R, T0 } from '../core/constants.js';
import { tempCToK } from '../simulation/utils.js';

export class SpeedConversions {
	private static getSpeedOfSoundKt(tempC: number): number {
		const tempK = tempCToK(tempC);
		const aMps = Math.sqrt(GAMMA * R * tempK);
		return aMps * KNOTS_PER_MPS;
	}

	static tasToMach(tasKt: number, tempC: number): number {
		const aKt = this.getSpeedOfSoundKt(tempC);
		return tasKt / aKt;
	}

	static machToTas(mach: number, tempC: number): number {
		const aKt = this.getSpeedOfSoundKt(tempC);
		return mach * aKt;
	}

	static tasToIas(
		tasKt: number,
		pressureInHg: number,
		tempC: number,
	): number {
		const mach = this.tasToMach(tasKt, tempC);

		if (mach >= 1) {
			throw new RangeError('tasToIas does not support supersonic speed.');
		}

		const qc = pressureInHg * (Math.pow(1 + 0.2 * mach * mach, 3.5) - 1);

		const machCas = Math.sqrt(5 * (Math.pow(qc / P0 + 1, 2 / 7) - 1));

		const a0Kt = this.getSpeedOfSoundKt(T0);
		return machCas * a0Kt;
	}

	static iasToTas(
		casKt: number,
		pressureInHg: number,
		tempC: number,
	): number {
		const a0Kt = this.getSpeedOfSoundKt(T0);
		const machCas = casKt / a0Kt;

		if (machCas >= 1) {
			throw new RangeError('iasToTas does not support supersonic speed.');
		}

		const qc = P0 * (Math.pow(1 + 0.2 * machCas * machCas, 3.5) - 1);

		const mach = Math.sqrt(
			5 * (Math.pow(qc / pressureInHg + 1, 2 / 7) - 1),
		);

		if (mach >= 1) {
			throw new RangeError('iasToTas does not support supersonic speed.');
		}

		return this.machToTas(mach, tempC);
	}
}
