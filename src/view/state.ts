export interface ViewSettings {
	vRange: number;
	statsDecimalPlaces: number;
	proximityDecimalPlaces: number;
}

export interface ViewPreferences {
	showGrid: boolean;
	showRings: boolean;
	vectorMinutes: number;
}

export interface ViewState extends ViewSettings, ViewPreferences { }

export function createViewState(
	viewSettings: ViewSettings,
	preferences: ViewPreferences = {
		showGrid: false,
		showRings: false,
		vectorMinutes: 1,
	},
): ViewState {
	return { ...viewSettings, ...preferences };
}
