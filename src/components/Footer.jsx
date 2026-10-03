import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Link as MuiLink, Stack, Grid, Divider, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import CodeIcon from '@mui/icons-material/Code';
import ApiService from '../network/API';

const PROJECTS = [
    { name: 'Alice-ktx', url: 'https://github.com/danbeldev/alice-ktx' },
    { name: 'Remote-ops', url: 'https://github.com/danbeldev/remote-ops' },
    { name: 'Firebase-App-Check-Spring', url: 'https://github.com/danbeldev/firebase-app-check-spring' },
];

const Footer = () => {
    const theme = useTheme();
    const [tags, setTags] = useState([]);

    useEffect(() => {
        ApiService.getAllTags()
            .then(setTags)
            .catch(() => setTags([]));
    }, []);

    return (
        <Box
            component="footer"
            sx={{
                mt: 8,
                pt: 6,
                pb: 3,
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* Бренд */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                            <CodeIcon sx={{ color: theme.palette.primary.main }} />
                            <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
                                DanBel
                            </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
                            Платформа с лекциями и практическими задачами по программированию
                            с автоматической проверкой решений.
                        </Typography>
                    </Grid>

                    {/* Разделы */}
                    {tags.length > 0 && (
                        <Grid item xs={6} sm={3} md={2.5}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                                Разделы
                            </Typography>
                            <Stack spacing={1}>
                                {tags.slice(0, 6).map((tag) => (
                                    <MuiLink
                                        key={tag.id}
                                        component={RouterLink}
                                        to={`/tags/${tag.id}`}
                                        color="text.secondary"
                                        underline="hover"
                                        variant="body2"
                                    >
                                        {tag.name}
                                    </MuiLink>
                                ))}
                            </Stack>
                        </Grid>
                    )}

                    {/* Проекты автора */}
                    <Grid item xs={6} sm={3} md={2.5}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                            Проекты
                        </Typography>
                        <Stack spacing={1}>
                            {PROJECTS.map((project) => (
                                <MuiLink
                                    key={project.name}
                                    href={project.url}
                                    target="_blank"
                                    rel="noopener"
                                    color="text.secondary"
                                    underline="hover"
                                    variant="body2"
                                >
                                    {project.name}
                                </MuiLink>
                            ))}
                        </Stack>
                    </Grid>

                    {/* Контакты */}
                    <Grid item xs={12} sm={12} md={3}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                            Информация
                        </Typography>
                        <Stack spacing={1}>
                            <MuiLink
                                href="https://github.com/danbeldev"
                                target="_blank"
                                rel="noopener"
                                color="text.secondary"
                                underline="hover"
                                variant="body2"
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                            >
                                <GitHubIcon fontSize="small" /> GitHub
                            </MuiLink>
                            <MuiLink
                                href="https://habr.com/ru/users/danbel/"
                                target="_blank"
                                rel="noopener"
                                color="text.secondary"
                                underline="hover"
                                variant="body2"
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                            >
                                <LanguageIcon fontSize="small" /> Habr
                            </MuiLink>
                            <MuiLink
                                component={RouterLink}
                                to="/privacy"
                                color="text.secondary"
                                underline="hover"
                                variant="body2"
                            >
                                О проекте и контакты
                            </MuiLink>
                            <MuiLink
                                component={RouterLink}
                                to="/privacy-policy"
                                color="text.secondary"
                                underline="hover"
                                variant="body2"
                            >
                                Политика конфиденциальности
                            </MuiLink>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="body2" color="text.secondary" textAlign="center">
                    © {new Date().getFullYear()} DanBel — платформа для обучения программированию
                </Typography>
            </Container>
        </Box>
    );
};

export default Footer;
