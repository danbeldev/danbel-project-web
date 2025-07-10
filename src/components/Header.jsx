import React, { useEffect, useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    Button,
    Box,
    Tooltip,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    ExpandMore,
    Brightness4,
    Brightness7,
    Code,
    Menu as MenuIcon
} from '@mui/icons-material';
import ApiService from '../network/API';
import { Link } from 'react-router-dom';

export const Header = ({ mode, toggleTheme }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [anchorElTags, setAnchorElTags] = useState(null);
    const [anchorElProjects, setAnchorElProjects] = useState(null);
    const [anchorElLocation, setAnchorElLocation] = useState(null);
    const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

    const [tags, setTags] = useState([]);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const data = await ApiService.getAllTags();
                setTags(data);
            } catch (err) {
                console.error('Failed to fetch tags:', err);
            }
        };
        fetchTags();
    }, []);

    const handleMenuOpen = (setter) => (event) => setter(event.currentTarget);
    const handleMenuClose = (setter) => () => setter(null);

    return (
        <AppBar position="static" elevation={1}>
            <Toolbar sx={{
                justifyContent: 'space-between',
                padding: { xs: '0 8px', sm: '0 16px' }
            }}>
                {/* Логотип - оптимизирован для мобильных */}
                <Box
                    component={Link}
                    to="/"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        padding: { xs: '6px 10px', sm: '4px 12px' },
                        borderRadius: 8,
                        backgroundColor: mode === 'light'
                            ? 'rgba(255, 255, 255, 0.7)'
                            : 'rgba(19,46,80,0.5)',
                        backdropFilter: 'blur(4px)',
                        border: mode === 'light'
                            ? '1px solid rgba(0, 0, 0, 0.05)'
                            : '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: mode === 'light'
                            ? '0 2px 6px rgba(0,0,0,0.05)'
                            : '0 2px 8px rgba(0,0,0,0.2)',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'background-color 0.3s ease, transform 0.2s ease',
                        minWidth: { xs: '40px', sm: 'auto' }, // Минимальная ширина для мобильных
                        minHeight: { xs: '40px', sm: 'auto' }, // Минимальная высота для мобильных
                        justifyContent: 'center', // Центрирование содержимого
                        '&:hover': {
                            backgroundColor: mode === 'light'
                                ? 'rgba(255, 255, 255, 0.9)'
                                : 'rgba(30, 41, 59, 0.7)',
                            transform: { xs: 'none', sm: 'translateY(-2px)' }, // Отключаем трансформацию на мобильных
                            '&:after': {
                                transform: 'scaleX(1)',
                                opacity: 1
                            }
                        },
                        '&:after': {
                            content: '""',
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            background: mode === 'light'
                                ? 'linear-gradient(45deg, #3a0ca3 0%, #4361ee 100%)'
                                : '#fff',
                            borderRadius: '0 0 8px 8px',
                            transform: 'scaleX(0)',
                            transformOrigin: 'bottom right',
                            transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease',
                            opacity: 0.7,
                            zIndex: 1
                        }
                    }}
                >
                    <Code sx={{
                        fontSize: { xs: '1.3rem', sm: '1.25rem' }, // Увеличиваем иконку на мобильных
                        color: mode === 'light' ? '#3a0ca3' : '#fff',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                            transform: 'rotate(15deg)'
                        }
                    }} />
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            fontSize: { xs: '0.9rem', sm: '1.25rem' },
                            color: mode === 'light'
                                ? 'transparent'
                                : '#fff',
                            background: mode === 'light'
                                ? 'linear-gradient(45deg, #3a0ca3 0%, #4361ee 100%)'
                                : 'none',
                            WebkitBackgroundClip: mode === 'light' ? 'text' : 'initial',
                            WebkitTextFillColor: mode === 'light' ? 'transparent' : 'initial',
                            backgroundClip: mode === 'light' ? 'text' : 'initial',
                            textFillColor: mode === 'light' ? 'transparent' : 'initial',
                            position: 'relative',
                            zIndex: 2,
                            display: { xs: 'none', sm: 'block' }, // Скрываем текст на мобильных
                            ml: { sm: 1 } // Добавляем отступ слева для текста
                        }}
                    >
                        danbel.ru
                    </Typography>
                </Box>

                {/* Правая часть: навигация и переключатель темы */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1, sm: 2 }
                }}>
                    {/* Навигация: десктоп vs мобильная */}
                    {!isMobile ? (
                        // Десктоп-навигация (справа)
                        <Box sx={{
                            display: 'flex',
                            gap: 2,
                            alignItems: 'center'
                        }}>
                            {/* Разделы */}
                            <Box>
                                <Button
                                    color="inherit"
                                    endIcon={<ExpandMore />}
                                    onClick={handleMenuOpen(setAnchorElTags)}
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                    Разделы
                                </Button>
                                <Menu
                                    anchorEl={anchorElTags}
                                    open={Boolean(anchorElTags)}
                                    onClose={handleMenuClose(setAnchorElTags)}
                                >
                                    {tags.map((tag) => (
                                        <MenuItem
                                            key={tag.id}
                                            component={Link}
                                            to={`/tags/${tag.id}`}
                                            onClick={handleMenuClose(setAnchorElTags)}
                                        >
                                            {tag.name}
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </Box>

                            {/* Проекты */}
                            <Box>
                                <Button
                                    color="inherit"
                                    endIcon={<ExpandMore />}
                                    onClick={handleMenuOpen(setAnchorElProjects)}
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                    Проекты
                                </Button>
                                <Menu
                                    anchorEl={anchorElProjects}
                                    open={Boolean(anchorElProjects)}
                                    onClose={handleMenuClose(setAnchorElProjects)}
                                >
                                    <MenuItem onClick={() => {
                                        window.open('https://github.com/danbeldev/alice-ktx', '_blank');
                                        handleMenuClose(setAnchorElProjects)
                                    }}>Alice-ktx</MenuItem>
                                    <MenuItem onClick={() => {
                                        window.open('https://github.com/danbeldev/remote-ops', '_blank');
                                        handleMenuClose(setAnchorElProjects)
                                    }}>Remote-ops</MenuItem>
                                    <MenuItem onClick={() => {
                                        window.open('https://github.com/danbeldev/firebase-app-check-spring', '_blank');
                                        handleMenuClose(setAnchorElProjects)
                                    }}>Firebase-App-Check-Spring</MenuItem>
                                </Menu>
                            </Box>

                            {/* Где я? */}
                            <Box>
                                <Button
                                    color="inherit"
                                    endIcon={<ExpandMore />}
                                    onClick={handleMenuOpen(setAnchorElLocation)}
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                    Где я?
                                </Button>
                                <Menu
                                    anchorEl={anchorElLocation}
                                    open={Boolean(anchorElLocation)}
                                    onClose={handleMenuClose(setAnchorElLocation)}
                                >
                                    <MenuItem onClick={() => {
                                        window.open('https://github.com/danbeldev', '_blank');
                                        handleMenuClose(setAnchorElLocation)
                                    }}>GitHub</MenuItem>
                                </Menu>
                            </Box>
                        </Box>
                    ) : (
                        // Мобильная навигация (справа)
                        <Box>
                            <IconButton
                                color="inherit"
                                onClick={handleMenuOpen(setMobileMenuAnchor)}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Menu
                                anchorEl={mobileMenuAnchor}
                                open={Boolean(mobileMenuAnchor)}
                                onClose={handleMenuClose(setMobileMenuAnchor)}
                                PaperProps={{
                                    sx: {
                                        maxHeight: '70vh',
                                        width: '60vw',
                                        overflow: 'auto'
                                    }
                                }}
                            >
                                {/* Разделы */}
                                <Typography variant="subtitle2" sx={{ px: 2, pt: 1, fontWeight: 'bold' }}>
                                    Разделы
                                </Typography>
                                {tags.map((tag) => (
                                    <MenuItem
                                        key={tag.id}
                                        component={Link}
                                        to={`/tags/${tag.id}`}
                                        onClick={handleMenuClose(setMobileMenuAnchor)}
                                        sx={{ pl: 3 }}
                                    >
                                        {tag.name}
                                    </MenuItem>
                                ))}

                                {/* Проекты */}
                                <Typography variant="subtitle2" sx={{ px: 2, pt: 2, fontWeight: 'bold' }}>
                                    Проекты
                                </Typography>
                                <MenuItem onClick={() => {
                                    window.open('https://github.com/danbeldev/alice-ktx', '_blank');
                                    handleMenuClose(setMobileMenuAnchor)
                                }} sx={{ pl: 3 }}>Alice-ktx</MenuItem>
                                <MenuItem onClick={() => {
                                    window.open('https://github.com/danbeldev/remote-ops', '_blank');
                                    handleMenuClose(setMobileMenuAnchor)
                                }} sx={{ pl: 3 }}>Remote-ops</MenuItem>
                                <MenuItem onClick={() => {
                                    window.open('https://github.com/danbeldev/firebase-app-check-spring', '_blank');
                                    handleMenuClose(setMobileMenuAnchor)
                                }} sx={{ pl: 3 }}>Firebase-App-Check-Spring</MenuItem>

                                {/* Где я? */}
                                <Typography variant="subtitle2" sx={{ px: 2, pt: 2, fontWeight: 'bold' }}>
                                    Где я?
                                </Typography>
                                <MenuItem onClick={() => {
                                    window.open('https://github.com/danbeldev', '_blank');
                                    handleMenuClose(setMobileMenuAnchor)
                                }} sx={{ pl: 3 }}>GitHub</MenuItem>
                            </Menu>
                        </Box>
                    )}

                    {/* Переключатель темы (виден на всех устройствах) */}
                    <Tooltip title="Сменить тему">
                        <IconButton
                            onClick={toggleTheme}
                            color="inherit"
                            size={isMobile ? "small" : "medium"}
                        >
                            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
};