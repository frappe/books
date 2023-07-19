import { Doc } from 'fyo/model/doc';

export class PluginTemplate extends Doc {
  name?: string;
  value?: string;

  get isPluginTemplate() {
    return true;
  }
}
