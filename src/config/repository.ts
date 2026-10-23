import defaultConfig from './default-config.json' with { type: 'json' };
import configSchema from './schemas/config.schema.json' with { type: 'json' };
import defaultSeparationPracticeConfig from './default-separation-practice-config.json' with { type: 'json' };
import separationPracticeConfigSchema from './schemas/separation-practice-config.schema.json' with { type: 'json' };
import sharedConfigSchema from './schemas/shared-config.schema.json' with { type: 'json' };
import { createScenario, type SimulationScenario } from './scenario.js';
import type { ConfigEditorData, ConfigEditorDocument } from './types.js';

const ACTIVE_CONFIG_STORAGE_KEY = 'aircraft-simulator.active-config';
const ACTIVE_SEPARATION_PRACTICE_CONFIG_STORAGE_KEY =
	'aircraft-simulator.active-separation-practice-config';

export class ConfigRepository {
	private readonly storage: Storage | null;
	private activeConfigData: unknown;
	private activeSeparationPracticeConfigData: unknown;

	constructor(storage: Storage | null = getBrowserStorage()) {
		this.storage = storage;
		this.activeConfigData =
			readStoredConfig(storage, ACTIVE_CONFIG_STORAGE_KEY) ?? defaultConfig;
		this.activeSeparationPracticeConfigData =
			readStoredConfig(storage, ACTIVE_SEPARATION_PRACTICE_CONFIG_STORAGE_KEY) ??
			defaultSeparationPracticeConfig;
	}

	getEditorData(): ConfigEditorData {
		return {
			configText: JSON.stringify(this.activeConfigData, null, '\t'),
			defaultConfigText: JSON.stringify(defaultConfig, null, '\t'),
			separationPracticeConfigText: JSON.stringify(
				this.activeSeparationPracticeConfigData,
				null,
				'\t',
			),
			defaultSeparationPracticeConfigText: JSON.stringify(
				defaultSeparationPracticeConfig,
				null,
				'\t',
			),
			configSchema,
			separationPracticeConfigSchema,
			sharedConfigSchema,
		};
	}

	createScenario(
		configOverride?: unknown,
		separationPracticeConfigOverride?: unknown,
	): SimulationScenario {
		return createScenario(
			configOverride === undefined
				? this.activeConfigData
				: configOverride,
			separationPracticeConfigOverride === undefined
				? this.activeSeparationPracticeConfigData
				: separationPracticeConfigOverride,
		);
	}

	commit(document: ConfigEditorDocument, configData: unknown): boolean {
		const storageKey =
			document === 'config'
				? ACTIVE_CONFIG_STORAGE_KEY
				: ACTIVE_SEPARATION_PRACTICE_CONFIG_STORAGE_KEY;
		if (document === 'config') this.activeConfigData = configData;
		else this.activeSeparationPracticeConfigData = configData;

		if (!this.storage) return false;
		try {
			this.storage.setItem(storageKey, JSON.stringify(configData));
			return true;
		} catch {
			return false;
		}
	}
}

function getBrowserStorage(): Storage | null {
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

function readStoredConfig(
	storage: Storage | null,
	storageKey: string,
): unknown | undefined {
	try {
		const storedConfig = storage?.getItem(storageKey);
		return storedConfig == null ? undefined : JSON.parse(storedConfig);
	} catch {
		return undefined;
	}
}
