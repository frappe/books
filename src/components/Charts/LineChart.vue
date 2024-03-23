<template>
  <div>
    <svg
      ref="chartSvg"
      :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
      xmlns="http://www.w3.org/2000/svg"
      @mousemove="update"
    >
      <!-- x Grid Lines -->
      <path
        v-if="drawXGrid"
        :d="xGrid"
        :stroke="gridColor"
        :stroke-width="gridThickness"
        stroke-linecap="round"
        fill="transparent"
      />

      <!-- Axis -->
      <path
        v-if="drawAxis"
        :d="axis"
        :stroke-width="axisThickness"
        :stroke="axisColor"
        fill="transparent"
      />

      <!-- x Labels -->
      <template v-if="drawLabels && xLabels.length > 0">
        <text
          v-for="(i, j) in count"
          :key="j + '-xlabels'"
          :style="fontStyle"
          :y="
            viewBoxHeight -
            axisPadding +
            yLabelOffset +
            fontStyle.fontSize / 2 -
            bottom
          "
          :x="xs[i - 1]"
          text-anchor="middle"
        >
          {{ formatX(xLabels[i - 1] || '') }}
        </text>
      </template>

      <!-- y Labels -->
      <template v-if="drawLabels && yLabelDivisions > 0">
        <text
          v-for="(i, j) in yLabelDivisions + 1"
          :key="j + '-ylabels'"
          :style="fontStyle"
          :y="yScalerLocation(i - 1)"
          :x="axisPadding - xLabelOffset + left"
          text-anchor="end"
        >
          {{ yScalerValue(i - 1) }}
        </text>
      </template>

      <!-- Gradient Mask -->
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="85%">
          <stop offset="0%" stop-color="rgba(255, 255, 255, 0.5)" />
          <stop offset="40%" stop-color="rgba(255, 255, 255, 0.1)" />
          <stop offset="70%" stop-color="rgba(255, 255, 255, 0)" />
        </linearGradient>

        <mask v-for="(i, j) in num" :id="'rect-mask-' + i" :key="j + '-mask'">
          <rect
            x="0"
            :y="gradY(j)"
            :height="viewBoxHeight - gradY(j)"
            width="100%"
            fill="url('#grad')"
          />
        </mask>
      </defs>

      <g v-for="(i, j) in num" :key="j + '-gpath'">
        <!-- Gradient Paths -->
        <path
          stroke-linejoin="round"
          :d="getGradLine(i - 1)"
          :stroke-width="thickness"
          stroke-linecap="round"
          :fill="colors[i - 1] || getRandomColor()"
          :mask="`url('#rect-mask-${i}')`"
        />

        <!-- Lines -->
        <path
          stroke-linejoin="round"
          :d="getLine(i - 1)"
          :stroke="colors[i - 1] || getRandomColor()"
          :stroke-width="thickness"
          stroke-linecap="round"
          fill="transparent"
        />
      </g>

      <!-- Tooltip Reference -->
      <circle
        v-if="xi > -1 && yi > -1"
        r="12"
        :cx="cx"
        :cy="cy"
        :fill="colors[yi]"
        style="
          filter: brightness(115%) drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.25));
        "
      />
    </svg>
    <Tooltip
      v-if="showTooltip"
      ref="tooltip"
      :offset="15"
      placement="top"
      class="text-sm shadow-md px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 border-s-4"
      :style="{ borderColor: colors[yi] }"
    >
      <div class="flex flex-col justify-center items-center">
        <p>
          {{ xi > -1 ? formatX(xLabels[xi]) : '' }}
        </p>
        <p class="font-semibold">
          {{ yi > -1 ? format(points[yi][xi]) : '' }}
        </p>
      </div>
    </Tooltip>
  </div>
</template>
<script>
import { euclideanDistance, prefixFormat } from 'src/utils/chart';
import Tooltip from '../Tooltip.vue';

export default {
  components: { Tooltip },
  props: {
    colors: { type: Array, default: () => [] },
    xLabels: { type: Array, default: () => [] },
    yLabelDivisions: { type: Number, default: 4 },
    points: { type: Array, default: () => [[]] },
    drawAxis: { type: Boolean, default: false },
    drawXGrid: { type: Boolean, default: true },
    drawLabels: { type: Boolean, default: true },
    viewBoxHeight: { type: Number, default: 500 },
    aspectRatio: { type: Number, default: 4 },
    axisPadding: { type: Number, default: 30 },
    pointsPadding: { type: Number, default: 24 },
    xLabelOffset: { type: Number, default: 20 },
    yLabelOffset: { type: Number, default: 5 },
    gridColor: { type: String, default: 'rgba(0, 0, 0, 0.2)' },
    axisColor: { type: String, default: 'rgba(0, 0, 0, 0.5)' },
    thickness: { type: Number, default: 5 },
    axisThickness: { type: Number, default: 1 },
    gridThickness: { type: Number, default: 0.5 },
    yMin: { type: Number, default: null },
    yMax: { type: Number, default: null },
    format: { type: Function, default: (n) => n.toFixed(1) },
    formatY: { type: Function, default: prefixFormat },
    formatX: { type: Function, default: (v) => v },
    fontSize: { type: Number, default: 20 },
    fontColor: { type: String, default: '#415668' },
    bottom: { type: Number, default: 0 },
    left: { type: Number, default: 55 },
    extendGridX: { type: Number, default: -20 },
    tooltipDispDistThreshold: { type: Number, default: 40 },
    showTooltip: { type: Boolean, default: true },
  },
  data() {
    return { cx: -1, cy: -1, xi: -1, yi: -1 };
  },
  computed: {
    fontStyle() {
      return { fontSize: this.fontSize, fill: this.fontColor };
    },
    viewBoxWidth() {
      return this.aspectRatio * this.viewBoxHeight;
    },
    num() {
      return this.points.length;
    },
    count() {
      return Math.max(...this.points.map((p) => p.length));
    },
    xs() {
      return Array(this.count)
        .fill()
        .map(
          (_, i) =>
            this.padding +
            this.left +
            (i * (this.viewBoxWidth - this.left - 2 * this.padding)) /
              (this.count - 1 || 1) // The "or" one (1) prevents accidentally dividing by 0
        );
    },
    ys() {
      const min = this.hMin;
      const max = this.hMax;
      return this.points.map((pp) =>
        pp.map(
          (p) =>
            this.padding +
            (1 - (p - min) / (max - min)) *
              (this.viewBoxHeight - 2 * this.padding - this.bottom)
        )
      );
    },
    xy() {
      return this.xs.map((x, i) => [x, this.ys.map((y) => y[i])]);
    },
    min() {
      return Math.min(...this.points.flat());
    },
    max() {
      return Math.max(...this.points.flat());
    },
    axis() {
      return `M ${this.axisPadding + this.left} ${this.axisPadding} V ${
        this.viewBoxHeight - this.axisPadding - this.bottom
      } H ${this.viewBoxWidth - this.axisPadding}`;
    },
    padding() {
      return this.axisPadding + this.pointsPadding;
    },
    xGrid() {
      const { l, r } = this.xLims;
      const lo = l + this.extendGridX;
      const ro = r - this.extendGridX;
      const ys = Array(this.yLabelDivisions + 1)
        .fill()
        .map((_, i) => this.yScalerLocation(i));
      return ys.map((y) => `M ${lo} ${y} H ${ro}`).join(' ');
    },
    yGrid() {
      return [];
    },
    xLims() {
      const l = this.padding + this.left;
      const r = this.viewBoxWidth - this.padding;
      return { l, r };
    },
    hMin() {
      return Math.min(this.yMin ?? this.min, 0);
    },
    hMax() {
      let hMax = Math.max(this.yMax ?? this.max, 0);
      if (hMax === this.hMin) {
        return hMax + 1000;
      }
      return hMax;
    },
  },
  methods: {
    gradY(i) {
      return Math.min(...this.ys[i]).toFixed();
    },
    yScalerLocation(i) {
      return (
        ((this.yLabelDivisions - i) *
          (this.viewBoxHeight - this.padding * 2 - this.bottom)) /
          this.yLabelDivisions +
        this.padding
      );
    },
    yScalerValue(i) {
      const min = this.hMin;
      const max = this.hMax;
      return this.formatY((i * (max - min)) / this.yLabelDivisions + min);
    },
    getLine(i) {
      const [x, y] = this.xy[0];
      let d = `M ${x} ${y[i]} `;
      this.xy.slice(1).forEach(([x, y]) => {
        d += `L ${x} ${y[i]} `;
      });
      return d;
    },
    getGradLine(i) {
      let bo = this.viewBoxHeight - this.padding - this.bottom;
      let d = `M ${this.padding + this.left} ${bo}`;
      this.xy.forEach(([x, y]) => {
        d += `L ${x} ${y[i]} `;
      });
      return d + ` V ${bo} Z`;
    },
    getRandomColor() {
      const rgb = Array(3)
        .fill()
        .map(() => parseInt(Math.random() * 255))
        .join(',');
      return `rgb(${rgb})`;
    },
    update(event) {
      if (!this.showTooltip) {
        return;
      }

      const { x, y } = this.getSvgXY(event);
      const { xi, yi, cx, cy, d } = this.getPointIndexAndCoords(x, y);

      if (d > this.tooltipDispDistThreshold) {
        this.xi = -1;
        this.yi = -1;
        this.cx = -1;
        this.cy = -1;
        this.$refs.tooltip.destroy();
        return;
      }
      this.$refs.tooltip.create();

      this.xi = xi;
      this.yi = yi;
      this.cx = cx;
      this.cy = cy;
      this.$refs.tooltip.update(event);
    },
    getSvgXY({ clientX, clientY }) {
      const inv = this.$refs.chartSvg.getScreenCTM().inverse();
      const point = new DOMPoint(clientX, clientY);
      const { x, y } = point.matrixTransform(inv);
      return { x, y };
    },
    getPointIndexAndCoords(x, y) {
      const { l, r } = this.xLims;
      const xi = Math.round((x - l) / ((r - l) / (this.count - 1)));
      if (xi < 0 || xi > this.count - 1) {
        return { d: this.tooltipDispDistThreshold + 1 };
      }
      const px = this.xs[xi];
      const pys = this.ys.map((yarr) => yarr[xi]);
      const dists = pys.map((py) => euclideanDistance(x, y, px, py));
      const minDist = Math.min(...dists);
      const yi = dists
        .map((j, i) => [j - minDist, i])
        .filter(([j, _]) => j === 0)
        .at(-1)[1];
      return { xi, yi, cx: px, cy: pys[yi], d: minDist };
    },
  },
};
</script>
