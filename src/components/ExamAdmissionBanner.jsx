import React, {useEffect, useState} from 'react';
import {Alert, AlertTitle, Link as MuiLink, Stack, Typography} from '@mui/material';
import {Link} from 'react-router-dom';
import ApiService from '../network/API';

// Допуск студента к экзамену по предмету: что сдано и что осталось. Показывается, только если у предмета заданы лекции допуска.
const ExamAdmissionBanner = ({tagId}) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!localStorage.getItem('accessToken') || ApiService.isAdmin()) return;
        ApiService.getMyAdmission(tagId).then(setData).catch(() => setData(null));
    }, [tagId]);

    if (!data || !data.configured) return null;

    const admitted = data.status === 'ADMITTED';
    return (
        <Alert severity={admitted ? 'success' : 'warning'} sx={{mb: 3}}>
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
    );
};

export default ExamAdmissionBanner;
