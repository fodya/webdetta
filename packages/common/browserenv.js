export const isMobile = (() => {
  const list = [
    'Android', 'webOS', 'iPhone', 'iPad', 'iPod',
    'BlackBerry', 'Windows Phone', 'Opera Mini', 'IEMobile'
  ];
  return list.some(d => navigator.userAgent.includes(d));
})();