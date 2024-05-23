import { h } from '#tk';

export const title = 'Chai Shop';
export const currency = '₽';

export const menuItems = [
  { icon: 'news', title: 'Наш блог' },
  { icon: 'telegram', title: 'Связаться с нами' },
  { icon: 'comment', title: 'Оставить отзыв о товаре' },
]

export const categories = [
  { id: 'tea', title: 'Чай', img: './assets/img/tea.jpg' },
  { id: 'coffee', title: 'Кофе', img: './assets/img/coffee.jpg' },
  { id: 'teaware', title: 'Посуда', img: './assets/img/teapot.jpg' },
  { id: 'gifts', title: 'Подарки', img: './assets/img/gift.jpg' },
  { id: 'packaging', title: 'Упаковка', img: './assets/img/packaging.jpg' }
]

export const qtyTypes = {
  grams: 'г.'
}

export const qtyTypesVerbose = {
  grams: 'грамм'
}

Object.groupBy ??= (list, func) =>
  list.reduce((r, v) => ((r[func(v)] ??= []).push(v), r), {});

export const stockItemsCount = ({ search }) => {
  const [items] = stockItems({ search });
  return Object.fromEntries(
    Object.entries(Object.groupBy(items, d => d.category))
      .map(([k, v]) => [k, v.length])
  );
}

const searchNorm = str => str
  .toLowerCase()
  .replaceAll('ё', 'е');
export const stockItems = ({ search='', category='' }={}) => {
  search = searchNorm(search);
  return h.loader([], [search, category], async () => {
    await new Promise(r => setTimeout(r, 350));
    return stockItemsPromise.then(list => {
      if (search) list = list.filter(item =>
        searchNorm(item.name).includes(search)
      );
      if (category) list = list.filter(item =>
        item.category == category
      );
      return list;
    })
  });
}
const stockItemsPromise = (async () => {
  let data;
  try {
    data = JSON.parse(localStorage.catalog);
  }
  catch {
    data = await fetch('./assets/data/catalog.json').then(res => res.json());
    localStorage.catalog = JSON.stringify(data);
  }
  return data;
})();
