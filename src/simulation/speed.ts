import { simState } from '../core/state.js';
import { SpeedConversions } from '../math/speedConversions.js';

export type SpeedSpec =
	| { unit: 'tas'; value: number }
	| { unit: 'ias'; value: number }
	| { unit: 'mach'; value: number };

export function resolveTas(
	speed: SpeedSpec,
	altitude: number,
): number {
	const tempC = simState.atmosphere.getTemperatureCAtAltitude(altitude);

	switch (speed.unit) {
		case 'tas':
			return speed.value;
		case 'ias':
			return SpeedConversions.iasToTas(
				speed.value,
				simState.atmosphere.getPressureAtAltitude(altitude),
				tempC,
			);
		case 'mach':
			return SpeedConversions.machToTas(speed.value, tempC);
	}
}
