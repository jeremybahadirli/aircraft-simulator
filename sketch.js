const MILLIS_PER_HOUR = 3600000;
const MAX_LOG_LINES = 400;

let time = 0;
let canvas;
const logLines = [];
let nextLogTime = 0;
let logDirty = false;

function setup() {
	angleMode(DEGREES);
	Logger.log('\n');

	initConfig();
	createUI();
	canvas = createCanvas().parent(canvasDiv);

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
	Logger.printLogs(time);
	nextLogTime += settings.logFrequency / 60 / 60;

	for (const e of events) {
		e.armed = e.active;
	}

	windowResized();
}

function draw() {
	translate(p5.Vector.div(createVector(width, height), 2));
	scale(canvas.height / settings.vRange);
	scale(1, -1);

	const deltaHours = (deltaTime / MILLIS_PER_HOUR) * settings.playbackSpeed;
	const nextTime = time + deltaHours;

	if (settings.playbackSpeed !== 0) {
		for (const event of events) {
			if (event.armed && event.trigger()) {
				event.armed = false;
				event.actions(deltaHours);
				for (const logger of loggers) {
					logger.updateCalculated();
				}
			}
		}

		for (const ac of aircraftList) {
			ac.updateGroundTrack();
			ac.updatePosition(deltaHours);
		}

		for (const pl of loggers) {
			pl.updateProximity();
		}

		if (nextTime >= nextLogTime) {
			Logger.printLogs(nextTime);
			nextLogTime += settings.logFrequency / 60 / 60;
		}
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
