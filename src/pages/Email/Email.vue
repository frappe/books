<template>
        <div class="frappe-list">
            <list-actions
              :doctype="doctype"
              :name="name"
              :tab="tab"
              :showDelete="checkList.length"
              @compose="newDoc"
              @update="updateList"
              @delete="deleteCheckedItems"
            />
            <ul class="list-group">
                <list-item v-for="doc of visibleList" :key="doc.name" :id="doc.name"
                    :isActive="doc.name === $route.params.name"
                    :isChecked="isChecked(doc.name)"
                    :v-bind:visibleList="visibleList"
                    :v-bind:currentPage="currentPage" 
                    @clickItem="openMail(doc.name)"
                    @checkItem="toggleCheck(doc.name)">
                    <indicator v-if="hasIndicator" :color="getIndicatorColor(doc)" />
                    <div class="list-item">
                      <div v-if="tab=='SENT'"> <b> {{ doc.toEmailAddress | truncate(50)}} </b> </div>
                      <div v-else> <b> {{ doc.fromEmailAddress | truncate(30) }} </b> </div> 
                      <div> <i> {{ doc.date | truncate(50) }} </i></div>
                      <div><i>   {{ doc.subject | truncate(50) }}</i></div>
                    </div>
                    <!-- <span class="col-2 text-truncate">{{ doc.fromEmailAddress }}</span>
                    <span class="col text-truncate">{{ doc.subject }}</span>
                    <span class="col-3">{{ doc.modified }} </span> -->
                </list-item>
            </ul>
            <div v-if="totalPages() > 0" class="pagination-wrapper">

              <f-button primary v-if="showPreviousLink()" v-on:click="updatePage(currentPage-1)"> ⇐ </f-button>
                  {{ currentPage + 1 }} of {{ totalPages() }}
              <f-button primary  v-if="showNextLink()" v-on:click="updatePage(currentPage + 1)"> ⇒ </f-button>
            </div>
        </div>
</template>
<script>
import Vue from 'vue';
import { _ } from 'frappejs/utils';
import List from 'frappejs/ui/components/List/List';
import frappe from 'frappejs';
import Form from 'frappejs/ui/components/Form/Form';
import ListItem from 'frappejs/ui/components/List/ListItem';
import ListActions from './EmailActions';
import EmailSend from './EmailSend';

export default {
  name: 'EmailList',
  props: ['doctype', 'tab', 'name'],
  components: {
    ListActions,
    ListItem
  },
  data() {
    return {
      data: [],
      checkList: [],
      activeItem: '',
      selectedId: '',
      nextId: 13,
      currentPage: 0,
      pageSize: 6,
      visibleList: []
    };
  },
  computed: {
    meta() {
      return frappe.getMeta(this.doctype);
    },
    hasIndicator() {
      return Boolean(this.meta.indicators);
    }
  },
  watch: {
    tab: async function() {
      console.log('Reached List', this.tab, this.name);
    }
  },
  async created() {
    frappe.db.on(`change:${this.doctype}`, () => {
      this.updateList(this.selectedId);
    });
    //this.$root.$emit('toggleEmailSidebar', true);
    const data = await frappe.db.getAll({
      doctype: this.doctype,
      fields: ['name', 'fromEmailAddress', 'subject', 'date'],
      orderBy: 'date'
    });
    //console.log(data);
    this.data = data;
  },
  beforeMount: function() {
    this.updateViewList();
  },
  mounted() {
    this.updateList(this.selectedId);
  },
  methods: {
    async newDoc() {
      let doc = await frappe.getNewDoc(this.doctype);
      let emailFields = frappe.getMeta('Email').fields;
      await doc.set('read', 'Seen');
      emailFields[5].hidden = true;

      doc['fromEmailAddress'] = this.selectedId;

      this.$modal.show({
        component: EmailSend,
        props: {
          doctype: doc.doctype,
          name: doc.name
        }
      });
      doc.on('afterInsert', data => {
        this.$modal.hide();
      });
    },
    async updateList(selectedId) {
      this.selectedId = selectedId;
      var filters = { toEmailAddress: this.selectedId };
      if (this.tab == 'SENT') {
        filters = { fromEmailAddress: this.selectedId, sent: '1' };
      }
      const indicatorField = this.hasIndicator
        ? this.meta.indicators.key
        : null;
      const fields = [
        'name',
        indicatorField,
        ...this.meta.keywordFields
      ].filter(Boolean);

      // console.log(filters);

      const data = await frappe.db.getAll({
        doctype: this.doctype,
        fields: ['*'],
        filters: filters,
        orderBy: 'date'
      });

      this.data = data;
      this.updateViewList();
    },
    async openMail(name) {
      this.activeItem = name;
      //this.$router.push(`/edit/${this.doctype}/${name}`);
      this.$router.push(`/view/${this.doctype}/${this.tab}/${name}`);
    },
    async deleteCheckedItems() {
      await frappe.db.deleteMany(this.doctype, this.checkList);
      this.checkList = [];
    },
    toggleCheck(name) {
      if (this.checkList.includes(name)) {
        this.checkList = this.checkList.filter(docname => docname !== name);
      } else {
        this.checkList = this.checkList.concat(name);
      }
    },
    isChecked(name) {
      return this.checkList.includes(name);
    },
    getIndicatorColor(doc) {
      return this.meta.getIndicatorColor(doc);
    },
    updatePage(pageNumber) {
      this.currentPage = pageNumber;
      this.updateViewList();
    },
    updateViewList() {
      this.visibleList = this.data.slice(
        this.currentPage * this.pageSize,
        this.currentPage * this.pageSize + this.pageSize
      );
      // no email
      if (this.visibleList.length == 0 && this.currentPage > 0) {
        this.updatePage(this.currentPage - 1);
      }
    },
    totalPages() {
      return Math.ceil(this.data.length / this.pageSize);
    },
    showPreviousLink() {
      return this.currentPage == 0 ? false : true;
    },
    showNextLink() {
      return this.currentPage == this.totalPages() - 1 ? false : true;
    }
  }
};

Vue.filter('truncate', function(text, stop, clamp) {
  return text.slice(0, stop) + (stop < text.length ? clamp || '...' : '');
});

// Vue.filter('format', function(date) {
//   date = date.split(' ');
//   return date[0] + ' ' + date[1] + ' ' + date[2] + ' ' + date[4].slice(0, 5);
// });
</script>
<style>
.list-group {
  cursor: pointer;
}
.title div {
  margin-left: 10%;
  margin-right: 10%;
  flex-direction: row;
}
.list-item {
  margin-left: 4%;
  height: 80px;
}

.pagination-wrapper {
  position: absolute;
  /*bottom: 5%;*/
  left: 40%;
}

.pagination-wrapper {
  position: absolute;
  /*bottom: 5%;*/
  left: 40%;
}
</style>