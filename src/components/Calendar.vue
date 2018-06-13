<template>
  <div id="calendarFull">
    <button @click="refreshEvents">Refresh</button>
    <button v-if="selected._id" @click="removeEvent">Remove</button>
    <pre v-if="selected._id">Title: {{selected.title}}
    Start: {{selected.start}}
    End: {{selected.end}}
    Allday: {{selected.allDay}}
    ID: {{selected.id}}</pre>
    <full-calendar ref="calendar" :event-sources="eventSources" @event-drop="eventDrop" @event-resize="eventResize" @event-selected="eventSelected" @event-created="eventCreated" :config="config"></full-calendar>
  </div>
</template>

<script>
import moment from 'moment';
import frappe from "frappejs";

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
      events: [
        {
          id: "asa123",
          title: 'event1',
          start: moment().hours(12).minutes(0),
        },
        {
          id: "asad2346",
          title: 'event2',
          start: moment().add(-1, 'days'),
          end: moment().add(1, 'days'),
          allDay: true,
        },
        {
          id: "jkbhjkh15",
          title: 'event3',
          start: moment().add(2, 'days'),
          end: moment().add(2, 'days').add(6, 'hours'),
          allDay: false,
        },
      ],

      config: {
        eventClick: (event) => {
          console.log(event);
          this.selected = JSON.parse(JSON.stringify(event, getCircularReplacer()));
    //       alert(`Title: ${this.selected.title}
    // Start: ${this.selected.start}
    // End: ${this.selected.end}
    // Allday: ${this.selected.allDay}
    // ID: ${this.selected.id}`)
        },
      },

      selected: {},
    };
  },

  async created(){ 
  var temp=await frappe.db.getAll({
          doctype: "Event",
          fields: ["title", "start","end","name"]
        })
  this.events=[];
  for(var i=0;i<temp.length;i++){
    var tempx = {};
    tempx.title = temp[i].title;
    tempx.start = temp[i].start;
    tempx.end = temp[i].end;
    tempx.id = temp[i].name;
    this.events.push(tempx);
  }
  },

  methods: {
    async eventDrop(event) {
      this.selected = event;
      let events = await frappe.db.getAll({doctype:'Event', fields:['name'], filters: {name: this.selected.id}});
      let eventsx = await frappe.getDoc('Event', events[0].name);
      // console.log("xxxxxxxx",this.selected.start);
      eventsx.start = this.selected.start;
      await eventsx.update();
      this.selected = {};
    },

    async eventResize(event) {
      this.selected = event;
      let events = await frappe.db.getAll({doctype:'Event', fields:['name'], filters: {name: this.selected.id}});
      let eventsx = await frappe.getDoc('Event', events[0].name);
      // console.log("xxxxxxxx",this.selected.start);
      eventsx.start = this.selected.start;
      eventsx.end = this.selected.end;
      await eventsx.update();
      this.selected = {};
    },

    refreshEvents() {
      this.$refs.calendar.$emit('refetch-events');
    },

    async removeEvent() {
      this.$refs.calendar.$emit('remove-event', this.selected);
      let events = await frappe.db.getAll({doctype:'Event', fields:['name'], filters: {name: this.selected.id}});
      let eventsx = await frappe.getDoc('Event', events[0].name);
      await eventsx.delete();
      this.selected = {};
    },

    eventSelected(event) {
      this.selected = event;
    },

    eventCreated(...test) {
      console.log(test);
    },
  },

  computed: {
    eventSources() {
      const self = this;
      return [
        {
          events(start, end, timezone, callback) {
            setTimeout(() => {
              callback(self.events.filter(() => Math.random() > 0));
            }, 1000);
          },
        },
      ];
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
