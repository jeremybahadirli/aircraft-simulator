import { MAX_DIGITS } from '../constants.js';

export function formatNumber(
	n: number,
	preferredDecimals = 0,
	leadingZeroes = 0,
): { n: string; p: string } {
	if (!Number.isFinite(n)) {
		return { n: String(n), p: '=' };
	}

	let [intPart, fracPart = ''] = Math.abs(n)
		.toFixed(preferredDecimals)
		.split('.');
	intPart = intPart.padStart(leadingZeroes, '0');

	const maxDecimals = Math.max(0, MAX_DIGITS - intPart.length);
	const cappedDecimals = Math.min(preferredDecimals, maxDecimals);
	if (cappedDecimals !== preferredDecimals) {
		[intPart, fracPart = ''] = Math.abs(n).toFixed(cappedDecimals).split('.');
		intPart = intPart.padStart(leadingZeroes, '0');
	} else {
		fracPart = fracPart.slice(0, cappedDecimals);
	}

	const formatted =
		(n < 0 ? '-' : '') +
		intPart +
		(cappedDecimals > 0 ? `.${fracPart}` : '');
	const precisionChar =
		Number(formatted) === roundToDecimals(n, MAX_DIGITS) ? '=' : '≈';

	return { n: formatted, p: precisionChar };
}

function roundToDecimals(value: number, decimals: number): number {
	const scale = 10 ** decimals;
	return Math.round(value * scale) / scale;
}
