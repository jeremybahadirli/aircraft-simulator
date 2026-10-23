import type { Schema } from 'ajv';

export type ConfigEditorDocument = 'config' | 'separation-practice';

export interface ConfigEditorData {
	configText: string;
	defaultConfigText: string;
	separationPracticeConfigText: string;
	defaultSeparationPracticeConfigText: string;
	configSchema: Schema;
	separationPracticeConfigSchema: Schema;
	sharedConfigSchema: Schema;
}
