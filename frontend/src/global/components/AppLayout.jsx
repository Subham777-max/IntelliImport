import React from 'react';
import Navbar from './Navbar';

const AppLayout = ({ children }) => (
    <div className="min-h-screen flex flex-col bg-[#f5f5f4]">
        <Navbar />
        <main className="flex-1 overflow-auto">
            {children}
        </main>
    </div>
);

export default AppLayout;
