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
    Chip,
    Button,
    Box,
    CircularProgress,
    Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ApiService from '../network/API';

const formatDuration = (ms) => {
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `${h}ч ${m}м` : `${m}м`;
};

export const AdminLabsPage = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState(null);
    const [statsBySession, setStatsBySession] = useState({});
    const [error, setError] = useState(null);

    const load = async () => {
        try {
            const list = await ApiService.getAllActiveLabs();
            setSessions(list);

            const statsEntries = await Promise.all(
                list.filter((s) => s.status === 'RUNNING').map(async (s) => {
                    try {
                        return [s.id, await ApiService.getLabStats(s.id)];
                    } catch {
                        return [s.id, []];
                    }
                })
            );
            setStatsBySession(Object.fromEntries(statsEntries));
        } catch (err) {
            setError(err.reason || err.message || 'Не удалось загрузить список окружений');
        }
    };

    useEffect(() => {
        load();
        const interval = setInterval(load, 7000);
        return () => clearInterval(interval);
    }, []);

    const handleStop = async (sessionId) => {
        try {
            await ApiService.stopLab(sessionId);
            await load();
        } catch (err) {
            setError(err.reason || err.message || 'Не удалось остановить окружение');
        }
    };

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography color="error">{error}</Typography>
            </Container>
        );
    }

    if (!sessions) {
        return (
            <Box display="flex" justifyContent="center" py={10}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                Лабораторные окружения (активные и приостановленные)
            </Typography>

            {sessions.length === 0 ? (
                <Typography color="text.secondary">Сейчас нет ни активных, ни приостановленных окружений.</Typography>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Студент</TableCell>
                                <TableCell>Задача</TableCell>
                                <TableCell>Статус</TableCell>
                                <TableCell>Окружения (CPU / RAM / диск)</TableCell>
                                <TableCell>Запущено</TableCell>
                                <TableCell align="right">Действие</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sessions.map((s) => (
                                <TableRow key={s.id} hover>
                                    <TableCell
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/users/${s.user.id}`)}
                                    >
                                        {s.user.username}
                                    </TableCell>
                                    <TableCell
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/problems/${s.problemId}`)}
                                    >
                                        {s.problemTitle}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={s.status === 'RUNNING' ? 'работает' : 'на паузе'}
                                            color={s.status === 'RUNNING' ? 'success' : 'default'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                            {s.status !== 'RUNNING' ? (
                                                <Typography variant="caption" color="text.secondary">контейнеры остановлены</Typography>
                                            ) : (statsBySession[s.id] || []).map((c) => (
                                                <Chip
                                                    key={c.containerName}
                                                    size="small"
                                                    variant="outlined"
                                                    label={`${c.environmentName}: ${c.cpuPercent?.toFixed(0) ?? 0}% · ${c.memUsageMb?.toFixed(0) ?? 0}/${c.memLimitMb?.toFixed(0) ?? 0}MB · ${c.diskMb?.toFixed(1) ?? 0}MB`}
                                                />
                                            ))}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        {formatDuration(Date.now() - new Date(s.startedAt).getTime())} назад
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button size="small" color="error" onClick={() => handleStop(s.id)}>
                                            Удалить
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

export default AdminLabsPage;
