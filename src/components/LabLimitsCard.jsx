import React, { useEffect, useState } from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MemoryIcon from '@mui/icons-material/Memory';
import SpeedIcon from '@mui/icons-material/Speed';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import StorageIcon from '@mui/icons-material/Storage';
import ApiService from '../network/API';
import ProblemLimitsCard from './ProblemLimitsCard';

// Статичные лимиты лабораторного окружения (до запуска) — та же карточка,
// что и "Ограничения задачи" у CODE-задач, просто с другим набором пунктов.
const LabLimitsCard = () => {
    const [config, setConfig] = useState(null);

    useEffect(() => {
        ApiService.getLabConfig().then(setConfig).catch(() => {});
    }, []);

    if (!config) return null;

    return (
        <ProblemLimitsCard
            title="Ограничения окружения"
            items={[
                { icon: <SpeedIcon />, label: 'CPU', value: `${config.cpuLimit} ядро` },
                { icon: <MemoryIcon />, label: 'RAM', value: `${config.memoryLimitMb} МБ` },
                { icon: <StorageIcon />, label: 'Диск (мягкий лимит)', value: `${config.diskLimitMb} МБ` },
                { icon: <AccessTimeIcon />, label: 'Автопауза при простое', value: `${config.idleTimeoutMinutes} мин` },
                { icon: <HourglassBottomIcon />, label: 'Максимум за один раз', value: `${config.maxSessionHours} ч` },
                { icon: <DeleteSweepIcon />, label: 'Удаление после паузы', value: `${config.pausedRetentionDays} дней` },
            ]}
        />
    );
};

export default LabLimitsCard;
