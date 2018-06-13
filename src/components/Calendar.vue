<template>
  <div id="calendarFull">
    <button @click="refreshEvents">Refresh</button>
    <button v-if="selected._id" @click="removeEvent">Remove</button>
    <pre v-if="selected._id">Title: {{selected.title}}
    Start: {{selected.start}}
    End: {{selected.end}}
    Allday: {{selected.allDay}}
    ID: {{selected.id}}</pre>
    <full-calendar ref="calendar" :event-sources="eventSources" @event-selected="eventSelected" @event-created="eventCreated" :config="config"></full-calendar>
  </div>
</template>

<script>
import moment from 'moment';

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
          id: 1,
          title: 'event1',
          start: moment().hours(12).minutes(0),
        },
        {
          id: 2,
          title: 'event2',
          start: moment().add(-1, 'days'),
          end: moment().add(1, 'days'),
          allDay: true,
        },
        {
          id: 3,
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
        },
      },

      selected: {},
    };
  },

  methods: {
    refreshEvents() {
      this.$refs.calendar.$emit('refetch-events');
    },

    removeEvent() {
      this.$refs.calendar.$emit('remove-event', this.selected);
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
              callback(self.events.filter(() => Math.random() > 0.5));
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
  margin-top: 60px;
}
</style>
