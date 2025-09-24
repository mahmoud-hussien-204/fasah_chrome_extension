import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
  type QueryKey,
} from '@tanstack/react-query';

import AuthGuard from './shared/components/guards/auth-guard';

import AppContent from './shared/components/app-content';

import AppLogo from './shared/components/app-logo';

import { AuthProvider } from './shared/providers/auth.provider';

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
