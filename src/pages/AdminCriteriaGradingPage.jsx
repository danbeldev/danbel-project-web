import React, {useCallback, useEffect, useState} from 'react';
import {
    Container, Typography, Box, CircularProgress, Accordion, AccordionSummary, AccordionDetails,
    TextField, Button, Chip, Stack, Paper, Breadcrumbs, Link as MuiLink, Snackbar, Alert, ButtonGroup,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import {Link, useParams} from 'react-router-dom';
import ApiService from '../network/API';
import CriteriaAiPanel from '../components/CriteriaAiPanel';

const fmt = (n) => String(Math.round(n * 100) / 100);
const parse = (v) => parseFloat(String(v).replace(',', '.'));

// Проверка работ студентов по критериям: баллы (шаг 0.25) и комментарии по каждому критерию,
// затем «Опубликовать» — только после этого студент видит результат, а баллы идут в оценку лекции.
const AdminCriteriaGradingPage = () => {
    const {problemId} = useParams();
    const [data, setData] = useState(null);
    const [drafts, setDrafts] = useState({});
    const [busyId, setBusyId] = useState(null);
    const [toast, setToast] = useState(null);
    const [error, setError] = useState(null);
    const [aiStatus, setAiStatus] = useState(null);
    const [aiBusyId, setAiBusyId] = useState(null);

    const load = useCallback(() => {
        return ApiService.getCriteriaGrading(problemId)
            .then((d) => {
                setData(d);
                const next = {};
                d.students.forEach((s) => {
                    next[s.userId] = {};
                    d.criteria.forEach((c) => {
                        const r = s.results[c.id];
                        next[s.userId][c.id] = {points: r ? String(r.earnedPoints) : '', comment: r?.comment || ''};
                    });
                });
                setDrafts(next);
            })
            .catch((err) => setError(err.message || err.reason || 'Не удалось загрузить данные'));
    }, [problemId]);

    useEffect(() => {
        load();
        ApiService.getCriteriaAiStatus(problemId).then(setAiStatus).catch(() => {});
    }, [load, problemId]);

    const runAiForStudent = async (student) => {
        setAiBusyId(student.userId);
        try {
            const outcome = await ApiService.runCriteriaAiForUser(problemId, student.userId, true);
            const ok = outcome.status === 'OK';
            setToast({severity: ok ? 'success' : 'warning', message: ok ? 'AI-черновик готов' : (outcome.message || 'Не проверено')});
            await load();
            ApiService.getCriteriaAiStatus(problemId).then(setAiStatus).catch(() => {});
        } catch (err) {
            setToast({severity: 'error', message: err.message || err.reason || 'Не удалось запустить AI-проверку'});
        } finally {
            setAiBusyId(null);
        }
    };

    const lastRun = (userId) => aiStatus?.lastRuns?.find((r) => r.userId === userId);

    const setDraft = (userId, criterionId, patch) => setDrafts((prev) => ({
        ...prev,
        [userId]: {...prev[userId], [criterionId]: {...prev[userId][criterionId], ...patch}},
    }));

    const totalOf = (userId) => data.criteria.reduce((sum, c) => sum + (parse(drafts[userId]?.[c.id]?.points) || 0), 0);

    const save = async (student, published) => {
        setBusyId(student.userId);
        try {
            const results = data.criteria.map((c) => {
                const d = drafts[student.userId][c.id];
                return {criterionId: c.id, earnedPoints: parse(d.points) || 0, comment: d.comment};
            });
            await ApiService.saveCriteriaResults(problemId, student.userId, {results, published});
            setToast({severity: 'success', message: published === true ? 'Опубликовано' : published === false ? 'Публикация снята' : 'Сохранено'});
            await load();
        } catch (err) {
            setToast({severity: 'error', message: err.message || err.reason || 'Не удалось сохранить'});
        } finally {
            setBusyId(null);
        }
    };

    if (error) return <Container sx={{py: 4}}><Typography color="error">{error}</Typography></Container>;
    if (!data) return <Box display="flex" justifyContent="center" py={10}><CircularProgress/></Box>;

    return (
        <Container maxWidth="lg" sx={{py: 4}}>
            <Breadcrumbs sx={{mb: 2}}>
                <MuiLink component={Link} to={`/problems/${problemId}`} underline="hover" color="inherit">Задача</MuiLink>
                <Typography color="text.primary">Проверка по критериям</Typography>
            </Breadcrumbs>

            <Typography variant="h5" fontWeight={700} sx={{mb: 1}}>Проверка по критериям</Typography>
            <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
                Максимум: {fmt(data.totalMaxPoints)} б. В списке студенты, создавшие базу или репозиторий, и те, у кого уже есть баллы.
                Баллы студенту и оценке лекции открываются только после «Опубликовать»; если у студента есть напарник, баллы засчитываются и ему.
            </Typography>

            {data.problemType === 'MYSQL_DB' && (
                <CriteriaAiPanel problemId={problemId} status={aiStatus} onStatusChange={setAiStatus} onFinished={load}/>
            )}

            {data.criteria.length === 0 && (
                <Alert severity="warning">У задачи нет критериев — добавьте их на странице задачи.</Alert>
            )}
            {data.students.length === 0 && data.criteria.length > 0 && (
                <Typography color="text.secondary">Пока нет студентов для проверки.</Typography>
            )}

            {data.criteria.length > 0 && data.students.map((s) => (
                <Accordion key={s.userId} disableGutters variant="outlined" sx={{mb: 1}}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{width: '100%', pr: 2}} flexWrap="wrap">
                            <Typography fontWeight={600} sx={{flexGrow: 1}}>{s.fullName}</Typography>
                            {s.resourceUrl && (
                                <MuiLink href={s.resourceUrl} target="_blank" rel="noopener noreferrer"
                                         onClick={(e) => e.stopPropagation()} variant="body2">
                                    Репозиторий ↗
                                </MuiLink>
                            )}
                            {s.groupName && <Typography variant="body2" color="text.secondary">{s.groupName}</Typography>}
                            {s.partnerName && <Chip size="small" color="primary" variant="outlined" label={`в паре: ${s.partnerName}`}/>}
                            <Typography variant="body2">{fmt(totalOf(s.userId))} / {fmt(data.totalMaxPoints)}</Typography>
                            {lastRun(s.userId) && (
                                <Chip size="small" variant="outlined" icon={<AutoAwesomeIcon/>}
                                      color={lastRun(s.userId).status === 'OK' ? 'secondary' : lastRun(s.userId).status === 'ERROR' ? 'error' : 'default'}
                                      title={lastRun(s.userId).message || ''}
                                      label={{OK: 'AI проверил', SKIPPED: 'AI пропустил', ERROR: 'AI: ошибка'}[lastRun(s.userId).status] || lastRun(s.userId).status}/>
                            )}
                            <Chip size="small" color={s.published ? 'success' : 'default'}
                                  label={s.published ? (s.autoPublished ? 'Опубликовано AI' : 'Опубликовано') : 'Черновик'}/>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack spacing={2}>
                            {data.criteria.map((c) => {
                                const d = drafts[s.userId]?.[c.id] || {points: '', comment: ''};
                                return (
                                    <Paper key={c.id} variant="outlined" sx={{p: 2}}>
                                        <Stack direction="row" justifyContent="space-between" gap={2}>
                                            <Box>
                                                <Typography fontWeight={600}>
                                                    {c.title} {!c.visible && <Chip size="small" label="скрытый" sx={{ml: 1}}/>}
                                                    {s.results[c.id]?.source === 'AI' && (
                                                        <Chip size="small" color="secondary" variant="outlined" icon={<AutoAwesomeIcon/>}
                                                              label="AI-черновик" sx={{ml: 1}}/>
                                                    )}
                                                </Typography>
                                                {c.description && (
                                                    <Typography variant="body2" color="text.secondary" sx={{whiteSpace: 'pre-wrap'}}>{c.description}</Typography>
                                                )}
                                            </Box>
                                            <Typography fontWeight={700} sx={{whiteSpace: 'nowrap'}}>макс. {fmt(c.maxPoints)}</Typography>
                                        </Stack>
                                        <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} sx={{mt: 1.5}} alignItems={{sm: 'center'}}>
                                            <TextField
                                                label="Баллы" size="small" type="number" sx={{width: 120}}
                                                inputProps={{min: 0, max: c.maxPoints, step: 0.25}} value={d.points}
                                                onChange={(e) => setDraft(s.userId, c.id, {points: e.target.value})}
                                            />
                                            <ButtonGroup size="small" variant="outlined">
                                                <Button onClick={() => setDraft(s.userId, c.id, {points: '0'})}>0</Button>
                                                <Button onClick={() => setDraft(s.userId, c.id, {points: String(c.maxPoints / 2)})}>½</Button>
                                                <Button onClick={() => setDraft(s.userId, c.id, {points: String(c.maxPoints)})}>макс</Button>
                                            </ButtonGroup>
                                            <TextField
                                                label="Комментарий" size="small" fullWidth value={d.comment}
                                                onChange={(e) => setDraft(s.userId, c.id, {comment: e.target.value})}
                                            />
                                        </Stack>
                                    </Paper>
                                );
                            })}
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                {data.problemType === 'MYSQL_DB' && (
                                <Button color="secondary" startIcon={aiBusyId === s.userId ? <CircularProgress size={14}/> : <AutoAwesomeIcon/>}
                                        disabled={data.problemType !== 'MYSQL_DB' || !aiStatus?.config?.enabled || aiBusyId === s.userId || s.published}
                                        onClick={() => runAiForStudent(s)}>
                                    Проверить AI
                                </Button>
                                )}
                                <Button disabled={busyId === s.userId} onClick={() => save(s, undefined)}>Сохранить</Button>
                                {s.published ? (
                                    <Button color="warning" disabled={busyId === s.userId} onClick={() => save(s, false)}>Снять публикацию</Button>
                                ) : null}
                                <Button variant="contained" disabled={busyId === s.userId} onClick={() => save(s, true)}>
                                    {s.published ? 'Сохранить и опубликовать' : 'Опубликовать'}
                                </Button>
                            </Stack>
                        </Stack>
                    </AccordionDetails>
                </Accordion>
            ))}

            <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}>
                {toast && <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>}
            </Snackbar>
        </Container>
    );
};

export default AdminCriteriaGradingPage;
