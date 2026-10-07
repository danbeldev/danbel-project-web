import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Alert, Box, Button, Chip, CircularProgress, LinearProgress, MenuItem, Paper, Select, Stack, TextField, Typography,
} from '@mui/material';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';
import RefreshIcon from '@mui/icons-material/Refresh';
import ApiService from '../network/API';

const STATUS = {
    ACTIVE: {label: 'Подключён', color: 'success'},
    BLOCKED: {label: 'Заблокировал бота', color: 'error'},
    NOT_LINKED: {label: 'Не подключён', color: 'default'},
};

const formatTime = (iso) => format(new Date(iso), 'd MMM yyyy, HH:mm', {locale: ru});
const percent = (part, total) => (total ? Math.round((part / total) * 100) : 0);

const StatCard = ({title, value, hint, color}) => (
    <Paper variant="outlined" sx={{p: 2, borderRadius: 3, flex: '1 1 150px', minWidth: 0}}>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h4" fontWeight={800} sx={{mt: 0.5}} color={color}>{value}</Typography>
        {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Paper>
);

// Статистика Telegram: сколько студентов подключили бота и сколько из них «живые» (не заблокировали бота
// и сообщения им доставляются), по группам и по каждому студенту.
const AdminTelegramStats = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [group, setGroup] = useState('');
    const [status, setStatus] = useState('');
    const [query, setQuery] = useState('');

    const load = useCallback(async () => {
        try {
            setData(await ApiService.getTelegramStats());
            setError(null);
        } catch (e) {
            setError(typeof e === 'string' ? e : (e?.message || 'Не удалось загрузить статистику'));
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const students = useMemo(() => {
        if (!data) return [];
        const q = query.trim().toLowerCase();
        return data.students.filter((s) => (!group || s.groupName === group) && (!status || s.status === status)
            && (!q || s.name.toLowerCase().includes(q) || (s.username || '').toLowerCase().includes(q)));
    }, [data, group, status, query]);

    if (!data && !error) return <Box sx={{textAlign: 'center', py: 8}}><CircularProgress/></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    const t = data.totals;
    const healthy = t.active - t.problems;

    return (
        <Box>
            {!data.botEnabled && <Alert severity="warning" sx={{mb: 2}}>Telegram выключен: на сервере не задан токен бота.</Alert>}
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 1.5}}>
                <Typography color="text.secondary">
                    Бот {data.botUsername ? `@${data.botUsername}` : ''}: сколько студентов получают личные уведомления в Telegram.
                </Typography>
                <Button size="small" startIcon={<RefreshIcon/>} onClick={load}>Обновить</Button>
            </Box>

            <Stack direction="row" spacing={1.5} useFlexGap sx={{flexWrap: 'wrap', mb: 2}}>
                <StatCard title="Живые" value={healthy} color="success.main"
                          hint={`${percent(healthy, t.students)}% студентов: подключены и сообщения доходят`}/>
                <StatCard title="Подключили" value={t.active} hint={`из ${t.students} студентов (${percent(t.active, t.students)}%)`}/>
                <StatCard title="Не подключили" value={t.notLinked} hint={`${percent(t.notLinked, t.students)}%`}/>
                <StatCard title="Заблокировали бота" value={t.blocked} color={t.blocked ? 'error.main' : undefined}
                          hint="канал отключён, нужно подключить заново"/>
            </Stack>
            <LinearProgress variant="determinate" value={percent(t.active, t.students)} sx={{height: 10, borderRadius: 5, mb: 0.5}}/>
            <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 1}}>
                Подключено {t.active} из {t.students}.
                {t.problems > 0 && ` У ${t.problems} подключённых последняя доставка не удалась — смотрите ошибку в списке ниже.`}
                {' '}Хотя бы одно сообщение доставлено: {t.delivered}.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 3}}>
                «Живой» — подключён, бот не заблокирован и последняя отправка прошла без ошибки.
            </Typography>

            <Typography variant="h6" sx={{mb: 1}}>По группам</Typography>
            <Stack spacing={1} sx={{mb: 3}}>
                {data.groups.map((g) => (
                    <Paper key={g.groupName} variant="outlined" sx={{p: 1.5, borderRadius: 3, cursor: 'pointer'}}
                           onClick={() => setGroup(group === g.groupName ? '' : g.groupName)}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'}}>
                            <Typography fontWeight={600} sx={{flex: '0 0 110px'}}>{g.groupName}</Typography>
                            <Box sx={{flex: '1 1 160px'}}>
                                <LinearProgress variant="determinate" value={percent(g.active, g.students)} sx={{height: 8, borderRadius: 4}}/>
                            </Box>
                            <Typography variant="body2" sx={{minWidth: 130}}>
                                {g.active} из {g.students} ({percent(g.active, g.students)}%)
                            </Typography>
                            {g.blocked > 0 && <Chip size="small" color="error" variant="outlined" label={`заблокировали: ${g.blocked}`}/>}
                            {g.notLinked > 0 && <Chip size="small" variant="outlined" label={`не подключили: ${g.notLinked}`}/>}
                        </Box>
                    </Paper>
                ))}
            </Stack>

            <Typography variant="h6" sx={{mb: 1}}>Студенты</Typography>
            <Stack direction="row" spacing={1.5} useFlexGap sx={{flexWrap: 'wrap', mb: 1.5}}>
                <TextField size="small" label="Поиск" value={query} onChange={(e) => setQuery(e.target.value)} sx={{minWidth: 180}}/>
                <Select size="small" displayEmpty value={group} onChange={(e) => setGroup(e.target.value)} sx={{minWidth: 150}}>
                    <MenuItem value=""><em>Все группы</em></MenuItem>
                    {data.groups.map((g) => <MenuItem key={g.groupName} value={g.groupName}>{g.groupName}</MenuItem>)}
                </Select>
                <Select size="small" displayEmpty value={status} onChange={(e) => setStatus(e.target.value)} sx={{minWidth: 190}}>
                    <MenuItem value=""><em>Любой статус</em></MenuItem>
                    {Object.entries(STATUS).map(([key, v]) => <MenuItem key={key} value={key}>{v.label}</MenuItem>)}
                </Select>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 1}}>Показано {students.length} из {data.students.length}</Typography>
            <Stack spacing={1}>
                {students.map((s) => (
                    <Paper key={s.userId} variant="outlined" sx={{p: 1.5, borderRadius: 3}}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap'}}>
                            <Box sx={{flex: '1 1 200px', minWidth: 0}}>
                                <Typography fontWeight={600} noWrap>{s.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {s.groupName || 'Без группы'}{s.username ? ` · @${s.username}` : ''}
                                </Typography>
                            </Box>
                            <Chip size="small" variant="outlined" color={STATUS[s.status].color} label={STATUS[s.status].label}/>
                            {s.status === 'ACTIVE' && s.lastStatus === 'FAILED' && <Chip size="small" color="warning" variant="outlined" label="доставка не удалась"/>}
                            <Typography variant="caption" color="text.secondary" sx={{minWidth: 150, textAlign: 'right'}}>
                                {s.lastSentAt ? `доставлено: ${formatTime(s.lastSentAt)}` : s.linkedAt ? `подключён: ${formatTime(s.linkedAt)}` : ''}
                            </Typography>
                        </Box>
                        {s.status !== 'NOT_LINKED' && s.lastStatus === 'FAILED' && s.lastError && (
                            <Alert severity="warning" sx={{mt: 1, py: 0}}>
                                {s.lastErrorCode ? `код ${s.lastErrorCode}` : 'сбой'} — {s.lastError}
                            </Alert>
                        )}
                    </Paper>
                ))}
            </Stack>
        </Box>
    );
};

export default AdminTelegramStats;
