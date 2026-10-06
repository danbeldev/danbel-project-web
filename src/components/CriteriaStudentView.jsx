import React, {useEffect, useMemo, useState} from 'react';
import {Box, Typography, Paper, Stack, Chip, LinearProgress, Alert, CircularProgress} from '@mui/material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ApiService from '../network/API';

const fmt = (n) => String(Math.round(n * 100) / 100);

const colorFor = (ratio) => (ratio >= 0.999 ? 'success' : ratio >= 0.5 ? 'warning' : 'error');

// Рубрика глазами студента: открытые критерии и максимум по скрытым; после публикации
// проверки — свои баллы, комментарии и раскрытые скрытые критерии.
const CriteriaStudentView = ({problemId}) => {
    const [view, setView] = useState(undefined);

    useEffect(() => {
        ApiService.getMyCriteria(problemId).then(setView).catch(() => setView(null));
    }, [problemId]);

    const groups = useMemo(() => {
        if (!view) return [];
        const map = new Map();
        view.criteria.forEach((c) => {
            const key = c.section || '';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(c);
        });
        return [...map.entries()];
    }, [view]);

    if (view === undefined) return <Box display="flex" justifyContent="center" py={6}><CircularProgress size={28}/></Box>;
    if (!view || (view.criteria.length === 0 && view.hiddenCount === 0)) {
        return <Typography color="text.secondary" sx={{p: 3}}>Для этой задачи критериев оценки пока нет.</Typography>;
    }

    const ratio = view.published && view.totalMaxPoints > 0 ? view.totalEarnedPoints / view.totalMaxPoints : 0;

    return (
        <Box sx={{p: {xs: 2, sm: 3}}}>
            <Stack direction={{xs: 'column', sm: 'row'}} alignItems={{sm: 'center'}} justifyContent="space-between" gap={2} sx={{mb: 2}}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Критерии оценки</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Работа оценивается по этим пунктам. Всего {fmt(view.totalMaxPoints)} б.
                    </Typography>
                </Box>
                {view.published ? (
                    <Box sx={{minWidth: 200}}>
                        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                            <Typography variant="h4" fontWeight={800}>{fmt(view.totalEarnedPoints)}</Typography>
                            <Typography color="text.secondary">из {fmt(view.totalMaxPoints)} · {Math.round(ratio * 100)}%</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" color={colorFor(ratio)} value={ratio * 100} sx={{height: 8, borderRadius: 4}}/>
                    </Box>
                ) : (
                    <Chip icon={<HourglassTopIcon/>} color="info" variant="outlined" label="Ожидает проверки"/>
                )}
            </Stack>

            {view.viaPair && (
                <Alert severity="info" sx={{mb: 2}}>
                    Это результат вашего напарника по паре — он засчитан и вам.
                </Alert>
            )}

            {!view.published && (
                <Alert severity="info" sx={{mb: 2}}>
                    Результат появится после проверки преподавателем. Баллы пойдут в оценку за лекцию пропорционально сложности задачи.
                </Alert>
            )}

            <Stack spacing={3}>
                {groups.map(([section, list]) => (
                    <Box key={section || 'none'}>
                        {section && <Typography variant="overline" color="text.secondary">{section}</Typography>}
                        <Stack spacing={1.5}>
                            {list.map((c) => {
                                const r = c.earnedPoints != null && c.maxPoints ? c.earnedPoints / c.maxPoints : null;
                                return (
                                    <Paper key={c.id} variant="outlined" sx={{
                                        p: 2, borderRadius: 3, borderLeft: 4,
                                        borderLeftColor: r == null ? 'divider' : `${colorFor(r)}.main`,
                                    }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                                            <Box>
                                                <Typography fontWeight={700}>
                                                    {c.title}
                                                    {!c.visible && <Chip size="small" icon={<VisibilityOffIcon/>} label="было скрыто" sx={{ml: 1}}/>}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                color={r == null ? 'default' : colorFor(r)}
                                                variant={r == null ? 'outlined' : 'filled'}
                                                label={c.earnedPoints != null ? `${fmt(c.earnedPoints)} / ${fmt(c.maxPoints)}` : `${fmt(c.maxPoints)} б.`}
                                                sx={{fontWeight: 700, flexShrink: 0}}
                                            />
                                        </Stack>
                                        {c.description && (
                                            <Typography variant="body2" color="text.secondary" sx={{mt: 1, whiteSpace: 'pre-wrap'}}>{c.description}</Typography>
                                        )}
                                        {c.comment && (
                                            <Alert severity="info" icon={false} sx={{mt: 1.5, py: 0}}>{c.comment}</Alert>
                                        )}
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </Box>
                ))}

                {view.hiddenCount > 0 && !view.published && (
                    <Paper variant="outlined" sx={{p: 2, borderRadius: 3, borderStyle: 'dashed'}}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <VisibilityOffIcon color="disabled"/>
                            <Box>
                                <Typography fontWeight={700}>Скрытые критерии: {view.hiddenCount}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Суммарно {fmt(view.hiddenMaxPoints)} б. Подробности откроются после проверки.
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                )}
            </Stack>
        </Box>
    );
};

export default CriteriaStudentView;
