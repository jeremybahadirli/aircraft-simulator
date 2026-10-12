import type { Aircraft } from './aircraft.js';

export class Stat {
	ac: Aircraft;
	name: string;

	constructor(ac: Aircraft, name: string) {
		this.ac = ac;
		this.name = name;
	}

	static create(ac: Aircraft, name = `${ac.callsign}`): Stat {
		return new Stat(ac, name);
	}
}
