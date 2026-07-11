import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

const Navbar = () => {
    const { user, handleLogout } = useAuth();
    const navigate = useNavigate();

    const onLogout = async () => {
        await handleLogout();
        navigate('/login');
    };

    const initials = user?.fullName
        ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <header className="h-12 bg-white border-b border-neutral-200 flex items-center px-6 shrink-0">
            <Link to="/" className="flex items-center gap-2 mr-auto">
                <img
                    src="https://lh3.googleusercontent.com/aida/AP1WRLsETx12axDhXsoRgGw6oJ9WwxxQVX3bQ1Y2OG1BTuY8WopF4x5eWbR27QOTJw5B43O9TAoNxAqjpZwTFPHIeb97uthnBPcqtYKMvA6iwCERnN-vAxvCyOqDJ_HKW9l2JkKOkgqtQ1YWDVjx2HK7soFg3d9XAnfsMKWIfmmNaLhAVoHtqvfUMZTls-F6nunWGnDdW92pFo5IE3F0eVRGg3RZzPC7I0fLRjKNM77R1-xvDsAfJL_uH2Nb"
                    alt="IntelliImport"
                    className="w-6 h-6 rounded object-contain"
                />
                <span className="text-sm font-semibold text-neutral-900 tracking-tight">IntelliImport</span>
            </Link>

            <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-neutral-600">{initials}</span>
                </div>
                <button
                    onClick={onLogout}
                    className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                >
                    Logout
                </button>
            </div>
        </header>
    );
};

export default Navbar;
