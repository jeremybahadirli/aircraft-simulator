import { simState } from '../core/state.js';

export function drawCanvas() {
	push();
	background('black');
	stroke('gray');
	strokeWeight(1);
	point(0, 0);
	pop();
}

export function drawGrid() {
	push();
	stroke('gray');
	strokeWeight(0.1);

	const scale = simState.settings.vRange / height;
	const halfX = (width * scale) / 2;
	const halfY = (height * scale) / 2;

	for (let i = 0; i <= halfX; i += 10) {
		line(i, halfY, i, -halfY);
		if (i !== 0) line(-i, halfY, -i, -halfY);
	}
	for (let i = 0; i <= halfY; i += 10) {
		line(halfX, i, -halfX, i);
		if (i !== 0) line(halfX, -i, -halfX, -i);
	}

	pop();
}

export function drawRings() {
	push();
	noFill();
	stroke('gray');
	strokeWeight(0.1);

	const scale = simState.settings.vRange / height;
	const maxRadius = (createVector(width, height).mag() * scale) / 2;

	for (let i = 10; i < maxRadius; i += 10) {
		circle(0, 0, i * 2);
	}

	pop();
}

export function drawWind(wind) {
	push();

	fill('white');
	strokeWeight(0);

	translate(0, simState.settings.vRange / 2 - 5);

	const windStr = Number.isInteger(wind.vel.mag())
		? wind.vel.mag().toString()
		: wind.vel.mag().toFixed(simState.settings.statsDecimalPlaces);

	push();
	scale(1, -1);
	textSize(3);
	text(windStr, -5, 6);
	pop();

	push();
	rotate(-wind.vel.asHeading());
	triangle(-1, 0, 1, 0, 0, 5);
	pop();

	pop();
}

export function drawAircraft(ac) {
	push();

	translate(ac.pos);
	rotate(-ac.trk.asHeading());
	fill(ac.color);
	stroke(ac.color);

	// Draw target
	push();
	noStroke();
	circle(0, 0, 1);
	pop();

	// Draw vector line
	const vectorLineExtent = (ac.trk.mag() / 60) * simState.settings.vectorMins;
	if (vectorLineExtent >= 1.5) {
		push();
		strokeWeight(0.25);
		line(0, 1.5, 0, vectorLineExtent);
		pop();
	}

	// Draw halo
	if (ac.halo) {
		push();
		noFill();
		strokeWeight(0.4);
		circle(0, 0, 10);
		pop();
	}

	pop();
}
