import { useQuery } from '@tanstack/react-query';

import { apiGetUserData } from '../api/index.api';

import { useEffect } from 'react';

import WithLoading from './with-loading';

import { Alert, AlertDescription, AlertTitle } from './ui/alert';

import { AlertCircleIcon } from 'lucide-react';

import { useAuth } from '../providers/auth.provider';

const UserData = ({ children }: React.PropsWithChildren) => {
  const { userName } = useAuth();

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['get-user-data'],
    queryFn: () => apiGetUserData(userName),
    enabled: !!userName,
    retry: 0,
  });

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
    <WithLoading isLoading={isFetching}>
      {data?.data?.isActive ? (
        children
      ) : (
        <Alert variant='destructive'>
          <AlertCircleIcon />
          <AlertTitle>حسابك غير مفعل</AlertTitle>
        </Alert>
      )}
    </WithLoading>
  );
};

export default UserData;
