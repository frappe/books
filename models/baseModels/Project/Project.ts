import { Doc } from 'fyo/model/doc';

export class Project extends Doc {
  status?: 'Active' | 'Completed' | 'Cancelled';
}