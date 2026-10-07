import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Stack
} from '@mui/material';
import ApiService from '../network/API';
import { useLocation, useNavigate } from 'react-router-dom';

const SignInPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // Если на вход отправили со страницы, требующей авторизации, после входа возвращаем туда.
    const returnTo = typeof location.state?.from === 'string' && location.state.from.startsWith('/') ? location.state.from : '/articles';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSignIn = async () => {
        setError(null);
        setLoading(true);
        try {
            await ApiService.signIn(username, password);
            navigate(returnTo, { replace: true });
            window.location.reload();
        } catch (err) {
            setError(typeof err === 'string' ? err : 'Ошибка входа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={4} sx={{ p: 4, mt: 8, borderRadius: 2 }}>
                <Typography variant="h5" align="center" gutterBottom>
                    Вход в систему
                </Typography>

                <Stack spacing={3}>
                    <TextField
                        label="Имя пользователя"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        fullWidth
                    />

                    <TextField
                        label="Пароль"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                    />

                    {error && <Alert severity="error">{error}</Alert>}

                    <Button
                        variant="contained"
                        onClick={handleSignIn}
                        disabled={loading}
                        fullWidth
                    >
                        {loading ? <CircularProgress size={24} /> : 'Войти'}
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
};

export default SignInPage;
