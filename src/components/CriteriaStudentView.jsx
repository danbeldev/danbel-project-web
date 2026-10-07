import React, {useEffect, useMemo, useState} from 'react';
import {Box, Typography, Paper, Stack, Chip, LinearProgress, Alert, CircularProgress} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ApiService from '../network/API';

const fmt = (n) => String(Math.round(n * 100) / 100);

const GRADE_COLORS = {3: '#ffa726', 4: '#42a5f5', 5: '#66bb6a'};

// Сводка вверху: баллы за лекцию (от них зависит оценка) и сколько ещё нужно на 3, 4 и 5.
const LectureProgress = ({lecture, published}) => {
    if (!lecture || !lecture.maxPoints) return null;
    const {earnedPoints: earned, maxPoints: max} = lecture;
    const tiers = [[3, lecture.minPointsFor3], [4, lecture.minPointsFor4], [5, lecture.minPointsFor5]];

    return (
        <Paper variant="outlined" sx={{p: {xs: 2, sm: 3}, mb: 3, borderRadius: 3}}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-end" flexWrap="wrap" gap={1}>
                <Box>
                    <Typography variant="body2" color="text.secondary">Ваши баллы за лекцию</Typography>
                    <Typography variant="h4" fontWeight={800}>
                        {fmt(earned)} <Typography component="span" variant="h6" color="text.secondary">из {fmt(max)}</Typography>
                    </Typography>
                </Box>
                {lecture.grade != null && (
                    <Chip color="primary" label={`Оценка за лекцию: ${lecture.grade}`} sx={{fontWeight: 700}}/>
                )}
            </Stack>

            <Box sx={{position: 'relative', mt: 2, mb: 1.5}}>
                <LinearProgress variant="determinate" value={Math.min(100, (earned / max) * 100)} sx={{height: 10, borderRadius: 5}}/>
                {tiers.map(([grade, min]) => (
                    <Box key={grade} title={`«${grade}»: от ${fmt(min)} баллов`} sx={{
                        position: 'absolute', top: -3, bottom: -3, width: 3, borderRadius: 1,
                        left: `${Math.min(100, (min / max) * 100)}%`, bgcolor: GRADE_COLORS[grade],
                    }}/>
                ))}
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {tiers.map(([grade, min]) => {
                    const left = Math.max(0, Math.round((min - earned) * 100) / 100);
                    return left === 0 ? (
                        <Chip key={grade} icon={<CheckCircleIcon/>} label={`«${grade}»: набрано (от ${fmt(min)})`}
                              sx={{bgcolor: GRADE_COLORS[grade], color: '#111', fontWeight: 700, '& .MuiChip-icon': {color: '#111'}}}/>
                    ) : (
                        <Chip key={grade} variant="outlined" label={`«${grade}»: ещё ${fmt(left)} б. (нужно ${fmt(min)})`}
                              sx={{borderColor: GRADE_COLORS[grade], fontWeight: 600}}/>
                    );
                })}
            </Stack>

            {lecture.problemMaxPoints > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{mt: 1.5}}>
                    Эта задача даёт до {fmt(lecture.problemMaxPoints)} баллов лекции: сейчас {fmt(lecture.problemEarnedPoints)}
                    {published ? '' : ' (баллы по критериям появятся после проверки)'}.
                </Typography>
            )}
        </Paper>
    );
};

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
            <LectureProgress lecture={view.lecture} published={view.published}/>

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
