export const handleUncaught = (handlers={}) => {
  window.addEventListener('unhandledrejection', handlers.rejection ?? (e) => { 
    console.log(`UNHANDLED PROMISE REJECTION: ${e.reason}`);
    return true;
  });

  window.addEventListener('error', handlers.exception ?? (msg, url, num) => {
    console.log(msg + ';' + url + ';' + num);
    return true;
  });
}
