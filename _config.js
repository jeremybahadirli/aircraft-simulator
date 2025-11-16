function initConfig() {
	settings = {
		displaySize: createVector(800, 800),
		vRange: 100,
		playbackSpeed: 10,
		vectorMins: 1,
		logFrequency: 0,
		statsDecimalPlaces: 0,
		proximityDecimalPlaces: 3,
	};

	wind = new Wind({
		from: 67.5,
		speed: 0,
	});

	aircraftList = [
		Aircraft.onHeading({
			pos: ASVector.fromAngle(90, 0),
			heading: 67.5,
			TAS: 300,
			halo: true,
		}),
		Aircraft.onHeading({
			pos: ASVector.fromAngle(180, 5),
			heading: 360,
			TAS: 300,
		}),
	];

	loggers = [new Logger(0, 1)];

	events = [
		{
			active: false,
			trigger: () => {
				return aircraftList[0].pos.y < 0;
			},
			actions: () => {
				aircraftList[0].vel = createVelocityOnTrack(270, 450, wind);
			},
		},
	];
}
