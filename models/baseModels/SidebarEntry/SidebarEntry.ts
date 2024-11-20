import { Doc } from 'fyo/model/doc';

export class SidebarEntry extends Doc {
  section?: string;
  route?:   string;
  model?:   string;
  filters?: string;

  fullRoute() {
    switch(this.route) {
      case '/list':
        return `/list/${this.model}/${this.name}`;
      default:
        return this.route;
    }
  }

  parsedFilters() {
    return JSON.parse(this.filters)
  }
}

