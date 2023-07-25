import type { Fyo } from 'fyo';

export default function initialize(fyo: Fyo) {
  const models = getModels(fyo);
  fyo.doc.registerModels(models);
}

function getModels(fyo: Fyo) {
  class PluginTemplate extends fyo.Doc {
    name?: string;
    value?: string;

    get isPluginTemplate() {
      return true;
    }
  }

  return { PluginTemplate };
}
