const MILLIS_PER_HOUR = 3600000;
const MAX_LOG_LINES = 400;

let time = 0;

const logLines = [];
let nextLogTime = 0;
let logDirty = false;

function setup() {
	angleMode(DEGREES);

	initConfig();

	const canvas = createCanvas(settings.displaySize.x, settings.displaySize.y);
	createUI();

	const defaultPlaybackSpeed = settings.playbackSpeed;
	canvas.mousePressed(() => {
		if (settings.playbackSpeed === 0) {
			settings.playbackSpeed = defaultPlaybackSpeed;
		} else {
			settings.playbackSpeed = 0;
		}
	});

	for (const pl of loggers) {
		pl.updateProximity();
	}
	Logger.log('\n');
	Logger.printLogs(time);
	nextLogTime += settings.logFrequency / 60 / 60;
}

function draw() {
	translate(p5.Vector.div(settings.displaySize, 2));
	scale(settings.displaySize.y / settings.vRange);
	scale(1, -1);

	const deltaHours = (deltaTime / MILLIS_PER_HOUR) * settings.playbackSpeed;
	const nextTime = time + deltaHours;

	for (const event of events) {
		if (event.active && event.trigger()) {
			event.actions();
			event.active = false;
		}
	}

	for (const ac of aircraftList) {
		ac.updateGroundTrack();
		ac.updatePosition(deltaHours);
	}

	for (const pl of loggers) {
		pl.updateProximity();
	}

	if (settings.playbackSpeed !== 0 && nextTime >= nextLogTime) {
		Logger.printLogs(nextTime);
		nextLogTime += settings.logFrequency / 60 / 60;
	}

	drawCanvas();
	if (gridCheckbox.checked()) drawGrid();
	if (ringsCheckbox.checked()) drawRings();
	if (wind.vel.mag() > 0) drawWind(wind);
	for (const ac of aircraftList) {
		drawAircraft(ac);
	}

	time = nextTime;
}
