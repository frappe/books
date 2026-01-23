import { SchemaStub } from 'schemas/types';
import Expense from './Expense.json';
import License from './License.json';
import User from './User.json';
import SystemUser from './SystemUser.json';

const customSchemas: SchemaStub[] = [
  Expense as SchemaStub,
  License as SchemaStub,
  User as SchemaStub,
  SystemUser as SchemaStub,
];

export default customSchemas;
