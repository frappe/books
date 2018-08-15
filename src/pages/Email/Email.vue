<template>
        <div class="frappe-list">
            <list-actions
              :doctype="doctype"
              :name="name"
              :showDelete="checkList.length"
              @compose="newDoc"
              @update="updateList"
              @delete="deleteCheckedItems"
            />
            <br>
            <ul class="row title">
                <span class="col-2 ">From</span>
                <!-- <div > To</div> -->
                <span class="col">Subject </span>
                <span class="col-3">Date </span>
            </ul>
            <ul class="list-group">
                <list-item v-for="doc of data" :key="doc.name" :id="doc.name"
                    :isActive="doc.name === $route.params.name"
                    :isChecked="isChecked(doc.name)"
                    @clickItem="openMail(doc.name)"
                    @checkItem="toggleCheck(doc.name)">
                    <span class="col-2 text-truncate">{{ doc.fromEmailAddress }}</span>
                    <span class="col text-truncate">{{ doc.subject }}</span>
                    <span class="col-3">{{ doc.modified }} </span>
                </list-item>
            </ul>
        </div>
</template>
<script>
import { _ } from 'frappejs/utils';
import List from 'frappejs/ui/components/List/List';
import frappe from 'frappejs';
import Form from 'frappejs/ui/components/Form/Form';
import ListItem from 'frappejs/ui/components/List/ListItem';
import ListActions from './EmailActions';
import EmailSend from './EmailSend';

export default {
  name: 'EmailList',
  props: ['doctype', 'name'],
  components: {
    ListActions,
    ListItem
  },
  data() {
    return {
      data: [],
      checkList: [],
      activeItem: ''
    };
  },
  computed: {
    meta() {
      return frappe.getMeta(this.doctype);
    }
  },
  async created() {
    frappe.db.on(`change:${this.doctype}`, () => {
      this.updateList();
    });
    //this.$root.$emit('toggleEmailSidebar', true);
    const data = await frappe.db.getAll({
      doctype: this.doctype,
      fields: ['name', 'fromEmailAddress', 'subject', 'modified']
    });
    this.data = data;
  },
  mounted() {
    this.updateList();
  },
  methods: {
    async newDoc() {
      let doc = await frappe.getNewDoc(this.doctype);
      //   let emailFields = frappe.getMeta('Email').fields;
      //   for (let i = 0; i < emailFields.length; i++) {
      //     emailFields[i].disabled = false;
      //   }
      this.$modal.show({
        component: EmailSend,
        props: {
          doctype: doc.doctype,
          name: doc.name
        }
      });
      console.log('Err Fix : dump db');
      // unable to dump on DB [ check delete + hit refresh / sync ]
      doc.on('afterInsert', data => {
        this.$modal.hide();
      });
    },
    async updateList(selectedId) {
      const fields = [
        'name',
      ].filter(Boolean);

      const data = await frappe.db.getAll({
        doctype: this.doctype,
        fields: ['*'],
        filters: { toEmailAddress: selectedId },
        orderBy: 'date'
      });
      console.log(data);
      this.data = data;
    },
    async openMail(name) {
      //   this.activeItem = name;
      //   const data = await frappe.db.getAll({
      //     doctype: this.doctype,
      //     fields: ['*'],
      //     filters: { name: this.activeItem }
      //   });
      //   let emailFields = frappe.getMeta('Email').fields;
      //   emailFields[5].hidden = false;
      //   for (let i = 0; i < emailFields.length; i++) {
      //     emailFields[i].disabled = true;
      //   }
      //   // EMAIL DATE DISABLED DOESN't Work
      //   emailFields[1].hidden = true;
      //   emailFields[3].hidden = true;
      //   emailFields[4].hidden = true;
      this.activeItem = name;
      this.$router.push(`/view/${this.doctype}/${name}`);
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
  }
};
</script>
<style>
.list-group {
  cursor: pointer;
}
.title div {
  margin-left: 10%;
  margin-right: 10%;
  display: flex;
  flex-direction: row;
}
</style>