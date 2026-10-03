import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    Box,
    Button,
    Stack,
    Tabs,
    Tab,
    CircularProgress,
    Alert,
    Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import ApiService from '../network/API';
import LabTerminal from './LabTerminal';
import ProblemLimitsCard from './ProblemLimitsCard';

const formatRemaining = (seconds) => {
    if (seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

const LabPanel = ({ problem }) => {
    const [session, setSession] = useState(null);
    const [stats, setStats] = useState([]);
    const [activeEnv, setActiveEnv] = useState(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [now, setNow] = useState(Date.now());
    const [config, setConfig] = useState(null);

    const pollRef = useRef(null);

    useEffect(() => {
        ApiService.getLabConfig().then(setConfig).catch(() => {});
    }, []);

    const refresh = useCallback(async () => {
        try {
            const mine = await ApiService.getMyLab();
            if (mine && mine.problemId === problem.id) {
                setSession(mine);
                // Через функциональное обновление, а не чтение activeEnv из замыкания —
                // иначе из-за устаревшего замыкания каждый опрос сбрасывал вкладку на первую.
                setActiveEnv((prev) => (prev && mine.environments.includes(prev)) ? prev : mine.environments[0]);
                if (mine.status === 'RUNNING') {
                    const s = await ApiService.getLabStats(mine.id);
                    setStats(s);
                }
            } else {
                setSession(mine); // окружение для другой задачи, если есть
            }
        } catch (err) {
            setError(err.reason || err.message || 'Не удалось получить статус окружения');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [problem.id]);

    useEffect(() => {
        refresh();
        pollRef.current = setInterval(refresh, 7000);
        const tick = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            clearInterval(pollRef.current);
            clearInterval(tick);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [problem.id]);

    const handleStart = async () => {
        setStarting(true);
        setError(null);
        try {
            const created = await ApiService.startLab(problem.id);
            setSession(created);
            setActiveEnv(created.environments[0]);
        } catch (err) {
            setError(err.reason || err.message || 'Не удалось запустить окружение');
        } finally {
            setStarting(false);
        }
    };

    const handlePause = async () => {
        if (!session) return;
        setBusy(true);
        try {
            const updated = await ApiService.pauseLab(session.id);
            setSession(updated);
            setStats([]);
        } catch (err) {
            setError(err.reason || err.message || 'Не удалось приостановить окружение');
        } finally {
            setBusy(false);
        }
    };

    const handleResume = async () => {
        if (!session) return;
        setBusy(true);
        setError(null);
        try {
            const updated = await ApiService.resumeLab(session.id);
            setSession(updated);
        } catch (err) {
            setError(err.reason || err.message || 'Не удалось возобновить окружение');
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        if (!session) return;
        if (!window.confirm('Окружение будет удалено безвозвратно, вместе со всеми файлами внутри. Продолжить?')) return;
        setBusy(true);
        try {
            await ApiService.stopLab(session.id);
            setSession(null);
            setStats([]);
        } catch (err) {
            setError(err.reason || err.message || 'Не удалось удалить окружение');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress size={28} />
            </Box>
        );
    }

    const isMine = session && session.problemId === problem.id;

    if (!isMine) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {session && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        У вас уже есть окружение для другой задачи («{session.problemTitle}»).
                        Завершите его, прежде чем запускать это.
                    </Alert>
                )}

                <Button
                    variant="contained"
                    startIcon={starting ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                    onClick={handleStart}
                    disabled={starting || !!session}
                >
                    Запустить окружение
                </Button>
            </Box>
        );
    }

    if (session.status === 'PAUSED') {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <PauseCircleOutlineIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" sx={{ mb: 1 }}>
                    Окружение приостановлено — все файлы внутри сохранены.
                </Typography>
                {session.pausedAt && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Если не возобновить, будет удалено безвозвратно{' '}
                        {new Date(new Date(session.pausedAt).getTime() + session.pausedRetentionDays * 86400000)
                            .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Typography>
                )}

                <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                        variant="contained"
                        startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                        onClick={handleResume}
                        disabled={busy}
                    >
                        Возобновить
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteForeverIcon />}
                        onClick={handleDelete}
                        disabled={busy}
                    >
                        Удалить
                    </Button>
                </Stack>
            </Box>
        );
    }

    const idleDeadline = new Date(session.lastActivityAt).getTime() + session.idleTimeoutMinutes * 60000;
    const maxDeadline = new Date(session.startedAt).getTime() + session.maxSessionHours * 3600000;
    const deadline = Math.min(idleDeadline, maxDeadline);
    const remainingSeconds = Math.max(0, Math.floor((deadline - now) / 1000));
    const isLowTime = remainingSeconds < 120;

    const serverItems = [
        {
            icon: <AccessTimeIcon />,
            label: 'До автопаузы',
            value: formatRemaining(remainingSeconds),
            highlight: isLowTime,
        },
        ...stats.map((s) => ({
            icon: <SpeedIcon />,
            label: `${s.environmentName}: CPU / RAM`,
            value: `${s.cpuPercent?.toFixed(0) ?? 0}% / ${s.memUsageMb?.toFixed(0) ?? 0}–${s.memLimitMb?.toFixed(0) ?? 0} МБ`,
        })),
        ...stats.map((s) => ({
            icon: <StorageIcon />,
            label: `${s.environmentName}: диск`,
            value: config ? `${s.diskMb?.toFixed(0) ?? 0} / ${config.diskLimitMb} МБ` : `${s.diskMb?.toFixed(1) ?? 0} МБ`,
            highlight: config && s.diskMb >= config.diskLimitMb * 0.9,
        })),
    ];

    return (
        <Box sx={{ height: '100%', display: 'flex', gap: 2 }}>
            <Box sx={{ minWidth: 240, display: { xs: 'none', md: 'block' } }}>
                <ProblemLimitsCard title="Сервер" items={serverItems} />
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                        fullWidth
                        size="small"
                        startIcon={busy ? <CircularProgress size={16} /> : <PauseIcon />}
                        onClick={handlePause}
                        disabled={busy}
                    >
                        Приостановить
                    </Button>
                    <Button
                        fullWidth
                        size="small"
                        color="error"
                        startIcon={<DeleteForeverIcon />}
                        onClick={handleDelete}
                        disabled={busy}
                    >
                        Удалить
                    </Button>
                </Stack>
            </Box>

            <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>{error}</Alert>}

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, display: { xs: 'flex', md: 'none' } }}>
                    <Button size="small" startIcon={<StopIcon />} onClick={handlePause} sx={{ ml: 'auto' }}>
                        Пауза ({formatRemaining(remainingSeconds)})
                    </Button>
                    <Button size="small" color="error" startIcon={<DeleteForeverIcon />} onClick={handleDelete}>
                        Удалить
                    </Button>
                </Stack>

                {session.environments.length > 1 && (
                    <Tabs
                        value={activeEnv}
                        onChange={(e, v) => setActiveEnv(v)}
                        sx={{ minHeight: 32, mb: 1 }}
                    >
                        {session.environments.map((env) => (
                            <Tab key={env} value={env} label={env} sx={{ minHeight: 32, py: 0.5 }} />
                        ))}
                    </Tabs>
                )}

                <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                    {activeEnv && <LabTerminal sessionId={session.id} env={activeEnv} />}
                </Box>
            </Box>
        </Box>
    );
};

export default LabPanel;
