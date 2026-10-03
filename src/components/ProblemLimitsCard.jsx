import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MemoryIcon from '@mui/icons-material/Memory';

const Row = ({ icon, label, value, theme, highlight }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, '&:last-child': { mb: 0 } }}>
        <Box sx={{ color: highlight ? theme.palette.error.main : theme.palette.secondary.main, mr: 1.5, fontSize: '1.2rem', display: 'flex' }}>
            {icon}
        </Box>
        <Box>
            <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, lineHeight: 1 }}>
                {label}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, color: highlight ? theme.palette.error.main : theme.palette.text.primary }}>
                {value}
            </Typography>
        </Box>
    </Box>
);

// Универсальная карточка лимитов/инфо — items: [{icon, label, value, highlight?}].
// Используется и для лимитов CODE-задачи, и для лимитов/живой статистики SSH_LAB.
const ProblemLimitsCard = ({ title = 'Ограничения задачи', items, problem }) => {
    const theme = useTheme();

    const resolvedItems = items ?? (problem ? [
        { icon: <AccessTimeIcon />, label: 'Ограничение времени', value: `${(problem.timeLimit / 1000).toFixed(2)} с` },
        { icon: <MemoryIcon />, label: 'Ограничение памяти', value: `${problem.memoryLimit} МБ` },
    ] : []);

    return (
        <Card
            sx={{
                borderRadius: 2,
                boxShadow: theme.shadows[4],
                minWidth: 220,
                background: theme.palette.background.paper,
            }}
        >
            <CardContent>
                <Typography variant="h6" component="div" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                    {title}
                </Typography>

                {resolvedItems.map((item, i) => (
                    <Row key={i} {...item} theme={theme} />
                ))}
            </CardContent>
        </Card>
    );
};

export default ProblemLimitsCard;
