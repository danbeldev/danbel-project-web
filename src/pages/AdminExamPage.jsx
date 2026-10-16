import React, {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {
    Alert, Box, Breadcrumbs, Button, Chip, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogTitle,
    IconButton, Link as MuiLink, MenuItem, Paper, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ApiService from '../network/API';

const TYPE_LABEL = {CODE: 'Код', ANSWERS: 'Тест', INPUT: 'Ответ', GIT_REPO: 'Git', MYSQL_DB: 'MySQL', SSH_LAB: 'Лаб.'};

const errText = (e, fallback) => (typeof e === 'string' ? e : e?.reason || e?.message) || fallback;

// Экзамен по предмету: билеты (наборы задач) и проведение экзамена для групп.
const AdminExamPage = () => {
    const {tagId} = useParams();
    const navigate = useNavigate();
    const [tag, setTag] = useState(null);
    const [tickets, setTickets] = useState(null);
    const [events, setEvents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [error, setError] = useState(null);
    const [newTitle, setNewTitle] = useState('');
    const [eventDialog, setEventDialog] = useState(false);
    const [eventForm, setEventForm] = useState({groupId: '', title: '', durationMinutes: 90});

    const load = useCallback(async () => {
        try {
            const [t, e] = await Promise.all([ApiService.getExamTickets(tagId), ApiService.getExamEvents(tagId)]);
            setTickets(t);
            setEvents(e);
        } catch (err) {
            setError(errText(err, 'Не удалось загрузить экзамен'));
        }
    }, [tagId]);

    useEffect(() => {
        ApiService.getTagById(tagId).then(setTag).catch(() => {});
        ApiService.getAllGroups().then(setGroups).catch(() => {});
        load();
    }, [tagId, load]);

    const run = async (fn, fallback) => {
        setError(null);
        try {
            await fn();
            await load();
        } catch (err) {
            setError(errText(err, fallback));
        }
    };

    const createTicket = () => run(async () => {
        await ApiService.createExamTicket(tagId, newTitle);
        setNewTitle('');
    }, 'Не удалось создать билет');

    const renameTicket = (t) => {
        const title = window.prompt('Название билета', t.title);
        if (title && title.trim() && title !== t.title) run(() => ApiService.renameExamTicket(t.id, title), 'Не удалось переименовать');
    };

    const deleteTicket = (t) => {
        if (window.confirm(`Удалить билет «${t.title}»?`)) run(() => ApiService.deleteExamTicket(t.id), 'Не удалось удалить билет');
    };

    const removeProblem = (t, p) => {
        if (window.confirm(`Убрать задачу «${p.title}» из билета?`)) run(() => ApiService.removeExamProblem(t.id, p.id), 'Не удалось убрать задачу');
    };

    const createEvent = () => run(async () => {
        const id = await ApiService.createExamEvent({
            tagId: Number(tagId),
            groupId: Number(eventForm.groupId),
            title: eventForm.title,
            durationMinutes: Number(eventForm.durationMinutes),
        });
        setEventDialog(false);
        navigate(`/admin/exam-events/${id}`);
    }, 'Не удалось создать экзамен');

    const deleteEvent = (e, ev) => {
        e.stopPropagation();
        if (window.confirm(`Удалить экзамен «${ev.title}»?`)) run(() => ApiService.deleteExamEvent(ev.id), 'Не удалось удалить экзамен');
    };

    if (!tickets && !error) return <Box display="flex" justifyContent="center" py={8}><CircularProgress/></Box>;
    if (!tickets) return <Container maxWidth="md" sx={{py: 4}}><Alert severity="error">{error}</Alert></Container>;

    return (
        <Container maxWidth="md" sx={{py: 4}}>
            <Breadcrumbs sx={{mb: 2}}>
                <MuiLink component={Link} to="/groups" underline="hover" color="inherit">Группы</MuiLink>
                <Typography color="text.primary">Экзамен{tag ? `: ${tag.name}` : ''}</Typography>
            </Breadcrumbs>
            {error && <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>{error}</Alert>}

            <Typography variant="h6" fontWeight={700} gutterBottom>Экзамены</Typography>
            <Typography variant="body2" color="text.secondary" sx={{mb: 1.5}}>
                Экзамен проводится для группы: общая длительность на студента, а доступ и билет вы выдаёте каждому отдельно.
            </Typography>
            <Stack spacing={1} sx={{mb: 1.5}}>
                {events.length === 0 && <Typography variant="body2" color="text.disabled">Пока нет ни одного экзамена.</Typography>}
                {events.map((ev) => (
                    <Paper key={ev.id} variant="outlined" sx={{p: 1.5, borderRadius: 2, cursor: 'pointer'}} onClick={() => navigate(`/admin/exam-events/${ev.id}`)}>
                        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
                            <Typography fontWeight={700} sx={{flex: 1, minWidth: 200}}>{ev.title}</Typography>
                            <Chip size="small" label={ev.groupName}/>
                            <Chip size="small" variant="outlined" label={`${ev.durationMinutes} мин`}/>
                            <Chip size="small" variant="outlined" label={`начали ${ev.started} из ${ev.students}`}/>
                            <Tooltip title="Удалить (только если доступ ещё не выдавался)">
                                <IconButton size="small" onClick={(e) => deleteEvent(e, ev)}><DeleteOutlineIcon fontSize="small"/></IconButton>
                            </Tooltip>
                        </Stack>
                    </Paper>
                ))}
            </Stack>
            <Button variant="contained" startIcon={<AddIcon/>} onClick={() => setEventDialog(true)} disabled={tickets.length === 0}>
                Создать экзамен для группы
            </Button>
            {tickets.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ml: 1}}>Сначала создайте билеты</Typography>}

            <Typography variant="h6" fontWeight={700} sx={{mt: 5}} gutterBottom>Билеты</Typography>
            <Typography variant="body2" color="text.secondary" sx={{mb: 1.5}}>
                Билет — набор задач любых типов. Студенту при выдаче доступа достаётся случайный билет без повторов в группе (пока билетов хватает).
                Задачи в билет добавляются запросом <code>POST /exams/tickets/{'{id}'}/problems</code> — тело такое же, как у создания задачи лекции
                (<code>articleId</code> не нужен); тест-кейсы и варианты ответов задаются как обычно через <code>/problems/{'{id}'}/test-cases</code> и
                <code> /answers</code>.
            </Typography>
            <Stack spacing={1.5} sx={{mb: 2}}>
                {tickets.map((t) => (
                    <Paper key={t.id} variant="outlined" sx={{p: 2, borderRadius: 2}}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography fontWeight={700} sx={{flex: 1}}>{t.title}</Typography>
                            {t.used && <Chip size="small" variant="outlined" label="выдавался"/>}
                            <IconButton size="small" onClick={() => renameTicket(t)}><EditOutlinedIcon fontSize="small"/></IconButton>
                            <IconButton size="small" onClick={() => deleteTicket(t)}><DeleteOutlineIcon fontSize="small"/></IconButton>
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{mt: 1}}>
                            {t.problems.length === 0 && <Typography variant="body2" color="text.disabled">В билете нет задач</Typography>}
                            {t.problems.map((p) => (
                                <Chip
                                    key={p.id}
                                    size="small"
                                    clickable
                                    label={`${p.title} · ${TYPE_LABEL[p.type] || p.type}`}
                                    onClick={() => navigate(`/problems/${p.id}`)}
                                    onDelete={t.used ? undefined : () => removeProblem(t, p)}
                                    deleteIcon={<CloseIcon/>}
                                />
                            ))}
                        </Stack>
                    </Paper>
                ))}
            </Stack>
            <Stack direction="row" spacing={1}>
                <TextField size="small" label="Название билета" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && newTitle.trim() && createTicket()}/>
                <Button variant="outlined" startIcon={<AddIcon/>} disabled={!newTitle.trim()} onClick={createTicket}>Добавить билет</Button>
            </Stack>

            <Dialog open={eventDialog} onClose={() => setEventDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Новый экзамен</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{pt: 1}}>
                        <TextField select label="Группа" value={eventForm.groupId} onChange={(e) => setEventForm({...eventForm, groupId: e.target.value})}>
                            {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
                        </TextField>
                        <TextField label="Название (необязательно)" value={eventForm.title} onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                                   placeholder={`Экзамен — ${tag?.name || ''}`}/>
                        <TextField type="number" label="Минут на студента" value={eventForm.durationMinutes}
                                   onChange={(e) => setEventForm({...eventForm, durationMinutes: e.target.value})}
                                   helperText="Время отсчитывается с момента выдачи доступа студенту; продлить можно каждому отдельно"/>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEventDialog(false)}>Отмена</Button>
                    <Button variant="contained" disabled={!eventForm.groupId || !(Number(eventForm.durationMinutes) > 0)} onClick={createEvent}>Создать</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminExamPage;
