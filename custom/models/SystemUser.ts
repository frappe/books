import { Doc } from 'fyo/model/doc';

export class SystemUser extends Doc {
  current_user?: string;
  current_role?: string;
  current_organization?: string;
  session_token?: string;
}
