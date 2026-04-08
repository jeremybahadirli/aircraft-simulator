import { simState } from '../core/state.js';
import type { Aircraft } from './aircraft.js';

export class Stat {
	ac: number;
	name: string;

	constructor(ac: number, name: string) {
		this.ac = ac;
		this.name = name;
	}

	static create(ac: number, name = `Aircraft ${ac}`): Stat {
		return new Stat(ac, name);
	}

	get aircraft(): Aircraft {
		return simState.aircraftList[this.ac];
	}
}
