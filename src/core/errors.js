import { stageLog } from '../logging/logging.js';

export function haltWithError(msg) {
	frameRate(0);
	stageLog(msg);
}
