import { simState } from '../core/state.js';

export class Stat {
	constructor(ac, name) {
		this.ac = ac;
		this.name = name;
	}

	static create(ac, name = `Aircraft ${ac}`) {
		return new Stat(ac, name);
	}

	get aircraft() {
		return simState.aircraftList[this.ac];
	}
}
