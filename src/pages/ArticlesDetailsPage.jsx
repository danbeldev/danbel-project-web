import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    CircularProgress,
    Chip,
    Avatar,
    Stack,
    Divider, Card, CardContent
} from '@mui/material';
import {format} from 'date-fns';
import ApiService from '../network/API';

import 'highlight.js/styles/github.css';
import 'highlight.js/styles/github-dark.css';
import MarkdownContent from "../components/MarkdownContent";
import EvaluationDisplay from "../components/EvaluationDisplay";

export const difficultyTranslation = {
    EASY: 'Лёгкая',
    MEDIUM: 'Средняя',
    HARD: 'Сложная'
};

export const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
        case 'EASY':
            return 'success';
        case 'MEDIUM':
            return 'warning';
        case 'HARD':
            return 'error';
        default:
            return 'primary';
    }
};

const difficultyOrder = {
    EASY: 1,
    MEDIUM: 2,
    HARD: 3
};

export const ArticlesDetailsPage = ({mode}) => {
    const navigate = useNavigate();

    const {id} = useParams();
    const [article, setArticle] = useState(null);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [evaluation, setEvaluation] = useState(null);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const data = await ApiService.getArticleById(id);
                setArticle(data);

                const probData = await ApiService.getProblems(id);
                setProblems(probData.sort((a, b) => {
                    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
                }));

                setEvaluation(await ApiService.getEvaluation(id))
            } catch (err) {
                setError(err.message || 'Ошибка загрузки статьи');
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [id]);

    useEffect(() => {
        document.body.dataset.hljsTheme = mode;
    }, [mode]);

    useEffect(() => {
        if (article)
            document.title = article.title;
    }, [article])

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress/>
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{py: 4}}>
            {/* Обложка */}
            {article.coverFileName && (
                <Box mb={3}>
                    <img
                        src={`https://map.matstart.ru:30/danbel-project-api/files/${article.coverFileName}`}
                        alt={article.title}
                        style={{width: '100%', borderRadius: 12}}
                    />
                </Box>
            )}

            {/* Заголовок */}
            <Typography variant="h4" component="h1" gutterBottom>
                {article.title}
            </Typography>

            {/* Краткое описание */}
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {article.shortDescription}
            </Typography>

            {/* Автор и дата */}
            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                mb={2}
                onClick={() => navigate("/users/" + article.author.id)}
                sx={{cursor: 'pointer'}}
            >
                <Avatar
                    alt={article.author.username}
                    src={
                        article.author.avatarFileName
                            ? `https://map.matstart.ru:30/danbel-project-api/files/${article.author.avatarFileName}`
                            : undefined
                    }
                    sx={{width: 32, height: 32}}
                />
                <Typography variant="body2">{article.author.username}</Typography>
                <Typography variant="body2" color="text.secondary">
                    • {format(new Date(article.createdAt), 'dd MMMM yyyy')}
                </Typography>
            </Stack>

            {/* Теги */}
            <Box mb={2} sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                {article.tags.map((tag) => (
                    <Chip key={tag.id} label={tag.name} size="small" color="primary" sx={{cursor: "pointer"}}
                          onClick={() => navigate(`/tags/${tag.id}`)}/>
                ))}
            </Box>

            {evaluation &&
                <EvaluationDisplay value={evaluation.evaluation}/>
            }

            <Divider sx={{my: 3}}/>

            <MarkdownContent content={article.content} mode={mode}/>

            <div>
                {problems.length > 0 &&
                    <h1>Задания</h1>
                }
                {problems.map((problem) => (
                    <Card
                        key={problem.id} sx={{mb: 2, cursor: 'pointer'}}
                        onClick={() => {
                            if (localStorage.getItem('accessToken')) {
                                navigate(`/problems/${problem.id}`);
                            }else {
                                navigate(`/sign-in`);
                            }
                        }}
                    >
                        <CardContent>
                            <Typography variant="h5" component="div">
                                {problem.title}
                            </Typography>
                            <Chip
                                label={difficultyTranslation[problem.difficulty]}
                                color={getDifficultyColor(problem.difficulty)}
                                size="small"
                            />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </Container>
    );
};
