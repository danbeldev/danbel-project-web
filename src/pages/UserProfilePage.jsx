import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {
    Avatar,
    Box,
    Container,
    Typography,
    CircularProgress,
    Stack
} from '@mui/material';
import {format} from 'date-fns';
import ApiService from '../network/API';
import ArticleList from "../components/ArticleList";
import YandexBannerAd, {YandexTapeAd} from "../components/YandexBannerAd";

const UserProfilePage = () => {
    const {id} = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await ApiService.getUserById(id);
                setUser(data);
            } catch (err) {
                setError(err.message || 'Не удалось загрузить пользователя');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id]);

    useEffect(() => {
        if (user)
            document.title = user.username;
    }, [user])

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
            <Box textAlign="center">
                <Avatar
                    src={user.avatarFileName
                        ? `https://map.matstart.ru:30/danbel-project-api/files/${user.avatarFileName}`
                        : undefined
                    }
                    alt={user.username}
                    sx={{width: 96, height: 96, margin: '0 auto', mb: 2}}
                />

                <Typography variant="h5" gutterBottom>
                    {user.username}
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{mb: 2}}>
                    {user.description}
                </Typography>

                <Stack direction="row" justifyContent="center" spacing={2} sx={{mt: 2}}>
                    <Typography variant="body2" color="text.secondary">
                        📝 Статей: <strong>{user.countArticles}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        📅 С нами с: <strong>{format(new Date(user.createdAt), 'dd MMMM yyyy')}</strong>
                    </Typography>
                </Stack>
            </Box>

            <div style={{height: "20px"}}/>

            <YandexBannerAd/>

            <div style={{height: "20px"}}/>

            <ArticleList tagIds={[]} authorIds={[id]}/>

            <div style={{height: "10px"}}/>

            <YandexTapeAd/>
        </Container>
    );
};

export default UserProfilePage;
