import React, {useCallback, useEffect, useState} from 'react';
import {
    Alert, Avatar, Box, Button, Chip, CircularProgress, Container, FormControlLabel, Paper, Stack, Switch,
    ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import {Link as RouterLink} from 'react-router-dom';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';
import GradeOutlinedIcon from '@mui/icons-material/GradeOutlined';
import AlarmOutlinedIcon from '@mui/icons-material/AlarmOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TelegramIcon from '@mui/icons-material/Telegram';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ApiService from '../network/API';

const KINDS = {
    CRITERIA_PUBLISHED: {icon: <FactCheckOutlinedIcon/>, color: '#2e7d32', label: 'Проверка'},
    GRADE_CHANGED: {icon: <GradeOutlinedIcon/>, color: '#ed6c02', label: 'Оценка'},
    DEADLINE_REMINDER: {icon: <AlarmOutlinedIcon/>, color: '#d32f2f', label: 'Напоминание'},
    DEADLINE_PASSED: {icon: <LockOutlinedIcon/>, color: '#6d4c41', label: 'Срок истёк'},
    DEADLINE_CHANGED: {icon: <EventOutlinedIcon/>, color: '#0288d1', label: 'Срок сдачи'},
    PARTNER: {icon: <GroupOutlinedIcon/>, color: '#7b1fa2', label: 'Пара'},
    NEW_ARTICLE: {icon: <MenuBookOutlinedIcon/>, color: '#4361ee', label: 'Лекция'},
    OTHER: {icon: <NotificationsNoneIcon/>, color: '#607d8b', label: 'Уведомление'},
};

const CHANNELS = {TELEGRAM: 'Telegram'};

const formatTime = (iso) => format(new Date(iso), 'd MMMM, HH:mm', {locale: ru});

// Результат доставки по каналу: доставлено / ждёт отправки / не удалось (с кодом и причиной).
const Delivery = ({d}) => {
    const name = CHANNELS[d.channel] || d.channel;
    if (d.status === 'SENT') {
        return <Chip size="small" color="success" variant="outlined" icon={<CheckCircleOutlineIcon/>}
                     label={`${name}: доставлено${d.sentAt ? ` · ${formatTime(d.sentAt)}` : ''}`}/>;
    }
    if (d.status === 'PENDING') {
        return <Chip size="small" color="warning" variant="outlined" icon={<ScheduleIcon/>}
                     label={`${name}: ${d.attempts > 0 ? `повтор отправки (попыток: ${d.attempts})` : 'ожидает отправки'}`}/>;
    }
    return <Chip size="small" color="error" variant="outlined" icon={<ErrorOutlineIcon/>} label={`${name}: не доставлено`}/>;
};

const NotificationCard = ({item, showUser}) => {
    const kind = KINDS[item.kind] || KINDS.OTHER;
    const failed = item.deliveries.filter((d) => d.status === 'FAILED' || (d.status === 'PENDING' && d.error));
    return (
        <Paper variant="outlined" sx={{p: 2, borderRadius: 3}}>
            <Box sx={{display: 'flex', gap: 1.75, alignItems: 'flex-start'}}>
                <Avatar sx={{bgcolor: `${kind.color}22`, color: kind.color, width: 42, height: 42}}>{kind.icon}</Avatar>
                <Box sx={{minWidth: 0, flex: 1}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5}}>
                        <Typography variant="caption" color="text.secondary">
                            {kind.label} · {formatTime(item.createdAt)}
                        </Typography>
                        {showUser && <Chip size="small" label={item.userName} sx={{height: 20}}/>}
                    </Box>
                    <Typography sx={{whiteSpace: 'pre-line', wordBreak: 'break-word'}}>{item.text}</Typography>

                    <Stack direction="row" spacing={1} useFlexGap sx={{mt: 1.25, flexWrap: 'wrap', alignItems: 'center'}}>
                        {item.deliveries.length === 0 ? (
                            <Chip size="small" variant="outlined" icon={<TelegramIcon/>}
                                  label="Только на сайте: Telegram не подключён"/>
                        ) : item.deliveries.map((d, i) => <Delivery key={i} d={d}/>)}
                        {item.url && (
                            <Button size="small" component={RouterLink} to={item.url} endIcon={<OpenInNewIcon fontSize="small"/>}
                                    sx={{ml: 'auto !important', py: 0.25, px: 1.25}}>
                                Открыть
                            </Button>
                        )}
                    </Stack>

                    {failed.map((d, i) => (
                        <Alert key={i} severity={d.status === 'FAILED' ? 'error' : 'warning'} sx={{mt: 1, py: 0}}>
                            {CHANNELS[d.channel] || d.channel}: {d.errorCode ? `код ${d.errorCode}` : 'сбой'}
                            {d.error ? ` — ${d.error}` : ''}
                        </Alert>
                    ))}
                </Box>
            </Box>
        </Paper>
    );
};

const SIZE = 30;

// Все уведомления пользователя и результат их доставки. Админ может посмотреть уведомления всех и только ошибки.
const NotificationsPage = () => {
    const admin = ApiService.isAdmin();
    const [scope, setScope] = useState('mine');
    const [onlyFailed, setOnlyFailed] = useState(false);
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async (pageToLoad, replace) => {
        setLoading(true);
        setError(null);
        try {
            const data = await ApiService.getNotifications({page: pageToLoad, size: SIZE, onlyFailed, all: admin && scope === 'all'});
            setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
            setHasMore(data.hasMore);
            setPage(pageToLoad);
        } catch (e) {
            setError(typeof e === 'string' ? e : (e?.message || 'Не удалось загрузить уведомления'));
        } finally {
            setLoading(false);
        }
    }, [admin, scope, onlyFailed]);

    useEffect(() => {
        load(0, true);
    }, [load]);

    return (
        <Container maxWidth="md" sx={{py: 3}}>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2}}>
                <Typography variant="h5">Уведомления</Typography>
                <Stack direction="row" spacing={2} sx={{alignItems: 'center', flexWrap: 'wrap'}}>
                    {admin && (
                        <ToggleButtonGroup size="small" exclusive value={scope} onChange={(e, v) => v && setScope(v)}>
                            <ToggleButton value="mine">Мои</ToggleButton>
                            <ToggleButton value="all">Все пользователи</ToggleButton>
                        </ToggleButtonGroup>
                    )}
                    <FormControlLabel
                        control={<Switch size="small" checked={onlyFailed} onChange={(e) => setOnlyFailed(e.target.checked)}/>}
                        label="Только с ошибками"/>
                </Stack>
            </Box>

            {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}

            <Stack spacing={1.5}>
                {items.map((item) => <NotificationCard key={item.id} item={item} showUser={admin && scope === 'all'}/>)}
            </Stack>

            {!loading && !error && items.length === 0 && (
                <Box sx={{textAlign: 'center', py: 8, color: 'text.secondary'}}>
                    <NotificationsNoneIcon sx={{fontSize: 56, opacity: 0.5}}/>
                    <Typography sx={{mt: 1}}>{onlyFailed ? 'Уведомлений с ошибками нет' : 'Пока уведомлений нет'}</Typography>
                </Box>
            )}

            <Box sx={{textAlign: 'center', mt: 2}}>
                {loading && <CircularProgress size={28}/>}
                {!loading && hasMore && <Button onClick={() => load(page + 1, false)}>Показать ещё</Button>}
            </Box>
        </Container>
    );
};

export default NotificationsPage;
