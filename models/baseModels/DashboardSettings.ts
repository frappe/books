import { Doc } from 'fyo/model/doc';

export class DashboardSettings extends Doc {
  widgetLayout?: string;
  activeProfile?: string;
}
