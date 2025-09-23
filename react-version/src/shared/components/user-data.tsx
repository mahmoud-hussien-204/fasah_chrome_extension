import { useQuery } from '@tanstack/react-query';

import { apiGetUserData } from '../api/index.api';

import { useAuth } from '@/App';

import { useEffect } from 'react';

import WithLoading from './with-loading';

import { Alert, AlertDescription, AlertTitle } from './ui/alert';

import { AlertCircleIcon } from 'lucide-react';

const UserData = ({ children }: React.PropsWithChildren) => {
  const { userName } = useAuth();

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['get-user-data'],
    queryFn: () => apiGetUserData(userName),
    enabled: !!userName,
    retry: 0,
  });

  console.log(data, isFetching);

  useEffect(() => {
    if (isError) {
      localStorage.clear();
      window.location.reload();
    }
  }, [isError]);

  return isError ? (
    <Alert variant='destructive'>
      <AlertCircleIcon />
      <AlertTitle>حدث خطأ</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  ) : (
    <WithLoading isLoading={isFetching}>{children}</WithLoading>
  );
};

export default UserData;
