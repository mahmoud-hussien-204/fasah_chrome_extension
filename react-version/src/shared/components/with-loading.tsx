import { Loader2Icon, SendIcon } from 'lucide-react';

import { cn } from '../utils/index.utils';

interface IProps extends React.PropsWithChildren {
  isLoading: boolean;
  className?: string;
}

const WithLoading = ({ isLoading, children, className }: IProps) => {
  return isLoading ? <Loading className={className} /> : children;
};

export default WithLoading;

export const Loading = ({ className }: Partial<Pick<IProps, 'className'>>) => {
  return (
    <div className={cn('flex h-[calc(100svh-250px)] items-center justify-center', className)}>
      <Loader2Icon className='-mt-0.5rem animate-spin' size={28} />
      {/* <div className='animate-bounce'>Loading...</div> */}
    </div>
  );
};

export const SplashScreen = () => {
  return (
    <div className='flex h-screen items-center justify-center'>
      <div className='relative flex items-center justify-center'>
        {/* Loader circle around */}
        <span className='border-foreground absolute h-16 w-16 animate-spin rounded-full border-2 border-t-transparent' />

        {/* Center Icon */}
        <SendIcon className='text-primary' size={32} />
      </div>
    </div>
  );
};
