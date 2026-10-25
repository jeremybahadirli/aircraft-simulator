import defaultConfig from './default-config.json' with { type: 'json' };
import configSchema from './schemas/config.schema.json' with { type: 'json' };
import defaultSeparationPracticeConfig from './default-separation-practice-config.json' with { type: 'json' };
import separationPracticeConfigSchema from './schemas/separation-practice-config.schema.json' with { type: 'json' };
import sharedConfigSchema from './schemas/shared-config.schema.json' with { type: 'json' };
import { createScenario, type SimulationScenario } from './scenario.js';
import type {
	Config,
	ConfigEditorData,
	ConfigEditorDocument,
	SeparationPracticeConfig,
} from './types.js';
import { validateSchema } from './validation.js';

const ACTIVE_CONFIG_STORAGE_KEY = 'aircraft-simulator.active-config';
const ACTIVE_SEPARATION_PRACTICE_CONFIG_STORAGE_KEY =
	'aircraft-simulator.active-separation-practice-config';

export class ConfigRepository {
	private readonly storage: Storage | null;
	private activeConfigData: Config;
	private activeSeparationPracticeConfigData: SeparationPracticeConfig;

	constructor(storage: Storage | null = getBrowserStorage()) {
		this.storage = storage;

		const storedConfig = readStoredConfig(
			storage,
			ACTIVE_CONFIG_STORAGE_KEY,
		);
		if (storedConfig === undefined) {
			this.activeConfigData = defaultConfig as Config;
		} else {
			try {
				this.activeConfigData = validateSchema<Config>(
					storedConfig,
					configSchema,
					'Invalid config',
				);
			} catch {
				this.activeConfigData = defaultConfig as Config;
				writeStoredConfig(
					storage,
					ACTIVE_CONFIG_STORAGE_KEY,
					defaultConfig,
				);
			}
		}

		const storedSeparationPracticeConfig = readStoredConfig(
			storage,
			ACTIVE_SEPARATION_PRACTICE_CONFIG_STORAGE_KEY,
		);
		if (storedSeparationPracticeConfig === undefined) {
			this.activeSeparationPracticeConfigData =
				defaultSeparationPracticeConfig as SeparationPracticeConfig;
		} else {
			try {
				this.activeSeparationPracticeConfigData =
					validateSchema<SeparationPracticeConfig>(
						storedSeparationPracticeConfig,
						separationPracticeConfigSchema,
						'Invalid config',
					);
			} catch {
				this.activeSeparationPracticeConfigData =
					defaultSeparationPracticeConfig as SeparationPracticeConfig;
				writeStoredConfig(
					storage,
					ACTIVE_SEPARATION_PRACTICE_CONFIG_STORAGE_KEY,
					defaultSeparationPracticeConfig,
				);
			}
		}
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
		let validatedConfigData: Config | SeparationPracticeConfig;
		if (document === 'config') {
			const validatedConfig = validateSchema<Config>(
				configData,
				configSchema,
				'Invalid config',
			);
			this.activeConfigData = validatedConfig;
			validatedConfigData = validatedConfig;
		} else {
			const validatedConfig = validateSchema<SeparationPracticeConfig>(
				configData,
				separationPracticeConfigSchema,
				'Invalid separation practice config',
			);
			this.activeSeparationPracticeConfigData = validatedConfig;
			validatedConfigData = validatedConfig;
		}

		if (!this.storage) return false;
		try {
			this.storage.setItem(
				storageKey,
				JSON.stringify(validatedConfigData),
			);
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

function writeStoredConfig(
	storage: Storage | null,
	storageKey: string,
	configData: unknown,
): void {
	try {
		storage?.setItem(storageKey, JSON.stringify(configData));
	} catch {
		// The in-memory default remains usable when storage cannot be updated.
	}
}
