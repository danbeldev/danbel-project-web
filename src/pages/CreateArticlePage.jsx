import React, {useEffect, useState} from 'react';
import {
    Box,
    Button,
    Container,
    MenuItem,
    TextField,
    Typography,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import {useForm, Controller} from 'react-hook-form';
import {useNavigate, useParams} from 'react-router-dom';
import ApiService from '../network/API';
import {FileUpload} from '../components/FileUpload';
import TextareaAutosize from 'react-textarea-autosize';

const CreateArticlePage = () => {
    const {id} = useParams();
    const navigate = useNavigate();

    const {
        control,
        handleSubmit,
        reset,
        formState: {errors, isSubmitting}
    } = useForm();

    const [tags, setTags] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loadingArticle, setLoadingArticle] = useState(!!id);

    // Загрузка тегов
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const data = await ApiService.getAllTags();
                setTags(data);
            } catch (err) {
                setError('Не удалось загрузить теги');
            }
        };

        fetchTags();
    }, []);

    // Загрузка данных статьи при редактировании
    useEffect(() => {
        if (!id) return;

        const fetchArticle = async () => {
            try {
                const data = await ApiService.getArticleById(id);
                reset({
                    title: data.title,
                    shortDescription: data.shortDescription,
                    content: data.content,
                    coverFileName: data.coverFileName,
                    tagIds: data.tags?.map(tag => tag.id) || [],
                });
            } catch (err) {
                setError('Не удалось загрузить статью');
            } finally {
                setLoadingArticle(false);
            }
        };

        fetchArticle();
    }, [id, reset]);

    // Сохранение (создание или обновление)
    const onSubmit = async (data) => {
        try {
            if (id) {
                await ApiService.updateArticle(id, {
                    ...data,
                    tagIds: data.tagIds || [],
                });
            } else {
                await ApiService.createArticle({
                    ...data,
                    tagIds: data.tagIds || [],
                });
            }
            setSuccess(true);
            setTimeout(() => navigate('/articles'), 1500);
        } catch (err) {
            setError(err.message || 'Ошибка при сохранении статьи');
        }
    };

    if (loadingArticle) {
        return (
            <Container maxWidth="md" sx={{py: 4}}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{py: 4}}>
            <Typography variant="h4" gutterBottom>
                {id ? 'Редактировать статью' : 'Добавить новую статью'}
            </Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{mt: 2}}>
                <Controller
                    name="title"
                    control={control}
                    rules={{required: 'Укажите заголовок'}}
                    render={({field}) => (
                        <TextField
                            {...field}
                            label="Заголовок"
                            fullWidth
                            margin="normal"
                            error={!!errors.title}
                            helperText={errors.title?.message}
                        />
                    )}
                />

                <Controller
                    name="shortDescription"
                    control={control}
                    rules={{required: 'Укажите краткое описание'}}
                    render={({field}) => (
                        <TextField
                            {...field}
                            label="Краткое описание"
                            fullWidth
                            margin="normal"
                            multiline
                            rows={3}
                            error={!!errors.shortDescription}
                            helperText={errors.shortDescription?.message}
                        />
                    )}
                />

                <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Содержание"
                            fullWidth
                            margin="normal"
                            multiline
                            InputProps={{
                                inputComponent: TextareaAutosize,
                                inputProps: {
                                    minRows: 6,
                                    style: { resize: 'vertical' },
                                },
                            }}
                            error={!!errors.content}
                            helperText={errors.content?.message}
                        />
                    )}
                />

                <Controller
                    name="coverFileName"
                    control={control}
                    rules={{required: 'Укажите имя файла обложки'}}
                    render={({field}) => (
                        <TextField
                            {...field}
                            label="Имя файла обложки (без загрузки)"
                            fullWidth
                            margin="normal"
                            error={!!errors.coverFileName}
                            helperText={errors.coverFileName?.message}
                        />
                    )}
                />

                <Controller
                    name="tagIds"
                    control={control}
                    defaultValue={[]}
                    render={({field}) => (
                        <TextField
                            {...field}
                            label="Теги"
                            select
                            SelectProps={{multiple: true}}
                            fullWidth
                            margin="normal"
                        >
                            {tags.map((tag) => (
                                <MenuItem key={tag.id} value={tag.id}>
                                    {tag.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                />

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    sx={{mt: 3}}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <CircularProgress size={24}/> : id ? 'Сохранить' : 'Опубликовать'}
                </Button>

                <div style={{height: "40px"}}/>

                https://map.matstart.ru:30/danbel-project-api/files/

                <FileUpload/>

                {error && (
                    <Alert severity="error" sx={{mt: 2}}>
                        {error}
                    </Alert>
                )}

                <Snackbar
                    open={success}
                    autoHideDuration={3000}
                    onClose={() => setSuccess(false)}
                >
                    <Alert severity="success" variant="filled">
                        {id ? 'Статья успешно обновлена!' : 'Статья успешно опубликована!'}
                    </Alert>
                </Snackbar>
            </Box>
        </Container>
    );
};

export default CreateArticlePage;
