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
import moment,{ lang } from 'moment';
import frappe from "frappejs";
import { StringDecoder } from 'string_decoder';
const { DateTime } = require('luxon');

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
          console.log(event);
          this.selected = JSON.parse(JSON.stringify(event, getCircularReplacer()));
        },
      },

      selected: {},
    };
  },

  async created(){ 
  var allEvents=await frappe.db.getAll({
          doctype: "Event",
          fields: ["title", "startDate","startHour","startMinute","endDate","endHour","endMinute","name"]
        })
  this.events=[];
  for(var i=0;i<allEvents.length;i++){
    var event = {};

    event.title = allEvents[i].title;
    event.id = allEvents[i].name;

    var dtstart = DateTime.fromISO(allEvents[i].startDate).set({hour: parseInt(allEvents[i].startHour), minute: parseInt(allEvents[i].startMinute)});
    var dtend = DateTime.fromISO(allEvents[i].endDate).set({hour: parseInt(allEvents[i].endHour), minute: parseInt(allEvents[i].endMinute)});

    console.log(dtstart,"INPUT")
    event.start = dtstart.toISO();
    event.end = dtend.toISO();
    
    var test = DateTime.fromISO(event.start).hour;

    this.events.push(event);
    // console.log(event);
  }
  },

  methods: {
    async eventDrop(event) {
      this.selected = event;
      let allEvents = await frappe.db.getAll({doctype:'Event', fields:['name'], filters: {name: this.selected.id}});
      let currEvent = await frappe.getDoc('Event', allEvents[0].name);
      // console.log("xxxxxxxx",this.selected.start);
      this.selected = JSON.parse(JSON.stringify(event, getCircularReplacer()));
      
      var dtstart = DateTime.fromISO(String(this.selected.start));
      currEvent.startHour = String(dtstart.hour);
      currEvent.startMinute = String(dtstart.minute);
      currEvent.startDate = dtstart.toISO();


      var dtend = DateTime.fromISO(String(this.selected.end));
      currEvent.endHour = String(dtend.hour);
      currEvent.endMinute = String(dtend.minute);
      currEvent.endDate = dtend.toISO();


      await currEvent.update();
      this.selected = {};
    },

    async eventResize(event) {
      this.selected = event;
      let allEvents = await frappe.db.getAll({doctype:'Event', fields:['name'], filters: {name: this.selected.id}});
      let currEvent = await frappe.getDoc('Event', allEvents[0].name);
      // console.log("xxxxxxxx",this.selected.start);
      this.selected = JSON.parse(JSON.stringify(event, getCircularReplacer()));
      
      var dtstart = DateTime.fromISO(this.selected.start);
      currEvent.startDate = dtstart.toISO();
      currEvent.startHour = String(dtstart.hour);
      currEvent.startMinute = String(dtstart.minute);

      var dtend = DateTime.fromISO(String(this.selected.end));
      currEvent.endDate = dtend.toISO();
      currEvent.endHour = String(dtend.hour);
      currEvent.endMinute = String(dtend.minute);


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
