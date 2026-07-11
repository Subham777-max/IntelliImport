import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthInput from '../components/AuthInput';
import AuthButton from '../components/AuthButton';
import { useToast } from '../../../global/hooks/useToast';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const { handleLogin, loading, error } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        if (error) {
            let msg = error.response?.data?.message || error.message || "An error occurred during login.";
            if (msg.toLowerCase().includes("token")) {
                msg = "You need to login first";
            }
            showToast(msg, "error");
        }
    }, [error, showToast]);

    const validate = () => {
        const newErrors = {};
        if (!email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Please enter a valid email address";
        }
        if (!password) {
            newErrors.password = "Password is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        const response = await handleLogin(email, password);
        if (response && response.data) {
            showToast("Login successful!", "success");
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="mt-6 text-center text-2xl font-bold text-black">
                    Welcome back
                </h2>
            </div>

            <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
                <div className="bg-[#fafafa] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
                    <form className="space-y-5" onSubmit={onSubmit} noValidate>
                        <AuthInput
                            id="email"
                            label="Email address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            error={errors.email}
                        />

                        <AuthInput
                            id="password"
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            error={errors.password}
                        />

                        <div>
                            <AuthButton type="submit" loading={loading}>
                                Sign in
                            </AuthButton>
                        </div>
                    </form>

                    <div className="mt-6">
                        <p className="text-center text-xs text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-semibold text-black hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
