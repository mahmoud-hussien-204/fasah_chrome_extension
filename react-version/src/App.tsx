

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
  type QueryKey,
} from '@tanstack/react-query';



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
        <div>hello</div>
      </QueryClientProvider>
  );
}

export default App;
