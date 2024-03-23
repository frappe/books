<template>
  <div>
    <svg
      ref="chartSvg"
      :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
      xmlns="http://www.w3.org/2000/svg"
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

      <!-- zero line -->
      <path
        v-if="drawZeroLine"
        :d="zLine"
        :stroke="zeroLineColor"
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
      <template v-if="xLabels.length > 0">
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
          {{ j % skipXLabel === 0 ? formatX(xLabels[i - 1] || '') : '' }}
        </text>
      </template>

      <!-- y Labels -->
      <template v-if="yLabelDivisions > 0">
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

      <defs>
        <clipPath id="positive-rect-clip">
          <rect x="0" y="0" :width="viewBoxWidth" :height="z" />
        </clipPath>
        <clipPath id="negative-rect-clip">
          <rect
            x="0"
            :y="z"
            :width="viewBoxWidth"
            :height="viewBoxHeight - z"
          />
        </clipPath>
      </defs>

      <rect
        v-for="(rec, i) in positiveRects"
        :key="i + 'prec'"
        :rx="radius"
        :ry="radius"
        :x="rec.x"
        :y="rec.y"
        :width="width"
        :height="rec.height"
        :fill="rec.color"
        clip-path="url(#positive-rect-clip)"
        @mouseenter="() => create(rec.xi, rec.yi)"
        @mousemove="update"
        @mouseleave="destroy"
      />

      <rect
        v-for="(rec, i) in negativeRects"
        :key="i + 'nrec'"
        :rx="radius"
        :ry="radius"
        :x="rec.x"
        :y="rec.y"
        :width="width"
        :height="rec.height"
        :fill="rec.color"
        clip-path="url(#negative-rect-clip)"
        @mouseenter="() => create(rec.xi, rec.yi)"
        @mousemove="update"
        @mouseleave="destroy"
      />
    </svg>
    <Tooltip
      ref="tooltip"
      :offset="15"
      placement="top"
      class="text-sm shadow-md px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 border-s-4"
      :style="{ borderColor: activeColor }"
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
import { prefixFormat } from 'src/utils/chart';
import Tooltip from '../Tooltip.vue';

export default {
  components: { Tooltip },
  props: {
    skipXLabel: { type: Number, default: 2 },
    colors: { type: Array, default: () => [] },
    xLabels: { type: Array, default: () => [] },
    yLabelDivisions: { type: Number, default: 4 },
    points: { type: Array, default: () => [[]] },
    drawAxis: { type: Boolean, default: false },
    drawXGrid: { type: Boolean, default: true },
    viewBoxHeight: { type: Number, default: 500 },
    aspectRatio: { type: Number, default: 2.1 },
    axisPadding: { type: Number, default: 30 },
    pointsPadding: { type: Number, default: 40 },
    xLabelOffset: { type: Number, default: 20 },
    yLabelOffset: { type: Number, default: 0 },
    gridColor: { type: String, default: 'rgba(0, 0, 0, 0.2)' },
    zeroLineColor: { type: String, default: 'rgba(0, 0, 0, 0.2)' },
    axisColor: { type: String, default: 'rgba(0, 0, 0, 0.5)' },
    axisThickness: { type: Number, default: 1 },
    gridThickness: { type: Number, default: 0.5 },
    yMin: { type: Number, default: null },
    yMax: { type: Number, default: null },
    format: { type: Function, default: (n) => n.toFixed(1) },
    formatY: { type: Function, default: prefixFormat },
    formatX: { type: Function, default: (v) => v },
    fontSize: { type: Number, default: 22 },
    fontColor: { type: String, default: '#415668' },
    bottom: { type: Number, default: 0 },
    width: { type: Number, default: 28 },
    left: { type: Number, default: 65 },
    radius: { type: Number, default: 17 },
    extendGridX: { type: Number, default: -20 },
    tooltipDispDistThreshold: { type: Number, default: 20 },
    drawZeroLine: { type: Boolean, default: true },
  },
  data() {
    return { xi: -1, yi: -1, activeColor: 'rgba(0, 0, 0, 0.2)' };
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
    z() {
      return this.getViewBoxY(0);
    },
    ys() {
      return this.points.map((pp) => pp.map(this.getViewBoxY));
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
    zLine() {
      const { l, r } = this.xLims;
      const lo = l + this.extendGridX;
      const ro = r - this.extendGridX;
      return `M ${lo} ${this.z} H ${ro}`;
    },
    xLims() {
      const l = this.padding + this.left;
      const r = this.viewBoxWidth - this.padding;
      return { l, r };
    },
    positiveRects() {
      return this.rects.flat().filter(({ isPositive }) => isPositive);
    },
    negativeRects() {
      return this.rects.flat().filter(({ isPositive }) => !isPositive);
    },
    rects() {
      return this.xy.map(([x, ys], i) =>
        ys.map((y, j) => this.getRect(x, y, i, j))
      );
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
    getViewBoxY(value) {
      const min = this.hMin;
      const max = this.hMax;
      let percent = 1 - (value - min) / (max - min);
      if (percent === -Infinity) {
        percent = 0;
      }
      return (
        this.padding +
        percent * (this.viewBoxHeight - 2 * this.padding - this.bottom)
      );
    },
    getRect(px, py, i, j) {
      const isPositive = py <= this.z;
      const x = px - (this.width * this.num) / 2 + j * this.width;
      const y = isPositive ? py : this.z - this.radius;
      const h = Math.abs(py - this.z);
      const height = h + this.radius;
      const color = this.getColor(j, isPositive);
      return { x, y, height, color, isPositive, xi: i, yi: j };
    },
    getColor(j, isPositive) {
      if (this.colors.length > 0) {
        const c = this.colors[j];
        return typeof c === 'string'
          ? c
          : c[isPositive ? 'positive' : 'negative'];
      }
      return this.getRandomColor();
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
    create(xi, yi) {
      this.xi = xi;
      this.yi = yi;
      this.activeColor = this.getColor(yi, this.points[yi][xi] > 0);
      this.$refs.tooltip.create();
    },
    update(event) {
      this.$refs.tooltip.update(event);
    },
    destroy() {
      this.xi = -1;
      this.yi = -1;
      this.$refs.tooltip.destroy();
    },
  },
};
</script>

<style scoped>
rect:hover {
  filter: brightness(105%);
}
</style>
