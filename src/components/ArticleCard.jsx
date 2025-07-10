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
    useMediaQuery,
    useTheme
} from '@mui/material';
import {format} from 'date-fns';
import {useNavigate} from 'react-router-dom';
import {EditIcon} from "lucide-react";
import ApiService from "../network/API";

const ArticleCard = ({article}) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                boxShadow: isMobile ? 1 : 4,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                    transform: isMobile ? 'none' : 'translateY(-8px)',
                    boxShadow: isMobile ? 1 : 12,
                }
            }}
            onClick={() => navigate(`/articles/${article.id}`)}
        >
            <CardActionArea>
                {article.coverFileName && (
                    <CardMedia
                        component="img"
                        height={isMobile ? "140" : "180"}
                        image={`https://map.matstart.ru:30/danbel-project-api/files/${article.coverFileName}`}
                        alt={article.title}
                        sx={{ objectFit: 'cover' }}
                    />
                )}

                <CardContent sx={{flexGrow: 1, p: isMobile ? 1.5 : 2}}>
                    <Typography
                        variant={isMobile ? "subtitle1" : "h6"}
                        component="h2"
                        sx={{
                            fontWeight: 600,
                            mb: isMobile ? 1 : 2,
                            fontSize: isMobile ? '1rem' : '1.25rem'
                        }}
                    >
                        {article.title}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        paragraph
                        sx={{
                            fontSize: isMobile ? '0.8rem' : '0.875rem',
                            display: '-webkit-box',
                            WebkitLineClamp: isMobile ? 2 : 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}
                    >
                        {article.shortDescription}
                    </Typography>

                    {/* Author info */}
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: isMobile ? 1 : 2 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate("/users/" + article.author.id);
                        }}
                    >
                        <Avatar
                            alt={article.author.username}
                            src={
                                article.author.avatarFileName
                                    ? `https://map.matstart.ru:30/danbel-project-api/files/${article.author.avatarFileName}`
                                    : undefined
                            }
                            sx={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32 }}
                        />
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        >
                            {article.author.username}
                        </Typography>
                    </Stack>

                    <Box sx={{ mb: 1 }}>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                        >
                            {format(new Date(article.createdAt), 'MMMM d, yyyy')}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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

                    { ApiService.isAdmin() &&
                        <>
                            <div style={{height: "10px"}}/>
                            <EditIcon onClick={(e) => {
                                e.stopPropagation();
                                navigate('/articles/edit/' + article.id)
                            }}/>
                        </>
                    }
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default ArticleCard;