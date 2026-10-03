// components/ArticleCard.jsx
import React from 'react';
import {
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Typography,
    Avatar,
    Stack,
    Box,
    Chip,
    IconButton,
    Tooltip,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';
import {useNavigate} from 'react-router-dom';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import ApiService from "../network/API";

const ArticleCard = ({article}) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    // Минимум 190px — требование Яндекса для рекламного формата In-Image
    // (реклама поверх обложки): если изображение ниже, блок просто не рендерится.
    const coverHeight = 190;

    const authorInitial = article.author.username?.[0]?.toUpperCase();

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                boxShadow: isMobile ? 1 : 4,
                position: 'relative',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                    transform: isMobile ? 'none' : 'translateY(-6px)',
                    boxShadow: isMobile ? 1 : 12,
                },
                '&:hover .article-edit-btn': {
                    opacity: 1,
                }
            }}
        >
            {ApiService.isAdmin() && (
                <Tooltip title="Редактировать">
                    <IconButton
                        className="article-edit-btn"
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate('/articles/edit/' + article.id);
                        }}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 2,
                            opacity: isMobile ? 1 : 0,
                            transition: 'opacity 0.2s ease',
                            backgroundColor: 'rgba(0,0,0,0.45)',
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.65)',
                            }
                        }}
                    >
                        <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}

            <CardActionArea onClick={() => navigate(`/articles/${article.id}`)} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                {article.coverFileName ? (
                    <CardMedia
                        component="img"
                        height={coverHeight}
                        image={ApiService.getFileUrl(article.coverFileName)}
                        alt={article.title}
                        sx={{ objectFit: 'cover' }}
                    />
                ) : (
                    <Box
                        sx={{
                            height: coverHeight,
                            background: theme.palette.mode === 'light'
                                ? 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)'
                                : 'linear-gradient(135deg, #5e60ce 0%, #1e293b 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <MenuBookRoundedIcon sx={{ fontSize: coverHeight * 0.4, color: 'rgba(255,255,255,0.85)' }} />
                    </Box>
                )}

                <CardContent sx={{flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column', p: isMobile ? 1.5 : 2}}>
                    <Typography
                        variant={isMobile ? "subtitle1" : "h6"}
                        component="h2"
                        sx={{
                            fontWeight: 600,
                            mb: 1,
                            fontSize: isMobile ? '1rem' : '1.25rem'
                        }}
                    >
                        {article.title}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mb: isMobile ? 1.5 : 2,
                            fontSize: isMobile ? '0.8rem' : '0.875rem',
                            display: '-webkit-box',
                            WebkitLineClamp: isMobile ? 2 : 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}
                    >
                        {article.shortDescription}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: isMobile ? 1.5 : 2 }}>
                        {article.tags.map((tag) => (
                            <Chip
                                key={tag.id}
                                label={tag.name}
                                size={isMobile ? "small" : "medium"}
                                color="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/tags/${tag.id}`);
                                }}
                                sx={{
                                    fontSize: isMobile ? '0.65rem' : '0.75rem',
                                    height: isMobile ? 24 : 32
                                }}
                            />
                        ))}
                    </Box>

                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mt: 'auto' }}
                    >
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate("/users/" + article.author.id);
                            }}
                            sx={{ '&:hover': { opacity: 0.8 } }}
                        >
                            <Avatar
                                alt={article.author.username}
                                src={
                                    article.author.avatarFileName
                                        ? ApiService.getFileUrl(article.author.avatarFileName)
                                        : undefined
                                }
                                sx={{
                                    width: isMobile ? 26 : 30,
                                    height: isMobile ? 26 : 30,
                                    fontSize: '0.8rem',
                                    bgcolor: theme.palette.primary.main
                                }}
                            >
                                {!article.author.avatarFileName && authorInitial}
                            </Avatar>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontSize: isMobile ? '0.75rem' : '0.8rem' }}
                            >
                                {article.author.username}
                            </Typography>
                        </Stack>

                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                        >
                            {format(new Date(article.createdAt), 'd MMM yyyy', { locale: ru })}
                        </Typography>
                    </Stack>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default ArticleCard;
