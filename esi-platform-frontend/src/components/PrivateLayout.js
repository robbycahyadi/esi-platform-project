import React from 'react';
import Header from './Header';

const PrivateLayout = ({ children }) => {
    return (
        <div>
            <Header />
            <main>
                {children}
            </main>
        </div>
    );
};

export default PrivateLayout;