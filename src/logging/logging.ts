import { formatNumber } from '../math/formatNumber.js';
import type { SimulationState } from '../simulation/state.js';
import type { ViewState } from '../view/state.js';

export function formatStatusFrame(
	state: SimulationState,
	viewState: ViewState,
	hours: number,
): string {
	const frameLineComponents: [string, string][] = [];
	const minutes = Math.trunc(hours * 60);
	const seconds = Math.trunc((hours * 60 * 60) % 60);
	const secondsText =
		(seconds < 0 ? '-' : '') +
		Math.abs(seconds).toString().padStart(2, '0');
	frameLineComponents.push(['Time:', `${minutes}m ${secondsText}s`]);

	for (const stat of state.stats) {
		const heading = formatNumber(
			stat.ac.vel.heading(),
			viewState.statsDecimalPlaces,
			3,
		);
		const track = formatNumber(
			stat.ac.trk.heading(),
			viewState.statsDecimalPlaces,
			3,
		);
		const groundSpeed = formatNumber(
			stat.ac.trk.mag(),
			viewState.statsDecimalPlaces,
		);
		frameLineComponents.push([
			`${stat.name}:`,
			[
				`hdg ${heading.p} ${heading.n}°  `,
				`trk ${track.p} ${track.n}°  `,
				`gs ${groundSpeed.p} ${groundSpeed.n} KT`,
			].join(''),
		]);
	}

	for (const proximity of state.proximities) {
		const distance = formatNumber(
			proximity.proximity,
			viewState.proximityDecimalPlaces,
		);
		const nearest = formatNumber(
			proximity.lowestProximity,
			viewState.proximityDecimalPlaces,
		);
		frameLineComponents.push([
			`${proximity.name}:`,
			[
				`proximity ${distance.p} ${distance.n} NM  `,
				`nearest ${nearest.p} ${nearest.n} NM`,
			].join(''),
		]);
	}

	const longestLabelLength = frameLineComponents.reduce((max, [label]) => {
		return Math.max(max, label.length);
	}, 0);
	return frameLineComponents
		.map(
			([label, value]) =>
				`  ${label.padEnd(longestLabelLength + 2)}${value}`,
		)
		.join('\n');
}
