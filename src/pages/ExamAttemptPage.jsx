import React, {useCallback, useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Alert, Box, Button, Chip, CircularProgress, Container, Paper, Stack, Typography} from '@mui/material';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import ApiService from '../network/API';
import {formatLeft, useCountdown} from '../components/ExamTimer';

const TYPE_LABEL = {CODE: 'Код', ANSWERS: 'Тест', INPUT: 'Письменный ответ', GIT_REPO: 'Git', MYSQL_DB: 'MySQL', SSH_LAB: 'Лаборатория'};
const DIFFICULTY_LABEL = {EASY: 'Лёгкая', MEDIUM: 'Средняя', HARD: 'Сложная'};

// Экзамен студента: билет, таймер и список задач.
const ExamAttemptPage = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState(null);
    const [error, setError] = useState(null);
    const [finishing, setFinishing] = useState(false);

    const load = useCallback(() => {
        ApiService.getMyExamAttempt(id).then(setAttempt).catch((e) => setError(e?.reason || e?.message || 'Не удалось загрузить экзамен'));
    }, [id]);

    useEffect(() => {
        load();
        const timer = setInterval(load, 20000); // подхватываем продление и завершение
        return () => clearInterval(timer);
    }, [load]);

    const left = useCountdown(attempt?.endsAt, attempt?.serverNow);

    const finish = async () => {
        if (!window.confirm('Завершить экзамен? После этого решения приниматься не будут.')) return;
        setFinishing(true);
        try {
            await ApiService.finishExam(id);
            load();
        } catch (e) {
            setError(e?.reason || e?.message || 'Не удалось завершить экзамен');
        } finally {
            setFinishing(false);
        }
    };

    if (error) return <Container maxWidth="md" sx={{py: 4}}><Alert severity="error">{error}</Alert></Container>;
    if (!attempt) return <Box display="flex" justifyContent="center" py={8}><CircularProgress/></Box>;

    const active = attempt.state === 'ACTIVE' && left > 0;

    return (
        <Container maxWidth="md" sx={{py: 4}}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap spacing={2} sx={{mb: 3}}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>Экзамен</Typography>
                    <Typography variant="body1" color="text.secondary">Ваш билет: {attempt.ticketTitle}</Typography>
                </Box>
                <Chip
                    icon={<TimerOutlinedIcon/>}
                    color={!active ? 'default' : left < 5 * 60 * 1000 ? 'error' : 'primary'}
                    label={active ? `Осталось ${formatLeft(left)}` : 'Время вышло'}
                    sx={{fontSize: '1.1rem', fontWeight: 700, py: 2.5, px: 1}}
                />
            </Stack>

            {!active && (
                <Alert severity="info" sx={{mb: 3}}>
                    Экзамен завершён, решения больше не принимаются. Результат сообщит преподаватель.
                    {attempt.grade != null && <strong> Ваша оценка: {attempt.grade}.</strong>}
                    {attempt.comment && ` ${attempt.comment}`}
                </Alert>
            )}
            {active && (
                <Alert severity="warning" sx={{mb: 3}}>
                    Во время экзамена результаты проверки не показываются: вы видите только, что решение принято. Проверяется последнее
                    отправленное решение по каждой задаче.
                </Alert>
            )}

            <Stack spacing={1.5}>
                {attempt.problems.map((p, i) => (
                    <Paper key={p.id} variant="outlined" sx={{p: 2, borderRadius: 2}}>
                        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
                            <Typography fontWeight={700} sx={{flex: 1, minWidth: 200}}>{i + 1}. {p.title}</Typography>
                            <Chip size="small" variant="outlined" label={TYPE_LABEL[p.type] || p.type}/>
                            {p.difficulty && <Chip size="small" variant="outlined" label={DIFFICULTY_LABEL[p.difficulty] || p.difficulty}/>}
                            <Button variant="contained" size="small" onClick={() => navigate(`/problems/${p.id}`)}>
                                {active ? 'Решать' : 'Открыть'}
                            </Button>
                        </Stack>
                    </Paper>
                ))}
            </Stack>

            {active && (
                <Box sx={{mt: 4, textAlign: 'right'}}>
                    <Button color="error" variant="outlined" disabled={finishing} onClick={finish}>Завершить экзамен</Button>
                </Box>
            )}
        </Container>
    );
};

export default ExamAttemptPage;
