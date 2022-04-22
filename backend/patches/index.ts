import { Patch } from '../database/types';
import testPatch from './testPatch';

export default [
  { name: 'testPatch', version: '0.5.0-beta.0', patch: testPatch },
] as Patch[];
