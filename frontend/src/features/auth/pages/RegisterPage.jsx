import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthInput from '../components/AuthInput';
import AuthButton from '../components/AuthButton';
import { useToast } from '../../../global/hooks/useToast';

const RegisterPage = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const { handleRegister, loading, error } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        if (error) {
            let msg = error.response?.data?.message || error.message || "An error occurred during registration.";
            if (msg.toLowerCase().includes("token")) {
                msg = "You need to login first";
            }
            showToast(msg, "error");
        }
    }, [error, showToast]);

    const validate = () => {
        const newErrors = {};
        if (!fullName.trim()) newErrors.fullName = "Full name is required";
        
        if (!email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 8 || password.length > 32) {
            newErrors.password = "Password must be between 8 and 32 characters";
        } else if (!/[A-Z]/.test(password)) {
            newErrors.password = "Password must contain at least one uppercase letter";
        } else if (!/[a-z]/.test(password)) {
            newErrors.password = "Password must contain at least one lowercase letter";
        } else if (!/[0-9]/.test(password)) {
            newErrors.password = "Password must contain at least one number";
        } else if (!/[@$!%*?&]/.test(password)) {
            newErrors.password = "Password must contain at least one special character (@$!%*?&)";
        } else if (/\s/.test(password)) {
            newErrors.password = "Password must not contain spaces";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        const response = await handleRegister(fullName, email, password);
        if (response && response.data) {
            showToast("Registration successful!", "success");
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="mt-6 text-center text-2xl font-bold text-black">
                    Create an account
                </h2>
            </div>

            <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
                <div className="bg-[#fafafa] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
                    <form className="space-y-5" onSubmit={onSubmit} noValidate>
                        <AuthInput
                            id="fullName"
                            label="Full Name"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                            error={errors.fullName}
                        />
                        
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
                                Register
                            </AuthButton>
                        </div>
                    </form>

                    <div className="mt-6">
                        <p className="text-center text-xs text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-black hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
