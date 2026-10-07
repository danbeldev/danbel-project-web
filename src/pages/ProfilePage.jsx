import React, { useEffect, useState } from 'react';
import {
    Avatar,
    Box,
    Container,
    Typography,
    Grid,
    CircularProgress,
    Tabs,
    Tab,
    Chip,
    Button,
    IconButton,
    Link as MuiLink,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ApiService from '../network/API';
import EvaluationList from '../components/EvaluationList';
import YandexAdBlock from '../components/ads/YandexAdBlock';
import ProblemLimitsCard from '../components/ProblemLimitsCard';
import CourseworkCard from '../components/CourseworkCard';
import {TelegramConnectCard} from '../components/TelegramConnect';
import { copyToClipboard } from '../copyToClipboard';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const FEED_BLOCK_ID = "R-A-20141312-5";

export const ProfilePage = () => {
    const [evaluationsData, setEvaluationsData] = useState([]);
    const [profile, setProfile] = useState(null);
    const [currentTag, setCurrentTag] = useState(null);
    const [evaluationsLoaded, setEvaluationsLoaded] = useState(false);
    const [articlesByTag, setArticlesByTag] = useState({});
    const [gitCredentials, setGitCredentials] = useState(null);
    const [gitLoading, setGitLoading] = useState(false);
    const [gitError, setGitError] = useState(null);
    const [courseworks, setCourseworks] = useState([]);

    const loadCourseworks = () => {
        ApiService.getMyCourseworks().then(setCourseworks).catch(() => {});
    };

    useEffect(() => {
        ApiService.getEvaluations().then((res) => {
            setEvaluationsData(res);
            if (res.length > 0) {
                setCurrentTag(res[0].tag);
            }
            setEvaluationsLoaded(true);
        });
        ApiService.getMeUser().then((res) => setProfile(res));
        loadCourseworks();
    }, []);

    // Лекции без оценки тоже должны быть видны (как в таблице группы у преподавателя),
    // поэтому подтягиваем полный список лекций тега, а не только те, где уже есть оценка.
    useEffect(() => {
        if (!currentTag || articlesByTag[currentTag.id]) return;

        ApiService.getAllArticles([currentTag.id], [], 0, 100)
            .then((articles) => {
                setArticlesByTag((prev) => ({ ...prev, [currentTag.id]: articles }));
            })
            .catch(() => {
                setArticlesByTag((prev) => ({ ...prev, [currentTag.id]: [] }));
            });
    }, [currentTag, articlesByTag]);

    const handleShowGitCredentials = () => {
        setGitLoading(true);
        setGitError(null);
        ApiService.getGitCredentials()
            .then(setGitCredentials)
            .catch((err) => setGitError(err.reason || err.message || 'Не удалось получить данные'))
            .finally(() => setGitLoading(false));
    };

    const handleCopy = (text) => copyToClipboard(text);

    const handleTagChange = (event, newValue) => {
        const selectedTag = evaluationsData.find(item => item.tag.id === newValue)?.tag;
        setCurrentTag(selectedTag);
    };

    if (!profile || !evaluationsLoaded) {
        return (
            <Box display="flex" justifyContent="center" py={10}>
                <CircularProgress />
            </Box>
        );
    }

    const currentTagData = evaluationsData.find(item => item.tag.id === currentTag?.id);
    const currentTagArticles = currentTag ? articlesByTag[currentTag.id] : undefined;

    const evaluationByArticleId = {};
    (currentTagData?.evaluations || []).forEach((e) => {
        evaluationByArticleId[e.article.id] = e;
    });

    // Полный список: у лекций без оценки просто нет записи в evaluationByArticleId —
    // EvaluationList покажет их с прочерком вместо пропуска.
    const currentEvaluations = currentTagArticles
        ? currentTagArticles.map((article) => evaluationByArticleId[article.id] || { article, evaluation: null })
        : (currentTagData?.evaluations || []);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Профиль */}
            <Box
                display="flex"
                alignItems="center"
                gap={3}
                mb={4}
                sx={{
                    p: 3,
                    borderRadius: 4,
                    boxShadow: 2,
                    backgroundColor: (theme) =>
                        theme.palette.mode === 'light' ? '#f9f9f9' : '#1e1e1e',
                }}
            >
                <Avatar
                    src={
                        profile.avatarFileName
                            ? ApiService.getFileUrl(profile.avatarFileName)
                            : undefined
                    }
                    alt={profile.username}
                    sx={{ width: 80, height: 80 }}
                />
                <Box>
                    <Typography variant="h5" fontWeight="bold">
                        {profile.username}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        {profile.description}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item>
                            <Typography variant="body2" color="text.secondary">
                                Статей: {profile.countArticles}
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Typography variant="body2" color="text.secondary">
                                С нами с {format(new Date(profile.createdAt), 'd MMMM yyyy', { locale: ru })}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            <div style={{height: "10px"}}/>

            <TelegramConnectCard/>

            {/* Данные для входа в Gitea — нужны для git-задач */}
            <Box sx={{ maxWidth: 320, mx: 'auto', mb: 3 }}>
                {!gitCredentials ? (
                    <Box sx={{ textAlign: 'center' }}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={gitLoading ? <CircularProgress size={16} /> : <GitHubIcon />}
                            onClick={handleShowGitCredentials}
                            disabled={gitLoading}
                        >
                            Показать данные для Git (Gitea)
                        </Button>
                        {gitError && (
                            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                {gitError}
                            </Typography>
                        )}
                    </Box>
                ) : (
                    <>
                        <ProblemLimitsCard
                            title="Git (Gitea)"
                            items={[
                                {
                                    icon: <IconButton size="small" onClick={() => handleCopy(gitCredentials.username)} sx={{ p: 0 }}><ContentCopyIcon fontSize="inherit" /></IconButton>,
                                    label: 'Логин',
                                    value: gitCredentials.username,
                                },
                                {
                                    icon: <IconButton size="small" onClick={() => handleCopy(gitCredentials.password)} sx={{ p: 0 }}><ContentCopyIcon fontSize="inherit" /></IconButton>,
                                    label: 'Пароль',
                                    value: gitCredentials.password,
                                },
                            ]}
                        />
                        {gitCredentials.giteaBaseUrl && (
                            <Box sx={{ textAlign: 'center', mt: 1 }}>
                                <MuiLink
                                    href={gitCredentials.giteaBaseUrl}
                                    target="_blank"
                                    rel="noopener"
                                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                                >
                                    {gitCredentials.giteaBaseUrl} <OpenInNewIcon fontSize="small" />
                                </MuiLink>
                            </Box>
                        )}
                    </>
                )}
            </Box>

            {courseworks.length > 0 && (
                <Box sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                    {courseworks.map((submission) => (
                        <CourseworkCard
                            key={submission.courseworkId}
                            submission={submission}
                            onSaved={loadCourseworks}
                        />
                    ))}
                </Box>
            )}

            {evaluationsData.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    Пока нет оценок ни по одному предмету
                </Typography>
            ) : (
            <>
            {/* Tabs for tags */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={currentTag?.id || false}
                    onChange={handleTagChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    textColor="inherit"
                    sx={{
                        borderRadius: 2,
                        bgcolor: 'background.default',
                        boxShadow: 1,
                        '& .MuiTabs-indicator': {
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: '#fff',
                        },
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '1rem',
                            color: 'rgba(255,255,255,0.7)',
                            transition: 'color 0.3s ease',
                            '&:hover': {
                                color: '#fff',
                                opacity: 1,
                            },
                            px: 3,
                            py: 1.5,
                            minHeight: 48,
                            borderRadius: 2,
                        },
                        '& .Mui-selected': {
                            color: '#fff',
                            fontWeight: 600,
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                        },
                    }}
                >
                    {evaluationsData.map((item) => (
                        <Tab
                            key={item.tag.id}
                            label={
                                <Box display="flex" alignItems="center" gap={1}>
                                    {item.tag.name}
                                    {item.exam && (
                                        <Chip
                                            label="Экзамен"
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                            }
                            value={item.tag.id}
                        />
                    ))}
                </Tabs>
            </Box>

            <Box width="100%" maxWidth="1000px" mx="auto">
                {currentTagData && (
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 3,
                            mb: 2,
                            px: 0.5,
                            flexWrap: 'wrap',
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            Оценено лекций: <strong>
                                {currentTagData.evaluations.length}
                                {currentTagArticles ? ` из ${currentTagArticles.length}` : ''}
                            </strong>
                        </Typography>
                        {currentTagData.averageGrade != null && (
                            <Typography variant="body2" color="text.secondary">
                                Средний балл: <strong>{currentTagData.averageGrade.toFixed(1)}</strong>
                            </Typography>
                        )}
                    </Box>
                )}
                <EvaluationList items={currentEvaluations} />
            </Box>
            </>
            )}
            <YandexAdBlock blockId={FEED_BLOCK_ID} type="feed"/>
        </Container>
    );
};