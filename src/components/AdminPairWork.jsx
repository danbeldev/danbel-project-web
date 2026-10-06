import React, {useCallback, useEffect, useState} from 'react';
import {
    Accordion, AccordionDetails, AccordionSummary, Alert, Box, FormControlLabel, IconButton,
    MenuItem, Select, Stack, Switch, ToggleButton, ToggleButtonGroup, Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ApiService from '../network/API';

const name = (u) => {
    const full = [u.lastName, u.firstName, u.patronymic].filter(Boolean).join(' ');
    return full ? `${full} (${u.username})` : u.username;
};

// Работа в паре для задач лекции (страница редактирования). По умолчанию на задаче
// пара запрещена: общий флаг включает её для всех, а персональные правила
// разрешают/запрещают конкретному студенту на конкретной задаче.
const ProblemPairSettings = ({problem, groups}) => {
    const [allowed, setAllowed] = useState(!!problem.pairAllowed);
    const [overrides, setOverrides] = useState({});
    const [pairs, setPairs] = useState([]);
    const [groupId, setGroupId] = useState('');
    const [students, setStudents] = useState([]);
    const [message, setMessage] = useState(null);

    const load = useCallback(async () => {
        const [perms, ps] = await Promise.all([ApiService.getPairPermissions(problem.id), ApiService.getPairs(problem.id)]);
        setOverrides(Object.fromEntries(perms.map((p) => [p.user.id, p.allowed ? 'allow' : 'deny'])));
        setPairs(ps);
    }, [problem.id]);

    useEffect(() => {
        load().catch(() => {});
    }, [load]);

    useEffect(() => {
        if (!groupId) {
            setStudents([]);
            return;
        }
        ApiService.getGroupById(groupId).then((g) => setStudents(g.students.map((s) => s.user))).catch(() => {});
    }, [groupId]);

    const toggleAllowed = async (value) => {
        setAllowed(value);
        await ApiService.setPairAllowed(problem.id, value);
        setMessage(value ? 'Пара разрешена всем на этой задаче' : 'Пара запрещена по умолчанию');
    };

    const setOverride = async (userId, value) => {
        if (value === 'default') await ApiService.removePairPermission(problem.id, userId);
        else await ApiService.setPairPermission(problem.id, userId, value === 'allow');
        await load();
    };

    const removePair = async (ownerId) => {
        await ApiService.removePairByAdmin(problem.id, ownerId);
        await load();
    };

    return (
        <Accordion disableGutters variant="outlined">
            <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                <Typography fontWeight={600}>{problem.title}</Typography>
                <Typography color="text.secondary" sx={{ml: 2}}>
                    {allowed ? 'пара разрешена всем' : 'пара запрещена'}
                    {Object.keys(overrides).length > 0 ? ` · исключений: ${Object.keys(overrides).length}` : ''}
                    {pairs.length > 0 ? ` · пар: ${pairs.length}` : ''}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                {message && <Alert severity="success" sx={{mb: 1.5}} onClose={() => setMessage(null)}>{message}</Alert>}

                <FormControlLabel
                    control={<Switch checked={allowed} onChange={(e) => toggleAllowed(e.target.checked)}/>}
                    label="Разрешить работу в паре всем студентам на этой задаче"
                />

                <Typography variant="subtitle2" sx={{mt: 2, mb: 1}}>Исключения по студентам</Typography>
                <Select size="small" displayEmpty value={groupId} onChange={(e) => setGroupId(e.target.value)} sx={{minWidth: 200, mb: 1}}>
                    <MenuItem value="">Выберите группу…</MenuItem>
                    {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
                </Select>
                <Stack spacing={0.5}>
                    {students.map((u) => (
                        <Stack key={u.id} direction={{xs: 'column', sm: 'row'}} spacing={1} alignItems={{sm: 'center'}} justifyContent="space-between">
                            <Typography variant="body2">{name(u)}</Typography>
                            <ToggleButtonGroup
                                size="small" exclusive
                                value={overrides[u.id] || 'default'}
                                onChange={(e, v) => v && setOverride(u.id, v)}
                            >
                                <ToggleButton value="default">По умолчанию</ToggleButton>
                                <ToggleButton value="allow" color="success">Разрешить</ToggleButton>
                                <ToggleButton value="deny" color="error">Запретить</ToggleButton>
                            </ToggleButtonGroup>
                        </Stack>
                    ))}
                </Stack>

                <Typography variant="subtitle2" sx={{mt: 2, mb: 0.5}}>Пары на задаче</Typography>
                {pairs.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Пока никто не указал напарника.</Typography>
                ) : pairs.map((p) => (
                    <Stack key={p.owner.id} direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2">
                            {name(p.owner)} + {name(p.partner)} · {new Date(p.createdAt).toLocaleString('ru-RU')}
                        </Typography>
                        <IconButton size="small" title="Удалить пару" onClick={() => removePair(p.owner.id)}>
                            <DeleteOutlineIcon fontSize="small"/>
                        </IconButton>
                    </Stack>
                ))}
            </AccordionDetails>
        </Accordion>
    );
};

const AdminPairWork = ({articleId}) => {
    const [problems, setProblems] = useState([]);
    const [groups, setGroups] = useState([]);
    const [version, setVersion] = useState(0);
    const [busy, setBusy] = useState(false);
    const [perms, setPerms] = useState({});
    const [globalGroupId, setGlobalGroupId] = useState('');
    const [globalStudents, setGlobalStudents] = useState([]);

    const loadProblems = useCallback(
        () => ApiService.getProblems(articleId).then(setProblems).catch(() => {}),
        [articleId]
    );

    useEffect(() => {
        loadProblems();
        ApiService.getAllGroups().then(setGroups).catch(() => {});
    }, [articleId, loadProblems]);

    // Персональные правила по всем задачам лекции: {problemId: {userId: 'allow'|'deny'}}.
    const problemIds = problems.map((p) => p.id).join(',');
    const loadPerms = useCallback(async () => {
        const list = await Promise.all(problems.map((p) => ApiService.getPairPermissions(p.id)));
        setPerms(Object.fromEntries(problems.map((p, i) => [
            p.id,
            Object.fromEntries(list[i].map((x) => [x.user.id, x.allowed ? 'allow' : 'deny'])),
        ])));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [problemIds]);

    useEffect(() => {
        if (problems.length) loadPerms().catch(() => {});
    }, [problems.length, loadPerms]);

    useEffect(() => {
        if (!globalGroupId) {
            setGlobalStudents([]);
            return;
        }
        ApiService.getGroupById(globalGroupId).then((g) => setGlobalStudents(g.students.map((s) => s.user))).catch(() => {});
    }, [globalGroupId]);

    if (problems.length === 0) return null;

    const allOn = problems.every((p) => p.pairAllowed);
    const someOn = problems.some((p) => p.pairAllowed);

    // Общий флаг на всех заданиях лекции разом; персональные правила студентов не трогаем.
    const setAll = async (value) => {
        setBusy(true);
        try {
            await Promise.all(problems.map((p) => ApiService.setPairAllowed(p.id, value)));
            await loadProblems();
            setVersion((v) => v + 1);
        } finally {
            setBusy(false);
        }
    };

    // Значение студента по всем задачам: одинаковое везде или 'mixed', если по-разному.
    const globalValue = (userId) => {
        const values = problems.map((p) => perms[p.id]?.[userId] || 'default');
        return values.every((v) => v === values[0]) ? values[0] : 'mixed';
    };

    // Исключение для студента сразу на всех заданиях лекции.
    const setGlobalOverride = async (userId, value) => {
        setBusy(true);
        try {
            await Promise.all(problems.map((p) => (
                value === 'default'
                    ? ApiService.removePairPermission(p.id, userId)
                    : ApiService.setPairPermission(p.id, userId, value === 'allow')
            )));
            await loadPerms();
            setVersion((v) => v + 1);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box sx={{mt: 4, p: 2, border: 1, borderColor: 'divider', borderRadius: 2}}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Работа в паре</Typography>
            <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                По умолчанию на задаче работа в паре запрещена. Можно разрешить её всем на задаче или только
                конкретным студентам (и наоборот запретить). Решение владельца аккаунта засчитывается напарнику,
                напарник — только из той же группы. Удаление пары оценки не снижает.
            </Typography>
            <Stack direction={{xs: 'column', sm: 'row'}} spacing={1.5} alignItems={{sm: 'center'}}
                   sx={{p: 1.5, mb: 2, borderRadius: 2, bgcolor: 'action.hover'}}>
                <FormControlLabel
                    sx={{flexGrow: 1, m: 0}}
                    control={
                        <Switch
                            checked={allOn}
                            disabled={busy}
                            onChange={(e) => setAll(e.target.checked)}
                        />
                    }
                    label={
                        <Box>
                            <Typography fontWeight={700}>Разрешить пару на всех заданиях лекции</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {allOn ? 'Включено на всех заданиях'
                                    : someOn ? 'Включено частично — настроено по заданиям ниже'
                                        : 'Выключено на всех заданиях (по умолчанию)'}
                            </Typography>
                        </Box>
                    }
                />
            </Stack>
            <Box sx={{p: 1.5, mb: 2, borderRadius: 2, bgcolor: 'action.hover'}}>
                <Typography fontWeight={700}>Исключения для студентов на всех заданиях лекции</Typography>
                <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 1}}>
                    Выберите группу и разрешите или запретите пару студенту сразу на всех заданиях.
                    Если у студента на заданиях по-разному, кнопки не подсвечены — настройка точечная.
                </Typography>
                <Select size="small" displayEmpty value={globalGroupId}
                        onChange={(e) => setGlobalGroupId(e.target.value)} sx={{minWidth: 200, mb: 1}}>
                    <MenuItem value="">Выберите группу…</MenuItem>
                    {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
                </Select>
                <Stack spacing={0.5}>
                    {globalStudents.map((u) => (
                        <Stack key={u.id} direction={{xs: 'column', sm: 'row'}} spacing={1}
                               alignItems={{sm: 'center'}} justifyContent="space-between">
                            <Typography variant="body2">
                                {name(u)}
                                {globalValue(u.id) === 'mixed' && (
                                    <Typography component="span" variant="caption" color="warning.main"> · по-разному</Typography>
                                )}
                            </Typography>
                            <ToggleButtonGroup
                                size="small" exclusive disabled={busy}
                                value={globalValue(u.id) === 'mixed' ? null : globalValue(u.id)}
                                onChange={(e, v) => v && setGlobalOverride(u.id, v)}
                            >
                                <ToggleButton value="default">По умолчанию</ToggleButton>
                                <ToggleButton value="allow" color="success">Разрешить</ToggleButton>
                                <ToggleButton value="deny" color="error">Запретить</ToggleButton>
                            </ToggleButtonGroup>
                        </Stack>
                    ))}
                </Stack>
            </Box>
            <Stack spacing={1}>
                {problems.map((p) => <ProblemPairSettings key={`${p.id}-${version}`} problem={p} groups={groups}/>)}
            </Stack>
        </Box>
    );
};

export default AdminPairWork;
