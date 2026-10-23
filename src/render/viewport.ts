import { Vector2 } from '../math/vector2.js';

export interface Viewport {
	width: number;
	height: number;
	pixelsPerNm: number;
	centerCanvas: Vector2;
	worldToView: (position: Vector2) => Vector2;
	viewToWorld: (position: Vector2) => Vector2;
	viewToCanvas: (position: Vector2) => Vector2;
	canvasToView: (xPx: number, yPx: number) => Vector2;
	worldToCanvas: (position: Vector2) => Vector2;
	canvasToWorld: (xPx: number, yPx: number) => Vector2;
	nmToPx: (nm: number) => number;
	pxToNm: (px: number) => number;
}

export function createViewport(
	width: number,
	height: number,
	vRangeNm: number,
): Viewport {
	const pixelsPerNm = height / vRangeNm;
	const centerCanvas = Vector2.fromXY(width / 2, height / 2);
	const worldToView = (position: Vector2) =>
		Vector2.fromXY(position.x * pixelsPerNm, position.y * pixelsPerNm);
	const viewToWorld = (position: Vector2) =>
		Vector2.fromXY(position.x / pixelsPerNm, position.y / pixelsPerNm);
	const viewToCanvas = (position: Vector2) =>
		Vector2.fromXY(
			centerCanvas.x + position.x,
			centerCanvas.y - position.y,
		);
	const canvasToView = (xPx: number, yPx: number) =>
		Vector2.fromXY(xPx - centerCanvas.x, centerCanvas.y - yPx);

	return {
		width,
		height,
		pixelsPerNm,
		centerCanvas: centerCanvas,
		worldToView,
		viewToWorld,
		viewToCanvas,
		canvasToView,
		worldToCanvas: (position) => viewToCanvas(worldToView(position)),
		canvasToWorld: (xPx, yPx) => viewToWorld(canvasToView(xPx, yPx)),
		nmToPx: (nm) => nm * pixelsPerNm,
		pxToNm: (px) => px / pixelsPerNm,
	};
}
