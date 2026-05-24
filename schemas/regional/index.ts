import { SchemaStub } from 'schemas/types';
import IndianSchemas from './in';
import SwissSchemas from './ch';
import EstonianSchemas from './ee';

/**
 * Regional Schemas are exported by country code.
 */
export default {
  in: IndianSchemas,
  ch: SwissSchemas,
  ee: EstonianSchemas,
} as Record<string, SchemaStub[]>;
