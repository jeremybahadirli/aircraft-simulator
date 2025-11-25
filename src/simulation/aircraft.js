import { simState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import {
	createVelocityDirect,
	createVelocityOnTrack,
} from './utils.js';

export class Aircraft {
	constructor({ pos, vel, halo = false, color = 'yellow' }) {
		this.pos = pos;
		this.vel = vel;
		this.halo = halo;
		this.color = color;
		this.trk = p5.Vector.add(this.vel, simState.wind.vel);
	}

	static onHeading({ pos, heading, TAS, halo, color }) {
		return new Aircraft({
			pos,
			vel: ASVector.fromAngle(heading, TAS),
			halo,
			color,
		});
	}

	static onTrack({ pos, track, TAS, halo, color }) {
		return new Aircraft({
			pos,
			vel: createVelocityOnTrack(track, TAS),
			halo,
			color,
		});
	}

	static direct({ pos, fix, TAS, halo, color }) {
		return new Aircraft({
			pos,
			vel: createVelocityDirect(fix, pos, TAS),
			halo,
			color,
		});
	}

	static stationary({ pos, halo, color }) {
		return new Aircraft({
			pos,
			vel: ASVector.fromAngle(
				simState.wind.vel.asHeading() + 180,
				simState.wind.vel.mag()
			),
			halo,
			color,
		});
	}

	updateGroundTrack() {
		this.trk = p5.Vector.add(this.vel, simState.wind.vel);
	}

	updatePosition(hours) {
		const delta = p5.Vector.mult(this.trk, hours);
		this.pos = p5.Vector.add(this.pos, delta);
	}
}
