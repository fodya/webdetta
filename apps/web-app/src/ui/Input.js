import { el, v, Component } from '#tk';
import { Icon } from '#ui';

const Search = Component((placeholder, [val, setVal], { inputProps }={}) => {
  return el.Div(v.row('c', 'c').rel().w`f`.h`5.5`.r`1`.bg`w`.br`l0`.rigid(),
    el.Input(v.w.h`f`.pl`1.5`.pr`5`.ts`md`,
      inputProps,
      el.prop.value(val),
      el.attr.placeholder(placeholder),
      el.on
        .input(e => setVal(e.target.value))
        .keydown(e => e.key == 'Enter' && e.target.blur()),
    ),
    el.Div(v.abs().ir(0).p`1.5`.ptr(val),
      el.on.pointerdown(() => val && setVal('')),
      Icon(val ? 'close' : 'search', 't2', 22)
    )
  );
});

export default { Search }
