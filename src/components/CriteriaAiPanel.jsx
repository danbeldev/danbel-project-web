import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    Alert, Box, Button, Chip, CircularProgress, Collapse, FormControlLabel, LinearProgress, Paper, Stack, Switch, Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalculateIcon from '@mui/icons-material/Calculate';
import ApiService from '../network/API';

const fmtTokens = (n) => (n >= 1000 ? `${Math.round(n / 100) / 10} тыс.` : String(n));

const STATUS_LABEL = {OK: 'можно проверить', TOO_LARGE: 'слишком большая работа', EMPTY: 'нет работы', ERROR: 'ошибка'};

// Панель AI-проверки на странице проверки работ: оценка объёма, запуск по всей задаче, прогресс.
// AI ставит только черновики баллов — публикует преподаватель.
const CriteriaAiPanel = ({problemId, status, onStatusChange, onFinished, groupId = null, groupName = null}) => {
    const [estimate, setEstimate] = useState(null);
    const [estimating, setEstimating] = useState(false);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState(null);
    const [showItems, setShowItems] = useState(false);
    const [togglingAuto, setTogglingAuto] = useState(false);
    const wasRunning = useRef(false);

    useEffect(() => {
        setEstimate(null);
    }, [groupId]);

    const job = status?.job;
    const running = job?.state === 'RUNNING';
    const config = status?.config;

    const refresh = useCallback(() => ApiService.getCriteriaAiStatus(problemId).then(onStatusChange).catch(() => {}), [problemId, onStatusChange]);

    useEffect(() => {
        if (!running) {
            if (wasRunning.current) {
                wasRunning.current = false;
                onFinished && onFinished();
            }
            return undefined;
        }
        wasRunning.current = true;
        const timer = setInterval(refresh, 3000);
        return () => clearInterval(timer);
    }, [running, refresh, onFinished]);

    const toggleAutoPublish = async (enabled) => {
        if (enabled && !window.confirm('Включить автопубликацию? После AI-проверки студенты сразу увидят баллы и комментарии, а оценка лекции пересчитается. Баллы, которые вы выставили вручную, и уже опубликованные проверки AI не трогает.')) return;
        setTogglingAuto(true);
        setError(null);
        try {
            await ApiService.setCriteriaAiAutoPublish(problemId, enabled);
            await refresh();
        } catch (err) {
            setError(err.message || err.reason || 'Не удалось изменить настройку');
        } finally {
            setTogglingAuto(false);
        }
    };

    const doEstimate = async () => {
        setEstimating(true);
        setError(null);
        try {
            setEstimate(await ApiService.getCriteriaAiEstimate(problemId, groupId));
            setShowItems(true);
        } catch (err) {
            setError(err.message || err.reason || 'Не удалось оценить объём');
        } finally {
            setEstimating(false);
        }
    };

    const start = async () => {
        const where = status?.autoPublish ? 'Баллы будут ОПУБЛИКОВАНЫ автоматически.' : 'Баллы появятся черновиками.';
        const scope = groupName ? `группы «${groupName}»` : 'всех групп';
        const text = estimate
            ? `Проверить ${estimate.checkable} работ(ы) ${scope}, ≈ ${fmtTokens(estimate.totalEstimatedInputTokens)} токенов на вход? ${where}`
            : `Запустить AI-проверку работ ${scope}? ${where}`;
        if (!window.confirm(text)) return;
        setStarting(true);
        setError(null);
        try {
            await ApiService.runCriteriaAi(problemId, false, groupId);
            await refresh();
        } catch (err) {
            setError(err.message || err.reason || 'Не удалось запустить проверку');
        } finally {
            setStarting(false);
        }
    };

    return (
        <Paper variant="outlined" sx={{p: 2, mb: 3, borderRadius: 3}}>
            <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" alignItems={{sm: 'center'}} gap={2}>
                <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <AutoAwesomeIcon color="secondary"/>
                        <Typography fontWeight={700}>AI-проверка</Typography>
                        {config && (
                            <Chip size="small" color={config.enabled ? 'success' : 'default'}
                                  label={config.enabled ? `Включена${config.model ? ` · ${config.model}` : ''}` : 'Не настроена'}/>
                        )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>
                        AI ставит баллы и комментарии по критериям. Баллы, которые вы уже сохранили вручную, AI не
                        перезаписывает, слишком большие работы пропускаются. Пока доступно для MySQL-задач.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{flexShrink: 0}}>
                    <Button variant="outlined" startIcon={estimating ? <CircularProgress size={16}/> : <CalculateIcon/>}
                            onClick={doEstimate} disabled={estimating || running}>
                        {groupName ? 'Оценить объём группы' : 'Оценить объём'}
                    </Button>
                    <Button variant="contained" color="secondary" onClick={start}
                            disabled={!config?.enabled || running || starting}>
                        {groupName ? `Проверить группу ${groupName}` : 'Проверить всех'}
                    </Button>
                </Stack>
            </Stack>

            <FormControlLabel
                sx={{mt: 1.5, display: 'flex'}}
                control={<Switch checked={!!status?.autoPublish} disabled={togglingAuto || !status}
                                 onChange={(e) => toggleAutoPublish(e.target.checked)}/>}
                label={status?.autoPublish
                    ? 'Автопубликация включена — студенты видят результат сразу после AI-проверки'
                    : 'Публиковать результат автоматически (иначе — черновик, который публикуете вы)'}
            />

            {config && !config.enabled && (
                <Alert severity="info" sx={{mt: 2}}>
                    На сервере ещё не заданы LLM_BASE_URL, LLM_API_KEY и LLM_MODEL — запуск пока недоступен.
                    Оценка объёма работает уже сейчас.
                </Alert>
            )}
            {error && <Alert severity="error" sx={{mt: 2}} onClose={() => setError(null)}>{error}</Alert>}

            {config?.monthlyTokenBudget > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 1.5}}>
                    Токены в этом месяце: {fmtTokens(config.usedTokensThisMonth)} из {fmtTokens(config.monthlyTokenBudget)}
                </Typography>
            )}

            {job && (
                <Box sx={{mt: 2}}>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">
                            {running ? 'Идёт проверка…' : job.state === 'DONE' ? 'Проверка завершена' : 'Проверка прервана'}
                            {' '}{job.done} из {job.total}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            оценено {job.ok} · опубликовано {job.published} · пропущено {job.skipped} · ошибок {job.errors}
                        </Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={job.total ? (job.done / job.total) * 100 : 100}
                                    color={job.errors > 0 ? 'warning' : 'secondary'} sx={{mt: 0.5, height: 6, borderRadius: 3}}/>
                    {job.message && <Alert severity="error" sx={{mt: 1}}>{job.message}</Alert>}
                </Box>
            )}

            {estimate && (
                <Box sx={{mt: 2}}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip label={`Работ: ${estimate.students}`}/>
                        <Chip color="success" variant="outlined" label={`Можно проверить: ${estimate.checkable}`}/>
                        <Chip color="warning" variant="outlined" label={`Слишком большие: ${estimate.tooLarge}`}/>
                        <Chip variant="outlined" label={`Пустые: ${estimate.empty}`}/>
                        <Chip color="primary" label={`≈ ${fmtTokens(estimate.totalEstimatedInputTokens)} токенов на вход`}/>
                    </Stack>
                    <Button size="small" onClick={() => setShowItems((v) => !v)} sx={{mt: 1}}>
                        {showItems ? 'Скрыть список' : 'Показать по студентам'}
                    </Button>
                    <Collapse in={showItems}>
                        <Stack spacing={0.5} sx={{mt: 1}}>
                            {estimate.items.map((i) => (
                                <Stack key={i.userId} direction="row" justifyContent="space-between" gap={2}>
                                    <Typography variant="body2">{i.fullName}</Typography>
                                    <Typography variant="body2" color={i.status === 'OK' ? 'text.secondary' : 'warning.main'}>
                                        {i.status === 'OK' ? `≈ ${fmtTokens(i.estimatedTokens)}` : (i.message || STATUS_LABEL[i.status])}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Collapse>
                </Box>
            )}
        </Paper>
    );
};

export default CriteriaAiPanel;
