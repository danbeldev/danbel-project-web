import React from 'react';
import { Container, Typography, Box, Link as MuiLink } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';

export const PrivacyPage = () => {
    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                О проекте и контакты
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                DanBel — учебная платформа с лекциями и практическими задачами по программированию,
                сетевому администрированию и базам данных для студентов колледжа. Здесь публикуются
                лекции, практические работы (код, git-репозитории, SSH-лабы, MySQL) и ведётся учёт
                прогресса студентов.
            </Typography>

            <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
                Контакты
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GitHubIcon fontSize="small" />
                    <MuiLink href="https://github.com/danbeldev" target="_blank" rel="noopener">
                        github.com/danbeldev
                    </MuiLink>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" />
                    <MuiLink href="mailto:dan.bel.89@bk.ru">
                        dan.bel.89@bk.ru
                    </MuiLink>
                </Box>
            </Box>
        </Container>
    );
};

export default PrivacyPage;
