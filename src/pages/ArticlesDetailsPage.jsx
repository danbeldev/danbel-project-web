import React, { useEffect, useState } from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    CircularProgress,
    Chip,
    Avatar,
    Stack,
    Divider
} from '@mui/material';
import { format } from 'date-fns';
import ApiService from '../network/API';

import 'highlight.js/styles/github.css';
import 'highlight.js/styles/github-dark.css';
import MarkdownContent from "../components/MarkdownContent";

export const ArticlesDetailsPage = ({mode}) => {
    const navigate = useNavigate();

    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const data = await ApiService.getArticleById(id);
                setArticle(data);
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
                <CircularProgress />
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
        <Container maxWidth="md" sx={{ py: 4 }}>
            {/* Обложка */}
            {article.coverFileName && (
                <Box mb={3}>
                    <img
                        src={`https://map.matstart.ru:30/danbel-project-api/files/${article.coverFileName}`}
                        alt={article.title}
                        style={{ width: '100%', borderRadius: 12 }}
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
                sx={{ cursor: 'pointer' }}
            >
                <Avatar
                    alt={article.author.username}
                    src={
                        article.author.avatarFileName
                            ? `https://map.matstart.ru:30/danbel-project-api/files/${article.author.avatarFileName}`
                            : undefined
                    }
                    sx={{ width: 32, height: 32 }}
                />
                <Typography variant="body2">{article.author.username}</Typography>
                <Typography variant="body2" color="text.secondary">
                    • {format(new Date(article.createdAt), 'dd MMMM yyyy')}
                </Typography>
            </Stack>

            {/* Теги */}
            <Box mb={2} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {article.tags.map((tag) => (
                    <Chip key={tag.id} label={tag.name} size="small" color="primary" sx={{ cursor: "pointer" }} onClick={ () => navigate(`/tags/${tag.id}`) } />
                ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            <MarkdownContent content={article.content} mode={mode} />
        </Container>
    );
};
