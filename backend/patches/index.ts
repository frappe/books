import { Patch } from '../database/types';
import addUOMs from './addUOMs';
import testPatch from './testPatch';
import updateSchemas from './updateSchemas';

export default [
  { name: 'testPatch', version: '0.5.0-beta.0', patch: testPatch },
  {
    name: 'updateSchemas',
    version: '0.5.0-beta.0',
    patch: updateSchemas,
    priority: 100,
  },
  {
    name: 'addUOMs',
    version: '0.6.0-beta.0',
    patch: addUOMs,
  },
] as Patch[];
