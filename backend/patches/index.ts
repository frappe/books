import { Patch } from '../database/types';
import testPatch from './testPatch';
import updateSchemas from './updateSchemas';

export default [
  { name: 'testPatch', version: '0.5.0-beta.0', patch: testPatch },
  { name: 'updateSchemas', version: '0.5.0-beta.0', patch: updateSchemas },
] as Patch[];
