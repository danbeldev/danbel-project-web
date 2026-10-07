import React, {useCallback, useEffect, useState} from 'react';
import {
    Alert, Box, Button, Chip, CircularProgress, Container, FormControlLabel, MenuItem, Paper, Select, Stack, Switch,
    ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SendIcon from '@mui/icons-material/Send';
import ApiService from '../network/API';

const PROVIDERS = {MAX: 'Max', VK: 'VK'};

// Название чата; у бесед VK оно не всегда известно боту — тогда показываем номер беседы (peer_id = 2000000000 + номер).
const chatLabel = (c) => c.title || (c.provider === 'VK' ? `Беседа VK №${c.chatId - 2000000000}` : `Чат ${c.chatId}`);

const errText = (e, fallback) => (typeof e === 'string' ? e : (e?.message || fallback));
const formatTime = (iso) => format(new Date(iso), 'd MMMM, HH:mm', {locale: ru});

const StatusChip = ({m}) => {
    const name = PROVIDERS[m.channel] || m.channel;
    if (m.status === 'SENT') {
        return <Chip size="small" color="success" variant="outlined" icon={<CheckCircleOutlineIcon/>}
                     label={`${name}: доставлено${m.sentAt ? ` · ${formatTime(m.sentAt)}` : ''}`}/>;
    }
    if (m.status === 'PENDING') {
        return <Chip size="small" color="warning" variant="outlined" icon={<ScheduleIcon/>}
                     label={m.attempts > 0 ? `${name}: повтор отправки (попыток: ${m.attempts})` : `${name}: ожидает отправки`}/>;
    }
    return <Chip size="small" color="error" variant="outlined" icon={<ErrorOutlineIcon/>} label={`${name}: не доставлено`}/>;
};

// Состояние бота мессенджера: подключён ли, как называется, ошибка связи и подсказка, как добавить бота в чат.
const MessengerCard = ({name, status, hint}) => (
    <Paper variant="outlined" sx={{p: 2, borderRadius: 3, flex: '1 1 280px', minWidth: 0}}>
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 0.5}}>
            <Typography fontWeight={700}>{name}</Typography>
            {!status.enabled && <Chip size="small" label="не настроен"/>}
            {status.enabled && !status.error && <Chip size="small" color="success" variant="outlined" label="подключён"/>}
            {status.enabled && status.error && <Chip size="small" color="error" variant="outlined" label="нет связи"/>}
        </Box>
        {status.enabled && !status.error && (
            <Typography variant="body2">
                {status.botName}{status.botUsername ? ` (@${status.botUsername})` : ''}
            </Typography>
        )}
        {status.enabled && status.error && <Typography variant="body2" color="error">{status.error}</Typography>}
        {!status.enabled && (
            <Typography variant="body2" color="text.secondary">Токен бота ещё не задан на сервере.</Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 0.75}}>{hint}</Typography>
    </Paper>
);

// Одна группа: выбор мессенджера (Max или VK) и чата этого мессенджера, тест и приветствие.
const GroupRow = ({group, status, onBind, onTest, onWelcome}) => {
    const [provider, setProvider] = useState(group.provider);
    useEffect(() => setProvider(group.provider), [group.provider]);

    const messenger = provider === 'MAX' ? status.max : provider === 'VK' ? status.vk : null;
    const chats = provider ? status.chats.filter((c) => c.provider === provider) : [];
    const bound = group.provider && group.chatId != null;
    const value = bound && provider === group.provider ? String(group.chatId) : '';

    return (
        <Paper variant="outlined" sx={{p: 2, borderRadius: 3}}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'}}>
                <Typography fontWeight={600} sx={{flex: '0 0 110px'}}>{group.name}</Typography>

                <ToggleButtonGroup size="small" exclusive value={provider} onChange={(e, v) => v && setProvider(v)}>
                    {Object.entries(PROVIDERS).map(([key, label]) => (
                        <ToggleButton key={key} value={key}>{label}</ToggleButton>
                    ))}
                </ToggleButtonGroup>

                {provider && (
                    <Select size="small" displayEmpty value={value} sx={{minWidth: 220, flex: '1 1 220px'}}
                            onChange={(e) => onBind(provider, e.target.value, group)}>
                        <MenuItem value=""><em>{chats.length ? 'Выберите чат' : 'Нет чатов'}</em></MenuItem>
                        {chats.map((c) => (
                            <MenuItem key={c.chatId} value={String(c.chatId)}>
                                {chatLabel(c)}{c.groupId != null && c.groupId !== group.id ? ` — занят (${c.groupName})` : ''}
                            </MenuItem>
                        ))}
                    </Select>
                )}

                {bound && (
                    <>
                        <Button size="small" variant="outlined" startIcon={<SendIcon/>} onClick={() => onTest(group.id)}>Тест</Button>
                        <Button size="small" variant="outlined" onClick={() => onWelcome(group)}>Приветствие</Button>
                        <Button size="small" color="inherit" onClick={() => onBind(group.provider, '', group)}>Отвязать</Button>
                    </>
                )}
            </Box>
            {provider && messenger && !messenger.enabled && (
                <Typography variant="caption" color="warning.main" sx={{display: 'block', mt: 0.75}}>
                    {PROVIDERS[provider]} ещё не настроен — сообщения в этот чат пока не отправляются.
                </Typography>
            )}
            {provider && messenger?.enabled && chats.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 0.75}}>
                    Бот {PROVIDERS[provider]} ещё не добавлен ни в один чат: добавьте его в чат группы и сделайте администратором.
                </Typography>
            )}
        </Paper>
    );
};

// Админка чатов групп: у каждой группы свой мессенджер (Max или VK) и чат, в который бот пишет общие сообщения.
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
            setError(errText(e, 'Не удалось загрузить состояние'));
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

    // chatId === '' — отвязать текущий чат группы; иначе привязать выбранный (прежний чат группы снимается).
    const bind = async (provider, chatId, group) => {
        try {
            if (chatId === '') {
                if (group.provider && group.chatId != null) await ApiService.bindGroupChat(group.provider, group.chatId, null);
            } else {
                const other = group.provider && group.provider !== provider && group.chatId != null;
                if (other && !window.confirm(`У группы ${group.name} уже привязан чат в ${PROVIDERS[group.provider]}. Заменить его на чат в ${PROVIDERS[provider]}?`)) return;
                await ApiService.bindGroupChat(provider, chatId, group.id);
                setInfo(`Чат привязан к группе ${group.name}. Бот отправит в него приветствие.`);
                setTimeout(() => loadMessages(0, true), 5000);
            }
            await loadStatus();
        } catch (e) {
            setError(errText(e, 'Не удалось изменить привязку'));
        }
    };

    const test = async (groupId) => {
        try {
            const r = await ApiService.sendMaxTest(groupId);
            setInfo(r.queued ? 'Тестовое сообщение поставлено в очередь, оно придёт в течение нескольких секунд.' : 'У группы нет привязанного чата или его мессенджер не настроен.');
            setTimeout(() => loadMessages(0, true), 5000);
        } catch (e) {
            setError(errText(e, 'Не удалось отправить тест'));
        }
    };

    const welcome = async (group) => {
        if (!window.confirm(`Отправить в чат группы ${group.name} приветствие бота (что он будет присылать)?`)) return;
        try {
            const r = await ApiService.sendMaxWelcome(group.id);
            setInfo(r.queued ? 'Приветствие поставлено в очередь, оно придёт в течение нескольких секунд.' : 'У группы нет привязанного чата или его мессенджер не настроен.');
            setTimeout(() => loadMessages(0, true), 5000);
        } catch (e) {
            setError(errText(e, 'Не удалось отправить приветствие'));
        }
    };

    if (!status && !error) return <Box sx={{textAlign: 'center', py: 8}}><CircularProgress/></Box>;

    return (
        <Container maxWidth="md" sx={{py: 3}}>
            <Typography variant="h5" sx={{mb: 0.5}}>Чаты групп</Typography>
            <Typography color="text.secondary" sx={{mb: 2}}>
                Общие сообщения группе (новая лекция, сроки сдачи, итоги) бот отправляет в её чат: у каждой группы это чат в Max или в VK.
            </Typography>

            {error && <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>{error}</Alert>}
            {info && <Alert severity="success" sx={{mb: 2}} onClose={() => setInfo(null)}>{info}</Alert>}

            {status && (
                <Stack direction="row" spacing={2} useFlexGap sx={{flexWrap: 'wrap', mb: 3}}>
                    <MessengerCard name="Max" status={status.max}
                                   hint="Добавьте бота в чат группы в Max и сделайте его администратором — чат появится в списке."/>
                    <MessengerCard name="VK" status={status.vk}
                                   hint="Добавьте сообщество в беседу группы и сделайте администратором — беседа появится в списке (в сообществе должен быть включён Bots Long Poll)."/>
                </Stack>
            )}

            <Typography variant="h6" sx={{mb: 1}}>Группы</Typography>
            <Stack spacing={1.5}>
                {status?.groups.map((g) => (
                    <GroupRow key={g.id} group={g} status={status} onBind={bind} onTest={test} onWelcome={welcome}/>
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
