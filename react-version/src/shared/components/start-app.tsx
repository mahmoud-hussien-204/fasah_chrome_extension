import { useState } from 'react';

import { Button } from './ui/button';

import { Loading } from './with-loading';

interface IProps {
  url: string | undefined;
}

const StartApp = ({ url }: IProps) => {
  const [startedApp, setIsStartedApp] = useState(false);

  return (
    <div className='flex flex-col gap-3'>
      {startedApp && <Loading className='h-[100px]' />}
      <Button type='button' disabled={startedApp} onClick={() => setIsStartedApp(true)}>
        بدء التشغيل
      </Button>
      <Button
        type='button'
        variant='destructive'
        disabled={!startedApp}
        onClick={() => setIsStartedApp(false)}
      >
        ايقاف التشغيل
      </Button>
    </div>
  );
};

export default StartApp;
