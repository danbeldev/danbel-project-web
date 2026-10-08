import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Box, Button, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Tooltip, Typography} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ApiService from '../network/API';

const DIFFICULTY_ORDER = {EASY: 0, MEDIUM: 1, HARD: 2};

// Навигация по задачам лекции, как в LeetCode: назад/вперёд и список всех задач с отметкой «решена»,
// чтобы не возвращаться на страницу лекции. Порядок такой же, как на странице лекции.
const ProblemNavigator = ({articleId, problemId}) => {
    const navigate = useNavigate();
    const [problems, setProblems] = useState([]);
    const [anchor, setAnchor] = useState(null);

    useEffect(() => {
        if (!articleId) return;
        let cancelled = false;
        ApiService.getProblems(articleId)
            .then((list) => {
                if (cancelled) return;
                setProblems([...list].sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 9) - (DIFFICULTY_ORDER[b.difficulty] ?? 9)));
            })
            .catch(() => !cancelled && setProblems([]));
        return () => { cancelled = true; };
    }, [articleId, problemId]);

    const index = problems.findIndex((p) => String(p.id) === String(problemId));
    const prev = index > 0 ? problems[index - 1] : null;
    const next = index >= 0 && index < problems.length - 1 ? problems[index + 1] : null;
    const go = (p) => {
        setAnchor(null);
        if (p) navigate(`/problems/${p.id}`);
    };

    return (
        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{mb: 1}}>
            <Button size="small" startIcon={<ArrowBackIcon/>} onClick={() => navigate(`/articles/${articleId}`)}>
                К лекции
            </Button>
            {problems.length > 1 && index >= 0 && (
                <>
                    <Tooltip title={prev ? prev.title : ''}>
                        <span><IconButton size="small" disabled={!prev} onClick={() => go(prev)} aria-label="Предыдущая задача">
                            <ChevronLeftIcon/>
                        </IconButton></span>
                    </Tooltip>
                    <Button size="small" startIcon={<FormatListBulletedIcon/>} onClick={(e) => setAnchor(e.currentTarget)}>
                        Задача {index + 1} из {problems.length}
                    </Button>
                    <Tooltip title={next ? next.title : ''}>
                        <span><IconButton size="small" disabled={!next} onClick={() => go(next)} aria-label="Следующая задача">
                            <ChevronRightIcon/>
                        </IconButton></span>
                    </Tooltip>
                    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
                          slotProps={{paper: {sx: {maxHeight: 420, minWidth: 280}}}}>
                        {problems.map((p, i) => (
                            <MenuItem key={p.id} selected={i === index} onClick={() => go(p)}>
                                <ListItemIcon>
                                    {p.submitSuccess
                                        ? <CheckCircleIcon fontSize="small" color="success"/>
                                        : <RadioButtonUncheckedIcon fontSize="small"/>}
                                </ListItemIcon>
                                <ListItemText primary={<Typography variant="body2" noWrap>{i + 1}. {p.title}</Typography>}/>
                            </MenuItem>
                        ))}
                    </Menu>
                </>
            )}
            <Box sx={{flexGrow: 1}}/>
        </Stack>
    );
};

export default ProblemNavigator;
