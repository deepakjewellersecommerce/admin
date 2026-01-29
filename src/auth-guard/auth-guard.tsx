
import Logo from '@/components/common/logo';
import { useGetUser } from '@/lib/react-query/auth-query';
import { Fragment, PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';

const AuthGuard = ({ children }: PropsWithChildren) => {
    const { isLoading, isError, data: _data, error: _error } = useGetUser();

    if (isLoading)
        return (
            <section className="flex h-screen w-screen flex-col items-center justify-center">
                <Logo />
                <h4 className="mt-4">Verifying authentication...</h4>
                <p className="text-sm text-gray-500 mt-2">Please wait while we check your login status</p>
            </section>
        );

    if (isError) {
        return <Navigate to="/auth/login" />;
    }
    
    return <Fragment>{children}</Fragment>;
};

export default AuthGuard;
