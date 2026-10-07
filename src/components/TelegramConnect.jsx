import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material';
import TelegramIcon from '@mui/icons-material/Telegram';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ApiService from '../network/API';

const POLL_MS = 3000;
const POLL_LIMIT_MS = 10 * 60 * 1000;

// Состояние привязки + запуск привязки: ссылка открывается в новой вкладке, а статус опрашивается,
// пока пользователь не нажмёт Start в боте.
const useTelegramLink = () => {
    const [status, setStatus] = useState(null);
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const timer = useRef(null);

    const stopPolling = useCallback(() => {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        setWaiting(false);
    }, []);

    const refresh = useCallback(async () => {
        try {
            const s = await ApiService.getTelegramStatus();
            setStatus(s);
            return s;
        } catch (e) {
            return null;
        }
    }, []);

    useEffect(() => () => timer.current && clearInterval(timer.current), []);

    const connect = useCallback(async () => {
        setError('');
        try {
            const {url} = await ApiService.createTelegramLink();
            setLinkUrl(url);
            window.open(url, '_blank', 'noopener');
            setWaiting(true);
            const startedAt = Date.now();
            if (timer.current) clearInterval(timer.current);
            timer.current = setInterval(async () => {
                const s = await refresh();
                if ((s && s.linked && s.enabled) || Date.now() - startedAt > POLL_LIMIT_MS) stopPolling();
            }, POLL_MS);
        } catch (e) {
            setError(typeof e === 'string' ? e : (e?.message || 'Не удалось получить ссылку'));
        }
    }, [refresh, stopPolling]);

    const disconnect = useCallback(async () => {
        setError('');
        try {
            await ApiService.unlinkTelegram();
            await refresh();
        } catch (e) {
            setError(typeof e === 'string' ? e : (e?.message || 'Не удалось отвязать'));
        }
    }, [refresh]);

    return {status, waiting, error, linkUrl, connect, disconnect, refresh};
};

const connected = (s) => !!(s && s.linked && s.enabled);
const available = (s) => !!(s && s.botEnabled && s.botUsername);

const WaitingHint = ({linkUrl}) => (
    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mt: 2}}>
        <CircularProgress size={18}/>
        <Typography variant="body2" color="text.secondary">
            Откройте Telegram и нажмите Start. Если вкладка не открылась,{' '}
            <a href={linkUrl} target="_blank" rel="noopener noreferrer">перейдите по ссылке</a>.
        </Typography>
    </Box>
);

// Диалог при каждом заходе на сайт, пока Telegram не подключён. «Позже» закрывает его до следующего запуска.
export const TelegramConnectDialog = () => {
    const location = useLocation();
    const {status, waiting, error, linkUrl, connect, refresh} = useTelegramLink();
    const [open, setOpen] = useState(false);
    const checked = useRef(false);

    useEffect(() => {
        if (!ApiService.isAuthenticated()) {
            checked.current = false; // после выхода и нового входа проверим заново
            setOpen(false);
            return;
        }
        if (checked.current || location.pathname === '/sign-in') return;
        checked.current = true;
        refresh().then((s) => {
            if (available(s) && !connected(s)) setOpen(true);
        });
    }, [location.pathname, refresh]);

    const done = connected(status);

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                {done ? <CheckCircleIcon color="success"/> : <TelegramIcon color="primary"/>}
                {done ? 'Telegram подключён' : 'Подключите Telegram'}
            </DialogTitle>
            <DialogContent>
                {done ? (
                    <Typography>Готово! Теперь уведомления будут приходить вам в Telegram.</Typography>
                ) : (
                    <>
                        <Typography>
                            Бот DanBel будет присылать вам личные уведомления: о баллах, сроках сдачи и другом важном.
                            Подключение занимает несколько секунд.
                        </Typography>
                        {waiting && <WaitingHint linkUrl={linkUrl}/>}
                        {error && <Alert severity="error" sx={{mt: 2}}>{error}</Alert>}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                {done ? (
                    <Button variant="contained" onClick={() => setOpen(false)}>Закрыть</Button>
                ) : (
                    <>
                        <Button onClick={() => setOpen(false)}>Позже</Button>
                        <Button variant="contained" startIcon={<TelegramIcon/>} onClick={connect}>
                            {waiting ? 'Открыть ещё раз' : 'Подключить Telegram'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

// Блок в профиле: статус, кнопка подключения и отключение.
export const TelegramConnectCard = () => {
    const {status, waiting, error, linkUrl, connect, disconnect, refresh} = useTelegramLink();

    useEffect(() => {
        refresh();
    }, [refresh]);

    if (!available(status)) return null;

    return (
        <Box sx={{maxWidth: 320, mx: 'auto', mb: 2, textAlign: 'center'}}>
            {connected(status) ? (
                <>
                    <Typography variant="body2" sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5}}>
                        <CheckCircleIcon color="success" fontSize="small"/>
                        Telegram подключён{status.username ? ` (@${status.username})` : ''}
                    </Typography>
                    <Button size="small" color="inherit" onClick={disconnect} sx={{mt: 0.5}}>Отключить</Button>
                </>
            ) : (
                <>
                    <Button size="small" variant="outlined" startIcon={<TelegramIcon/>} onClick={connect}>
                        {status.linked ? 'Включить уведомления в Telegram' : 'Подключить Telegram'}
                    </Button>
                    {waiting && <WaitingHint linkUrl={linkUrl}/>}
                </>
            )}
            {error && <Typography variant="caption" color="error" sx={{display: 'block', mt: 1}}>{error}</Typography>}
        </Box>
    );
};
