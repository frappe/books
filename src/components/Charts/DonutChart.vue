<template>
  <div>
    <svg version="1.1" viewBox="0 0 100 100" @mouseleave="active = null">
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
        v-if="sectors.length === 1 || sectors.length === 0"
        clip-path="url(#donut-hole)"
        :cx="cx"
        :cy="cy"
        :r="radius"
        @mouseover="active = sectors.length === 1 ? 0 : null"
        :stroke-width="
          thickness + (active === 0 || externalActive === 0 ? 4 : 0)
        "
        :stroke="(sectors[0] && sectors[0].color) || '#f4f4f6'"
        :class="sectors.length >= 1 ? 'sector' : ''"
        :style="{ transformOrigin: `${cx}px ${cy}px` }"
        fill="transparent"
      />
      <template v-if="sectors.length > 1">
        <path
          clip-path="url(#donut-hole)"
          v-for="([theta, start_], i) in sectorsToStarts()"
          :key="i"
          :d="getArcPath(cx, cy, radius, start_, theta)"
          :stroke="sectors[i].color"
          :stroke-width="
            thickness + (active === i || externalActive === i ? 4 : 0)
          "
          :style="{ transformOrigin: `${cx}px ${cy}px` }"
          class="sector"
          fill="transparent"
          @mouseover="active = i"
        />
      </template>
    </svg>
    <div class="relative" style="top: -50%">
      <div class="text-base text-center font-semibold grid justify-center">
        <p class="text-xs text-gray-600 w-32">
          {{
            active !== null || externalActive !== null
              ? sectors[active !== null ? active : externalActive].label
              : totalLabel
          }}
        </p>
        <p class="w-32">
          {{
            valueFormatter(
              active !== null || externalActive !== null
                ? sectors[active !== null ? active : externalActive].value
                : getTotalValue(),
              'Currency'
            )
          }}
        </p>
      </div>
    </div>
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
    thickness: { default: 10, type: Number },
    externalActive: { default: null, type: Number },
    valueFormatter: { default: (v) => v.toString(), Function },
  },
  data() {
    return {
      cx: 50,
      cy: 50,
      width: 8,
      active: null,
      start: Math.PI,
    };
  },
  methods: {
    getTotalValue() {
      return this.sectors.map(({ value }) => value).reduce((a, b) => a + b, 0);
    },
    sectorsToRadians() {
      const totalValue = this.getTotalValue();
      return this.sectors.map(
        ({ value }) => (2 * Math.PI * value) / totalValue
      );
    },
    sectorsToStarts() {
      const theta = this.sectorsToRadians();
      const starts = [...theta];

      starts.forEach((e, i) => {
        starts[i] += starts[i - 1] ?? 0;
      });

      starts.unshift(0);
      starts.pop();

      return theta.map((t, i) => [t, starts[i]]);
    },
    getArcPath(...args) {
      let [cx, cy, r, start, theta] = args.map(parseFloat);
      start += parseFloat(this.start);
      const startX = cx + r * Math.cos(start);
      const startY = cy + r * Math.sin(start);
      const endX = cx + r * Math.cos(start + theta);
      const endY = cy + r * Math.sin(start + theta);
      const largeArcFlag = theta > Math.PI ? 1 : 0;
      const sweepFlag = 1;

      return `M ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
    },
  },
};
</script>

<style scoped>
.sector {
  transition: 100ms stroke-width ease-out;
}
</style>
