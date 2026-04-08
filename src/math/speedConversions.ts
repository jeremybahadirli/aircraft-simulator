import { GAMMA, KNOTS_PER_MPS, P0_INHG, R, T0_C } from '../core/constants.js';
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

	static tasToCas(
		tasKt: number,
		pressureInHg: number,
		tempC: number,
	): number {
		const mach = this.tasToMach(tasKt, tempC);

		if (mach >= 1) {
			throw new RangeError(
				'tasToCas supports subsonic flow only (M < 1).',
			);
		}

		const qc = pressureInHg * (Math.pow(1 + 0.2 * mach * mach, 3.5) - 1);

		const machCas = Math.sqrt(5 * (Math.pow(qc / P0_INHG + 1, 2 / 7) - 1));

		const a0Kt = this.getSpeedOfSoundKt(T0_C);
		return machCas * a0Kt;
	}

	static casToTas(
		casKt: number,
		pressureInHg: number,
		tempC: number,
	): number {
		const a0Kt = this.getSpeedOfSoundKt(T0_C);
		const machCas = casKt / a0Kt;

		if (machCas >= 1) {
			throw new RangeError(
				'casToTas supports subsonic flow only for the pitot relation used here.',
			);
		}

		const qc = P0_INHG * (Math.pow(1 + 0.2 * machCas * machCas, 3.5) - 1);

		const mach = Math.sqrt(
			5 * (Math.pow(qc / pressureInHg + 1, 2 / 7) - 1),
		);

		if (mach >= 1) {
			throw new RangeError(
				'casToTas produced M >= 1; a supersonic pitot relation would be required.',
			);
		}

		return this.machToTas(mach, tempC);
	}
}
