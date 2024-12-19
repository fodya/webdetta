export const isMobile = (() => {
  const list = [
    'Android',
    'webOS',
    'iPhone',
    'iPad',
    'iPod',
    'BlackBerry',
    'Windows Phone'
  ];
  return list.some(d => navigator.userAgent.includes(d));
})();
