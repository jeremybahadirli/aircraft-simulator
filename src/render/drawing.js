import { simState, uiState } from '../core/state.js';
import { getMousePos } from '../simulation/utils.js';

export function drawCanvas() {
	translate(createVector(width, height).div(2));
	scale(height / simState.settings.vRange);
	scale(1, -1);

	push();
	background('black');
	stroke('gray');
	strokeWeight(1);
	point(0, 0);
	pop();
}

export function drawCrosshair() {
	push();
	stroke('white')
	strokeWeight(0.1)
	const mousePos = getMousePos(mouseX, mouseY);
	translate(mousePos.x, mousePos.y);
	line(-2, 0, 2, 0);
	line(0, -2, 0, 2);
	pop();
}

export function drawGrid() {
	push();
	stroke('gray');
	strokeWeight(0.1);

	const scale = simState.settings.vRange / height;
	const halfWidth = (width * scale) / 2;
	const halfHeight = (height * scale) / 2;

	for (let x = 0; x <= halfWidth; x += 10) {
		line(x, -halfHeight, x, halfHeight);
		if (x !== 0) line(-x, halfHeight, -x, -halfHeight);
	}
	for (let y = 0; y <= halfHeight; y += 10) {
		line(-halfWidth, y, halfWidth, y);
		if (y !== 0) line(halfWidth, -y, -halfWidth, -y);
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

	for (let r = 10; r < maxRadius; r += 10) {
		circle(0, 0, r * 2);
	}

	pop();
}

export function drawWind() {
	push();

	fill('white');
	strokeWeight(0);

	translate(0, simState.settings.vRange / 2 - 5);

	const windStr = Number.isInteger(simState.wind.vel.mag())
		? simState.wind.vel.mag().toString()
		: simState.wind.vel.mag().toFixed(simState.settings.statsDecimalPlaces);

	push();
	scale(1, -1);
	textSize(3);
	text(windStr, -5, 6);
	pop();

	push();
	rotate(-simState.wind.vel.asHeading()); // p5 positive rotation -> ccw
	triangle(-1, 0, 1, 0, 0, 5);
	pop();

	pop();
}

export function drawAircraft(ac) {
	push();

	translate(ac.pos);
	rotate(-ac.trk.asHeading()); // p5 positive rotation -> ccw
	fill(ac.color);
	stroke(ac.color);

	// Draw target
	push();
	strokeWeight(1)
	point(0, 0)
	pop();

	// Draw vector line
	const vectorLineExtent = (ac.trk.mag() / 60) * uiState.vectorMinsInput.value()
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
