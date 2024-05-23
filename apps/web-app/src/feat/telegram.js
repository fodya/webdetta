let tgDetected;

export const initParams = {};
export const init = () => {
  Object.assign(initParams,
    Telegram.Utils.urlParseHashParams(document.location.hash)
  );
  
  tgDetected = 'tgWebAppData' in initParams;
  if (tgDetected) document.location.hash = '';

  Telegram.WebApp.ready();
}

export const isDebug = () => !tgDetected;

export const listenTheme = cb => {
  Telegram.WebApp.onEvent('themeChanged', () => {
    cb({ scheme: Telegram.WebApp.colorScheme });
  });
}

let mainButtonHandler;
Telegram.WebApp.MainButton.onClick(e => mainButtonHandler?.(e));
export const mainButton = (text, onclick) => {
  if (!text) {
    Telegram.WebApp.MainButton.hide();
  } else {
    mainButtonHandler = onclick;
    Telegram.WebApp.MainButton.setParams({ text });
    Telegram.WebApp.MainButton.show();
  }
}

let backButtonHandler;
Telegram.WebApp.BackButton.onClick(e => backButtonHandler?.(e));
export const backButton = (show, onclick) => {
  if (!show) {
    Telegram.WebApp.BackButton.hide();
  } else {
    Telegram.WebApp.BackButton.show();
    backButtonHandler = onclick;
  }
}

export const headerColor = c => Telegram.WebApp.setHeaderColor(c);

export const isExpanded = () => Telegram.WebApp.isExpanded;
export const expand = () => Telegram.WebApp.expand();

export const onViewportChange = f =>
  Telegram.WebApp.onEvent('viewportChanged', f);
