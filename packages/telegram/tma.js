const handlers = {};

export const user = {};

const wa = globalThis.Telegram?.WebApp ?? {};
const wv = globalThis.Telegram?.WebView ?? {};

export const initData = wa.initData;
export const initParam = wa?.initDataUnsafe?.start_param ?? '';

export const init = async (data=initData) => {
  const params = Object.fromEntries(new URLSearchParams(data));
  if (params.user) Object.assign(user, JSON.parse(params.user));

  wa.disableVerticalSwipes();
  wa.ready();

  return params.user ? true : false;
}

export const mainButton = (options) => {
  if (!options) {
    wa.MainButton.hide();
    return;
  }
  const { text, color, text_color, onclick } = options;
  if (!handlers.mainButton) {
    wa.MainButton.onClick(handlers.mainButton = onclick);
  }
  wa.MainButton.setParams({ text, color, text_color });
  wa.MainButton.show();
}

export const backButton = (onclick) => {
  if (!onclick) {
    wa.BackButton.hide();
    return;
  }
  if (!handlers.backButton) {
    wa.BackButton.onClick(handlers.backButton = onclick);
  }
  wa.BackButton.show();
}

export const headerColor = (color) =>
  wa.setHeaderColor(color);
export const backgroundColor = (color) =>
  wa.setBackgroundColor(color);

export const isExpanded = () => wa.isExpanded;
export const expand = () => wa.expand();

export const onViewportChange = (handler) => {
  wa.onEvent('viewportChanged', handler);
}
export const onThemeChange = (handler) => {
  wa.onEvent('themeChanged', () =>
    handler({ scheme: wa.colorScheme })
  );
}

export const phoneNumber = () => {
  return new Promise((resolve) => {
    let h;
    wv.onEvent('custom_method_invoked', h = (_, data) => {
      try {
        data = Object.fromEntries(new URLSearchParams(data.result));
        if (!data.contact) return;
        wv.offEvent('custom_method_invoked', h);
        resolve(JSON.parse(data.contact).phone_number);
      } catch (e) {}
    });
    wa.requestContact(d => !d && resolve(null));
  });
}

export const popup = (title, message, buttons=[]) => {
  return new Promise(resolve =>
    wa.showPopup({ title, message, buttons }, resolve)
  );
}
export const alert = (message) => {
  return new Promise(resolve => {
    try {
      wa.showAlert(message, resolve);
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
      wa.showPopup({
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
