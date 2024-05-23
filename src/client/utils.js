export const handleUncaught = ({ exception, rejection }={}) => {
  window.addEventListener('error', exception ?? ((msg, url, num) => {
    console.log('Uncaught exception:', msg + ';' + url + ';' + num);
    return true;
  }));

  window.addEventListener('unhandledrejection', rejection ?? ((e) => { 
    console.log('Unhandled rejection:', e.reason);
    return true;
  }));
}
