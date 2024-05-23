import { el, v } from '#tk';

export default function(name, color, size=16) {
  if (!Array.isArray(size)) size = [size, size];
  const hasColor = !!color;
  color ??= 'currentColor';
  return el.Div(v.rigid(),
    el.style.width(size[0] + 'px').height(size[1] + 'px'),
    hasColor
    ? [
      v.bg(color),
      el.style
        .WebkitMaskImage.MaskImage(`url(./assets/icons/${name}.svg)`)
        .WebkitMaskSize.MaskSize('contain')
        .WebkitMaskPosition.MaskPosition('center')
        .WebkitMaskRepeat.MaskRepeat('no-repeat')
    ]
    : el.style
        .backgroundImage(`url(./assets/icons/${name}.svg)`)
        .backgroundSize('contain')
        .backgroundPosition('center')
        .backgroundRepeat('no-repeat')
  );
}
