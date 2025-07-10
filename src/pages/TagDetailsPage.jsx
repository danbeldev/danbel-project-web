import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    CircularProgress
} from '@mui/material';
import ApiService from '../network/API';
import ArticleList from "../components/ArticleList";

const TagDetailsPage = () => {
    const {id} = useParams();
    const [tag, setTag] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTag = async () => {
            try {
                const allTags = await ApiService.getTagById(id);
                setTag(allTags);
            } catch (err) {
                setError(err.message || 'Ошибка загрузки тега');
            } finally {
                setLoading(false);
            }
        };

        fetchTag();
    }, [id]);

    useEffect(() => {
        if (tag)
            document.title = tag.name;
    }, [tag])

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
        <Container maxWidth="lg" sx={{py: 4}}>
            <Typography variant="h4" gutterBottom>
                {tag.name}
            </Typography>

            <Typography variant="body1" color="text.secondary">
                {tag.description}
            </Typography>

            <div style={{height: "40px"}}/>

            <ArticleList tagIds={[id]} authorIds={[]}/>
        </Container>
    );
};

export default TagDetailsPage;
