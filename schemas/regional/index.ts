import { SchemaStub } from 'schemas/types';
import IndianSchemas from './in';
import SwissSchemas from './ch';
// EE: Estonian regional schemas (native regional pattern)
import EstonianSchemas from './ee';

/**
 * Regional Schemas are exported by country code.
 */
export default {
  in: IndianSchemas,
  ch: SwissSchemas,
  ee: EstonianSchemas, // EE
} as Record<string, SchemaStub[]>;
