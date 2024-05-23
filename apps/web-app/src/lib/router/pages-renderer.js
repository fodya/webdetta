const PagesRenderer = (router, renderer, list) => {
  const pages = Object.fromEntries(
    Object.entries(list).map(([k, v]) => [v[0], v[1]])
  );

  const routes = Object.fromEntries(
    Object.entries(list).map(([k, v]) => [k, v[0]])
  );

  const currentPage = () => renderer(router, pages);
  const currentRoute = () => router.route(pages);
  
  return { routes, currentPage, currentRoute };
}

export default PagesRenderer;
