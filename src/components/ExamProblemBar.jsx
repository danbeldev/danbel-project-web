import React, {useCallback, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Alert, Button, Chip, IconButton, Stack, Tooltip} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import ApiService from '../network/API';
import {formatLeft, useCountdown} from './ExamTimer';

// Верхняя панель задачи экзамена: назад к билету, переход между задачами билета и таймер.
const ExamProblemBar = ({attemptId, problemId}) => {
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState(null);

    const load = useCallback(() => {
        if (!attemptId) return;
        ApiService.getMyExamAttempt(attemptId).then(setAttempt).catch(() => {});
    }, [attemptId]);

    useEffect(() => {
        load();
        const timer = setInterval(load, 30000); // подхватываем продление времени преподавателем
        return () => clearInterval(timer);
    }, [load]);

    const left = useCountdown(attempt?.endsAt, attempt?.serverNow);

    if (!attemptId) {
        return <Alert severity="info" sx={{mb: 1}}>Задача экзамена (режим преподавателя).</Alert>;
    }
    if (!attempt) return null;

    const problems = attempt.problems || [];
    const index = problems.findIndex((p) => String(p.id) === String(problemId));
    const prev = index > 0 ? problems[index - 1] : null;
    const next = index >= 0 && index < problems.length - 1 ? problems[index + 1] : null;
    const over = attempt.state !== 'ACTIVE' || left <= 0;

    return (
        <>
            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{mb: 1}}>
                <Button size="small" startIcon={<ArrowBackIcon/>} onClick={() => navigate(`/exams/attempts/${attemptId}`)}>
                    К билету
                </Button>
                <Tooltip title={prev ? prev.title : ''}>
                    <span><IconButton size="small" disabled={!prev} onClick={() => navigate(`/problems/${prev.id}`)}><ChevronLeftIcon/></IconButton></span>
                </Tooltip>
                <span>Задача {index + 1} из {problems.length}</span>
                <Tooltip title={next ? next.title : ''}>
                    <span><IconButton size="small" disabled={!next} onClick={() => navigate(`/problems/${next.id}`)}><ChevronRightIcon/></IconButton></span>
                </Tooltip>
                <Chip
                    icon={<TimerOutlinedIcon/>}
                    color={over ? 'default' : left < 5 * 60 * 1000 ? 'error' : 'primary'}
                    label={over ? 'Время вышло' : `Осталось ${formatLeft(left)}`}
                    sx={{ml: 'auto', fontWeight: 700}}
                />
            </Stack>
            {over && <Alert severity="warning" sx={{mb: 1}}>Экзамен завершён — решения больше не принимаются.</Alert>}
        </>
    );
};

export default ExamProblemBar;
