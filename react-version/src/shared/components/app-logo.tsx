import { SendIcon } from 'lucide-react';

import { cn } from '../utils/index.utils';

const AppLogo = ({ className }: { className?: string }) => {
  return (
    <h5
      className={cn('gap-0.25rem flex items-center text-2xl font-bold tracking-wider', className)}
    >
      <SendIcon className='text-primary' />
      MegaSender
    </h5>
  );
};

export default AppLogo;
