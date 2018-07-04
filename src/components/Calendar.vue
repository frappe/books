<template>
  <div id="calendarFull">
    <button @click="refreshEvents">Refresh</button>
    <button v-if="selected._id" @click="removeEvent">Remove</button>
    <pre v-if="selected._id">Title: {{selected.title}}
    Start: {{selected.start}}
    End: {{selected.end}}
    Allday: {{selected.allDay}}
    ID: {{selected.id}}</pre>
    <full-calendar ref="calendar" :events="events" @event-drop="eventDrop" @event-resize="eventResize" @event-selected="eventSelected" @event-created="eventCreated" :config="config"></full-calendar>
  </div>
</template>

<script>
import frappe from "frappejs";
import Vue from 'vue'
import FullCalendar from 'vue-full-calendar';
const { DateTime } = require('luxon');
Vue.use(FullCalendar);

const getCircularReplacer = () => {
  const seen = new WeakSet;
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

export default {
  name: 'calendarFull',
  data() {
    return {
      events: [],

      config: {
        eventClick: (event) => {
          this.selected = JSON.parse(JSON.stringify(event, getCircularReplacer()));
        },
      },

      selected: {},
    };
  },

  async created(){ 
  var allEvents=await frappe.db.getAll({
          doctype: "Event",
          fields: ["title", "startDate","startTime","endDate","endTime","name"]
        })
  this.events=[];
  for(var i=0;i<allEvents.length;i++){
    var event = {};

    event.title = allEvents[i].title;
    event.id = allEvents[i].name;

    event.start = DateTime.fromISO(allEvents[i].startDate+"T"+allEvents[i].startTime).toISO()
    event.end = DateTime.fromISO(allEvents[i].endDate+"T"+allEvents[i].endTime).toISO()

    this.events.push(event);

  }
  },

  methods: {
    async eventDrop(event) {
      this.selected = event;
      let allEvents = await frappe.db.getAll({doctype:'Event', fields:['name'], filters: {name: this.selected.id}});
      let currEvent = await frappe.getDoc('Event', allEvents[0].name);

      this.selected = JSON.parse(JSON.stringify(event, getCircularReplacer()));
      
      var dtstart = (event.start).format("YYYY-MM-DD HH:mm").split(" ")
      currEvent.startTime = dtstart[1];
      currEvent.startDate = dtstart[0];


      var dtend = (event.end).format("YYYY-MM-DD HH:mm").split(" ")
      currEvent.endTime = dtend[1];
      currEvent.endDate = dtend[0];


      await currEvent.update();
      this.selected = {};
    },

    async eventResize(event) {
      this.selected = event;
      let allEvents = await frappe.db.getAll({doctype:'Event', fields:['name'], filters: {name: this.selected.id}});
      let currEvent = await frappe.getDoc('Event', allEvents[0].name);

      this.selected = JSON.parse(JSON.stringify(event, getCircularReplacer()));
      
      var dtstart = (event.start).format("YYYY-MM-DD HH:mm").split(" ")
      currEvent.startTime = dtstart[1];
      currEvent.startDate = dtstart[0];


      var dtend = (event.end).format("YYYY-MM-DD HH:mm").split(" ")
      currEvent.endTime = dtend[1];
      currEvent.endDate = dtend[0];


      await currEvent.update();
      this.selected = {};
    },

    refreshEvents() {
      this.$refs.calendar.$emit('refetch-events');
    },

    async removeEvent() {
      this.$refs.calendar.$emit('remove-event', this.selected);
      let allEvents = await frappe.db.getAll({doctype:'Event', fields:['name'], filters: {name: this.selected.id}});
      let currEvent = await frappe.getDoc('Event', allEvents[0].name);
      await currEvent.delete();
      this.selected = {};
    },

    eventSelected(event) {
      this.selected = event;
    },

    eventCreated(...test) {
      console.log(test);
    },
  },
};
</script>

<style>
@import 'fullcalendar/dist/fullcalendar.css';
#calendarFull {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* margin-top: 60px; */
}
</style>
