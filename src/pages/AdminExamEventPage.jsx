import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {
    Alert, Box, Breadcrumbs, Button, Chip, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogTitle,
    LinearProgress, Link as MuiLink, MenuItem, Paper, Snackbar, Stack, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import ApiService from '../network/API';
import {formatLeft} from '../components/ExamTimer';

const errText = (e, fallback) => (typeof e === 'string' ? e : e?.reason || e?.message) || fallback;

const STATUS = {
    PENDING: {label: 'Принято', color: 'default'},
    SUCCESS: {label: 'Верно', color: 'success'},
    FAILED: {label: 'Неверно', color: 'error'},
    ERROR: {label: 'Ошибка', color: 'warning'},
};

const parseResult = (json) => {
    if (!json) return null;
    try {
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
};

// Короткая сводка проверки: комментарий AI или «тестов пройдено N из M».
const resultSummary = (json) => {
    const r = parseResult(json);
    if (!r) return null;
    if (Array.isArray(r)) return `Тестов пройдено: ${r.filter((t) => t.passed).length} из ${r.length}`;
    return r.comment || r.error || null;
};

// Проведение экзамена для группы: допуск, выдача билета и времени, продление, проверка, оценки.
const AdminExamEventPage = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [now, setNow] = useState(Date.now());
    const [skew, setSkew] = useState(0); // расхождение часов сервера и браузера
    const [check, setCheck] = useState(null);
    const [work, setWork] = useState(null); // {attempt, fullName, items}
    const [gradeForm, setGradeForm] = useState({grade: '', comment: ''});
    const [busy, setBusy] = useState(false);
    const checkTimer = useRef(null);

    const load = useCallback(() => {
        ApiService.getExamEvent(id).then((d) => {
            const withAttempt = d.students.find((s) => s.attempt);
            if (withAttempt) setSkew(new Date(withAttempt.attempt.serverNow).getTime() - Date.now());
            setData(d);
        }).catch((e) => setError(errText(e, 'Не удалось загрузить экзамен')));
    }, [id]);

    const pollCheck = useCallback(async () => {
        try {
            const status = await ApiService.getExamCheckStatus(id);
            setCheck(status);
            if (status.running) checkTimer.current = setTimeout(pollCheck, 3000);
            else load();
        } catch (e) {
            // не критично
        }
    }, [id, load]);

    useEffect(() => {
        load();
        pollCheck();
        const refresh = setInterval(load, 15000);
        const tick = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            clearInterval(refresh);
            clearInterval(tick);
            clearTimeout(checkTimer.current);
        };
    }, [load, pollCheck]);

    const act = async (fn, okMessage) => {
        setBusy(true);
        try {
            await fn();
            if (okMessage) setToast({severity: 'success', message: okMessage});
            load();
        } catch (e) {
            setToast({severity: 'error', message: errText(e, 'Не удалось выполнить')});
        } finally {
            setBusy(false);
        }
    };

    const grant = (row) => {
        if (row.admission !== 'ADMITTED' && row.admission !== 'NOT_CONFIGURED'
            && !window.confirm(`${row.fullName} не допущен к экзамену. Всё равно выдать билет и запустить время?`)) return;
        act(() => ApiService.grantExam(id, row.userId), `Доступ выдан: ${row.fullName}`);
    };

    const extend = (row) => {
        const value = window.prompt(`На сколько минут продлить время для ${row.fullName}?`, '15');
        const minutes = Number(value);
        if (value && minutes > 0) act(() => ApiService.extendExam(row.attempt.id, minutes), 'Время продлено');
    };

    const reset = (row) => {
        if (window.confirm(`Сбросить выдачу билета у ${row.fullName}? Билет и время будут выданы заново.`)) {
            act(() => ApiService.resetExamAttempt(row.attempt.id), 'Выдача сброшена');
        }
    };

    const startCheck = async (force) => {
        if (force && !window.confirm('Перепроверить все решения заново? Письменные ответы снова пойдут в AI.')) return;
        try {
            setCheck(await ApiService.startExamCheck(id, force));
            checkTimer.current = setTimeout(pollCheck, 2000);
        } catch (e) {
            setToast({severity: 'error', message: errText(e, 'Не удалось запустить проверку')});
        }
    };

    const openWork = async (row) => {
        try {
            const w = await ApiService.getExamWork(row.attempt.id);
            setWork(w);
            setGradeForm({grade: w.attempt.grade ?? '', comment: w.attempt.comment ?? ''});
        } catch (e) {
            setToast({severity: 'error', message: errText(e, 'Не удалось загрузить работу')});
        }
    };

    const saveGrade = async () => {
        try {
            await ApiService.gradeExamAttempt(work.attempt.id, gradeForm.grade === '' ? null : Number(gradeForm.grade), gradeForm.comment);
            setWork(null);
            setToast({severity: 'success', message: 'Оценка сохранена'});
            load();
        } catch (e) {
            setToast({severity: 'error', message: errText(e, 'Не удалось сохранить оценку')});
        }
    };

    if (error) return <Container maxWidth="lg" sx={{py: 4}}><Alert severity="error">{error}</Alert></Container>;
    if (!data) return <Box display="flex" justifyContent="center" py={8}><CircularProgress/></Box>;

    const {event, students} = data;
    const running = !!check?.running;

    const admissionChip = (a) => {
        if (a === 'NOT_CONFIGURED') return <Typography variant="body2" color="text.disabled">—</Typography>;
        return <Chip size="small" variant="outlined" color={a === 'ADMITTED' ? 'success' : 'error'} label={a === 'ADMITTED' ? 'Допущен' : 'Не допущен'}/>;
    };

    const stateCell = (row) => {
        const a = row.attempt;
        if (!a) return <Chip size="small" label="Не начат"/>;
        const left = new Date(a.endsAt).getTime() - (now + skew);
        if (a.state === 'ACTIVE' && left > 0) return <Chip size="small" color="primary" label={`Идёт · ${formatLeft(left)}`}/>;
        return <Chip size="small" variant="outlined" label="Завершён"/>;
    };

    return (
        <Container maxWidth="xl" sx={{py: 4}}>
            <Breadcrumbs sx={{mb: 2}}>
                <MuiLink component={Link} to="/groups" underline="hover" color="inherit">Группы</MuiLink>
                <MuiLink component={Link} to={`/admin/exams/${event.tagId}`} underline="hover" color="inherit">Экзамен: {event.tagName}</MuiLink>
                <Typography color="text.primary">{event.groupName}</Typography>
            </Breadcrumbs>

            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap spacing={2} sx={{mb: 2}}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>{event.title}</Typography>
                    <Typography variant="body2" color="text.secondary">Группа {event.groupName} · {event.durationMinutes} мин на студента</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="contained" disabled={running} onClick={() => startCheck(false)}>Проверить работы</Button>
                    <Button variant="outlined" disabled={running} onClick={() => startCheck(true)}>Перепроверить все</Button>
                </Stack>
            </Stack>

            <Alert severity="info" sx={{mb: 2}}>
                Во время экзамена студенты видят только «принято». После экзамена нажмите «Проверить работы»: код проверится тестами, тесты с вариантами —
                по ответам, письменные ответы — через AI; git/MySQL/лаборатории смотрите вручную. Итоговую оценку выставляете вы в «Работа и оценка».
            </Alert>
            {running && (
                <Box sx={{mb: 2}}>
                    <Typography variant="body2" sx={{mb: 0.5}}>Проверяется: {check.done} из {check.total}</Typography>
                    <LinearProgress variant={check.total ? 'determinate' : 'indeterminate'} value={check.total ? (check.done / check.total) * 100 : 0}/>
                </Box>
            )}
            {!running && check?.total > 0 && (
                <Alert severity={check.message ? 'warning' : 'success'} sx={{mb: 2}}>
                    Проверено попыток: {check.done} из {check.total}. {check.message || ''}
                </Alert>
            )}

            <TableContainer component={Paper} variant="outlined" sx={{borderRadius: 2}}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Студент</TableCell>
                            <TableCell>Допуск</TableCell>
                            <TableCell>Билет</TableCell>
                            <TableCell>Состояние</TableCell>
                            <TableCell align="center">Решений</TableCell>
                            <TableCell align="center">Оценка</TableCell>
                            <TableCell align="right">Действия</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {students.map((row) => (
                            <TableRow key={row.userId} hover>
                                <TableCell sx={{whiteSpace: 'nowrap'}}>{row.fullName}</TableCell>
                                <TableCell>{admissionChip(row.admission)}</TableCell>
                                <TableCell>{row.attempt ? row.attempt.ticketTitle : '—'}</TableCell>
                                <TableCell>{stateCell(row)}</TableCell>
                                <TableCell align="center">{row.attempt ? row.submissions : '—'}</TableCell>
                                <TableCell align="center">
                                    {row.attempt?.grade != null ? <Chip size="small" color="primary" label={row.attempt.grade}/> : '—'}
                                </TableCell>
                                <TableCell align="right" sx={{whiteSpace: 'nowrap'}}>
                                    {!row.attempt ? (
                                        <Button size="small" variant="contained" disabled={busy} onClick={() => grant(row)}>Выдать билет</Button>
                                    ) : (
                                        <>
                                            <Button size="small" onClick={() => openWork(row)}>Работа и оценка</Button>
                                            <Button size="small" disabled={busy} onClick={() => extend(row)}>+ время</Button>
                                            {row.submissions === 0 && <Button size="small" color="inherit" disabled={busy} onClick={() => reset(row)}>Сбросить</Button>}
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={Boolean(work)} onClose={() => setWork(null)} maxWidth="md" fullWidth>
                <DialogTitle>{work?.fullName} — {work?.attempt.ticketTitle}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        {work?.items.map((it, i) => (
                            <Paper key={it.problem.id} variant="outlined" sx={{p: 2, borderRadius: 2}}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{mb: 1}} flexWrap="wrap" useFlexGap>
                                    <Typography fontWeight={700} sx={{flex: 1}}>{i + 1}. {it.problem.title}</Typography>
                                    <Chip size="small" variant="outlined" label={it.problem.type}/>
                                    {it.status ? <Chip size="small" color={STATUS[it.status]?.color || 'default'} label={STATUS[it.status]?.label || it.status}/> : <Chip size="small" label="Нет решения"/>}
                                    <Button size="small" onClick={() => navigate(`/problems/${it.problem.id}`)}>Условие</Button>
                                </Stack>
                                {it.answer != null && (
                                    <Box component="pre" sx={{m: 0, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, maxHeight: 260, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13}}>
                                        {it.answer}
                                    </Box>
                                )}
                                {resultSummary(it.resultJson) && (
                                    <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>{resultSummary(it.resultJson)}</Typography>
                                )}
                            </Paper>
                        ))}
                        <Stack direction="row" spacing={2}>
                            <TextField select size="small" label="Оценка за экзамен" value={gradeForm.grade} sx={{minWidth: 160}}
                                       onChange={(e) => setGradeForm({...gradeForm, grade: e.target.value})}>
                                <MenuItem value="">Не выставлена</MenuItem>
                                {[5, 4, 3, 2].map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                            </TextField>
                            <TextField size="small" fullWidth label="Комментарий (необязательно)" value={gradeForm.comment}
                                       onChange={(e) => setGradeForm({...gradeForm, comment: e.target.value})}/>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setWork(null)}>Закрыть</Button>
                    <Button variant="contained" onClick={saveGrade}>Сохранить оценку</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)}>
                {toast ? <Alert severity={toast.severity} variant="filled">{toast.message}</Alert> : undefined}
            </Snackbar>
        </Container>
    );
};

export default AdminExamEventPage;
