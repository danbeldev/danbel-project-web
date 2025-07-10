import React from 'react';
import { Box, Container, Typography, Link, Stack, useTheme } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';

const Footer = () => {
    const theme = useTheme();

    return (
        <Box
            component="footer"
            sx={{
                mt: 8,
                py: 3,
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
            }}
        >
            <Container maxWidth="lg">
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                >
                    <Typography variant="body2" color="text.secondary">
                        © {new Date().getFullYear()} danbel.ru
                    </Typography>

                    <Stack direction="row" spacing={2}>
                        <Link
                            href="https://github.com/danbeldev"
                            target="_blank"
                            rel="noopener"
                            color="inherit"
                            underline="hover"
                        >
                            <GitHubIcon fontSize="small" /> GitHub
                        </Link>

                        <Link
                            href="https://habr.com/ru/users/danbel/"
                            target="_blank"
                            rel="noopener"
                            color="inherit"
                            underline="hover"
                        >
                            <LanguageIcon fontSize="small" /> Habr
                        </Link>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
};

export default Footer;
