import type { SimulationState } from './state.js';

export function updateSimulation(state: SimulationState, nextTime: number): void {
	if (nextTime <= state.nextUpdate) return;

	state.events
		.filter((event) => event.armed && event.trigger())
		.forEach((event) => {
			event.armed = false;
			event.actions();
		});
	state.aircraftList.forEach((aircraft) => {
		aircraft.prevPos = aircraft.pos.copy();
		aircraft.prevVel = aircraft.vel.copy();
		aircraft.recordHistory(state.simSettings.numHistories);
		aircraft.updatePosition(nextTime - state.lastUpdate);
	});
	state.proximities.forEach((proximity) =>
		proximity.updateProximity(nextTime - state.lastUpdate),
	);

	state.lastUpdate = nextTime;
	state.nextUpdate += state.simSettings.secondsPerUpdate / 60 / 60;
}
