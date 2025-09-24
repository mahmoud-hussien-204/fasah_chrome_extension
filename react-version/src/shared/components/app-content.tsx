import { useRef, useState } from 'react';

import { Button } from './ui/button';

import StartApp from './start-app';

import { AppStatusProvider } from '../providers/app-status.provider';

enum UpdateType {
  NEW = 'new',
  OLD = 'old',
}

enum UpdateURL {
  NEW = 'https://fasah.zatca.gov.sa',
  OLD = 'https://oga.fasah.sa',
}

const updates = [
  {
    id: 1,
    title: 'التحديث الجديد',
    type: UpdateType.NEW,
    url: UpdateURL.NEW,
  },
  {
    id: 2,
    title: 'التحديث القديم',
    type: UpdateType.OLD,
    url: UpdateURL.OLD,
  },
];

const AppContent = () => {
  const refOfCurrentURL = useRef<UpdateURL>();

  const [isContentReady, setIsContentReady] = useState(false);

  const chooseUpdate = (data: (typeof updates)[number]) => {
    refOfCurrentURL.current = data.url;
    setIsContentReady(true);
  };

  return (
    <div>
      {isContentReady ? (
        <AppStatusProvider url={refOfCurrentURL.current}>
          <StartApp url={refOfCurrentURL.current} />
        </AppStatusProvider>
      ) : (
        <div className='flex flex-col gap-3'>
          {updates.map((updateItem) => (
            <Button
              type='button'
              variant='outline'
              key={updateItem.id}
              onClick={() => chooseUpdate(updateItem)}
              className='text-lg'
            >
              {updateItem.title}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppContent;
