import Store from 'electron-store';
import type { ConfigMap } from 'fyo/core/types';

const config = new Store<ConfigMap>();
export default config;
