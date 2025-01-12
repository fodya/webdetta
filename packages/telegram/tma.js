const handlers = {};

export const user = {};

const WebApp = globalThis.Telegram?.WebApp ?? {};
const WebView = globalThis.Telegram?.WebView ?? {};

export const initData = WebApp.initData;
export const initParam = WebApp?.initDataUnsafe?.start_param ?? '';

export const init = async (data=initData) => {
  const params = Object.fromEntries(new URLSearchParams(data));
  if (params.user) Object.assign(user, JSON.parse(params.user));

  WebApp.disableVerticalSwipes();
  WebApp.ready();

  return params.user ? true : false;
}

export const mainButton = (options) => {
  if (!options) {
    WebApp.MainButton.hide();
    return;
  }
  const { text, color, text_color, onclick } = options;
  if (!handlers.mainButton) {
    WebApp.MainButton.onClick(handlers.mainButton = onclick);
  }
  MainButton.setParams({ text, color, text_color });
  MainButton.show();
}

export const backButton = (onclick) => {
  if (!onclick) {
    WebApp.BackButton.hide();
    return;
  }
  if (!handlers.backButton) {
    WebApp.BackButton.onClick(handlers.backButton = onclick);
  }
  BackButton.show();
}

export const headerColor = (color) =>
  WebApp.setHeaderColor(color);
export const backgroundColor = (color) =>
  WebApp.setBackgroundColor(color);

export const isExpanded = () => WebApp.isExpanded;
export const expand = () => WebApp.expand();

export const onViewportChange = (handler) => {
  WebApp.onEvent('viewportChanged', handler);
}
export const onThemeChange = (handler) => {
  WebApp.onEvent('themeChanged', () =>
    handler({ scheme: WebApp.colorScheme })
  );
}

export const phoneNumber = () => {
  return new Promise((resolve) => {
    let h;
    WebView.onEvent('custom_method_invoked', h = (_, data) => {
      try {
        data = Object.fromEntries(new URLSearchParams(data.result));
        if (!data.contact) return;
        WebView.offEvent('custom_method_invoked', h);
        resolve(JSON.parse(data.contact).phone_number);
      } catch (e) {}
    });
    WebApp.requestContact(d => !d && resolve(null));
  });
}

export const popup = (title, message, buttons=[]) => {
  return new Promise(resolve =>
    WebApp.showPopup({ title, message, buttons }, resolve)
  );
}
export const alert = (message) => {
  return new Promise(resolve => {
    try {
      WebApp.showAlert(message, resolve);
    } catch (e) {
      resolve(window.alert(message));
    }
  });
}
export const confirm = (message, {
  titleText,
  confirmText,
  cancelText
}) => {
  return new Promise(resolve => {
    try {
      WebApp.showPopup({
        title: titleText,
        message: message,
        buttons: [
          {id: 'confirm', type: 'destructive', text: confirmText},
          {id: 'cancel', type: 'default', text: cancelText}
        ]
      }, d => resolve(d == 'confirm'));
    } catch (e) {
      resolve(window.confirm(message));
    }
  });
}
