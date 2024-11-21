<style scoped>
.dropdown1 :deep(button) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.dropdown2 :deep(button),
.btn-left :deep(button),
.date-start :deep(.rounded),
.date-stop :deep(.rounded) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.btn-right :deep(button) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.date-start,
.date-stop {
  width: 8rem;
}
.date-start :deep(input + div),
.date-stop :deep(input + div),
.date-start :deep(input),
.date-stop :deep(input) {
  height: 2rem;
  --tw-text-opacity: 1;
  color: rgba(82, 82, 82, var(--tw-text-opacity));
  --tw-bg-opacity: 1;
  background-color: rgba(237, 237, 237, var(--tw-bg-opacity));
}
</style>
<template>
  <div style="display: flex" class="flex">
    <div class="dropdown1">
      <Dropdown
        ref="dropdownPeriod"
        class="text-sm"
        :items="periodOptions"
        right
      >
        <template
          #default="{
            toggleDropdown,
            highlightItemUp,
            highlightItemDown,
            selectHighlightedItem,
          }"
        >
          <Button
            icon
            @click="toggleDropdown()"
            @keydown.down="highlightItemDown"
            @keydown.up="highlightItemUp"
            @keydown.enter="selectHighlightedItem"
          >
            {{ periodSelectorMap?.[value] ?? value }}
            <feather-icon name="chevron-down" class="ms-1 w-3 h-3" />
          </Button>
        </template>
      </Dropdown>
    </div>
    <div
      class="dropdown2"
      :value="value"
      :class="{
        hidden: value == 'custom',
      }"
    >
      <Dropdown
        ref="dropdownAnchor"
        class="text-sm"
        :items="anchorOptions"
        right
      >
        <template
          #default="{
            toggleDropdown,
            highlightItemUp,
            highlightItemDown,
            selectHighlightedItem,
          }"
        >
          <Button
            icon
            @click="toggleDropdown()"
            @keydown.down="highlightItemDown"
            @keydown.up="highlightItemUp"
            @keydown.enter="selectHighlightedItem"
          >
            {{ anchorSelectorMap?.[anchorValue] ?? anchorValue }}
            <feather-icon name="chevron-down" class="ms-1 w-3 h-3" />
          </Button>
        </template>
      </Dropdown>
    </div>
    <div class="btn-left">
      <Button icon @click="prev"
        ><feather-icon name="chevron-left" class="ms-1 w-3 h-3"
      /></Button>
    </div>
    <div class="date-start">
      <DateComp
        :df="startDateField"
        :value="startDate.toISODate()"
        @change="changeStartDate"
      ></DateComp>
    </div>
    <div class="date-stop">
      <DateComp
        :df="stopDateField"
        :value="stopDate.minus({ days: 1 }).toISODate()"
        @change="changeStopDate"
      ></DateComp>
    </div>
    <div class="btn-right">
      <Button icon @click="next"
        ><feather-icon name="chevron-right" class="ms-1 w-3 h-3"
      /></Button>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { fyo } from 'src/initFyo';
import { DateTime } from 'luxon';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import Dropdown from 'src/components/Dropdown.vue';
import DateComp from 'src/components/Controls/Date.vue';
import { PeriodKey } from 'src/utils/types';
import { PropType } from 'vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'DatePeriod',
  components: {
    Dropdown,
    Button,
    DateComp,
  },
  props: {},
  emits: ['change'],
  data() {
    return {
      value: 'M',
      anchorValue: 'civil',
      periodSelectorMap: {} as Record<PeriodKey | '', string>,
      anchorSelectorMap: {} as Record<PeriodKey | '', string>,
      anchorOptions: [],
      periodOptions: [] as { label: string; action: () => void }[],
      startDateField: {
        name: 'startDate',
        label: '',
      },
      stopDateField: {
        name: 'stopDate',
        label: '',
      },
      startDate: this.startDate || DateTime.now().startOf('day'),
      stopDate: this.stopDate || DateTime.now().startOf('day'),
    };
  },
  mounted() {
    this.anchorSelectorMap = {
      civil: t`Civil`,
      fiscal: t`Fiscal`,
      to_date: t`To Date`,
      custom: t`Custom`,
    };

    this.anchorOptions = Object.keys(this.anchorSelectorMap)
      .map((option) => {
        if (option == 'custom') return null;

        let label = this.anchorSelectorMap[option] ?? option;

        return {
          label,
          action: () => this.selectAnchor(option),
        };
      })
      .filter((x) => x);

    this.periodSelectorMap = {
      Y: t`Year`,
      S: t`Semester`,
      Q: t`Quarter`,
      M: t`Month`,
      custom: t`Custom`,
    };

    this.periodOptions = Object.keys(this.periodSelectorMap).map((option) => {
      let label = this.periodSelectorMap[option] ?? option;

      return {
        label,
        action: () => this.selectOption(option),
      };
    });

    this.selectAnchor(this.anchorValue);
  },
  methods: {
    async selectAnchor(value: PeriodKey) {
      this.anchorValue = value;

      if (this.value == 'custom') return;

      if (this.anchorValue == 'to_date') {
        this.stopDate = DateTime.now().startOf('day').plus({ days: 1 });
        this.startDate = this.stopDate.minus(this.period(this.value, 1));
      } else if (this.anchorValue == 'civil') {
        this.startDate = DateTime.now().startOf('day');
        switch (this.value) {
          case 'Y':
            this.startDate = this.startDate.startOf('year');
            break;
          case 'S':
            this.startDate = this.startDate.startOf('month').set({
              month: this.startDate.month < 7 ? 1 : 7,
            });
            break;
          case 'Q':
            this.startDate = this.startDate.startOf('quarter');
            break;
          case 'M':
            this.startDate = this.startDate.startOf('month');
            break;
        }
        this.stopDate = this.startDate.plus(this.period(this.value, 1));
      } else if (this.anchorValue == 'fiscal') {
        const fys = DateTime.fromJSDate(
          await fyo.getValue(
            ModelNameEnum.AccountingSettings,
            'fiscalYearStart'
          )
        );
        const fye = DateTime.fromJSDate(
          await fyo.getValue(ModelNameEnum.AccountingSettings, 'fiscalYearEnd')
        );
        const duration = fye
          .plus({ days: 1 })
          .diff(fys, ['years', 'months', 'days']);

        const today = DateTime.now().startOf('day');
        this.startDate = DateTime.now().startOf('day').set({
          month: fys.month,
          day: fys.day,
        });

        if (this.startDate.toJSDate() > today.toJSDate()) {
          this.startDate = this.startDate.minus({ years: 1 });
        }

        for (
          let i = 12;
          i > 0 &&
          this.startDate.plus(this.period(this.value, 1)).toJSDate() <
            today.toJSDate();
          i--
        ) {
          this.startDate = this.startDate.plus(this.period(this.value, 1));
        }

        this.stopDate = this.startDate.plus(
          this.value == 'Y' ? duration : this.period(this.value, 1)
        );
      }

      this.emitChanged();
      (
        this.$refs.dropdownAnchor as InstanceType<typeof Dropdown>
      ).toggleDropdown(false);
    },
    selectOption(value: PeriodKey) {
      this.value = value;
      if (this.value != 'custom') {
        this.stopDate = this.startDate.plus(this.period(this.value, 1));
        this.selectAnchor(this.anchorValue);
      } else {
        this.emitChanged();
      }

      (
        this.$refs.dropdownPeriod as InstanceType<typeof Dropdown>
      ).toggleDropdown(false);
    },
    changeStartDate(d) {
      this.startDate = DateTime.fromJSDate(d);
      this.anchorValue = 'custom';
      if (this.value != 'custom') {
        this.stopDate = this.startDate.plus(this.period(this.value, 1));
      }
      this.emitChanged();
    },
    changeStopDate(d) {
      this.stopDate = DateTime.fromJSDate(d).plus({ days: 1 });
      this.anchorValue = 'custom';
      if (this.value != 'custom') {
        this.startDate = this.stopDate.minus(this.period(this.value, 1));
      }
      this.emitChanged();
    },
    emitChanged() {
      console.log('emit change');
      this.$emit('change', {
        start: this.startDate,
        stop: this.stopDate,
        last: this.stopDate.minus({ day: 1 }),
      });
    },
    prev() {
      if (this.value != 'custom') {
        this.startDate = this.startDate.minus(this.period(this.value, 1));
        this.stopDate = this.stopDate.minus(this.period(this.value, 1));
      } else {
        let interval = this.interval();
        this.stopDate = this.startDate;
        this.startDate = this.stopDate.minus(interval);
      }
      this.emitChanged();
    },
    next() {
      if (this.value != 'custom') {
        this.startDate = this.startDate.plus(this.period(this.value, 1));
        this.stopDate = this.stopDate.plus(this.period(this.value, 1));
      } else {
        let interval = this.interval();
        this.startDate = this.stopDate;
        this.stopDate = this.startDate.plus(interval);
      }
      this.emitChanged();
    },
    period(val, n) {
      switch (val) {
        case 'Y':
          return { years: n };
        case 'S':
          return { months: n * 6 };
        case 'Q':
          return { months: n * 3 };
        case 'M':
          return { months: n };
      }
    },
    interval() {
      return this.stopDate.diff(this.startDate, ['years', 'months', 'days']);
    },
  },
});
</script>
