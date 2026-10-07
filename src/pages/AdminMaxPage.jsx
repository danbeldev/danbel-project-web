import React, {useCallback, useEffect, useState} from 'react';
import {
    Alert, Box, Button, Chip, CircularProgress, Container, FormControlLabel, MenuItem, Paper, Select, Stack, Switch,
    Typography,
} from '@mui/material';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SendIcon from '@mui/icons-material/Send';
import ApiService from '../network/API';

const errText = (e, fallback) => (typeof e === 'string' ? e : (e?.message || fallback));
const formatTime = (iso) => format(new Date(iso), 'd MMMM, HH:mm', {locale: ru});

const StatusChip = ({m}) => {
    if (m.status === 'SENT') {
        return <Chip size="small" color="success" variant="outlined" icon={<CheckCircleOutlineIcon/>}
                     label={`Max: доставлено${m.sentAt ? ` · ${formatTime(m.sentAt)}` : ''}`}/>;
    }
    if (m.status === 'PENDING') {
        return <Chip size="small" color="warning" variant="outlined" icon={<ScheduleIcon/>}
                     label={m.attempts > 0 ? `Max: повтор отправки (попыток: ${m.attempts})` : 'Max: ожидает отправки'}/>;
    }
    return <Chip size="small" color="error" variant="outlined" icon={<ErrorOutlineIcon/>} label="Max: не доставлено"/>;
};

// Админка Max: какие чаты видит бот, привязка чата к группе студентов, тестовое сообщение и журнал отправок.
const AdminMaxPage = () => {
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(0);
    const [onlyFailed, setOnlyFailed] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(true);

    const loadStatus = useCallback(async () => {
        try {
            setStatus(await ApiService.getMaxStatus());
            setError(null);
        } catch (e) {
            setError(errText(e, 'Не удалось загрузить состояние Max'));
        }
    }, []);

    const loadMessages = useCallback(async (p, replace) => {
        setLoadingMessages(true);
        try {
            const data = await ApiService.getGroupMessages({page: p, size: 20, onlyFailed});
            setMessages((prev) => (replace ? data.items : [...prev, ...data.items]));
            setHasMore(data.hasMore);
            setPage(p);
        } catch (e) {
            setError(errText(e, 'Не удалось загрузить журнал'));
        } finally {
            setLoadingMessages(false);
        }
    }, [onlyFailed]);

    useEffect(() => {
        loadStatus();
        const t = setInterval(loadStatus, 15000); // новые чаты появляются, когда бота добавляют
        return () => clearInterval(t);
    }, [loadStatus]);

    useEffect(() => {
        loadMessages(0, true);
    }, [loadMessages]);

    const bind = async (chatId, groupId) => {
        try {
            await ApiService.bindMaxChat(chatId, groupId === '' ? null : groupId);
            await loadStatus();
        } catch (e) {
            setError(errText(e, 'Не удалось привязать чат'));
        }
    };

    const test = async (groupId) => {
        try {
            const r = await ApiService.sendMaxTest(groupId);
            setInfo(r.queued ? 'Тестовое сообщение поставлено в очередь, оно придёт в течение нескольких секунд.' : 'У группы нет привязанного чата.');
            setTimeout(() => loadMessages(0, true), 5000);
        } catch (e) {
            setError(errText(e, 'Не удалось отправить тест'));
        }
    };

    const welcome = async (groupId, groupName) => {
        if (!window.confirm(`Отправить в чат группы ${groupName} приветствие бота (что он будет присылать)?`)) return;
        try {
            const r = await ApiService.sendMaxWelcome(groupId);
            setInfo(r.queued ? 'Приветствие поставлено в очередь, оно придёт в течение нескольких секунд.' : 'У группы нет привязанного чата.');
            setTimeout(() => loadMessages(0, true), 5000);
        } catch (e) {
            setError(errText(e, 'Не удалось отправить приветствие'));
        }
    };

    if (!status && !error) return <Box sx={{textAlign: 'center', py: 8}}><CircularProgress/></Box>;

    return (
        <Container maxWidth="md" sx={{py: 3}}>
            <Typography variant="h5" sx={{mb: 0.5}}>Чаты Max</Typography>
            <Typography color="text.secondary" sx={{mb: 2}}>
                Общие сообщения группе (новая лекция, сроки сдачи) бот отправляет в её чат в Max.
            </Typography>

            {error && <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>{error}</Alert>}
            {info && <Alert severity="success" sx={{mb: 2}} onClose={() => setInfo(null)}>{info}</Alert>}

            {status && !status.enabled && (
                <Alert severity="warning" sx={{mb: 2}}>Max выключен: на сервере не задан токен бота (MAX_BOT_TOKEN).</Alert>
            )}
            {status?.enabled && status.error && (
                <Alert severity="error" sx={{mb: 2}}>Бот не отвечает: {status.error}</Alert>
            )}

            {status?.enabled && !status.error && (
                <Paper variant="outlined" sx={{p: 2, borderRadius: 3, mb: 2}}>
                    <Typography>
                        Бот: <b>{status.botName}</b>{status.botUsername ? ` (@${status.botUsername})` : ''}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>
                        Добавьте бота в чат группы в Max и сделайте его администратором — чат появится в списке ниже. При привязке чата к группе бот сам отправит в чат приветствие с описанием уведомлений; кнопка «Приветствие» отправит его повторно.
                    </Typography>
                </Paper>
            )}

            <Typography variant="h6" sx={{mt: 3, mb: 1}}>Чаты, где состоит бот</Typography>
            {status && status.chats.length === 0 && (
                <Typography color="text.secondary">Пока ни одного чата: бота ещё не добавили в чат.</Typography>
            )}
            <Stack spacing={1.5}>
                {status?.chats.map((c) => (
                    <Paper key={c.chatId} variant="outlined" sx={{p: 2, borderRadius: 3}}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'}}>
                            <Box sx={{flex: '1 1 200px', minWidth: 0}}>
                                <Typography fontWeight={600} noWrap>{c.title || `Чат ${c.chatId}`}</Typography>
                                <Typography variant="caption" color="text.secondary">id {c.chatId}{c.type ? ` · ${c.type}` : ''}</Typography>
                            </Box>
                            <Select size="small" displayEmpty value={c.groupId ?? ''} sx={{minWidth: 180}}
                                    onChange={(e) => bind(c.chatId, e.target.value)}>
                                <MenuItem value=""><em>Не привязан</em></MenuItem>
                                {status.groups.map((g) => (
                                    <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                                ))}
                            </Select>
                            <Button size="small" variant="outlined" startIcon={<SendIcon/>} disabled={c.groupId == null}
                                    onClick={() => test(c.groupId)}>
                                Тест
                            </Button>
                            <Button size="small" variant="outlined" disabled={c.groupId == null}
                                    onClick={() => welcome(c.groupId, c.groupName)}>
                                Приветствие
                            </Button>
                        </Box>
                    </Paper>
                ))}
            </Stack>

            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mt: 4, mb: 1}}>
                <Typography variant="h6">Журнал сообщений в чаты</Typography>
                <FormControlLabel
                    control={<Switch size="small" checked={onlyFailed} onChange={(e) => setOnlyFailed(e.target.checked)}/>}
                    label="Только с ошибками"/>
            </Box>
            <Stack spacing={1.5}>
                {messages.map((m) => (
                    <Paper key={m.id} variant="outlined" sx={{p: 2, borderRadius: 3}}>
                        <Typography variant="caption" color="text.secondary">
                            {formatTime(m.createdAt)} · группа {m.groupName}
                        </Typography>
                        <Typography sx={{whiteSpace: 'pre-line', wordBreak: 'break-word', mt: 0.25}}>{m.text}</Typography>
                        <Box sx={{mt: 1}}><StatusChip m={m}/></Box>
                        {m.status !== 'SENT' && m.error && (
                            <Alert severity={m.status === 'FAILED' ? 'error' : 'warning'} sx={{mt: 1, py: 0}}>
                                {m.errorCode ? `код ${m.errorCode}` : 'сбой'} — {m.error}
                            </Alert>
                        )}
                    </Paper>
                ))}
            </Stack>
            {!loadingMessages && messages.length === 0 && (
                <Typography color="text.secondary">{onlyFailed ? 'Сообщений с ошибками нет.' : 'Сообщений пока не было.'}</Typography>
            )}
            <Box sx={{textAlign: 'center', mt: 2}}>
                {loadingMessages && <CircularProgress size={28}/>}
                {!loadingMessages && hasMore && <Button onClick={() => loadMessages(page + 1, false)}>Показать ещё</Button>}
            </Box>
        </Container>
    );
};

export default AdminMaxPage;
