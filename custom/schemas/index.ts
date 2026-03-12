import { SchemaStub } from 'schemas/types';
import Expense from './Expense.json';
import NumberSeries from './NumberSeries.json';

const customSchemas: SchemaStub[] = [
  Expense as SchemaStub,
  NumberSeries as SchemaStub,
];

export default customSchemas;
