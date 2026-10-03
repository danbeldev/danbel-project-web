import React, {useEffect, useRef, useState} from 'react';
import {
    Box,
    Button,
    Container,
    MenuItem,
    TextField,
    Typography,
    CircularProgress,
    Snackbar,
    Alert,
    Stack,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import {useForm, Controller} from 'react-hook-form';
import {useNavigate, useParams} from 'react-router-dom';
import ApiService from '../network/API';
import TextareaAutosize from 'react-textarea-autosize';

// Убираем всё, что не буква/цифра/точка/дефис — иначе кириллица или пробелы
// в исходном имени файла превратятся в мусорный путь на сервере.
const sanitizeFilename = (name) => {
    const dotIndex = name.lastIndexOf('.');
    const ext = (dotIndex >= 0 ? name.slice(dotIndex) : '').replace(/[^a-zA-Z0-9.]/g, '');
    const base = (dotIndex >= 0 ? name.slice(0, dotIndex) : name)
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9\-_]/g, '');
    return `${Date.now()}-${base || 'file'}${ext}`;
};

const CreateArticlePage = () => {
    const {id} = useParams();
    const navigate = useNavigate();

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: {errors, isSubmitting}
    } = useForm();

    const [tags, setTags] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loadingArticle, setLoadingArticle] = useState(!!id);
    const [coverUploading, setCoverUploading] = useState(false);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
    const [defaultCovers, setDefaultCovers] = useState([]);
    const [imageUploading, setImageUploading] = useState(false);
    const contentInputRef = useRef(null);

    const handlePoolCoverSelect = (filename, onChange) => {
        onChange(filename);
        setCoverPreviewUrl(ApiService.getFileUrl(filename));
    };

    const handleCoverSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const filename = sanitizeFilename(file.name);
        setCoverUploading(true);
        setError(null);
        try {
            await ApiService.uploadFile(file, filename);
            setValue('coverFileName', filename);
            setCoverPreviewUrl(ApiService.getFileUrl(filename));
        } catch (err) {
            setError('Не удалось загрузить обложку');
        } finally {
            setCoverUploading(false);
            e.target.value = '';
        }
    };

    const handleInsertImage = async (e, currentValue, onChange) => {
        const file = e.target.files[0];
        if (!file) return;

        const filename = sanitizeFilename(file.name);
        setImageUploading(true);
        setError(null);
        try {
            await ApiService.uploadFile(file, filename);
            const url = ApiService.getFileUrl(filename);
            const insertion = `![${file.name}](${url})`;
            const textarea = contentInputRef.current;
            const value = currentValue || '';

            if (textarea) {
                const start = textarea.selectionStart ?? value.length;
                const end = textarea.selectionEnd ?? value.length;
                onChange(value.slice(0, start) + insertion + value.slice(end));
            } else {
                onChange(value + insertion);
            }
        } catch (err) {
            setError('Не удалось загрузить изображение');
        } finally {
            setImageUploading(false);
            e.target.value = '';
        }
    };

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

    // Готовый пул обложек, из которого можно выбрать вместо загрузки своей
    useEffect(() => {
        ApiService.getDefaultCovers().then(setDefaultCovers).catch(() => {});
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
                if (data.coverFileName) {
                    setCoverPreviewUrl(ApiService.getFileUrl(data.coverFileName));
                }
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
                        <Box sx={{mt: 1}}>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{mb: 1}}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    component="label"
                                    startIcon={imageUploading ? <CircularProgress size={16}/> : <ImageIcon/>}
                                    disabled={imageUploading}
                                >
                                    Вставить картинку
                                    <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={(e) => handleInsertImage(e, field.value, field.onChange)}
                                    />
                                </Button>
                                <Typography variant="caption" color="text.secondary">
                                    Курсор в тексте — куда вставится ссылка на картинку
                                </Typography>
                            </Stack>
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
                                inputRef={contentInputRef}
                                error={!!errors.content}
                                helperText={errors.content?.message}
                            />
                        </Box>
                    )}
                />

                <Controller
                    name="coverFileName"
                    control={control}
                    render={({field}) => (
                        <Box sx={{mt: 2}}>
                            <Typography variant="subtitle2" gutterBottom>
                                Обложка статьи
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{mb: 1}}>
                                Выберите готовую обложку или загрузите свою. Если не выбрать — при публикации подставится первая из набора.
                            </Typography>

                            {defaultCovers.length > 0 && (
                                <Stack direction="row" spacing={1.5} sx={{mb: 2, flexWrap: 'wrap'}}>
                                    {defaultCovers.map((filename) => (
                                        <Box
                                            key={filename}
                                            component="img"
                                            src={ApiService.getFileUrl(filename)}
                                            alt={filename}
                                            onClick={() => handlePoolCoverSelect(filename, field.onChange)}
                                            sx={{
                                                width: 110,
                                                height: 62,
                                                objectFit: 'cover',
                                                borderRadius: 1.5,
                                                cursor: 'pointer',
                                                border: '3px solid',
                                                borderColor: field.value === filename ? 'primary.main' : 'transparent',
                                                opacity: field.value === filename ? 1 : 0.85,
                                                transition: 'all 0.15s',
                                                '&:hover': {opacity: 1},
                                            }}
                                        />
                                    ))}
                                </Stack>
                            )}

                            {coverPreviewUrl && (
                                <Box
                                    component="img"
                                    src={coverPreviewUrl}
                                    alt="Обложка"
                                    sx={{width: '100%', maxWidth: 360, borderRadius: 2, mb: 1, display: 'block'}}
                                />
                            )}

                            <input type="hidden" {...field} />

                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={coverUploading ? <CircularProgress size={16}/> : <ImageIcon/>}
                                disabled={coverUploading}
                            >
                                {coverPreviewUrl ? 'Заменить обложку' : 'Загрузить обложку'}
                                <input type="file" accept="image/*" hidden onChange={handleCoverSelect}/>
                            </Button>
                        </Box>
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
