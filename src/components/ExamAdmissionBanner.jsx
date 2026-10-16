import React, {useEffect, useState} from 'react';
import {Alert, AlertTitle, Box, Link as MuiLink, Paper, Stack, Typography} from '@mui/material';
import {Link} from 'react-router-dom';
import ApiService from '../network/API';

// Экзамен по предмету для студента: допуск (что сдано и что осталось) и лекции для подготовки.
// Каждый блок показывается, только если он настроен.
const ExamAdmissionBanner = ({tagId}) => {
    const [data, setData] = useState(null);
    const [prep, setPrep] = useState([]);

    useEffect(() => {
        if (!localStorage.getItem('accessToken') || ApiService.isAdmin()) return;
        ApiService.getMyAdmission(tagId).then(setData).catch(() => setData(null));
        ApiService.getExamPrep(tagId).then(setPrep).catch(() => setPrep([]));
    }, [tagId]);

    const hasAdmission = data && data.configured;
    if (!hasAdmission && prep.length === 0) return null;

    const admitted = hasAdmission && data.status === 'ADMITTED';
    return (
        <Box sx={{mb: 3}}>
            {hasAdmission && (
                <Alert severity={admitted ? 'success' : 'warning'} sx={{mb: prep.length ? 2 : 0}}>
                    <AlertTitle>{admitted ? 'Вы допущены к экзамену' : 'Допуска к экзамену пока нет'}</AlertTitle>
                    <Typography variant="body2">
                        Сдано на 3 и выше: {data.passed} из {data.required} обязательных лекций.
                        {data.manual === true && ' Допуск выдан преподавателем.'}
                        {data.manual === false && ' Преподаватель пока не допускает вас к экзамену.'}
                    </Typography>
                    {data.missing.length > 0 && (
                        <Stack sx={{mt: 1}}>
                            <Typography variant="body2" fontWeight={600}>{admitted ? 'Не сданы (допуск выдан вручную):' : 'Нужно сдать:'}</Typography>
                            {data.missing.map((m) => (
                                <MuiLink key={m.articleId} component={Link} to={`/articles/${m.articleId}`} underline="hover">
                                    {m.title}
                                </MuiLink>
                            ))}
                        </Stack>
                    )}
                </Alert>
            )}
            {prep.length > 0 && (
                <Paper variant="outlined" sx={{p: 2, borderRadius: 2}}>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>Подготовка к экзамену</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>
                        Эти лекции помогут подготовиться:
                    </Typography>
                    <Stack>
                        {prep.map((m) => (
                            <MuiLink key={m.articleId} component={Link} to={`/articles/${m.articleId}`} underline="hover">
                                {m.title}
                            </MuiLink>
                        ))}
                    </Stack>
                </Paper>
            )}
        </Box>
    );
};

export default ExamAdmissionBanner;
