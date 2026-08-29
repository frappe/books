import { SchemaStub } from 'schemas/types';
import CzechSchemas from './cz';
import IndianSchemas from './in';
import SlovakSchemas from './sk';
import SwissSchemas from './ch';

/**
 * Regional Schemas are exported by country code.
 */
export default {
  ch: SwissSchemas,
  cz: CzechSchemas,
  in: IndianSchemas,
  sk: SlovakSchemas,
} as Record<string, SchemaStub[]>;
