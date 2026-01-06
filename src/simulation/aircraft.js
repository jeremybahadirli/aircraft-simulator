import { simState } from '../core/state.js';
import { ASVector } from '../math/asvector.js';
import { createVelocityDirect, createVelocityOnTrack } from './utils.js';

export class Aircraft {
	constructor({ pos, vel, halo = false, color = 'yellow' }) {
		this.pos = pos;
		this.vel = vel;
		this.halo = halo;
		this.color = color;
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

	get trk() {
		return p5.Vector.add(this.vel, simState.wind.vel);
	}

	updatePosition(hours) {
		const delta = p5.Vector.mult(this.trk, hours);
		this.pos.add(delta);
	}

	turn(degrees) {
		this.vel.asRotate(degrees);
	}

	flyHeading(heading) {
		this.vel.setASHeading(heading);
	}

	flyTrack(track) {
		this.vel.setASHeading(createVelocityOnTrack(track))
	}

	increaseSpeed(kt) {
		this.vel.setMag(this.vel.mag() + kt);
	}

	reduceSpeed(kt) {
		this.vel.setMag(this.vel.mag() - kt);
	}

	maintain(TAS) {
		this.vel.setMag(TAS);
	}
}
