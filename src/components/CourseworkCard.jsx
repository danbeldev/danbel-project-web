import React, {useState} from 'react';
import {Box, Card, CardContent, Typography, TextField, Button, Chip, CircularProgress, Stack} from '@mui/material';
import ApiService from '../network/API';

// Карточка курсовой в профиле студента. Пока тема не утверждена — поля редактируемые
// и есть кнопка "Сохранить". После утверждения admin'ом — только просмотр.
const CourseworkCard = ({submission, onSaved}) => {
    const [placeOfPractice, setPlaceOfPractice] = useState(submission.placeOfPractice || '');
    const [topic, setTopic] = useState(submission.topic || '');
    const [description, setDescription] = useState(submission.description || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const userId = localStorage.getItem('userId');
            await ApiService.updateCourseworkSubmission(submission.courseworkId, userId, {
                placeOfPractice,
                topic,
                description,
            });
            onSaved && onSaved();
        } catch (err) {
            setError(err.message || 'Не удалось сохранить');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card variant="outlined" sx={{borderRadius: 2, mb: 2}}>
            <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{mb: 1.5}}>
                    <Typography variant="h6" fontWeight={600}>
                        {submission.courseworkTitle}
                    </Typography>
                    {submission.approved ? (
                        <Chip size="small" color="success" label="Утверждено"/>
                    ) : (
                        <Chip size="small" label="Черновик"/>
                    )}
                </Stack>

                {submission.approved ? (
                    <Box>
                        <Typography variant="body2" color="text.secondary">Место практики</Typography>
                        <Typography variant="body1" sx={{mb: 1.5}}>{submission.placeOfPractice || '—'}</Typography>

                        <Typography variant="body2" color="text.secondary">Тема</Typography>
                        <Typography variant="body1" sx={{mb: 1.5}}>{submission.topic || '—'}</Typography>

                        <Typography variant="body2" color="text.secondary">Описание</Typography>
                        <Typography variant="body1">{submission.description || '—'}</Typography>
                    </Box>
                ) : (
                    <Box>
                        <TextField
                            label="Место практики"
                            fullWidth
                            margin="dense"
                            value={placeOfPractice}
                            onChange={(e) => setPlaceOfPractice(e.target.value)}
                        />
                        <TextField
                            label="Тема"
                            fullWidth
                            margin="dense"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                        <TextField
                            label="Описание"
                            fullWidth
                            multiline
                            minRows={2}
                            margin="dense"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />

                        {error && <Typography color="error" variant="body2" sx={{mt: 1}}>{error}</Typography>}

                        <Button
                            variant="contained"
                            size="small"
                            sx={{mt: 1.5}}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? <CircularProgress size={18}/> : 'Сохранить'}
                        </Button>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default CourseworkCard;
