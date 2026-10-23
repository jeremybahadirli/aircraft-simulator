export function randBetween(minValue: number, maxValue: number): number {
	return Math.random() * (maxValue - minValue) + minValue;
}
