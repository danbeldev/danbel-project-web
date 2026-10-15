import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ApiService from '../network/API';

const STATUS = {
    PENDING: {label: 'Не проверен', color: 'default'},
    SUCCESS: {label: 'Верно', color: 'success'},
    FAILED: {label: 'Неверно', color: 'error'},
};

const formatDate = (iso) =>
    new Date(iso).toLocaleString('ru-RU', {timeZone: 'Europe/Samara', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});

// Ответы студентов на письменную задачу: вердикт и комментарий AI, ручное решение преподавателя, запуск AI-проверки.
const InputAnswersDialog = ({open, onClose, problemId}) => {
    const [rows, setRows] = useState(null);
    const [job, setJob] = useState(null);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const timer = useRef(null);

    const loadRows = useCallback(() => {
        ApiService.getInputAnswers(problemId).then(setRows).catch((e) => setError(e?.message || e?.reason || 'Не удалось загрузить ответы'));
    }, [problemId]);

    const poll = useCallback(async () => {
        try {
            const status = await ApiService.getInputAiCheckStatus(problemId);
            setJob(status);
            if (status.running) {
                timer.current = setTimeout(poll, 3000);
            } else {
                loadRows();
            }
        } catch (e) {
            setError(e?.message || 'Не удалось получить статус проверки');
        }
    }, [problemId, loadRows]);

    useEffect(() => {
        if (!open) return undefined;
        setError(null);
        loadRows();
        poll();
        return () => clearTimeout(timer.current);
    }, [open, loadRows, poll]);

    const start = async (force) => {
        if (force && !window.confirm('Перепроверить все ответы заново? Это потратит токены AI.')) return;
        setError(null);
        try {
            setJob(await ApiService.startInputAiCheck(problemId, force));
            timer.current = setTimeout(poll, 2000);
        } catch (e) {
            setError(e?.reason || e?.message || 'Не удалось запустить проверку');
        }
    };

    const verdict = async (row, correct) => {
        setBusyId(row.submissionId);
        try {
            await ApiService.setSubmissionVerdict(row.submissionId, correct, null);
            loadRows();
        } catch (e) {
            setError(e?.reason || e?.message || 'Не удалось сохранить решение');
        } finally {
            setBusyId(null);
        }
    };

    const pending = (rows || []).filter((r) => r.status === 'PENDING').length;
    const running = !!job?.running;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle>Ответы студентов</DialogTitle>
            <DialogContent dividers>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{mb: 2}}>
                    <Button variant="contained" startIcon={<AutoAwesomeIcon/>} disabled={running || pending === 0} onClick={() => start(false)}>
                        Проверить непроверенные ({pending})
                    </Button>
                    <Button variant="outlined" disabled={running || !rows?.length} onClick={() => start(true)}>
                        Перепроверить все
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                        Если у группы задан срок сдачи, ответы проверяются автоматически после его окончания; без срока — только здесь.
                    </Typography>
                </Stack>

                {running && (
                    <Box sx={{mb: 2}}>
                        <Typography variant="body2" sx={{mb: 0.5}}>
                            Проверяется: {job.done} из {job.total} (верно {job.correct}, неверно {job.incorrect}
                            {job.errors ? `, ошибок ${job.errors}` : ''})
                        </Typography>
                        <LinearProgress variant={job.total ? 'determinate' : 'indeterminate'} value={job.total ? (job.done / job.total) * 100 : 0}/>
                    </Box>
                )}
                {!running && job?.total > 0 && (
                    <Alert severity={job.errors || job.message ? 'warning' : 'success'} sx={{mb: 2}}>
                        Проверено {job.done} из {job.total}: верно {job.correct}, неверно {job.incorrect}
                        {job.errors ? `, ошибок ${job.errors}` : ''}. {job.message || ''}
                    </Alert>
                )}
                {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}

                {rows === null ? (
                    <Box display="flex" justifyContent="center" py={4}><CircularProgress/></Box>
                ) : rows.length === 0 ? (
                    <Typography color="text.secondary">Пока никто не отправил ответ.</Typography>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Студент</TableCell>
                                <TableCell sx={{minWidth: 260}}>Ответ</TableCell>
                                <TableCell>Результат</TableCell>
                                <TableCell sx={{minWidth: 220}}>Комментарий</TableCell>
                                <TableCell align="center">Решение</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((r) => (
                                <TableRow key={r.submissionId} hover>
                                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                                        {r.fullName}
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {r.groupName || '—'} · {formatDate(r.createdAt)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{r.answer}</TableCell>
                                    <TableCell>
                                        <Chip size="small" variant="outlined" label={STATUS[r.status]?.label || r.status} color={STATUS[r.status]?.color || 'default'}/>
                                        {r.status !== 'PENDING' && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {r.ai ? 'AI' : 'преподаватель'}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{whiteSpace: 'pre-wrap'}}>{r.comment || '—'}</TableCell>
                                    <TableCell align="center" sx={{whiteSpace: 'nowrap'}}>
                                        <Tooltip title="Засчитать">
                                            <span>
                                                <Button size="small" color="success" disabled={busyId === r.submissionId || r.status === 'SUCCESS'} onClick={() => verdict(r, true)}>
                                                    <CheckIcon fontSize="small"/>
                                                </Button>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title="Не засчитывать (уже выставленная оценка за лекцию автоматически не понижается)">
                                            <span>
                                                <Button size="small" color="error" disabled={busyId === r.submissionId || r.status === 'FAILED'} onClick={() => verdict(r, false)}>
                                                    <CloseIcon fontSize="small"/>
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Закрыть</Button>
            </DialogActions>
        </Dialog>
    );
};

export default InputAnswersDialog;
