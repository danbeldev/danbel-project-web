import React, { useEffect, useState } from 'react';
import {
    Avatar,
    Box,
    Container,
    Typography,
    Grid,
    CircularProgress
} from '@mui/material';
import ApiService from '../network/API';
import EvaluationList from '../components/EvaluationList';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export const ProfilePage = () => {
    const [evaluations, setEvaluations] = useState([]);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        ApiService.getEvaluations().then((res) => setEvaluations(res));
        ApiService.getMeUser().then((res) => setProfile(res));
    }, []);

    if (!profile) {
        return (
            <Box display="flex" justifyContent="center" py={10}>
                <CircularProgress />
            </Box>
        );
    }

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
                            ? `https://map.matstart.ru:30/danbel-project-api/files/${profile.avatarFileName}`
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

            <Typography variant="h6" fontWeight="medium" gutterBottom>
                Оценки
            </Typography>

            <Box width="100%" maxWidth="1000px" mx="auto">
                <EvaluationList items={evaluations} />
            </Box>
        </Container>
    );
};
