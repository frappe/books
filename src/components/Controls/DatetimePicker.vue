<template>
  <div>
    <!-- Datetime header -->
    <div class="flex justify-between items-center text-sm px-4 pt-4">
      <div class="text-blue-500">
        {{ datetimeString }}
      </div>

      <!-- Next and Previous Month Buttons -->
      <div class="flex items-center">
        <button
          class="font-mono text-gray-600 cursor-pointer"
          @click="prevClicked"
        >
          <FeatherIcon name="chevron-left" class="w-4 h-4" />
        </button>
        <button
          class="
            font-mono
            cursor-pointer
            w-2
            h-2
            rounded-full
            border-gray-400 border-2
          "
          @click="selectToday"
        />
        <button
          class="font-mono text-gray-600 cursor-pointer"
          @click="nextClicked"
        >
          <FeatherIcon name="chevron-right" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Date Input -->
    <div class="flex">
      <!-- Weekday Titles -->
      <div class="px-3 pt-4" :class="selectTime ? 'pb-4' : ''">
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="day of weekdays"
            :key="day"
            class="
              w-7
              h-7
              flex
              items-center
              justify-center
              text-xs text-gray-600
            "
          >
            {{ day }}
          </div>
        </div>

        <!-- Weekday Grid -->
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="item of weekdayList"
            :key="`${item.year}-${item.month}-${item.day}`"
            class="
              w-7
              h-7
              flex
              items-center
              justify-center
              text-xs
              rounded-full
              cursor-pointer
              hover:bg-gray-100
            "
            @click="select(item)"
            :class="getDayClass(item)"
          >
            {{ item.day }}
          </div>
        </div>
      </div>

      <!-- Month and Year Selectors -->
      <div
        v-if="selectMonthYear"
        class="border-s flex flex-col justify-between"
      >
        <!-- Month Selector -->
        <div
          class="flex flex-col gap-2 overflow-auto m-4"
          style="height: calc(248px - 79.5px - 1px - 2rem)"
        >
          <div
            v-for="(m, i) of months"
            :key="m"
            ref="monthDivs"
            class="text-xs cursor-pointer"
            :class="getMonthClass(i)"
            @click="change(i, 'month')"
          >
            {{ m }}
          </div>
        </div>

        <!-- Year Selector -->
        <div
          class="border-t w-full px-4 pt-4"
          :class="selectTime ? 'pb-4' : ''"
        >
          <label class="date-selector-label">Year</label>
          <input
            class="date-selector-input"
            type="number"
            min="1000"
            max="9999"
            @change="(e) => change(e, 'year')"
            :value="year"
          />
        </div>
      </div>
    </div>

    <!-- Time Selector -->
    <div
      v-if="selectTime"
      class="px-4 pt-4 grid gap-4 border-t"
      style="grid-template-columns: repeat(3, minmax(0, 1fr))"
    >
      <div>
        <label class="date-selector-label">Hours</label>
        <input
          class="date-selector-input"
          type="number"
          min="0"
          max="23"
          @change="(e) => change(e, 'hours')"
          :value="hours"
        />
      </div>
      <div>
        <label class="date-selector-label">Minutes</label>
        <input
          class="date-selector-input"
          type="number"
          min="0"
          max="59"
          @change="(e) => change(e, 'minutes')"
          :value="minutes"
        />
      </div>
      <div>
        <label class="date-selector-label">Seconds</label>
        <input
          class="date-selector-input"
          type="number"
          min="0"
          max="59"
          @change="(e) => change(e, 'seconds')"
          :value="seconds"
        />
      </div>
    </div>

    <!-- Footer -->
    <div class="flex p-4 w-full justify-between">
      <button
        class="text-xs text-gray-600 hover:text-gray-600"
        @click="selectMonthYear = !selectMonthYear"
      >
        {{ selectMonthYear ? t`Hide Month/Year` : t`Show Month/Year` }}
      </button>

      <button
        v-if="showClear"
        class="text-xs text-gray-600 hover:text-gray-600 ms-auto"
        @click="clearClicked"
      >
        {{ t`Clear` }}
      </button>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, nextTick, PropType } from 'vue';
import FeatherIcon from '../FeatherIcon.vue';

type WeekListItem = {
  year: number;
  month: number;
  day: number;
  weekday: number;
};

type DatetimeValues = {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  ms: number;
};

export default defineComponent({
  emits: ['update:modelValue'],
  props: {
    modelValue: { type: Date },
    selectTime: { type: Boolean, default: true },
    showClear: { type: Boolean, default: true },
    formatValue: { type: Function as PropType<(value: Date | null) => string> },
  },
  mounted() {
    this.viewMonth = this.month;
    this.viewYear = this.year;
  },
  data() {
    return {
      selectedMonth: 0,
      selectedYear: 1000,
      viewMonth: 0,
      viewYear: 1000,
      selectMonthYear: false,
    } as {
      selectedMonth: number;
      selectedYear: number;
      selectMonthYear: boolean;
      viewMonth: number;
      viewYear: number;
    };
  },
  watch: {
    async selectMonthYear(value) {
      if (!value) {
        return;
      }
      await nextTick();
      const monthDivs = this.$refs.monthDivs as HTMLDivElement[];
      if (!monthDivs?.length) {
        return;
      }
      monthDivs[this.month]?.scrollIntoView({
        block: 'center',
        inline: 'center',
      });
    },
  },
  computed: {
    today() {
      return new Date();
    },
    internalValue(): Date {
      if (this.modelValue == null) {
        return this.today;
      }
      return this.modelValue;
    },
    year() {
      // 1000 to 9999
      return this.internalValue?.getFullYear() ?? 1000;
    },
    month() {
      // 0 to 11
      return this.internalValue?.getMonth() ?? 0;
    },
    day() {
      // 1 to 31
      return this.internalValue?.getDate() ?? 1;
    },
    hours() {
      // 0 to 23
      return this.internalValue?.getHours() ?? 0;
    },
    minutes() {
      // 0 to 59
      return this.internalValue?.getMinutes() ?? 0;
    },
    seconds() {
      // 0 to 59
      return this.internalValue?.getSeconds() ?? 0;
    },
    ms() {
      // 0 to 999
      return this.internalValue?.getMilliseconds() ?? 0;
    },
    weekdayList() {
      return getWeekdayList(this.viewYear, this.viewMonth);
    },
    datetimeString() {
      if (this.formatValue) {
        return this.formatValue(this.internalValue);
      }

      const dateString = this.internalValue
        .toDateString()
        .split(' ')
        .slice(1)
        .join(' ');

      if (!this.selectTime) {
        return dateString;
      }
      const timeString = this.internalValue?.toTimeString().split(' ')[0] ?? '';

      return `${dateString} ${timeString}]`;
    },
    months() {
      return [
        this.t`January`,
        this.t`February`,
        this.t`March`,
        this.t`April`,
        this.t`May`,
        this.t`June`,
        this.t`July`,
        this.t`August`,
        this.t`September`,
        this.t`October`,
        this.t`November`,
        this.t`December`,
      ];
    },
    weekdays() {
      return [
        this.t`Su`,
        this.t`Mo`,
        this.t`Tu`,
        this.t`We`,
        this.t`Th`,
        this.t`Fr`,
        this.t`Sa`,
      ];
    },
  },
  methods: {
    getDayClass(item: WeekListItem) {
      let dclass = [];
      const today = this.today;
      const todayDay = today.getDate();
      const todayMonth = today.getMonth();
      const isToday = item.day === todayDay && item.month === todayMonth;
      const isSelected = item.day === this.day && item.month === this.month;
      if (item.month !== this.viewMonth && !isToday) {
        dclass.push('text-gray-600');
      }
      if (isSelected) {
        dclass.push('font-semibold');
      }
      if (isSelected && this.modelValue != null) {
        dclass.push('bg-gray-100', 'text-blue-500');
      } else if (isToday && !isSelected) {
        dclass.push('text-blue-500');
      }
      return dclass;
    },
    getMonthClass(item: number) {
      let dclass = [];
      if (item === this.month) {
        dclass.push('font-semibold');
      }
      if (this.modelValue != null && item === this.month) {
        dclass.push('text-blue-500');
      }
      return dclass;
    },
    change(e: number | Event, name: keyof DatetimeValues) {
      let value: number;
      if (typeof e === 'number' && name === 'month') {
        value = e;
      } else if (typeof e !== 'number') {
        value = Number((e.target as HTMLInputElement).value);
      } else {
        return;
      }

      if (Number.isNaN(value)) {
        return;
      }
      if (name === 'year' && value >= 1000 && value <= 9999) {
        return this.select({ year: value });
      }
      if (name === 'month' && value >= 0 && value <= 11) {
        return this.select({ month: value });
      }
      if (name === 'day' && value >= 1 && value <= 31) {
        return this.select({ day: value });
      }
      if (name === 'hours' && value >= 0 && value <= 23) {
        return this.select({ hours: value });
      }
      if (name === 'minutes' && value >= 0 && value <= 59) {
        return this.select({ minutes: value });
      }
      if (name === 'seconds' && value >= 0 && value <= 59) {
        return this.select({ seconds: value });
      }
      if (name === 'ms' && value >= 0 && value <= 999) {
        return this.select({ ms: value });
      }
    },
    select(values: Partial<DatetimeValues>) {
      values.year ??= this.year;
      values.month ??= this.month;
      values.day ??= this.day;
      values.hours ??= this.hours;
      values.minutes ??= this.minutes;
      values.seconds ??= this.seconds;
      values.ms ??= this.ms;

      const date = new Date(
        values.year,
        values.month,
        values.day,
        values.hours,
        values.minutes,
        values.seconds,
        values.ms
      );

      this.viewMonth = values.month;
      this.viewYear = values.year;

      this.emitChange(date);
    },
    selectToday() {
      return this.emitChange(new Date());
    },
    clearClicked() {
      this.emitChange(null);
    },
    emitChange(value: null | Date) {
      if (value == null) {
        this.viewMonth = this.today.getMonth();
        this.viewYear = this.today.getFullYear();
      } else {
        this.viewMonth = value.getMonth();
        this.viewYear = value.getFullYear();
      }

      this.$emit('update:modelValue', value);
    },
    nextClicked() {
      const d = new Date(this.viewYear, this.viewMonth + 1, 1);
      this.viewYear = d.getFullYear();
      this.viewMonth = d.getMonth();
    },
    prevClicked() {
      const d = new Date(this.viewYear, this.viewMonth - 1, 1);
      this.viewYear = d.getFullYear();
      this.viewMonth = d.getMonth();
    },
  },
  components: { FeatherIcon },
});

function getWeekdayList(startYear: number, startMonth: number): WeekListItem[] {
  /**
   * Weekday:
   *
   * S M T W T F S
   * 0 1 2 3 4 5 6
   *
   * 0: Sunday
   * 6: Saturday
   */
  let year = startYear;
  let month = startMonth;
  let day = 1;

  const weekdayList: WeekListItem[] = [];

  /**
   * Push days of the current month into weeklist
   */
  while (month === startMonth) {
    const date = new Date(year, month, day);
    if (date.getMonth() !== month) {
      break;
    }

    weekdayList.push({ year, month, day, weekday: date.getDay() });

    year = date.getFullYear();
    month = date.getMonth();
    day += 1;
  }

  /**
   * Unshift days of the previous month into weeklist
   * until the first day is Sunday
   */
  while (weekdayList[0]?.weekday !== 0) {
    const { year, month, day } = weekdayList[0] ?? {};
    if (year === undefined || month === undefined || day === undefined) {
      break;
    }

    const date = new Date(year, month, day - 1);
    weekdayList.unshift({
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      weekday: date.getDay(),
    });
  }

  /**
   * Push days of the next month into weeklist
   * until the last day is Saturday
   */
  while (weekdayList.length !== 42) {
    const { year, month, day } = weekdayList.at(-1) ?? {};
    if (year === undefined || month === undefined || day === undefined) {
      break;
    }

    const date = new Date(year, month, day + 1);
    weekdayList.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      weekday: date.getDay(),
    });
  }

  return weekdayList;
}
</script>

<style scoped>
.date-selector-label {
  @apply text-xs text-gray-600 block mb-0.5;
}

.date-selector-input {
  @apply text-sm text-gray-900 p-1 border rounded w-full;
}

input[type='number']::-webkit-inner-spin-button {
  appearance: auto;
}
</style>
