import React, {useState} from 'react';
import {Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Collapse, Stack, TextField, Typography} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ApiService from '../network/API';

const FIELDS = [
    {key: 'placeOfPractice', label: 'Место практики', hint: 'Где вы будете проходить практику', multiline: false},
    {key: 'topic', label: 'Тема', hint: 'Тема прошлого года', multiline: false},
    {key: 'description', label: 'Описание', hint: 'Чем занимается организация, в которой вы проходите практику', multiline: true},
];

const formatSaved = (iso) =>
    new Date(iso).toLocaleString('ru-RU', {
        timeZone: 'Europe/Samara',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

// Карточка курсовой в профиле студента. Пока тема не утверждена — поля редактируемые (все обязательные)
// и есть кнопка "Сохранить". После утверждения admin'ом — только просмотр.
const CourseworkCard = ({submission, onSaved}) => {
    const [values, setValues] = useState({
        placeOfPractice: submission.placeOfPractice || '',
        topic: submission.topic || '',
        description: submission.description || '',
    });
    const [touched, setTouched] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [open, setOpen] = useState(false);

    const isEmpty = (key) => !values[key].trim();
    const filled = FIELDS.every((f) => !isEmpty(f.key));
    const nothingYet = FIELDS.every((f) => !(submission[f.key] || '').trim());

    const change = (key) => (e) => {
        setValues((prev) => ({...prev, [key]: e.target.value}));
        setSuccess(false);
        setError(null);
    };

    const handleSave = async () => {
        setTouched(true);
        setSuccess(false);
        setError(null);
        if (!filled) {
            setError('Заполните все поля — они обязательны');
            return;
        }
        setSaving(true);
        try {
            const userId = localStorage.getItem('userId');
            await ApiService.updateCourseworkSubmission(submission.courseworkId, userId, {
                placeOfPractice: values.placeOfPractice.trim(),
                topic: values.topic.trim(),
                description: values.description.trim(),
            });
            setSuccess(true);
            setOpen(false);
            onSaved && onSaved();
        } catch (err) {
            setError((typeof err === 'string' ? err : err?.message) || 'Не удалось сохранить. Попробуйте ещё раз');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card variant="outlined" sx={{borderRadius: 2, mb: 2}}>
            <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{mb: 1}}>
                    <Typography variant="h6" fontWeight={600}>
                        {submission.courseworkTitle}
                    </Typography>
                    {submission.approved ? (
                        <Chip size="small" color="success" label="Утверждено"/>
                    ) : nothingYet ? (
                        <Chip size="small" color="warning" label="Не заполнено"/>
                    ) : (
                        <Chip size="small" label="На проверке"/>
                    )}
                </Stack>

                {!open && (
                    <Box>
                        {success && <Alert severity="success" sx={{mb: 1.5}}>Сохранено. Данные отправлены преподавателю.</Alert>}
                        {!success && nothingYet && !submission.approved && (
                            <Typography variant="body2" color="text.secondary" sx={{mb: 1.5}}>
                                Нужно указать место практики, тему и описание.
                            </Typography>
                        )}
                        {!nothingYet && (
                            <Box sx={{mb: 1.5}}>
                                <Typography variant="body2" color="text.secondary">Место практики</Typography>
                                <Typography variant="body1">{submission.placeOfPractice || '—'}</Typography>
                                {submission.savedAt && (
                                    <Typography variant="caption" color="text.secondary">
                                        Последнее сохранение: {formatSaved(submission.savedAt)}
                                    </Typography>
                                )}
                            </Box>
                        )}
                        <Button
                            variant={nothingYet ? 'contained' : 'outlined'}
                            startIcon={<EditOutlinedIcon/>}
                            onClick={() => { setOpen(true); setSuccess(false); }}
                        >
                            {submission.approved ? 'Показать данные' : nothingYet ? 'Заполнить' : 'Изменить'}
                        </Button>
                    </Box>
                )}

                <Collapse in={open} unmountOnExit>
                    {submission.approved ? (
                        <Box>
                            <Alert severity="success" sx={{mb: 2}}>Тема утверждена преподавателем. Изменить данные нельзя.</Alert>
                            {FIELDS.map((f) => (
                                <Box key={f.key} sx={{mb: 1.5}}>
                                    <Typography variant="body2" color="text.secondary">{f.label}</Typography>
                                    <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}>{submission[f.key] || '—'}</Typography>
                                </Box>
                            ))}
                            <Button onClick={() => setOpen(false)}>Свернуть</Button>
                        </Box>
                    ) : (
                        <Box>
                            {FIELDS.map((f) => {
                                const invalid = touched && isEmpty(f.key);
                                return (
                                    <TextField
                                        key={f.key}
                                        label={f.label}
                                        required
                                        fullWidth
                                        multiline={f.multiline}
                                        minRows={f.multiline ? 3 : undefined}
                                        margin="dense"
                                        value={values[f.key]}
                                        onChange={change(f.key)}
                                        error={invalid}
                                        helperText={invalid ? 'Обязательное поле' : f.hint}
                                        disabled={saving}
                                    />
                                );
                            })}

                            {error && <Alert severity="error" sx={{mt: 1.5}}>{error}</Alert>}

                            <Stack direction="row" alignItems="center" spacing={1} sx={{mt: 2}}>
                                <Button
                                    variant="contained"
                                    startIcon={saving ? <CircularProgress size={16} color="inherit"/> : <SaveOutlinedIcon/>}
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Сохраняем…' : 'Сохранить'}
                                </Button>
                                <Button onClick={() => setOpen(false)} disabled={saving}>Отмена</Button>
                            </Stack>
                        </Box>
                    )}
                </Collapse>
            </CardContent>
        </Card>
    );
};

export default CourseworkCard;
