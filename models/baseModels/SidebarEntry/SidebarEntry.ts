import { Doc } from 'fyo/model/doc';
import type { QueryFilter } from 'utils/db/types';

export class SidebarEntry extends Doc {
  section?: string;
  route?: string;
  model?: string;
  filters?: string;

  fullRoute(): string {
    switch (this.route) {
      case '/list':
        return `/list/${this.model!}/${this.name!}`;
      default:
        return this.route!;
    }
  }

  parsedFilters(): QueryFilter {
    return JSON.parse(this.filters!) as QueryFilter;
  }
}
