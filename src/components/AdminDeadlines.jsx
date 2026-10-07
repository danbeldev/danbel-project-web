import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Box, Button, Stack, TextField, Typography} from '@mui/material';
import {format} from 'date-fns';
import ApiService from '../network/API';
import {getTimezoneLabel} from './DeadlineBanner';

// "yyyy-MM-ddTHH:mm" в локальной зоне — формат значения для datetime-local.
const toInputValue = (iso) => (iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : '');

// Срок сдачи лекции по группам — для админа на странице редактирования лекции.
const AdminDeadlines = ({articleId}) => {
    const [rows, setRows] = useState([]);
    const [values, setValues] = useState({});
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        const data = await ApiService.getDeadlines(articleId);
        setRows(data);
        setValues(Object.fromEntries(data.map((r) => [r.groupId, toInputValue(r.closesAt)])));
    }, [articleId]);

    useEffect(() => {
        load().catch(() => {});
    }, [load]);

    const save = async (groupId, value) => {
        await ApiService.setDeadline(articleId, groupId, value ? new Date(value).toISOString() : null);
        await load();
        setMessage('Срок сохранён');
    };

    const recalc = async (groupId) => {
        await ApiService.recalculateGroupGrades(articleId, groupId);
        setMessage('Оценки пересчитаны');
    };

    const sendReport = async (row) => {
        const ok = window.confirm(
            `Отправить итоги по оценкам группе ${row.groupName}?\n\n` +
            'Список оценок уйдёт в чат группы в Max, а каждому студенту — в Telegram. ' +
            'Отправка сработает даже если проверены не все работы и даже если итоги уже отправлялись.');
        if (!ok) return;
        setError(null);
        try {
            await ApiService.sendGradesReport(articleId, row.groupId);
            setMessage(`Итоги группы ${row.groupName} поставлены в отправку`);
        } catch (e) {
            setError(typeof e === 'string' ? e : (e?.message || 'Не удалось отправить итоги'));
        }
    };

    if (rows.length === 0) return null;

    return (
        <Box sx={{mt: 4, p: 2, border: 1, borderColor: 'divider', borderRadius: 2}}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
                Срок сдачи по группам
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                Пусто — без ограничения. После срока приём решений закрывается, а студентам без оценки
                автоматически ставится 2. Срок можно менять и после закрытия. Когда срок истёк и проверены все работы, итоги по оценкам отправляются в чат группы (Max) и студентам (Telegram) сами; кнопка «Отправить итоги» делает это вручную. Время указывается в вашем часовом поясе: {getTimezoneLabel(new Date())}.
            </Typography>
            {message && <Alert severity="success" sx={{mb: 1}} onClose={() => setMessage(null)}>{message}</Alert>}
            {error && <Alert severity="error" sx={{mb: 1}} onClose={() => setError(null)}>{error}</Alert>}
            <Stack spacing={1.5}>
                {rows.map((row) => (
                    <Stack key={row.groupId} direction={{xs: 'column', sm: 'row'}} spacing={1} alignItems={{sm: 'center'}}>
                        <Typography sx={{minWidth: 120}}>
                            {row.groupName}{row.closed ? ' 🔒' : ''}
                        </Typography>
                        <TextField
                            type="datetime-local"
                            size="small"
                            value={values[row.groupId] ?? ''}
                            onChange={(e) => setValues((prev) => ({...prev, [row.groupId]: e.target.value}))}
                        />
                        <Button variant="contained" size="small" onClick={() => save(row.groupId, values[row.groupId])}>
                            Сохранить
                        </Button>
                        <Button size="small" onClick={() => save(row.groupId, null)}>Снять</Button>
                        <Button size="small" color="secondary" onClick={() => recalc(row.groupId)}>
                            Пересчитать оценки
                        </Button>
                        <Button size="small" color="secondary" disabled={!row.closesAt} onClick={() => sendReport(row)}>
                            Отправить итоги
                        </Button>
                    </Stack>
                ))}
            </Stack>
        </Box>
    );
};

export default AdminDeadlines;
