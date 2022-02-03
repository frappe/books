export const indicators = {
  GRAY: 'grey',
  GREY: 'grey',
  BLUE: 'blue',
  RED: 'red',
  GREEN: 'green',
  ORANGE: 'orange',
  PURPLE: 'purple',
  YELLOW: 'yellow',
  BLACK: 'black',
};

export const statusColor = {
  Draft: 'gray',
  Unpaid: 'orange',
  Paid: 'green',
  Cancelled: 'red',
};

const getValidColor = (color) => {
  const isValid = ['gray', 'orange', 'green', 'red', 'yellow', 'blue'].includes(
    color
  );
  return isValid ? color : 'gray';
};

export function getBgColorClass(color) {
  return `bg-${getValidColor(color)}-100`;
}

export function getColorClass(color, type, value = 300) {
  return `${type}-${getValidColor(color)}-${value}`;
}

export function getTextColorClass(color) {
  return `text-${getValidColor(color)}-600`;
}

export function getBgTextColorClass(color) {
  const bg = getBgColorClass(color);
  const text = getTextColorClass(color);
  return [bg, text].join(' ');
}
