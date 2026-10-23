import { Vector2 } from '../math/vector2.js';
import type { Viewport } from '../render/viewport.js';

export function getPointerWorldPosition(
	x: number,
	y: number,
	viewport: Viewport,
	keyIsPressed: boolean,
): Vector2 {
	const position = viewport.canvasToWorld(x, y);
	if (!keyIsPressed) return position;
	return Vector2.fromXY(
		Math.round(position.x * 10) / 10,
		Math.round(position.y * 10) / 10,
	);
}
