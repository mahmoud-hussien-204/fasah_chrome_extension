import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
  type QueryKey,
} from '@tanstack/react-query';

import { createContext, useContext, useReducer } from 'react';

import AuthGuard from './shared/components/guards/auth-guard';

import AppContent from './shared/components/app-content';

import AppLogo from './shared/components/app-logo';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      invalidatesQuery?: QueryKey;
    };
  }
}

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      if (mutation.meta?.invalidatesQuery) {
        queryClient.invalidateQueries({
          queryKey: mutation.meta.invalidatesQuery,
        });
      }
    },
  }),
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className='w-[400px] p-4'>
          <AppLogo />
          <AuthGuard>
            <AppContent />
          </AuthGuard>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

interface IAuthContextProps extends IUser {
  isLoggedIn: boolean;
}

const getUserNameFromLocalStorage = localStorage.getItem('user-name');

const initialState: IAuthContextProps = {
  isLoggedIn: getUserNameFromLocalStorage ? true : false,
  userName: getUserNameFromLocalStorage || null,
  isActive: false,
  isNew: false,
  token: '',
};

const AuthContext = createContext<IAuthContextProps & { dispatch: React.Dispatch<AuthAction> }>({
  ...initialState,
  dispatch: () => {},
});

type AuthAction = { type: 'LOGIN'; payload: IUser } | { type: 'LOGOUT' };

const authReducer = (state: IAuthContextProps, action: AuthAction) => {
  switch (action.type) {
    case 'LOGIN': {
      if (!action.payload.userName) return state;
      localStorage.setItem('user-name', action.payload.userName);
      return {
        isLoggedIn: true,
        userName: action.payload.userName,
        token: action.payload.token,
        isNew: action.payload.isNew,
        isActive: action.payload.isActive,
      };
    }
    case 'LOGOUT':
      return {
        ...initialState,
      };
    default:
      return state;
  }
};

const AuthProvider = ({ children }: React.PropsWithChildren) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  return <AuthContext.Provider value={{ ...state, dispatch }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
