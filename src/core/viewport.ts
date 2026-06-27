import { ASVector } from '../math/asvector.js';
import { simState } from './state.js';

export interface Viewport {
	pixelsPerNm: number;
	halfCanvasPx: ASVector;
	worldToView: (posWorld: p5.Vector) => ASVector;
	viewToWorld: (posView: p5.Vector) => ASVector;
	viewToCanvas: (posView: p5.Vector) => ASVector;
	canvasToView: (xPx: number, yPx: number) => ASVector;
	worldToCanvas: (posWorld: p5.Vector) => ASVector;
	canvasToWorld: (xPx: number, yPx: number) => ASVector;
	nmToPx: (nm: number) => number;
	pxToNm: (px: number) => number;
}

export function createViewport(): Viewport {
	const pixelsPerNm = height / simState.settings.vRange;
	const halfCanvasPx = ASVector.fromXY(width / 2, height / 2);
	const worldToView = (posWorld: p5.Vector) =>
		ASVector.fromXY(
			posWorld.x * pixelsPerNm,
			posWorld.y * pixelsPerNm,
		);
	const viewToWorld = (posView: p5.Vector) =>
		ASVector.fromXY(
			posView.x / pixelsPerNm,
			posView.y / pixelsPerNm,
		);
	const viewToCanvas = (posView: p5.Vector) =>
		ASVector.fromXY(
			halfCanvasPx.x + posView.x,
			halfCanvasPx.y - posView.y,
		);
	const canvasToView = (xPx: number, yPx: number) =>
		ASVector.fromXY(
			xPx - halfCanvasPx.x,
			halfCanvasPx.y - yPx,
		);

	return {
		pixelsPerNm,
		halfCanvasPx,
		worldToView,
		viewToWorld,
		viewToCanvas,
		canvasToView,
		worldToCanvas: (posWorld) => viewToCanvas(worldToView(posWorld)),
		canvasToWorld: (xPx, yPx) => viewToWorld(canvasToView(xPx, yPx)),
		nmToPx: (nm) => nm * pixelsPerNm,
		pxToNm: (px) => px / pixelsPerNm,
	};
}
