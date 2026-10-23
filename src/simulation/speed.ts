import { SpeedConversions } from '../math/speedConversions.js';
import type { Atmosphere } from './atmosphere.js';

export type SpeedSpec =
	| { unit: 'tas'; value: number }
	| { unit: 'ias'; value: number }
	| { unit: 'mach'; value: number };

export function resolveTas(
	speed: SpeedSpec,
	altitude: number,
	atmosphere: Atmosphere,
): number {
	const tempC = atmosphere.getTemperatureCAtAltitude(altitude);

	switch (speed.unit) {
		case 'tas':
			return speed.value;
		case 'ias':
			return SpeedConversions.iasToTas(
				speed.value,
				atmosphere.getPressureAtAltitude(altitude),
				tempC,
			);
		case 'mach':
			return SpeedConversions.machToTas(speed.value, tempC);
	}
}
