import UserData from '../user-data';

import LoginForm from '../login-form';

import { useAuth } from '@/shared/providers/auth.provider';

const AuthGuard = ({ children }: React.PropsWithChildren) => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) return <LoginForm />;

  return <UserData>{children}</UserData>;
};

export default AuthGuard;
