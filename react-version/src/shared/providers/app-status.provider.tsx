import { createContext, useContext, useEffect, useState } from 'react';

import WithLoading from '../components/with-loading';

import { sendMessageToContentScript, validateTab } from '../utils/index.utils';

interface IAppStatusContext {
  appIsRunning: boolean;
  isLoading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const AppStatusContext = createContext<IAppStatusContext>({
  appIsRunning: false,
  isLoading: true,
  error: null,
  setError: () => {},
});

interface IAppStatusProviderProps extends React.PropsWithChildren {
  url: string | undefined;
}

export const AppStatusProvider = ({ children, url }: IAppStatusProviderProps) => {
  const [appIsRunning, setAppIsRunning] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const tab = await validateTab(url);
        if (!tab.id) {
          setError('حدث خطأ، الرجاء المحاولة مرة أخرى');
          return;
        }
        sendMessageToContentScript(tab.id, 'status')
          .then((response) => {
            setAppIsRunning(response.status);
            setIsLoading(false);
          })
          .catch(() => {
            setError(`حدث خطأ الرجاء اعادة تحميل المتصفح`);
            setIsLoading(false);
          });
      } catch (error) {
        setIsLoading(false);
        setError(error as string);
      }
    })();
  }, []);

  return (
    <AppStatusContext.Provider value={{ appIsRunning, isLoading, error, setError }}>
      <WithLoading isLoading={isLoading}>{children}</WithLoading>
    </AppStatusContext.Provider>
  );
};

export const useAppStatus = () => {
  return useContext(AppStatusContext);
};
