
import { notificationUtil } from '../utils/notification.utils';



interface IInterceptor {
  endpoint: string;
  requestOptions?: RequestInit;
  showToast?: boolean;
}

const baseURL = import.meta.env.VITE_APP_API_BASE_URL;

export async function interceptor<TData>({
  endpoint,
  requestOptions = { method: 'GET' },
  showToast = true,
}: IInterceptor) {
  try {
    const request = await interceptRequest(requestOptions);

    if (!baseURL) throw new Error('Please ensure there is .env file with VITE_APP_API_BASE_URL');

    const response = await fetch(`${baseURL}${endpoint}`, request);

    const data = await interceptResponse<TData>(response);

    // show success toast
    if (requestOptions.method !== 'GET' && showToast && data.message) {
      notificationUtil.success(data.message);
    }

    return data;
  } catch (error) {
    const apiError: IApiError = {
      message: (error as Error).message || 'Something went wrong',
      status: error instanceof Response ? error.status : 500,
    };

    // show error toast
    if (showToast) {
      notificationUtil.error(apiError.message);
    }

    return Promise.reject(apiError);
  }
}

function getToken() {
  let token: string | null | undefined = null;

  return () => {
    if (!token) {
      token = store.get(userDataTokenAtom);
    }
    return token;
  };
}

const token = getToken();

const language = store.get(appConfigLangAtom);

async function interceptRequest(request: RequestInit) {
  const headers = new Headers({
    ...(request.headers || {}),
    Authorization: `Bearer ${token()}`,
    'Accept-Language': language,
    'Content-Language': language,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  });

  if (request.body instanceof FormData) {
    headers.delete('Content-Type');
    headers.delete('Accept');
  }

  request.headers = headers;

  return request;
}

async function interceptResponse<TData>(response: Response): Promise<IApiResponse<TData>> {
  // if unauthorized remove token and redirect to login page
  if (response.status === 401) {
    localStorage.removeItem('token');
    if (!window.location.pathname.startsWith('/auth')) {
      window.location.pathname = '/auth/login';
    }
  }

  const data = await response.json();

  if (!response.ok) {
    return Promise.reject({
      message: data.message,
      status: response.status,
    });
  }

  return {
    message: data.message,
    data: data.data?.meta ? data.data?.data : data.data,
    meta: data.data?.meta,
    statusCode: response.status,
  };
}
