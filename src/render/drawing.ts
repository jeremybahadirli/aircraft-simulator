import { formatNumber } from '../math/formatNumber.js';
import { Vector2 } from '../math/vector2.js';
import type { Aircraft, DatablockSlot } from '../simulation/aircraft.js';
import type { Atmosphere } from '../simulation/atmosphere.js';
import type { Viewport } from './viewport.js';

const CROSSHAIR_ARM_PX = 10;
const GRID_STEP_NM = 10;
const TARGET_POINT_PX = 6;
const HISTORY_TARGET_COLOR = '#837603';
const TARGET_PADDING_PX = 4;
const VECTOR_STROKE_PX = 1.5;
const LEADER_STROKE_PX = 2;
const HALO_STROKE_PX = 2;
const DEFAULT_DATABLOCK_TEXT_SIZE_PX = 18;
const MOBILE_DATABLOCK_TEXT_SIZE_PX = 18;
const DATABLOCK_LINE_SPACING_PX = 6;
const DATABLOCK_PADDING_PX = 4;
const LEADER_LINE_PX = 52;
const DATABLOCK_FONT = 'ERAMv300';
const WIND_ARROW_LENGTH_PX = 16;
const WIND_ARROW_WIDTH_PX = 12;
const PAUSED_BORDER_STROKE_PX = 8;
const PAUSED_BORDER_COLOR = '#808080';

export function drawCanvas(viewport: Viewport): void {
	background('black');
	stroke('gray');
	strokeWeight(10);
	drawWorldPoint(viewport, Vector2.fromXY(0, 0));
}

export function drawPausedBorder(viewport: Viewport): void {
	push();
	stroke(PAUSED_BORDER_COLOR);
	strokeWeight(PAUSED_BORDER_STROKE_PX);
	strokeCap(SQUARE);
	const rightPx = viewport.width;
	const bottomPx = viewport.height;
	line(0, 0, rightPx, 0);
	line(rightPx, 0, rightPx, bottomPx);
	line(rightPx, bottomPx, 0, bottomPx);
	line(0, bottomPx, 0, 0);
	pop();
}

export function drawCrosshair(viewport: Viewport, pointerWorld: Vector2): void {
	push();
	stroke('white');
	strokeWeight(1);
	const mousePosView = viewport.worldToView(pointerWorld);
	drawViewLine(
		viewport,
		Vector2.fromXY(mousePosView.x - CROSSHAIR_ARM_PX, mousePosView.y),
		Vector2.fromXY(mousePosView.x + CROSSHAIR_ARM_PX, mousePosView.y),
	);
	drawViewLine(
		viewport,
		Vector2.fromXY(mousePosView.x, mousePosView.y - CROSSHAIR_ARM_PX),
		Vector2.fromXY(mousePosView.x, mousePosView.y + CROSSHAIR_ARM_PX),
	);
	pop();
}

export function drawGrid(viewport: Viewport, verticalRangeNm: number): void {
	push();
	stroke('gray');
	strokeWeight(1);

	const halfWidthNm = viewport.pxToNm(viewport.width) / 2;
	const halfHeightNm = verticalRangeNm / 2;

	for (let x = 0; x <= halfWidthNm; x += GRID_STEP_NM) {
		drawWorldLine(
			viewport,
			Vector2.fromXY(x, -halfHeightNm),
			Vector2.fromXY(x, halfHeightNm),
		);
		if (x !== 0) {
			drawWorldLine(
				viewport,
				Vector2.fromXY(-x, -halfHeightNm),
				Vector2.fromXY(-x, halfHeightNm),
			);
		}
	}
	for (let y = 0; y <= halfHeightNm; y += GRID_STEP_NM) {
		drawWorldLine(
			viewport,
			Vector2.fromXY(-halfWidthNm, y),
			Vector2.fromXY(halfWidthNm, y),
		);
		if (y !== 0) {
			drawWorldLine(
				viewport,
				Vector2.fromXY(-halfWidthNm, -y),
				Vector2.fromXY(halfWidthNm, -y),
			);
		}
	}

	pop();
}

export function drawRings(viewport: Viewport, verticalRangeNm: number): void {
	push();
	noFill();
	stroke('gray');
	strokeWeight(1);

	const maxRadiusNm =
		Math.hypot(viewport.pxToNm(viewport.width), verticalRangeNm) / 2;

	for (let r = GRID_STEP_NM; r < maxRadiusNm; r += GRID_STEP_NM) {
		drawWorldCircle(viewport, Vector2.fromXY(0, 0), r);
	}

	pop();
}

export function drawWind(
	viewport: Viewport,
	atmosphere: Atmosphere,
	decimalPlaces: number,
): void {
	push();
	fill('white');
	stroke('white');
	strokeWeight(1.5);

	const windStr = Number.isInteger(atmosphere.windVel.mag())
		? atmosphere.windVel.mag().toString()
		: atmosphere.windVel.mag().toFixed(decimalPlaces);

	// Draw arrow
	const direction = headingToViewUnit(atmosphere.windVel.heading());
	const normal = Vector2.fromXY(-direction.y, direction.x);
	const centerView = Vector2.fromXY(0, viewport.centerCanvas.y - 24);
	const tailView = centerView
		.copy()
		.sub(direction.copy().mult(WIND_ARROW_LENGTH_PX / 2));
	const tipView = centerView
		.copy()
		.add(direction.copy().mult(WIND_ARROW_LENGTH_PX / 2));
	const leftView = tailView
		.copy()
		.add(normal.copy().mult(WIND_ARROW_WIDTH_PX / 2));
	const rightView = tailView
		.copy()
		.sub(normal.copy().mult(WIND_ARROW_WIDTH_PX / 2));
	drawViewTriangle(viewport, tipView, leftView, rightView);

	noStroke();
	textSize(getDatablockTextSizePx(viewport.width));
	drawViewText(
		viewport,
		windStr,
		Vector2.fromXY(centerView.x + 14, centerView.y - 5),
	);

	pop();
}

export function drawAircraft(
	ac: Aircraft,
	viewport: Viewport,
	vectorMinutes: number,
): void {
	drawAircraftSymbol(ac, viewport, vectorMinutes);
	drawAircraftDatablock(ac, viewport);
}

function drawAircraftSymbol(
	ac: Aircraft,
	viewport: Viewport,
	vectorMinutes: number,
): void {
	const color = ac.display.color;

	push();
	stroke(HISTORY_TARGET_COLOR);
	strokeWeight(TARGET_POINT_PX);
	ac.histories.forEach((historyPos) => {
		drawWorldPoint(viewport, historyPos);
	});

	fill(color);
	stroke(color);
	strokeCap(SQUARE);

	// Draw target
	strokeWeight(TARGET_POINT_PX);
	drawWorldPoint(viewport, ac.pos);

	// Draw vector line
	const posView = viewport.worldToView(ac.pos);
	const vectorLineExtent = (ac.trk.mag() / 60) * vectorMinutes;
	const vectorLineExtentPx = viewport.nmToPx(vectorLineExtent);
	if (vectorLineExtentPx >= getTargetLineOffsetPx()) {
		const direction = headingToViewUnit(ac.trk.heading());
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
		drawWorldCircle(viewport, ac.pos, ac.display.haloRadiusNm);
	}

	pop();
}

function drawAircraftDatablock(ac: Aircraft, viewport: Viewport): void {
	if (!ac.display.showDatablock) return;

	const anchorView = viewport.worldToView(ac.pos);
	const lines = getDatablockLines(ac);

	push();
	textFont(DATABLOCK_FONT);
	const datablockTextSizePx = getDatablockTextSizePx(viewport.width);
	textSize(datablockTextSizePx);

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
			textSize((datablockTextSizePx * 11) / 14);
		}
		drawViewText(
			viewport,
			lineText,
			Vector2.fromXY(
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

function getDatablockTextSizePx(canvasWidth: number): number {
	return canvasWidth <= 700
		? MOBILE_DATABLOCK_TEXT_SIZE_PX
		: DEFAULT_DATABLOCK_TEXT_SIZE_PX;
}

function drawViewPoint(viewport: Viewport, posView: Vector2): void {
	const posCanvas = viewport.viewToCanvas(posView);
	point(posCanvas.x, posCanvas.y);
}

function drawViewLine(
	viewport: Viewport,
	startView: Vector2,
	endView: Vector2,
): void {
	const startCanvas = viewport.viewToCanvas(startView);
	const endCanvas = viewport.viewToCanvas(endView);
	line(startCanvas.x, startCanvas.y, endCanvas.x, endCanvas.y);
}

function drawViewCircle(
	viewport: Viewport,
	centerView: Vector2,
	diameterPx: number,
): void {
	const centerCanvas = viewport.viewToCanvas(centerView);
	circle(centerCanvas.x, centerCanvas.y, diameterPx);
}

function drawViewTriangle(
	viewport: Viewport,
	p1View: Vector2,
	p2View: Vector2,
	p3View: Vector2,
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
	posView: Vector2,
): void {
	const posCanvas = viewport.viewToCanvas(posView);
	text(value, posCanvas.x, posCanvas.y);
}

function drawWorldPoint(viewport: Viewport, posWorld: Vector2): void {
	drawViewPoint(viewport, viewport.worldToView(posWorld));
}

function drawWorldLine(
	viewport: Viewport,
	startWorld: Vector2,
	endWorld: Vector2,
): void {
	drawViewLine(
		viewport,
		viewport.worldToView(startWorld),
		viewport.worldToView(endWorld),
	);
}

function drawWorldCircle(
	viewport: Viewport,
	centerWorld: Vector2,
	radiusNm: number,
): void {
	drawViewCircle(
		viewport,
		viewport.worldToView(centerWorld),
		viewport.nmToPx(radiusNm) * 2,
	);
}

function headingToViewUnit(heading: number): Vector2 {
	return Vector2.fromAngle(heading, 1);
}

function getTargetLineOffsetPx(): number {
	return TARGET_POINT_PX / 2 + TARGET_PADDING_PX;
}

function getLineStart(anchorPx: Vector2, endPx: Vector2): Vector2 {
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
	leaderEndView: Vector2,
	blockWidthPx: number,
	slot: DatablockSlot,
): Vector2 {
	const right = -blockWidthPx - DATABLOCK_PADDING_PX;
	const bottom1 = DATABLOCK_PADDING_PX + getTextHeight();
	const top3 =
		DATABLOCK_PADDING_PX +
		(getTextHeight() + DATABLOCK_LINE_SPACING_PX) * 2;

	switch (slot) {
		case 1:
		case 4:
			return leaderEndView.copy().add(Vector2.fromXY(right, top3));
		case 2:
		case 3:
		case 6:
			return leaderEndView.copy().add(Vector2.fromXY(0, top3));
		case 7:
			return leaderEndView.copy().add(Vector2.fromXY(right, bottom1));
		case 8:
		case 9:
			return leaderEndView.copy().add(Vector2.fromXY(0, bottom1));
	}
}

function getLeaderEnd(anchorView: Vector2, slot: DatablockSlot): Vector2 {
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
		.add(Vector2.fromAngle(leaderDirection, LEADER_LINE_PX));
}

function getTextHeight(text?: string): number {
	return textAscent(text ?? 'A') + textDescent(text ?? 'A');
}
