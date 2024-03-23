<template>
  <div>
    <svg
      version="1.1"
      viewBox="0 0 100 100"
      @mouseleave="$emit('change', null)"
    >
      <defs>
        <clipPath id="donut-hole">
          <circle
            :cx="cx"
            :cy="cy"
            :r="radius + thickness / 2"
            fill="black"
            stroke-width="0"
          />
        </clipPath>
      </defs>
      <circle
        v-if="thetasAndStarts.length === 1 || thetasAndStarts.length === 0"
        clip-path="url(#donut-hole)"
        :cx="cx"
        :cy="cy"
        :r="radius"
        :stroke-width="
          thickness +
          (hasNonZeroValues && active === thetasAndStarts[0][0] ? 4 : 0)
        "
        :stroke="
          hasNonZeroValues ? sectors[thetasAndStarts[0][0]].color : '#f4f4f6'
        "
        :class="hasNonZeroValues ? 'sector' : ''"
        :style="{ transformOrigin: `${cx}px ${cy}px` }"
        fill="transparent"
        @mouseover="
          $emit(
            'change',
            thetasAndStarts.length === 1 ? thetasAndStarts[0][0] : null
          )
        "
      />
      <template v-if="thetasAndStarts.length > 1">
        <path
          v-for="[i, theta, start_] in thetasAndStarts"
          :key="i"
          clip-path="url(#donut-hole)"
          :d="getArcPath(cx, cy, radius, start_, theta)"
          :stroke="getSectorColor(i)"
          :stroke-width="thickness + (active === i ? 4 : 0)"
          :style="{ transformOrigin: `${cx}px ${cy}px` }"
          class="sector"
          fill="transparent"
          @mouseover="$emit('change', i)"
        />
      </template>
      <text
        :x="cx"
        :y="cy"
        text-anchor="middle"
        :style="{
          fontSize: '6px',
          fontWeight: 'bold',
          fill: darkMode ? '#FFFFFF' : '#415668',
        }"
      >
        {{
          valueFormatter(
            active !== null && sectors.length !== 0
              ? sectors[active].value
              : totalValue,
            'Currency'
          )
        }}
      </text>
      <text
        :x="cx"
        :y="cy + 8"
        text-anchor="middle"
        style="font-size: 5px; fill: #a1abb4"
      >
        {{
          active !== null && sectors.length !== 0
            ? sectors[active].label
            : totalLabel
        }}
      </text>
    </svg>
  </div>
</template>

<script>
export default {
  props: {
    sectors: {
      default: () => [],
      type: Array,
    },
    totalLabel: { default: 'Total', type: String },
    radius: { default: 36, type: Number },
    startAngle: { default: Math.PI, type: Number },
    thickness: { default: 10, type: Number },
    active: { default: null, type: Number },
    valueFormatter: { default: (v) => v.toString(), Function },
    offsetX: { default: 0, type: Number },
    offsetY: { default: 0, type: Number },
    textOffsetX: { default: 0, type: Number },
    textOffsetY: { default: 0, type: Number },
    darkMode: Boolean,
  },
  emits: ['change'],
  computed: {
    cx() {
      return 50 + this.offsetX;
    },
    cy() {
      return 50 + this.offsetY;
    },
    totalValue() {
      return this.sectors.map(({ value }) => value).reduce((a, b) => a + b, 0);
    },
    thetasAndStarts() {
      const thetas = this.sectors
        .map(({ value }, i) => ({
          value: (2 * Math.PI * value) / this.totalValue,
          filterOut: value !== 0,
          i,
        }))
        .filter(({ filterOut }) => filterOut);

      const starts = [...thetas.map(({ value }) => value)];
      starts.forEach(({ value }, i) => {
        starts[i] += starts[i - 1] ?? 0;
      });

      starts.unshift(0);
      starts.pop();

      return thetas.map((t, i) => [t.i, t.value, starts[i]]);
    },
    hasNonZeroValues() {
      return this.thetasAndStarts.some((t) => this.sectors[t[0]].value !== 0);
    },
  },
  methods: {
    getArcPath(...args) {
      let [cx, cy, r, start, theta] = args.map(parseFloat);

      start += parseFloat(this.startAngle);
      const startX = cx + r * Math.cos(start);
      const startY = cy + r * Math.sin(start);
      const endX = cx + r * Math.cos(start + theta);
      const endY = cy + r * Math.sin(start + theta);
      const largeArcFlag = theta > Math.PI ? 1 : 0;
      const sweepFlag = 1;

      return `M ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
    },
    getSectorColor(index) {
      if (this.darkMode) {
        return this.sectors[index].color.darkColor;
      } else {
        return this.sectors[index].color.color;
      }
    },
  },
};
</script>

<style scoped>
.sector {
  transition: 100ms stroke-width ease-out;
}
</style>
