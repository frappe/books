import { SchemaStub } from 'schemas/types';
import Expense from './Expense.json';
import User from './User.json';
import SystemUser from './SystemUser.json';
import NumberSeries from './NumberSeries.json';

const customSchemas: SchemaStub[] = [
  Expense as SchemaStub,
  User as SchemaStub,
  SystemUser as SchemaStub,
  NumberSeries as SchemaStub,
];

export default customSchemas;
