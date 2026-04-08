import { FT_TO_M, g, P0_INHG as P0, R, T0_C as T0 } from '../core/constants.js';
import { ASVector } from '../math/asvector.js';
import { tempCToK } from './utils.js';

interface AtmosphereOptions {
	windVel?: { from: number; speed: number };
	seaLevelTemp?: number;
	seaLevelPressure?: number;
}

export class Atmosphere {
	windVel: ASVector;
	seaLevelTemp: number;

	constructor({
		windVel = { from: 0, speed: 0 },
		seaLevelTemp = T0,
	}: AtmosphereOptions) {
		this.windVel = ASVector.fromAngle(windVel.from + 180, windVel.speed);
		this.seaLevelTemp = seaLevelTemp;
	}

	getPressureAtAltitude(altitude: number): number {
		const h = altitude * FT_TO_M;

		// Layer 0: sea level to 11,000 m
		if (h <= 11000) {
			const L = 0.0065; // K/m
			return P0 * Math.pow(1 - (L * h) / tempCToK(T0), g / (R * L));
		}

		// Layer 1: 11,000 m to 20,000 m
		if (h <= 20000) {
			const P11 = 6.683245; // inHg
			const T11 = 216.65; // K
			const h11 = 11000; // m

			return P11 * Math.exp((-g * (h - h11)) / (R * T11));
		}

		throw new RangeError(
			'getPressureAtAltitude() currently supports standard atmosphere only up to 65,617 ft.',
		);
	}

	getTemperatureCAtAltitude(altitude: number): number {
		const h = altitude * FT_TO_M;

		// Layer 0: sea level to 11,000 m
		if (h <= 11000) {
			const lapseRateCPerM = 0.0065;
			return T0 - lapseRateCPerM * h + this.seaLevelTemp;
		}

		// Layer 1: 11,000 m to 20,000 m
		if (h <= 20000) {
			return -56.5 + this.seaLevelTemp;
		}

		throw new RangeError(
			'getTemperatureAtAltitude() currently supports standard atmosphere only up to 65,617 ft.',
		);
	}
}
