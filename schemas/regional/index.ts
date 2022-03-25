import { SchemaStub } from 'schemas/types';
import IndianSchemas from './in';

/**
 * Regional Schemas are exported by country code.
 */
export default { in: IndianSchemas } as Record<string, SchemaStub[]>;
