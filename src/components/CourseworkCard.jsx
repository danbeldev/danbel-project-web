import React, {useState} from 'react';
import {Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, TextField, Typography} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
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

                {submission.approved ? (
                    <Box>
                        <Alert severity="success" sx={{mb: 2}}>Тема утверждена преподавателем. Изменить данные нельзя.</Alert>
                        {FIELDS.map((f) => (
                            <Box key={f.key} sx={{mb: 1.5}}>
                                <Typography variant="body2" color="text.secondary">{f.label}</Typography>
                                <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}>{submission[f.key] || '—'}</Typography>
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Box>
                        {nothingYet && !success && (
                            <Alert severity="warning" sx={{mb: 1}}>
                                Заполните место практики, тему и описание — все поля обязательны.
                            </Alert>
                        )}
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
                        {success && (
                            <Alert severity="success" sx={{mt: 1.5}}>
                                Сохранено. Данные отправлены преподавателю.
                            </Alert>
                        )}

                        <Stack direction="row" alignItems="center" spacing={2} sx={{mt: 2}}>
                            <Button
                                variant="contained"
                                startIcon={saving ? <CircularProgress size={16} color="inherit"/> : <SaveOutlinedIcon/>}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Сохраняем…' : 'Сохранить'}
                            </Button>
                            {submission.savedAt && (
                                <Typography variant="caption" color="text.secondary">
                                    Последнее сохранение: {formatSaved(submission.savedAt)}
                                </Typography>
                            )}
                        </Stack>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default CourseworkCard;
