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
    useTheme, Avatar,
} from '@mui/material';
import {
    ExpandMore,
    Brightness4,
    Brightness7,
    Code,
    Menu as MenuIcon, AccountCircle
} from '@mui/icons-material';
import ApiService from '../network/API';
import {Link, useNavigate} from 'react-router-dom';

export const Header = ({ mode, toggleTheme }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [anchorElTags, setAnchorElTags] = useState(null);
    const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

    const [tags, setTags] = useState([]);
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const data = await ApiService.getAllTags();
                setTags(data);
                setUser(await ApiService.getMeUser())
            } catch (err) {
                console.error('Failed to fetch tags:', err);
            }
        };
        fetchTags();
    }, []);

    const handleMenuOpen = (setter) => (event) => setter(event.currentTarget);
    const handleMenuClose = (setter) => () => setter(null);

    const handleLogout = () => {

        ApiService.logout();

        setUser(null);
        setAnchorEl(null);
    };

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogin = () => {
        navigate('/sign-in')
    }

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

                            {/* Группы (только для админа) */}
                            {ApiService.isAdmin() && (
                                <Button
                                    color="inherit"
                                    component={Link}
                                    to="/groups"
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                    Группы
                                </Button>
                            )}

                            {ApiService.isAdmin() && (
                                <Button
                                    color="inherit"
                                    component={Link}
                                    to="/admin/labs"
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                    Лаборатории
                                </Button>
                            )}

                            {ApiService.isAdmin() && (
                                <Button
                                    color="inherit"
                                    component={Link}
                                    to="/admin/git-tasks"
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                    Git-репозитории
                                </Button>
                            )}

                            {ApiService.isAdmin() && (
                                <Button
                                    color="inherit"
                                    component={Link}
                                    to="/admin/courseworks"
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                    Курсовые
                                </Button>
                            )}

                            {ApiService.isAdmin() && (
                                <Button
                                    color="inherit"
                                    component={Link}
                                    to="/admin/mysql-tasks"
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                    MySQL-базы
                                </Button>
                            )}

                            {ApiService.isAdmin() && (
                                <Button
                                    color="inherit"
                                    component={Link}
                                    to="/admin/llm"
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                    AI-расход
                                </Button>
                            )}
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

                                {ApiService.isAdmin() && (
                                    <MenuItem
                                        component={Link}
                                        to="/groups"
                                        onClick={handleMenuClose(setMobileMenuAnchor)}
                                    >
                                        Группы
                                    </MenuItem>
                                )}
                                {ApiService.isAdmin() && (
                                    <MenuItem
                                        component={Link}
                                        to="/admin/labs"
                                        onClick={handleMenuClose(setMobileMenuAnchor)}
                                    >
                                        Лаборатории
                                    </MenuItem>
                                )}
                                {ApiService.isAdmin() && (
                                    <MenuItem
                                        component={Link}
                                        to="/admin/git-tasks"
                                        onClick={handleMenuClose(setMobileMenuAnchor)}
                                    >
                                        Git-репозитории
                                    </MenuItem>
                                )}
                                {ApiService.isAdmin() && (
                                    <MenuItem
                                        component={Link}
                                        to="/admin/courseworks"
                                        onClick={handleMenuClose(setMobileMenuAnchor)}
                                    >
                                        Курсовые
                                    </MenuItem>
                                )}
                                {ApiService.isAdmin() && (
                                    <MenuItem
                                        component={Link}
                                        to="/admin/mysql-tasks"
                                        onClick={handleMenuClose(setMobileMenuAnchor)}
                                    >
                                        MySQL-базы
                                    </MenuItem>
                                )}
                                {ApiService.isAdmin() && (
                                    <MenuItem
                                        component={Link}
                                        to="/admin/llm"
                                        onClick={handleMenuClose(setMobileMenuAnchor)}
                                    >
                                        AI-расход
                                    </MenuItem>
                                )}
                            </Menu>
                        </Box>
                    )}

                    {user ? (
                        <Box>
                            <IconButton
                                size="large"
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleMenu}
                                color="inherit"
                            >
                                {user.avatarFileName ? (
                                    <Avatar
                                        alt={user.username}
                                        src={ApiService.getFileUrl(user.avatarFileName)}
                                    />
                                ) : (
                                    <AccountCircle />
                                )}
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                <MenuItem onClick={() => {
                                    handleClose()
                                    navigate('/profile')
                                }}>Профиль</MenuItem>
                                <MenuItem onClick={() => {
                                    handleClose()
                                    navigate('/notifications')
                                }}>Уведомления</MenuItem>
                                <MenuItem onClick={handleLogout}>Выйти</MenuItem>
                            </Menu>
                        </Box>
                    ) : (
                        <Button color="inherit" onClick={handleLogin}>Войти</Button>
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