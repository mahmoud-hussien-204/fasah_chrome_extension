import { useForm } from 'react-hook-form';

import { Button } from './ui/button';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';

import z from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from './ui/input';

import { useMutation } from '@tanstack/react-query';

import { apiLoginUser } from '../api/index.api';

import { Alert, AlertDescription, AlertTitle } from './ui/alert';

import { AlertCircleIcon } from 'lucide-react';

import { useAuth } from '@/App';

const loginFormSchema = z.object({
  userName: z
    .string({
      required_error: 'اسم المستخدم مطلوب',
    })
    .min(1, { message: 'اسم المستخدم مطلوب' }),
});

const LoginForm = () => {
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      userName: '',
    },
    mode: 'onChange',
  });

  const { dispatch } = useAuth();

  const { mutate, isPending, error } = useMutation({
    mutationFn: apiLoginUser,
    onSuccess: (data, variables) => {
      dispatch({
        type: 'LOGIN',
        payload: {
          ...data.data,
          userName: variables,
        },
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    mutate(data.userName);
  });

  return (
    <div>
      <Form {...form}>
        <form onSubmit={onSubmit} id='login-form' className='flex flex-col gap-4'>
          {error?.message && (
            <Alert variant='destructive'>
              <AlertCircleIcon />
              <AlertTitle>حدث خطأ</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          <FormField
            control={form.control}
            name='userName'
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor='username'>اسم المستخدم</FormLabel>
                <FormControl>
                  <Input
                    placeholder='ادخل اسم المستخدم'
                    id='username'
                    type='text'
                    autoComplete='username'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type='submit'
            className='mt-1.25rem'
            isLoading={isPending}
            disabled={isPending || !form.formState.isValid}
          >
            تسجيل الدخول
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
