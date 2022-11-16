import { Doc } from "fyo/model/doc";
import { FilterFunction } from "fyo/model/types";
import { QueryFilter } from "utils/db/types";

export const locationFilter: FilterFunction = (doc: Doc) => {
  const item = doc.item;
  if (!doc.item) {
    return { item: null };
  }

  return { item: ['in', [null, item]] } as QueryFilter;
};
