import React, {useEffect, useState} from 'react';
import {Box, Typography, keyframes} from '@mui/material';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import LockClockRoundedIcon from '@mui/icons-material/LockClockRounded';
import {format} from 'date-fns';
import ApiService from '../network/API';

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
`;

// Срок сдачи лекции для группы текущего студента + секундный обратный отсчёт.
// Для админа и студентов без срока closesAt == null — ничего не показываем.
export const useDeadline = (articleId) => {
    const [closesAt, setClosesAt] = useState(null);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        setClosesAt(null);
        if (!articleId || !localStorage.getItem('accessToken')) return;
        let cancelled = false;
        ApiService.getMyDeadline(articleId)
            .then((data) => {
                if (!cancelled && data.closesAt) setClosesAt(new Date(data.closesAt).getTime());
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [articleId]);

    const msLeft = closesAt ? closesAt - now : null;
    const closed = closesAt !== null && msLeft <= 0;

    useEffect(() => {
        if (closesAt === null || closed) return;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [closesAt, closed]);

    return {closesAt, msLeft, closed, hasDeadline: closesAt !== null};
};

// Часовой пояс устройства студента: "Москва (UTC+3)". Время срока показываем в нём же,
// поэтому явно подписываем, чтобы не было путаницы между городами.
export const getTimezoneLabel = (date) => {
    const offsetMin = -date.getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    const hh = Math.floor(abs / 60);
    const mm = abs % 60;
    const utc = `UTC${sign}${hh}${mm ? ':' + String(mm).padStart(2, '0') : ''}`;
    try {
        const parts = new Intl.DateTimeFormat('ru-RU', {timeZoneName: 'long'}).formatToParts(date);
        const name = parts.find((p) => p.type === 'timeZoneName')?.value;
        const city = name && name.replace(/,?\s*(стандартное|летнее|зимнее)\s+время.*$/i, '').trim();
        if (city && !/^GMT|^UTC/i.test(city)) return `${city} (${utc})`;
    } catch (e) {
        // нет Intl-данных — достаточно смещения
    }
    return utc;
};

const pad = (n) => String(n).padStart(2, '0');

const formatCountdown = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return (days > 0 ? `${days} д ` : '') + `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const DeadlineBanner = ({articleId, deadline: external, compact = false}) => {
    const own = useDeadline(external ? null : articleId);
    const {closesAt, msLeft, closed, hasDeadline} = external || own;

    if (!hasDeadline) return null;

    // Чем ближе срок, тем тревожнее цвет: >1 суток — спокойный, <1 суток — предупреждение,
    // <1 часа — красный с пульсацией, закрыто — красный.
    const urgent = !closed && msLeft < HOUR;
    const color = closed || urgent ? 'error' : msLeft < DAY ? 'warning' : 'info';
    const Icon = closed ? LockClockRoundedIcon : AccessTimeRoundedIcon;

    return (
        <Box
            sx={(theme) => ({
                display: 'flex',
                alignItems: 'center',
                gap: compact ? 1.5 : 2.5,
                p: compact ? 1.5 : 2.5,
                my: 2,
                borderRadius: 3,
                border: `2px solid ${theme.palette[color].main}`,
                bgcolor: `${theme.palette[color].main}1f`,
                color: 'text.primary',
            })}
        >
            <Icon sx={{fontSize: compact ? 32 : 48, color: `${color}.main`, flexShrink: 0}}/>
            <Box sx={{minWidth: 0}}>
                <Typography variant={compact ? 'body2' : 'subtitle1'} color="text.secondary" fontWeight={600}>
                    {closed ? 'Приём решений закрыт' : 'До закрытия приёма решений'}
                </Typography>
                {closed ? (
                    <Typography variant={compact ? 'h6' : 'h5'} fontWeight={700} color="error.main">
                        Срок истёк {format(new Date(closesAt), 'dd.MM.yyyy HH:mm')} · {getTimezoneLabel(new Date(closesAt))}
                    </Typography>
                ) : (
                    <>
                        <Typography
                            component="div"
                            fontWeight={800}
                            color={`${color}.main`}
                            sx={{
                                fontSize: compact ? '1.9rem' : {xs: '2.2rem', sm: '3rem'},
                                lineHeight: 1.15,
                                fontVariantNumeric: 'tabular-nums',
                                animation: urgent ? `${pulse} 1s ease-in-out infinite` : 'none',
                            }}
                        >
                            {formatCountdown(msLeft)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            до {format(new Date(closesAt), 'dd.MM.yyyy HH:mm')} · {getTimezoneLabel(new Date(closesAt))}
                        </Typography>
                    </>
                )}
            </Box>
        </Box>
    );
};

export default DeadlineBanner;
