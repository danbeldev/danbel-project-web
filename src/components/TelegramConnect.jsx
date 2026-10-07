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
    IconButton,
    Typography,
} from '@mui/material';
import TelegramIcon from '@mui/icons-material/Telegram';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import GradeOutlinedIcon from '@mui/icons-material/GradeOutlined';
import AlarmOutlinedIcon from '@mui/icons-material/AlarmOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
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

const TG_BLUE = '#229ED9';
const TG_BLUE_LIGHT = '#2AABEE';

const WaitingHint = ({linkUrl}) => (
    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mt: 2}}>
        <CircularProgress size={18}/>
        <Typography variant="body2" color="text.secondary">
            Откройте Telegram и нажмите Start. Если вкладка не открылась,{' '}
            <a href={linkUrl} target="_blank" rel="noopener noreferrer">перейдите по ссылке</a>.
        </Typography>
    </Box>
);

const BENEFITS = [
    {icon: <GradeOutlinedIcon/>, title: 'Баллы и оценки', text: 'Узнаете о проверке сразу, как только она опубликована'},
    {icon: <AlarmOutlinedIcon/>, title: 'Напоминания о сроках', text: 'За сутки и за 2 часа до сдачи, если работа ещё не принята'},
    {icon: <NotificationsActiveOutlinedIcon/>, title: 'Важные изменения', text: 'Новые лекции, смена срока, приглашение в пару'},
];

const Benefit = ({icon, title, text}) => (
    <Box sx={{display: 'flex', gap: 1.75, alignItems: 'flex-start'}}>
        <Box sx={{
            width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: TG_BLUE_LIGHT, bgcolor: 'rgba(34, 158, 217, 0.14)',
        }}>
            {icon}
        </Box>
        <Box>
            <Typography sx={{fontWeight: 600, lineHeight: 1.3}}>{title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{lineHeight: 1.45}}>{text}</Typography>
        </Box>
    </Box>
);

const Step = ({n, active, done, children}) => (
    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, opacity: active || done ? 1 : 0.55}}>
        <Box sx={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0, fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', bgcolor: done ? 'success.main' : TG_BLUE,
        }}>
            {done ? <CheckCircleIcon sx={{fontSize: 18}}/> : n}
        </Box>
        <Typography variant="body2">{children}</Typography>
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
    const close = () => setOpen(false);

    return (
        <Dialog
            open={open}
            onClose={close}
            maxWidth="xs"
            fullWidth
            slotProps={{paper: {sx: {borderRadius: '24px', overflow: 'hidden', m: 2, backgroundImage: 'none'}}}}
        >
            <Box sx={{
                position: 'relative', px: 3, pt: 4, pb: 3, textAlign: 'center', color: '#fff',
                background: `linear-gradient(135deg, ${TG_BLUE_LIGHT} 0%, ${TG_BLUE} 55%, #1c7fc0 100%)`,
            }}>
                <IconButton onClick={close} aria-label="Закрыть" size="small"
                            sx={{position: 'absolute', top: 10, right: 10, color: 'rgba(255,255,255,0.85)'}}>
                    <CloseIcon fontSize="small"/>
                </IconButton>
                <Box sx={{
                    width: 72, height: 72, mx: 'auto', mb: 2, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'rgba(255,255,255,0.2)', boxShadow: '0 0 0 8px rgba(255,255,255,0.12)',
                }}>
                    {done ? <CheckCircleIcon sx={{fontSize: 44}}/> : <TelegramIcon sx={{fontSize: 44}}/>}
                </Box>
                <Typography variant="h5" sx={{fontWeight: 700}}>
                    {done ? 'Telegram подключён' : 'Подключите Telegram'}
                </Typography>
                <Typography sx={{mt: 0.5, opacity: 0.9}}>
                    {done ? 'Теперь уведомления будут приходить вам в личные сообщения' : 'Уведомления прямо в мессенджере'}
                </Typography>
            </Box>

            <DialogContent sx={{px: 3, pt: 3, pb: 1}}>
                {done ? (
                    <Typography color="text.secondary" sx={{textAlign: 'center', py: 1}}>
                        Отключить уведомления можно в профиле или командой /stop в боте.
                    </Typography>
                ) : waiting ? (
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.75, py: 0.5}}>
                        <Step n={1} done>Бот открыт в новой вкладке</Step>
                        <Step n={2} active>Нажмите <b>Start</b> в Telegram</Step>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5}}>
                            <CircularProgress size={18} sx={{color: TG_BLUE}}/>
                            <Typography variant="body2" color="text.secondary">
                                Ждём подтверждения. Вкладка не открылась?{' '}
                                <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{color: TG_BLUE_LIGHT}}>Открыть бота</a>
                            </Typography>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2.25}}>
                        {BENEFITS.map((b) => <Benefit key={b.title} {...b}/>)}
                    </Box>
                )}
                {error && <Alert severity="error" sx={{mt: 2}}>{error}</Alert>}
            </DialogContent>

            <DialogActions sx={{flexDirection: 'column', gap: 0.5, px: 3, pt: 2, pb: 2.5, '& > :not(style) ~ :not(style)': {ml: 0}}}>
                {done ? (
                    <Button fullWidth size="large" variant="contained" onClick={close}
                            sx={{bgcolor: TG_BLUE, '&:hover': {bgcolor: '#1c8bbf'}}}>
                        Отлично
                    </Button>
                ) : (
                    <>
                        <Button fullWidth size="large" variant="contained" startIcon={<TelegramIcon/>} onClick={connect}
                                sx={{bgcolor: TG_BLUE, borderRadius: '14px', py: 1.4, '&:hover': {bgcolor: '#1c8bbf'}}}>
                            {waiting ? 'Открыть бота ещё раз' : 'Подключить Telegram'}
                        </Button>
                        {!waiting && (
                            <Typography variant="caption" color="text.secondary" sx={{textAlign: 'center', pt: 0.5}}>
                                Бот пишет только вам и ничего не публикует. Подключение займёт несколько секунд.
                            </Typography>
                        )}
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
