import { Vector2 } from '../math/vector2.js';
import type { Viewport } from '../render/viewport.js';

export function getPointerWorldPosition(
	x: number,
	y: number,
	viewport: Viewport,
	shouldRoundToWorldTenths: boolean,
): Vector2 {
	const position = viewport.canvasToWorld(x, y);
	if (!shouldRoundToWorldTenths) return position;
	return Vector2.fromXY(
		Math.round(position.x * 10) / 10,
		Math.round(position.y * 10) / 10,
	);
}
