import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Stack, IconButton, Link as MuiLink } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ApiService from '../network/API';
import {showFullscreenAd} from './ads/showFullscreenAd';
import ProblemLimitsCard from './ProblemLimitsCard';
import { copyToClipboard } from '../copyToClipboard';

// Решение задачи — это git push в приватный репозиторий на self-hosted Gitea.
// Проверка ручная (как SSH_LAB/INPUT) — преподаватель заходит в репозиторий сам.
const GitTaskPanel = ({ problem }) => {
    const [repo, setRepo] = useState(null);
    const [credentials, setCredentials] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        Promise.all([
            ApiService.getMyGitRepo(problem.id).catch(() => null),
            ApiService.getGitCredentials().catch(() => null),
        ]).then(([r, c]) => {
            setRepo(r);
            setCredentials(c);
            setLoading(false);
        });
    }, [problem.id]);

    const handleCreate = async () => {
        // Полноэкранная реклама на действии — частоту ограничивает сам блок в кабинете.
        showFullscreenAd();
        setCreating(true);
        setError(null);
        try {
            const created = await ApiService.createGitRepo(problem.id);
            setRepo(created);
        } catch (err) {
            setError(err.reason || err.message || 'Не удалось создать репозиторий');
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

            {!repo ? (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Решение этой задачи — код в git-репозитории. Создайте приватный репозиторий,
                        запушьте туда решение — преподаватель проверит его сам.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <GitHubIcon />}
                        onClick={handleCreate}
                        disabled={creating}
                    >
                        Создать репозиторий
                    </Button>
                </Box>
            ) : (
                <Stack spacing={2} sx={{ maxWidth: 420, mx: 'auto' }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <MuiLink href={repo.htmlUrl} target="_blank" rel="noopener" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            {repo.repoName} <OpenInNewIcon fontSize="small" />
                        </MuiLink>
                    </Box>

                    {credentials && (
                        <ProblemLimitsCard
                            title="Данные для git push"
                            items={[
                                {
                                    icon: <IconButton size="small" onClick={() => handleCopy(credentials.username)} sx={{ p: 0 }}><ContentCopyIcon fontSize="inherit" /></IconButton>,
                                    label: 'Логин',
                                    value: credentials.username,
                                },
                                {
                                    icon: <IconButton size="small" onClick={() => handleCopy(credentials.password)} sx={{ p: 0 }}><ContentCopyIcon fontSize="inherit" /></IconButton>,
                                    label: 'Пароль',
                                    value: credentials.password,
                                },
                                {
                                    icon: <IconButton size="small" onClick={() => handleCopy(repo.cloneUrl)} sx={{ p: 0 }}><ContentCopyIcon fontSize="inherit" /></IconButton>,
                                    label: 'Clone URL',
                                    value: repo.cloneUrl,
                                },
                            ]}
                        />
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                        Репозиторий приватный — сделать его публичным нельзя. Использовать логин/пароль
                        именно от Gitea (это не пароль от платформы) при <code>git clone</code>/<code>git push</code>.
                    </Typography>
                </Stack>
            )}
        </Box>
    );
};

export default GitTaskPanel;
