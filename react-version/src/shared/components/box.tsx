import { cn } from '../utils/index.utils';

interface IProps extends React.PropsWithChildren {
  className?: string;
  title?: React.ReactNode;
}

const Box = ({ className, children, title }: IProps) => {
  return (
    <div className={cn('bg-muted p-1rem rounded-md border', className)}>
      {title && <BoxTitle>{title}</BoxTitle>}
      {children}
    </div>
  );
};

export default Box;

export const BoxTitle = ({ children }: Required<React.PropsWithChildren>) => {
  return <h4 className='mb-1.25rem text-lg font-medium'>{children}</h4>;
};
