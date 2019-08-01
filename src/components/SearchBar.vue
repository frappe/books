<template>
  <div>
    <div class="input-group">
      <div class="input-group-prepend">
        <span class="input-group-text pt-0">
          <feather-icon name="search" style="color: #212529 !important;"></feather-icon>
        </span>
      </div>
      <input
        type="search"
        class="form-control"
        placeholder="Search..."
        autocomplete="off"
        spellcheck="false"
        v-model="inputValue"
        @keyup.enter="search"
        aria-label="Recipient's username"
      />
    </div>
    <div v-if="inputValue" class="suggestion-list position-absolute shadow-sm" style="width: 100%">
      <list-row
        v-for="doc in suggestion"
        :key="doc.name"
        :class="doc.sep ? 'seperator': ''"
        class="d-flex align-items-center"
        @click.native="routeTo(doc.route)"
      >
        <span v-if="!doc.sep">
          <feather-icon class="mr-1" name="minus" />
        </span>
        <div :class="doc.sep ? 'small' : ''">{{ doc.name }}</div>
        <div class="small ml-auto">{{ doc.doctype }}</div>
      </list-row>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import ListRow from '../pages/ListView/ListRow';
import ListCell from '../pages/ListView/ListCell';

export default {
  data() {
    return {
      inputValue: '',
      suggestion: []
    };
  },
  components: {
    ListRow,
    ListCell
  },
  watch: {
    inputValue() {
      if (!this.inputValue.length) this.suggestion = [];
    }
  },
  methods: {
    async search() {
      const searchableDoctypes = frappe.getDoctypeList({
        isSingle: 0,
        isChild: 0
      });
      const documents = await this.getSearchedDocuments(searchableDoctypes);
      const doctypes = await this.getSearchedDoctypes(searchableDoctypes);
      this.suggestion = documents.concat(doctypes);
      if (this.suggestion.length === 0)
        this.suggestion = [{ sep: true, name: 'No results found.' }];
    },
    clearInput() {
      this.inputValue = '';
      this.$emit('change', null);
    },
    async getSearchedDocuments(searchableDoctypes) {
      const promises = searchableDoctypes.map(doctype => {
        return frappe.db.getAll({
          doctype,
          filters: { name: ['includes', this.inputValue] },
          fields: ['name']
        });
      });
      const data = await Promise.all(promises);
      // data contains list of documents, sorted according to position of its doctype in searchableDoctypes
      const items = [];
      items.push({
        sep: true,
        name: 'Documents'
      });
      for (let i = 0; i < data.length; i++) {
        // i represents doctype position in searchableDoctypes
        if (data[i].length > 0) {
          for (let doc of data[i]) {
            let doctype = searchableDoctypes[i];
            items.push({
              doctype,
              name: doc.name,
              route: `/edit/${doctype}/${doc.name}`
            });
          }
        }
      }
      if (items.length !== 1) return items;
      return [];
    },
    getSearchedDoctypes(searchableDoctypes) {
      const items = [{ sep: true, name: 'DocTypes' }];
      let filteredDoctypes = searchableDoctypes.filter(doctype => {
        return doctype.indexOf(this.inputValue) != -1;
      });
      filteredDoctypes = filteredDoctypes.map(doctype => {
        return {
          name: doctype,
          route: `/list/${doctype}`
        };
      });
      if (filteredDoctypes.length > 0) return items.concat(filteredDoctypes);
      return [];
    },
    routeTo(route) {
      this.$router.push(route);
      this.inputValue = '';
    }
  }
};
</script>

<style lang="scss" scoped>
@import '../styles/variables';
.input-group-text {
  background-color: var(--white);
  border-right: none;
}
.seperator {
  background-color: var(--light);
}

input {
  border-left: none;
  height: 27px;
}

input:focus {
  border: 1px solid #ced4da;
  border-left: none;
  outline: none !important;
  box-shadow: none !important;
}
.suggestion-list {
  z-index: 2;
}
</style>

