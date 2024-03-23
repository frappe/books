import colors from '../../colors.json';

export const uicolors = colors;
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

const getValidColor = (color: string) => {
  const isValid = [
    'gray',
    'orange',
    'green',
    'red',
    'yellow',
    'blue',
    'indigo',
    'pink',
    'purple',
    'teal',
  ].includes(color);
  return isValid ? color : 'gray';
};

export function getBgColorClass(color: string) {
  const vcolor = getValidColor(color);
  return `bg-${vcolor}-200 dark:bg-${vcolor}-700`;
}

export function getColorClass(
  color: string,
  type: 'bg' | 'text' | 'border',
  value = 300,
  darkvalue = 600
) {
  return `${type}-${getValidColor(color)}-${value} dark:${type}-${getValidColor(color)}-${darkvalue}`;
}

export function getTextColorClass(color: string) {
  return `text-${getValidColor(color)}-700 dark:text-${getValidColor(color)}-200`;
}

export function getBgTextColorClass(color: string) {
  const bg = getBgColorClass(color);
  const text = getTextColorClass(color);
  return [bg, text].join(' ');
}
