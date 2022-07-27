<template>
  <Popover @open="selectCurrentMonthYear">
    <template #target="{ togglePopover, handleBlur }">
      <input
        type="text"
        :class="inputClass"
        :value="value && formatValue ? formatValue(value) : value || ''"
        :placeholder="placeholder"
        readonly
        @focus="!readonly ? togglePopover() : null"
        @blur="handleBlur"
      />
    </template>
    <template #content="{ togglePopover }">
      <div class="text-left p-3 select-none">
        <div class="flex items-center justify-between">
          <span class="font-medium text-blue-500 text-base">
            {{ formatMonth }}
          </span>
          <span class="flex">
            <div
              class="
                w-5
                h-5
                hover:bg-gray-100
                rounded-md
                flex-center
                cursor-pointer
              "
            >
              <feather-icon
                @click="prevMonth"
                name="chevron-left"
                class="w-4 h-4"
              />
            </div>
            <div
              class="
                ml-2
                w-5
                h-5
                hover:bg-gray-100
                rounded-md
                flex-center
                cursor-pointer
              "
            >
              <feather-icon
                @click="nextMonth"
                name="chevron-right"
                class="w-4 h-4"
              />
            </div>
          </span>
        </div>
        <div class="mt-2 text-sm">
          <div class="flex w-full text-gray-600">
            <div
              class="w-6 h-6 mr-1 last:mr-0 flex-center text-center"
              v-for="(d, i) in ['S', 'M', 'T', 'W', 'T', 'F', 'S']"
              :key="i"
            >
              {{ d }}
            </div>
          </div>
          <div v-for="(week, i) in datesAsWeeks" :key="`${i}-${Math.random().toString(36)}`" class="mt-1">
            <div class="flex w-full">
              <div
                v-for="date in week"
                :key="`${toValue(date)}-${Math.random().toString(36)}`"
                class="
                  w-6
                  h-6
                  mr-1
                  last:mr-0
                  flex-center
                  cursor-pointer
                  rounded-md
                  hover:bg-blue-100 hover:text-blue-500
                "
                :class="{
                  'text-gray-600': date.getMonth() !== currentMonth - 1,
                  'text-blue-500': toValue(date) === toValue(today),
                  'bg-blue-100 font-semibold text-blue-500':
                    toValue(date) === value,
                }"
                @click="
                  selectDate(date);
                  togglePopover();
                "
              >
                {{ date.getDate() }}
              </div>
            </div>
          </div>
        </div>
        <div class="w-full flex justify-end mt-2">
          <div
            class="
              text-sm
              hover:bg-gray-100
              px-2
              py-1
              rounded-md
              cursor-pointer
            "
            @click="
              selectDate('');
              togglePopover();
            "
          >
            {{ t`Clear` }}
          </div>
        </div>
      </div>
    </template>
  </Popover>
</template>

<script>
import { DateTime } from 'luxon';
import Popover from '../Popover';

export default {
  name: 'DatePicker',
  props: ['value', 'placeholder', 'readonly', 'formatValue', 'inputClass'],
  emits: ['change'],
  components: {
    Popover,
  },
  data() {
    return {
      currentYear: null,
      currentMonth: null,
    };
  },
  created() {
    this.selectCurrentMonthYear();
  },
  computed: {
    today() {
      return this.getDate();
    },
    datesAsWeeks() {
      let datesAsWeeks = [];
      let dates = this.dates.slice();
      while (dates.length) {
        let week = dates.splice(0, 7);
        datesAsWeeks.push(week);
      }
      return datesAsWeeks;
    },
    dates() {
      if (!(this.currentYear && this.currentMonth)) {
        return [];
      }
      let monthIndex = this.currentMonth - 1;
      let year = this.currentYear;

      let firstDayOfMonth = this.getDate(year, monthIndex, 1);
      let lastDayOfMonth = this.getDate(year, monthIndex + 1, 0);
      let leftPaddingCount = firstDayOfMonth.getDay();
      let rightPaddingCount = 6 - lastDayOfMonth.getDay();

      let leftPadding = this.getDatesAfter(firstDayOfMonth, -leftPaddingCount);
      let rightPadding = this.getDatesAfter(lastDayOfMonth, rightPaddingCount);
      let daysInMonth = this.getDaysInMonth(monthIndex, year);
      let datesInMonth = this.getDatesAfter(firstDayOfMonth, daysInMonth - 1);

      let dates = [
        ...leftPadding,
        firstDayOfMonth,
        ...datesInMonth,
        ...rightPadding,
      ];
      if (dates.length < 42) {
        const finalPadding = this.getDatesAfter(
          dates.at(-1),
          42 - dates.length
        );
        dates = dates.concat(...finalPadding);
      }
      return dates;
    },
    formatMonth() {
      let date = this.getDate(this.currentYear, this.currentMonth - 1, 1);
      return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    },
  },
  methods: {
    selectDate(date) {
      this.$emit('change', this.toValue(date));
    },
    selectCurrentMonthYear() {
      let date = this.value ? this.getDate(this.value) : this.getDate();
      this.currentYear = date.getFullYear();
      this.currentMonth = date.getMonth() + 1;
    },
    prevMonth() {
      this.changeMonth(-1);
    },
    nextMonth() {
      this.changeMonth(1);
    },
    changeMonth(adder) {
      this.currentMonth = this.currentMonth + adder;
      if (this.currentMonth < 1) {
        this.currentMonth = 12;
        this.currentYear = this.currentYear - 1;
      }
      if (this.currentMonth > 12) {
        this.currentMonth = 1;
        this.currentYear = this.currentYear + 1;
      }
    },
    getDatesAfter(date, count) {
      let incrementer = 1;
      if (count < 0) {
        incrementer = -1;
        count = Math.abs(count);
      }
      let dates = [];
      while (count) {
        date = this.getDate(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + incrementer
        );
        dates.push(date);
        count--;
      }
      if (incrementer === -1) {
        return dates.reverse();
      }
      return dates;
    },

    getDaysInMonth(monthIndex, year) {
      let daysInMonthMap = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      let daysInMonth = daysInMonthMap[monthIndex];
      if (monthIndex === 1 && this.isLeapYear(year)) {
        return 29;
      }
      return daysInMonth;
    },

    isLeapYear(year) {
      if (year % 400 === 0) return true;
      if (year % 100 === 0) return false;
      if (year % 4 === 0) return true;
      return false;
    },

    toValue(date) {
      if (!date) {
        return '';
      }

      return DateTime.fromJSDate(date).toISODate()
    },

    getDate(...args) {
      let d = new Date(...args);
      return d;
    },
  },
};
</script>
