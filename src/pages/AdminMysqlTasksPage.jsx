import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Paper,
    Box,
    CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import ApiService from '../network/API';

export const AdminMysqlTasksPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        ApiService.getAllMysqlTasks()
            .then(setTasks)
            .catch((err) => setError(err.reason || err.message || 'Не удалось загрузить список баз данных'));
    }, []);

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography color="error">{error}</Typography>
            </Container>
        );
    }

    if (!tasks) {
        return (
            <Box display="flex" justifyContent="center" py={10}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                MySQL-базы студентов
            </Typography>

            {tasks.length === 0 ? (
                <Typography color="text.secondary">Пока никто не создал ни одной базы.</Typography>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Студент</TableCell>
                                <TableCell>Задача</TableCell>
                                <TableCell>База данных</TableCell>
                                <TableCell>Логин</TableCell>
                                <TableCell>Пароль</TableCell>
                                <TableCell>Хост:порт</TableCell>
                                <TableCell>Создана</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tasks.map((t) => (
                                <TableRow key={t.id} hover>
                                    <TableCell
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/users/${t.user.id}`)}
                                    >
                                        {t.user.username}
                                    </TableCell>
                                    <TableCell
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/problems/${t.problemId}`)}
                                    >
                                        {t.problemTitle}
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{t.databaseName}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{t.username}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{t.password}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{t.host}:{t.port}</TableCell>
                                    <TableCell>
                                        {format(new Date(t.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Container>
    );
};

export default AdminMysqlTasksPage;
