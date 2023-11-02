import { SchemaStub } from 'schemas/types';
import IndianSchemas from './in';
import SwissSchemas from './ch';

/**
 * Regional Schemas are exported by country code.
 */
export default { in: IndianSchemas, ch: SwissSchemas } as Record<
  string,
  SchemaStub[]
>;
