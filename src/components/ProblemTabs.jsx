import React, {useState} from 'react';
import {
    Tabs,
    Tab,
    Box,
    Paper,
    Stack,
    Typography,
    Divider,
    Chip, IconButton, CircularProgress,
} from '@mui/material';
import RefreshIcon from "@mui/icons-material/Refresh";
import ApiService from "../network/API";
import YandexBannerAd from "./YandexBannerAd";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function ProblemTabs({problem, submissions, handleSubmissionClick, updateSubmission}) {
    const [tabIndex, setTabIndex] = useState(0);

    const [loading, setLoading] = useState(false);

    // Определяем доступные вкладки
    const availableTabs = [];
    if (problem.testCases.length > 0) availableTabs.push('Примеры');
    if (submissions.length > 0) availableTabs.push('Отправки');

    const handleChange = (event, newIndex) => {
        setTabIndex(newIndex);
    };

    // Получаем текущую активную вкладку по индексу
    const currentTab = availableTabs[tabIndex];

    const onRefreshClick = async (e, id, index) => {
        e.stopPropagation();
        setLoading(true);
        try {
            const update = await ApiService.getSubmissionShort(id)
            updateSubmission(update, index)
            await sleep(4000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{width: '100%'}}>

            <YandexBannerAd/>

            {availableTabs.length > 0 &&
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
                    {availableTabs.map((tab, index) => (
                        <Tab key={index} label={tab}/>
                    ))}
                </Tabs>
            }

            <Box sx={{mt: 2}}>
                {currentTab === 'Примеры' && (
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

                                    <Divider/>

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

                {currentTab === 'Отправки' && (
                    <Box>
                        {submissions.map((s, index) => (
                            <Paper
                                key={s.id}
                                sx={{
                                    p: 1.5,
                                    my: 1,
                                    cursor: "pointer",
                                    "&:hover": {backgroundColor: "#232323"},
                                }}
                                onClick={() => handleSubmissionClick(s.id)}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography>
                                        #{s.id} • {s.language.name}
                                    </Typography>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Chip
                                            label={s.status}
                                            size="small"
                                            color={
                                                s.status === "SUCCESS"
                                                    ? "success"
                                                    : s.status === "FAILED"
                                                        ? "error"
                                                        : "default"
                                            }
                                            variant="outlined"
                                        />
                                        {(s.status === "PENDING" || s.status === "RUNNING") &&
                                            <IconButton
                                                size="small"
                                                onClick={(e) => onRefreshClick(e, s.id, index)}
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <CircularProgress size={20}/>
                                                ) : (
                                                    <RefreshIcon/>
                                                )}
                                            </IconButton>
                                        }
                                    </Box>
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