const handlers = {};

export const user = {};

export const initData = Telegram.WebApp.initData;
export const initParam = Telegram.WebApp?.initDataUnsafe?.start_param ?? '';

export const init = async (data=initData) => {
  const params = Object.fromEntries(new URLSearchParams(data));
  if (params.user) Object.assign(user, JSON.parse(params.user));

  Telegram.WebApp.disableVerticalSwipes();
  Telegram.WebApp.ready();

  return params.user ? true : false;
}

export const mainButton = (options) => {
  const { MainButton } = Telegram.WebApp;
  if (!options) { MainButton.hide(); return; }
  const { text, color, text_color, onclick } = options;
  if (!handlers.mainButton) MainButton.onClick(handlers.mainButton=onclick);
  MainButton.setParams({ text, color, text_color });
  MainButton.show();
}

export const backButton = (onclick) => {
  const { BackButton } = Telegram.WebApp;
  if (!onclick) { BackButton.hide(); return; }
  if (!handlers.backButton) BackButton.onClick(handlers.backButton=onclick);
  BackButton.show();
}

export const headerColor = (color) =>
  Telegram.WebApp.setHeaderColor(color);
export const backgroundColor = (color) =>
  Telegram.WebApp.setBackgroundColor(color);

export const isExpanded = () => Telegram.WebApp.isExpanded;
export const expand = () => Telegram.WebApp.expand();

export const onViewportChange = (handler) => {
  Telegram.WebApp.onEvent('viewportChanged', handler);
}
export const onThemeChange = (handler) => {
  Telegram.WebApp.onEvent('themeChanged', () =>
    handler({ scheme: Telegram.WebApp.colorScheme })
  );
}

export const phoneNumber = () => {
  return new Promise((resolve) => {
    let h;
    Telegram.WebView.onEvent('custom_method_invoked', h = (_, data) => {
      try {
        data = Object.fromEntries(new URLSearchParams(data.result));
        if (!data.contact) return;
        Telegram.WebView.offEvent('custom_method_invoked', h);
        resolve(JSON.parse(data.contact).phone_number);
      } catch (e) {}
    });
    Telegram.WebApp.requestContact(d => !d && resolve(null));
  });
}

export const popup = (title, message, buttons=[]) => {
  return new Promise(resolve =>
    Telegram.WebApp.showPopup({ title, message, buttons }, resolve)
  );
}
export const alert = (message) => {
  return new Promise(resolve => {
    try {
      Telegram.WebApp.showAlert(message, resolve);
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
      Telegram.WebApp.showPopup({
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
