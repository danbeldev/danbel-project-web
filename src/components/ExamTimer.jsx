import {useEffect, useMemo, useState} from 'react';

// Сколько миллисекунд осталось до endsAt. serverNow — время сервера в момент ответа: так таймер не зависит от часов клиента.
export const useCountdown = (endsAt, serverNow) => {
    const offset = useMemo(() => (serverNow ? new Date(serverNow).getTime() - Date.now() : 0), [serverNow]);
    const calc = () => (endsAt ? Math.max(0, new Date(endsAt).getTime() - (Date.now() + offset)) : 0);
    const [left, setLeft] = useState(calc);

    useEffect(() => {
        setLeft(calc());
        const timer = setInterval(() => setLeft(calc()), 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endsAt, offset]);

    return left;
};

const pad = (n) => String(n).padStart(2, '0');

export const formatLeft = (ms) => {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};
