import { simState, uiState } from '../core/state.js';
import { createViewport, type Viewport } from '../core/viewport.js';
import { ASVector } from '../math/asvector.js';
import type { Aircraft, DatablockSlot } from '../simulation/aircraft.js';
import { formatNumber, getMousePos } from '../simulation/utils.js';

const CROSSHAIR_ARM_PX = 10;
const GRID_STEP_NM = 10;
const TARGET_POINT_PX = 8;
const TARGET_PADDING_PX = 4;
const VECTOR_STROKE_PX = 1.5;
const LEADER_STROKE_PX = 2;
const HALO_STROKE_PX = 2;
const DATABLOCK_TEXT_SIZE_PX = 18;
const DATABLOCK_LINE_SPACING_PX = 6;
const DATABLOCK_PADDING_PX = 4;
const LEADER_LINE_PX = 52;
const DATABLOCK_FONT = 'ERAMv300';
const WIND_ARROW_LENGTH_PX = 12;
const WIND_ARROW_HALF_WIDTH_PX = 4;
const PAUSED_BORDER_STROKE_PX = 8;
const PAUSED_BORDER_COLOR = '#808080';

export function drawCanvas(viewport = createViewport()): void {
	background('black');
	stroke('gray');
	strokeWeight(10);
	drawViewPoint(viewport, ASVector.fromXY(0, 0));
}

export function drawPausedBorder(): void {
	push();
	stroke(PAUSED_BORDER_COLOR);
	strokeWeight(PAUSED_BORDER_STROKE_PX);
	strokeCap(SQUARE);
	const rightPx = width;
	const bottomPx = height;
	line(0, 0, rightPx, 0);
	line(rightPx, 0, rightPx, bottomPx);
	line(rightPx, bottomPx, 0, bottomPx);
	line(0, bottomPx, 0, 0);
	pop();
}

export function drawCrosshair(viewport = createViewport()): void {
	push();
	stroke('white');
	strokeWeight(1);
	const mousePosView = viewport.worldToView(getMousePos(mouseX, mouseY));
	drawViewLine(
		viewport,
		ASVector.fromXY(mousePosView.x - CROSSHAIR_ARM_PX, mousePosView.y),
		ASVector.fromXY(mousePosView.x + CROSSHAIR_ARM_PX, mousePosView.y),
	);
	drawViewLine(
		viewport,
		ASVector.fromXY(mousePosView.x, mousePosView.y - CROSSHAIR_ARM_PX),
		ASVector.fromXY(mousePosView.x, mousePosView.y + CROSSHAIR_ARM_PX),
	);
	pop();
}

export function drawGrid(viewport = createViewport()): void {
	push();
	stroke('gray');
	strokeWeight(1);

	const halfWidthNm = viewport.pxToNm(width) / 2;
	const halfHeightNm = simState.settings.vRange / 2;

	for (let x = 0; x <= halfWidthNm; x += GRID_STEP_NM) {
		drawWorldLine(
			viewport,
			ASVector.fromXY(x, -halfHeightNm),
			ASVector.fromXY(x, halfHeightNm),
		);
		if (x !== 0) {
			drawWorldLine(
				viewport,
				ASVector.fromXY(-x, -halfHeightNm),
				ASVector.fromXY(-x, halfHeightNm),
			);
		}
	}
	for (let y = 0; y <= halfHeightNm; y += GRID_STEP_NM) {
		drawWorldLine(
			viewport,
			ASVector.fromXY(-halfWidthNm, y),
			ASVector.fromXY(halfWidthNm, y),
		);
		if (y !== 0) {
			drawWorldLine(
				viewport,
				ASVector.fromXY(-halfWidthNm, -y),
				ASVector.fromXY(halfWidthNm, -y),
			);
		}
	}

	pop();
}

export function drawRings(viewport = createViewport()): void {
	push();
	noFill();
	stroke('gray');
	strokeWeight(1);

	const maxRadiusNm =
		createVector(viewport.pxToNm(width), simState.settings.vRange).mag() /
		2;

	for (let r = GRID_STEP_NM; r < maxRadiusNm; r += GRID_STEP_NM) {
		drawWorldCircle(viewport, ASVector.fromXY(0, 0), r);
	}

	pop();
}

export function drawWind(viewport = createViewport()): void {
	push();
	fill('white');
	stroke('white');
	strokeWeight(1.5);

	const windStr = Number.isInteger(simState.atmosphere.windVel.mag())
		? simState.atmosphere.windVel.mag().toString()
		: simState.atmosphere.windVel
				.mag()
				.toFixed(simState.settings.statsDecimalPlaces);

	const anchorView = ASVector.fromXY(0, viewport.halfCanvasPx.y - 24);
	const direction = headingToViewUnit(
		simState.atmosphere.windVel.asHeading(),
	);
	const normal = ASVector.fromXY(-direction.y, direction.x);
	const tailView = anchorView
		.copy()
		.sub(direction.copy().mult(WIND_ARROW_LENGTH_PX / 2));
	const tipView = anchorView
		.copy()
		.add(direction.copy().mult(WIND_ARROW_LENGTH_PX / 2));
	const leftView = tailView
		.copy()
		.add(normal.copy().mult(WIND_ARROW_HALF_WIDTH_PX));
	const rightView = tailView
		.copy()
		.sub(normal.copy().mult(WIND_ARROW_HALF_WIDTH_PX));

	noStroke();
	textSize(DATABLOCK_TEXT_SIZE_PX);
	drawViewText(
		viewport,
		windStr,
		ASVector.fromXY(anchorView.x - 28, anchorView.y - 5),
	);

	stroke('white');
	fill('white');
	drawViewTriangle(viewport, tipView, leftView, rightView);

	pop();
}

export function drawAircraft(
	ac: Aircraft,
	_index: number,
	viewport = createViewport(),
): void {
	drawAircraftSymbol(ac, viewport);
	drawAircraftDatablock(ac, viewport);
}

function drawAircraftSymbol(ac: Aircraft, viewport: Viewport): void {
	const posView = viewport.worldToView(ac.pos);
	const color = ac.display.color;

	push();
	fill(color);
	stroke(color);
	strokeCap(SQUARE);

	// Draw target
	strokeWeight(TARGET_POINT_PX);
	drawViewPoint(viewport, posView);

	// Draw vector line
	const vectorLineExtent =
		(ac.trk.mag() / 60) * Number(uiState.vectorMinsInput?.value() ?? 0);
	const vectorLineExtentPx = viewport.nmToPx(vectorLineExtent);
	if (vectorLineExtentPx >= getTargetLineOffsetPx()) {
		const direction = headingToViewUnit(ac.trk.asHeading());
		const endView = posView
			.copy()
			.add(direction.copy().mult(vectorLineExtentPx));
		const startView = getLineStart(posView, endView);
		strokeWeight(VECTOR_STROKE_PX);
		drawViewLine(viewport, startView, endView);
	}

	// Draw halo
	if (ac.display.halo) {
		noFill();
		strokeWeight(HALO_STROKE_PX);
		drawViewCircle(
			viewport,
			posView,
			viewport.nmToPx(ac.display.haloRadiusNm) * 2,
		);
	}

	pop();
}

function drawAircraftDatablock(ac: Aircraft, viewport: Viewport): void {
	if (!ac.display.showDatablock) return;

	const anchorView = viewport.worldToView(ac.pos);
	const lines = getDatablockLines(ac);

	push();
	textFont(DATABLOCK_FONT);
	textSize(DATABLOCK_TEXT_SIZE_PX);

	const lineHeight = getTextHeight();

	const blockWidthPx =
		Math.max(...lines.map((lineText) => textWidth(lineText))) +
		DATABLOCK_PADDING_PX * 2;

	const leaderEndView = getLeaderEnd(anchorView, ac.display.datablockSlot);
	const leaderStartView = getLineStart(anchorView, leaderEndView);

	const originView = getDatablockOrigin(
		leaderEndView,
		blockWidthPx,
		ac.display.datablockSlot,
	);

	stroke(ac.display.color);
	strokeWeight(LEADER_STROKE_PX);
	strokeCap(SQUARE);

	drawViewLine(viewport, leaderStartView, leaderEndView);

	noStroke();
	fill(ac.display.color);
	lines.forEach((lineText, lineIndex) => {
		if (lineIndex == 3) {
			textSize((DATABLOCK_TEXT_SIZE_PX * 11) / 14);
		}
		drawViewText(
			viewport,
			lineText,
			ASVector.fromXY(
				originView.x + DATABLOCK_PADDING_PX,
				originView.y -
					DATABLOCK_PADDING_PX -
					lineIndex * (lineHeight + DATABLOCK_LINE_SPACING_PX) -
					getTextHeight(),
			),
		);
	});

	pop();
}

function drawViewPoint(viewport: Viewport, posView: ASVector): void {
	const posCanvas = viewport.viewToCanvas(posView);
	point(posCanvas.x, posCanvas.y);
}

function drawViewLine(
	viewport: Viewport,
	startView: ASVector,
	endView: ASVector,
): void {
	const startCanvas = viewport.viewToCanvas(startView);
	const endCanvas = viewport.viewToCanvas(endView);
	line(startCanvas.x, startCanvas.y, endCanvas.x, endCanvas.y);
}

function drawViewCircle(
	viewport: Viewport,
	centerView: ASVector,
	diameterPx: number,
): void {
	const centerCanvas = viewport.viewToCanvas(centerView);
	circle(centerCanvas.x, centerCanvas.y, diameterPx);
}

function drawViewTriangle(
	viewport: Viewport,
	p1View: ASVector,
	p2View: ASVector,
	p3View: ASVector,
): void {
	const p1Canvas = viewport.viewToCanvas(p1View);
	const p2Canvas = viewport.viewToCanvas(p2View);
	const p3Canvas = viewport.viewToCanvas(p3View);
	triangle(
		p1Canvas.x,
		p1Canvas.y,
		p2Canvas.x,
		p2Canvas.y,
		p3Canvas.x,
		p3Canvas.y,
	);
}

function drawViewText(
	viewport: Viewport,
	value: string,
	posView: ASVector,
): void {
	const posCanvas = viewport.viewToCanvas(posView);
	text(value, posCanvas.x, posCanvas.y);
}

function drawWorldLine(
	viewport: Viewport,
	startWorld: ASVector,
	endWorld: ASVector,
): void {
	drawViewLine(
		viewport,
		viewport.worldToView(startWorld),
		viewport.worldToView(endWorld),
	);
}

function drawWorldCircle(
	viewport: Viewport,
	centerWorld: ASVector,
	radiusNm: number,
): void {
	drawViewCircle(
		viewport,
		viewport.worldToView(centerWorld),
		viewport.nmToPx(radiusNm) * 2,
	);
}

function headingToViewUnit(heading: number): ASVector {
	return ASVector.fromAngle(heading, 1);
}

function getTargetLineOffsetPx(): number {
	return TARGET_POINT_PX / 2 + TARGET_PADDING_PX;
}

function getLineStart(anchorPx: ASVector, endPx: ASVector): ASVector {
	const deltaPx = endPx.copy().sub(anchorPx);
	if (deltaPx.mag() === 0) return anchorPx.copy();

	return anchorPx.copy().add(deltaPx.setMag(getTargetLineOffsetPx()));
}

function getDatablockLines(ac: Aircraft): string[] {
	const gsStr = formatNumber(ac.trk.mag(), 0).n;
	const altitudeStr = formatNumber(ac.alt, 0, 3).n;

	return [
		ac.callsign,
		`${altitudeStr}C`,
		`${ac.cid} ${gsStr}`,
		ac.fourthLine,
	];
}

function getDatablockOrigin(
	leaderEndView: ASVector,
	blockWidthPx: number,
	slot: DatablockSlot,
): ASVector {
	const right = -blockWidthPx - DATABLOCK_PADDING_PX;
	const bottom1 = DATABLOCK_PADDING_PX + getTextHeight();
	const top3 =
		DATABLOCK_PADDING_PX +
		(getTextHeight() + DATABLOCK_LINE_SPACING_PX) * 2;

	switch (slot) {
		case 1:
		case 4:
			return leaderEndView.copy().add(ASVector.fromXY(right, top3));
		case 2:
		case 3:
		case 6:
			return leaderEndView.copy().add(ASVector.fromXY(0, top3));
		case 7:
			return leaderEndView.copy().add(ASVector.fromXY(right, bottom1));
		case 8:
		case 9:
			return leaderEndView.copy().add(ASVector.fromXY(0, bottom1));
	}
}

function getLeaderEnd(anchorView: ASVector, slot: DatablockSlot): ASVector {
	let leaderDirection;
	switch (slot) {
		case 1:
			leaderDirection = 315;
			break;
		case 2:
			leaderDirection = 0;
			break;
		case 3:
			leaderDirection = 45;
			break;
		case 4:
			leaderDirection = 270;
			break;
		case 6:
			leaderDirection = 90;
			break;
		case 7:
			leaderDirection = 225;
			break;
		case 8:
			leaderDirection = 180;
			break;
		case 9:
			leaderDirection = 135;
			break;
	}
	return anchorView
		.copy()
		.add(ASVector.fromAngle(leaderDirection, LEADER_LINE_PX));
}

function getTextHeight(text?: string): number {
	return textAscent(text ?? 'A') + textDescent(text ?? 'A');
}
