import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { FormProvider as Form, UseFormReturn } from 'react-hook-form';

type Props = {
  children: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  methods: UseFormReturn<any, any, any>;
  className?:string;
  onSubmit: () => void;
};



export default function FormProvider({ children, onSubmit, className,methods }: Props) {
  return (
    <Form {...methods}>
      <form className={cn(className||'')} onSubmit={onSubmit}>{children}</form>
    </Form>
  );
}
