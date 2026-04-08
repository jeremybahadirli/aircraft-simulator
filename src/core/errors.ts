import { stageLog } from '../logging/logging.js';

export function haltWithError(msg: string): void {
	frameRate(0);
	stageLog(msg);
}
