import { SchemaStub } from 'schemas/types';
import Expense from './Expense.json';
import License from './License.json';

const customSchemas: SchemaStub[] = [
  Expense as SchemaStub,
  License as SchemaStub,
];

export default customSchemas;
