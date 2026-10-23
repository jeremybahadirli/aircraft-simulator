import { Ajv } from 'https://cdn.jsdelivr.net/npm/ajv@8.20.0/+esm';
import type { Schema } from 'ajv';
import sharedConfigSchema from './schemas/shared-config.schema.json' with { type: 'json' };

export function validateSchema<T>(
	data: unknown,
	schema: Schema,
	errorMessage: string,
): T {
	const ajv = new Ajv();
	ajv.addKeyword('markdownDescription');
	ajv.addSchema(sharedConfigSchema);
	const validate = ajv.compile(schema);
	if (validate(data) !== true) {
		throw new Error(`${errorMessage}: ${ajv.errorsText(validate.errors)}`);
	}
	return data as T;
}
