import React, { useState } from 'react';
import {
    Tabs,
    Tab,
    Box,
    Paper,
    Stack,
    Typography,
    Divider,
    Chip,
} from '@mui/material';

function ProblemTabs({ problem, submissions, handleSubmissionClick }) {
    const [tabIndex, setTabIndex] = useState(0);

    const handleChange = (event, newIndex) => {
        setTabIndex(newIndex);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Tabs
                value={tabIndex}
                onChange={handleChange}
                aria-label="problem tabs"
                variant="fullWidth"
                textColor="inherit"
                sx={{
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    boxShadow: 1,
                    '& .MuiTabs-indicator': {
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: '#fff',
                    },
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '1rem',
                        color: 'rgba(255,255,255,0.7)',
                        transition: 'color 0.3s ease',
                        '&:hover': {
                            color: '#fff',
                            opacity: 1,
                        },
                        px: 3,
                        py: 1.5,
                        minHeight: 48,
                        borderRadius: 2,
                    },
                    '& .Mui-selected': {
                        color: '#fff',
                        fontWeight: 600,
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                    },
                }}
            >
                <Tab label="Примеры" />
                <Tab label="Отправки" />
            </Tabs>


            <Box sx={{ mt: 2 }}>
                {tabIndex === 0 && (
                    <Box>
                        {problem.testCases.map((testCase, index) => (
                            <Paper
                                key={testCase.id}
                                elevation={3}
                                sx={{
                                    p: 3,
                                    my: 2,
                                    borderRadius: 2,
                                    backgroundColor: (theme) => theme.palette.background.paper,
                                }}
                            >
                                <Stack spacing={2}>
                                    <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                        Пример {index + 1}
                                    </Typography>

                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                                            Ввод:
                                        </Typography>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 1.5,
                                                backgroundColor: 'background.default',
                                                fontFamily: 'monospace',
                                                whiteSpace: 'pre-wrap',
                                                borderRadius: 1,
                                            }}
                                        >
                                            {testCase.input.replace(/\\n/g, '\n')}
                                        </Paper>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                                            Ожидаемый вывод:
                                        </Typography>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 1.5,
                                                backgroundColor: 'background.default',
                                                fontFamily: 'monospace',
                                                whiteSpace: 'pre-wrap',
                                                borderRadius: 1,
                                            }}
                                        >
                                            {testCase.expectedOutput.replace(/\\n/g, '\n')}
                                        </Paper>
                                    </Box>
                                </Stack>
                            </Paper>
                        ))}
                    </Box>
                )}

                {tabIndex === 1 && (
                    <Box>
                        {submissions.map((s) => (
                            <Paper
                                key={s.id}
                                sx={{
                                    p: 1.5,
                                    my: 1,
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: '#232323' },
                                }}
                                onClick={() => handleSubmissionClick(s.id)}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography>
                                        #{s.id} • {s.language.name}
                                    </Typography>
                                    <Chip
                                        label={s.status}
                                        size="small"
                                        color={
                                            s.status === 'SUCCESS' ? 'success' :
                                                s.status === 'FAILED' ? 'error' :
                                                    'default'
                                        }
                                        variant="outlined"
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(s.createdAt).toLocaleString()}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default ProblemTabs;
