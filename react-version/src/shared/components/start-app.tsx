import { useState } from 'react';

import { Button } from './ui/button';

import { Loading } from './with-loading';

import { sendMessageToContentScript, validateTab } from '../utils/index.utils';

import { Alert, AlertDescription, AlertTitle } from './ui/alert';

import { AlertCircleIcon } from 'lucide-react';

import { useAppStatus } from '../providers/app-status.provider';

interface IProps {
  url: string | undefined;
}

const StartApp = ({ url }: IProps) => {
  const { error: appStatusError, appIsRunning } = useAppStatus();

  const [startedApp, setIsStartedApp] = useState(appIsRunning);

  const [error, setError] = useState<string | null>(null);

  const startingApp = async () => {
    setError(null);

    try {
      const tab = await validateTab(url);
      if (!tab.id) {
        setError('حدث خطأ، الرجاء المحاولة مرة أخرى');
        return;
      }
      sendMessageToContentScript(tab.id, 'start').then(() => {
        setIsStartedApp(true);
      });
    } catch (error) {
      setError(error as string);
    }
  };

  const stoppingApp = async () => {
    setError(null);
    try {
      const tab = await validateTab(url);
      if (!tab.id) {
        setError('حدث خطأ، الرجاء المحاولة مرة أخرى');
        return;
      }
      sendMessageToContentScript(tab.id, 'stop').then(() => {
        setIsStartedApp(false);
      });
    } catch (error) {
      setError(error as string);
    }
  };

  return (
    <div className='flex flex-col gap-3'>
      {(error || appStatusError) && (
        <Alert variant='destructive'>
          <AlertCircleIcon />
          <AlertTitle>حدث خطأ</AlertTitle>
          <AlertDescription>{error || appStatusError}</AlertDescription>
        </Alert>
      )}
      {startedApp && <Loading className='h-[100px]' />}
      <Button type='button' disabled={startedApp} onClick={startingApp}>
        بدء التشغيل
      </Button>
      <Button type='button' variant='destructive' disabled={!startedApp} onClick={stoppingApp}>
        ايقاف التشغيل
      </Button>
    </div>
  );
};

export default StartApp;
