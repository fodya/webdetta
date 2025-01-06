import { catchErrors } from '../common/utils.js';
import crypto from 'crypto';

export const authTMAUser = catchErrors((botToken, telegramInitData) => {
  const data = Object.fromEntries(new URLSearchParams(telegramInitData));
  data.user = data.user && JSON.parse(data.user);

  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken);

  const arr = decodeURIComponent(telegramInitData).split("&");
  const hashIndex = arr.findIndex((str) => str.startsWith("hash="));
  const hash = arr.splice(hashIndex)[0].split("=")[1];

  const payload = arr.sort((a, b) => a.localeCompare(b)).join("\n");

  const hash1 = crypto
    .createHmac("sha256", secret.digest())
    .update(payload)
    .digest("hex");

  return hash1 === hash ? data : null;
});
