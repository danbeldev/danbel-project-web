import React from 'react';
import {Navigate, useLocation} from 'react-router-dom';
import ApiService from '../network/API';

// Страницы только для вошедших: без токена отправляем на вход и запоминаем, куда вернуться после входа.
const RequireAuth = ({children}) => {
    const location = useLocation();
    if (!ApiService.isAuthenticated()) {
        return <Navigate to="/sign-in" replace state={{from: `${location.pathname}${location.search}`}}/>;
    }
    return children;
};

export default RequireAuth;
