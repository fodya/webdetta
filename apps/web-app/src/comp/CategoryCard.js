import { el, v, Component } from '#tk';

const CategoryCard = Component(({ item, description, action }) => {
  const { title, img } = item;
  return el.Div(v.col`l bw`.p`1.5`.gap`2`.br`l0`.r`1`.bg`w`.w`16`.ptr().rigid(),
    el.on.click(action),
    el.Div(v.mh`a`.r`1`.ov`h`.w`f`.h`12`.rigid(),
      el.style
        .backgroundImage(`url(${img})`)
        .backgroundSize('cover')
        .backgroundPosition('center')
        .backgroundRepeat('no-repeat')
    ),
    el.Div(v.col(),
      el.Span(v.tc`t2`.ts`xs`.tws`pw`, description ?? ' '),
      el.Span(v.tw`bold`.ts`md`.tws`pw`, title),
    )
  )
});

export default CategoryCard;
