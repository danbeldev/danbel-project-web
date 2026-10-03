import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Stack, IconButton } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ApiService from '../network/API';
import ProblemLimitsCard from './ProblemLimitsCard';
import { copyToClipboard } from '../copyToClipboard';

// Решение задачи — работа со своей MySQL-базой, созданной по кнопке.
// Проверка ручная (как GIT_REPO/SSH_LAB/INPUT) — преподаватель подключается сам.
const MysqlTaskPanel = ({ problem }) => {
    const [db, setDb] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        ApiService.getMyMysqlDb(problem.id)
            .then(setDb)
            .finally(() => setLoading(false));
    }, [problem.id]);

    const handleCreate = async () => {
        setCreating(true);
        setError(null);
        try {
            const created = await ApiService.createMysqlDb(problem.id);
            setDb(created);
        } catch (err) {
            setError(err.reason || err.message || 'Не удалось создать базу данных');
        } finally {
            setCreating(false);
        }
    };

    const handleCopy = (text) => copyToClipboard(text);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress size={28} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {!db ? (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Решение этой задачи — своя MySQL-база. Создайте её, подключитесь любым
                        клиентом (DBeaver, MySQL Workbench, консоль) — преподаватель проверит сам.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <StorageIcon />}
                        onClick={handleCreate}
                        disabled={creating}
                    >
                        Создать базу данных
                    </Button>
                </Box>
            ) : (
                <Stack spacing={2} sx={{ maxWidth: 420, mx: 'auto' }}>
                    <ProblemLimitsCard
                        title="Данные для подключения"
                        items={[
                            {
                                icon: <IconButton size="small" onClick={() => handleCopy(db.host)} sx={{ p: 0 }}><ContentCopyIcon fontSize="inherit" /></IconButton>,
                                label: 'Хост',
                                value: db.host,
                            },
                            {
                                icon: <IconButton size="small" onClick={() => handleCopy(String(db.port))} sx={{ p: 0 }}><ContentCopyIcon fontSize="inherit" /></IconButton>,
                                label: 'Порт',
                                value: db.port,
                            },
                            {
                                icon: <IconButton size="small" onClick={() => handleCopy(db.databaseName)} sx={{ p: 0 }}><ContentCopyIcon fontSize="inherit" /></IconButton>,
                                label: 'База данных',
                                value: db.databaseName,
                            },
                            {
                                icon: <IconButton size="small" onClick={() => handleCopy(db.username)} sx={{ p: 0 }}><ContentCopyIcon fontSize="inherit" /></IconButton>,
                                label: 'Логин',
                                value: db.username,
                            },
                            {
                                icon: <IconButton size="small" onClick={() => handleCopy(db.password)} sx={{ p: 0 }}><ContentCopyIcon fontSize="inherit" /></IconButton>,
                                label: 'Пароль',
                                value: db.password,
                            },
                        ]}
                    />

                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                        У вас есть права только на эту базу — доступа к чужим базам или к серверу
                        в целом нет. Подключайтесь любым клиентом, поддерживающим MySQL.
                    </Typography>
                </Stack>
            )}
        </Box>
    );
};

export default MysqlTaskPanel;
