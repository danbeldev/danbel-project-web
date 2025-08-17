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
    Chip
} from '@mui/material';
import ApiService from '../network/API';
import EvaluationList from '../components/EvaluationList';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import YandexBannerAd from "../components/YandexBannerAd";

export const ProfilePage = () => {
    const [evaluationsData, setEvaluationsData] = useState([]);
    const [profile, setProfile] = useState(null);
    const [currentTag, setCurrentTag] = useState(null);

    useEffect(() => {
        ApiService.getEvaluations().then((res) => {
            setEvaluationsData(res);
            if (res.length > 0) {
                setCurrentTag(res[0].tag);
            }
        });
        ApiService.getMeUser().then((res) => setProfile(res));
    }, []);

    const handleTagChange = (event, newValue) => {
        const selectedTag = evaluationsData.find(item => item.tag.id === newValue)?.tag;
        setCurrentTag(selectedTag);
    };

    if (!profile || evaluationsData.length === 0) {
        return (
            <Box display="flex" justifyContent="center" py={10}>
                <CircularProgress />
            </Box>
        );
    }

    const currentEvaluations = evaluationsData.find(item =>
        item.tag.id === currentTag?.id
    )?.evaluations || [];

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

            <div style={{height: "10px"}}/>

            <YandexBannerAd/>

            <div style={{height: "10px"}}/>

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
                <EvaluationList items={currentEvaluations} />
            </Box>
        </Container>
    );
};