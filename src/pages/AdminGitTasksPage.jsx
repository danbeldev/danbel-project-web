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
    Button,
    Link as MuiLink,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import ApiService from '../network/API';

export const AdminGitTasksPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        ApiService.getAllGitTasks()
            .then(setTasks)
            .catch((err) => setError(err.reason || err.message || 'Не удалось загрузить список репозиториев'));
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
                Git-репозитории студентов
            </Typography>

            {tasks.length === 0 ? (
                <Typography color="text.secondary">Пока никто не создал ни одного репозитория.</Typography>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Студент</TableCell>
                                <TableCell>Задача</TableCell>
                                <TableCell>Репозиторий</TableCell>
                                <TableCell>Создан</TableCell>
                                <TableCell>Проверка</TableCell>
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
                                    <TableCell>
                                        <MuiLink href={t.htmlUrl} target="_blank" rel="noopener" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                            {t.repoName} <OpenInNewIcon fontSize="inherit" />
                                        </MuiLink>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(t.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}
                                    </TableCell>
                                    <TableCell>
                                        <Button size="small" onClick={() => navigate(`/admin/problems/${t.problemId}/grading`)}>
                                            По критериям
                                        </Button>
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

export default AdminGitTasksPage;
