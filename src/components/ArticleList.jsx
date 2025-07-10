import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    useMediaQuery,
    useTheme
} from '@mui/material';
import ApiService from '../network/API';
import ArticleCard from './ArticleCard';

const PAGE_SIZE = 20;

const ArticleList = ({ tagIds = [], authorIds = [] }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pageNumber, setPageNumber] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const observer = useRef();
    const lastArticleRef = useRef();

    useEffect(() => {
        setArticles([]);
        setPageNumber(0);
        setHasMore(true);
    }, [tagIds, authorIds]);

    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            try {
                const data = await ApiService.getAllArticles(tagIds, authorIds, pageNumber, PAGE_SIZE);

                if (Array.isArray(data) && data.length > 0) {
                    setArticles((prev) => {
                        const ids = new Set(prev.map((a) => a.id));
                        const filtered = data.filter((a) => !ids.has(a.id));
                        return [...prev, ...filtered];
                    });
                    setHasMore(data.length === PAGE_SIZE);
                } else {
                    setHasMore(false);
                }
            } catch (err) {
                setError(err.message || 'Failed to load articles');
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, [pageNumber, tagIds, authorIds]);

    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const callback = (entries) => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                setPageNumber(prev => prev + 1);
            }
        };

        const observerInstance = new IntersectionObserver(callback, options);
        if (lastArticleRef.current) {
            observerInstance.observe(lastArticleRef.current);
        }

        return () => {
            if (lastArticleRef.current) {
                observerInstance.unobserve(lastArticleRef.current);
            }
        };
    }, [hasMore, loading]);

    if (error) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <>
            <Box
                display="grid"
                gridTemplateColumns={
                    isMobile
                        ? '1fr'
                        : 'repeat(auto-fill, minmax(300px, 1fr))'
                }
                gap={isMobile ? 2 : 3}
            >
                {articles.map((article, index) => {
                    // Для мобильных - простая однородная сетка
                    if (isMobile) {
                        return (
                            <Box
                                key={article.id}
                                ref={index === articles.length - 1 ? lastArticleRef : null}
                            >
                                <ArticleCard article={article} />
                            </Box>
                        );
                    }

                    // Для десктопов - специальное форматирование
                    let gridColumn = 'span 1';
                    let gridRow = 'span 1';

                    if (index === 0) {
                        gridColumn = 'span 2';
                    }

                    if (index % 5 === 0 && index !== 0) {
                        gridRow = 'span 2';
                    }

                    return (
                        <Box
                            key={article.id}
                            sx={{ gridColumn, gridRow }}
                            ref={index === articles.length - 1 ? lastArticleRef : null}
                        >
                            <ArticleCard article={article} />
                        </Box>
                    );
                })}
            </Box>

            {loading && (
                <Box display="flex" justifyContent="center" mt={2} p={2}>
                    <CircularProgress />
                </Box>
            )}
        </>
    );
};

export default ArticleList;