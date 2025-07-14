import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MemoryIcon from '@mui/icons-material/Memory';

const ProblemLimitsCard = ({ problem }) => {
    const theme = useTheme();

    const timeInSeconds = (problem.timeLimit / 1000).toFixed(2);

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
                <Typography
                    variant="h6"
                    component="div"
                    sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: theme.palette.text.primary
                    }}
                >
                    Ограничения задачи
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <AccessTimeIcon
                        sx={{
                            color: theme.palette.secondary.main,
                            mr: 1.5,
                            fontSize: '1.2rem'
                        }}
                    />
                    <Box>
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                color: theme.palette.text.secondary,
                                lineHeight: 1
                            }}
                        >
                            Ограничение времени
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: 500,
                                color: theme.palette.text.primary
                            }}
                        >
                            {timeInSeconds} с
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MemoryIcon
                        sx={{
                            color: theme.palette.secondary.main,
                            mr: 1.5,
                            fontSize: '1.2rem'
                        }}
                    />
                    <Box>
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                color: theme.palette.text.secondary,
                                lineHeight: 1
                            }}
                        >
                            Ограничение памяти
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: 500,
                                color: theme.palette.text.primary
                            }}
                        >
                            {problem.memoryLimit} МБ
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ProblemLimitsCard;