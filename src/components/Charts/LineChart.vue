<template>
  <svg
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

    <!-- Axis -->
    <path
      v-if="drawAxis"
      :d="axis"
      :stroke-width="axisThickness"
      :stroke="axisColor"
      fill="transparent"
    />

    <!-- x Labels -->
    <template v-if="yLabels.length > 0">
      <text
        :style="fontStyle"
        v-for="(i, j) in count"
        :key="j + '-xlabels'"
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
        {{ yLabels[i - 1] || '' }}
      </text>
    </template>

    <!-- y Labels -->
    <template v-if="xLabelDivisions > 0">
      <text
        :style="fontStyle"
        v-for="(i, j) in xLabelDivisions + 1"
        :key="j + '-ylabels'"
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

      <mask v-for="(i, j) in num" :key="j + '-mask'" :id="'rect-mask-' + i">
        <rect
          x="0"
          :y="gradY(j)"
          :height="viewBoxHeight - gradY(j)"
          width="100%"
          fill="url('#grad')"
        />
      </mask>
    </defs>

    <template v-for="(i, j) in num">
      <!-- Gradient Paths -->
      <path
        :key="j + '-gpath'"
        :d="getGradLine(i - 1)"
        :stroke-width="thickness"
        stroke-linecap="round"
        :fill="colors[i - 1] || getRandomColor()"
        :mask="`url('#rect-mask-${i}')`"
      />

      <!-- Lines -->
      <path
        :key="j + '-lpath'"
        :d="getLine(i - 1)"
        :stroke="colors[i - 1] || getRandomColor()"
        :stroke-width="thickness"
        stroke-linecap="round"
        fill="transparent"
      />
    </template>
  </svg>
</template>
<script>
import { prefixFormat } from './chartUtils';

export default {
  props: {
    colors: { type: Array, default: () => [] },
    yLabels: { type: Array, default: () => [] },
    xLabelDivisions: { type: Number, default: 4 },
    points: { type: Array, default: () => [[100, 200, 300, 400, 500]] },
    drawAxis: { type: Boolean, default: false },
    drawXGrid: { type: Boolean, default: true },
    viewBoxHeight: { type: Number, default: 500 },
    aspectRatio: { type: Number, default: 3.5 },
    axisPadding: { type: Number, default: 30 },
    pointsPadding: { type: Number, default: 24 },
    xLabelOffset: { type: Number, default: 5 },
    yLabelOffset: { type: Number, default: 5 },
    gridColor: { type: String, default: 'rgba(0, 0, 0, 0.2)' },
    axisColor: { type: String, default: 'rgba(0, 0, 0, 0.5)' },
    thickness: { type: Number, default: 4 },
    axisThickness: { type: Number, default: 1 },
    gridThickness: { type: Number, default: 0.5 },
    yMin: { type: Number, default: null },
    yMax: { type: Number, default: null },
    format: { type: Function, default: (n) => n.toFixed(1) },
    formatY: { type: Function, default: prefixFormat },
    fontSize: { type: Number, default: 18 },
    fontColor: { type: String, default: '#415668' },
    bottom: { type: Number, default: 0 },
    left: { type: Number, default: 55 },
    extendGridX: { type: Number, default: -20 },
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
              (this.count - 1)
        );
    },
    ys() {
      const min = this.yMin ?? this.min;
      const max = this.yMax ?? this.max;

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
      const lo = this.padding + this.left + this.extendGridX;
      const ro = this.viewBoxWidth - this.padding - this.extendGridX;

      const ys = Array(this.xLabelDivisions + 1)
        .fill()
        .map((_, i) => this.yScalerLocation(i));

      return ys.map((y) => `M ${lo} ${y} H ${ro}`).join(' ');
    },
    yGrid() {
      return [];
    },
  },
  data() {
    return {};
  },
  mounted() {},
  methods: {
    gradY(i) {
      return Math.min(...this.ys[i]).toFixed();
    },
    yScalerLocation(i) {
      return (
        ((this.xLabelDivisions - i) *
          (this.viewBoxHeight - this.padding * 2 - this.bottom)) /
          this.xLabelDivisions +
        this.padding
      );
    },
    yScalerValue(i) {
      return this.formatY(
        (i * (this.max - this.min)) / this.xLabelDivisions + this.min
      );
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
  },
};
</script>
