export function getColorByBrightness(color: string = '') {
  const [r, g, b] = [0, 2, 4].map(position => parseInt(color.substr(position, 2), 16))
  const colorBrightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return colorBrightness >= 128 ? 'black' : 'white';
}
