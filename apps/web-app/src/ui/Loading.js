import { el, v, Component } from '#tk';
import { Icon } from '#ui';

const Loading = Component((color='C', size=24) => {
  return el.Div(v.w`f`.h`f`.row('c', 'c'),
    Icon('loading', color, size)(v.rot`0`,
      v.Animation(`2s linear infinite`, {
        0: v.rot`0`,
        100: v.rot`360`
      })
    )
  );
});

const Wrap = Component((isLoaded, func) => {
  return isLoaded ? func() : Loading();
});

export default Object.assign(Loading, { Wrap });
