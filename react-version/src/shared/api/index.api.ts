import { interceptor } from './interceptor.api';

import { safeCall } from './safe-call.api';

export function apiGetUserData(userName: string | null) {
  const isSafe = safeCall('userName is Required', userName);

  if (!isSafe) return Promise.reject();

  return interceptor({
    endpoint: `/users/${userName}`,
  });
}

export function apiLoginUser(userName: string) {
  const isSafe = safeCall('userName is Required', userName);

  if (!isSafe) return Promise.reject();

  return interceptor<IUser>({
    endpoint: `/users/auth`,
    requestOptions: {
      method: 'POST',
      body: JSON.stringify({ username: userName }),
    },
  });
}
