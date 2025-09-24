import { createContext, useContext, useReducer } from 'react';

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

export const AuthProvider = ({ children }: React.PropsWithChildren) => {
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
