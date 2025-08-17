import React, {useEffect, useState} from 'react';
import {
    Box,
    Grid,
    Typography,
    Select,
    MenuItem,
    Button,
    FormControl,
    InputLabel,
    Chip,
    useTheme,
    useMediaQuery,
    Tabs,
    Tab, Checkbox, Card, CardContent, FormControlLabel
} from '@mui/material';
import {useParams} from 'react-router-dom';
import {Editor} from '@monaco-editor/react';
import ApiService from '../network/API';
import {difficultyTranslation, getDifficultyColor} from "./ArticlesDetailsPage";
import MarkdownContent from "../components/MarkdownContent";
import SubmissionDetailsDialog from "../components/SubmissionDetailsDialog";
import ProblemTabs from "../components/ProblemTabs";
import ProblemLimitsCard from "../components/ProblemLimitsCard";
import YandexBannerAd from "../components/YandexBannerAd";

export const ProblemCodeDetailsPage = ({mode}) => {
    const {problemId} = useParams();
    const [problem, setProblem] = useState(null);
    const [languages, setLanguages] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState(2);
    const [code, setCode] = useState('');

    const [submissions, setSubmissions] = useState([]);
    const [submissionDetail, setSubmissionDetail] = useState(null);
    const [openModal, setOpenModal] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileTab, setMobileTab] = useState(0);

    const [selectedAnswers, setSelectedAnswers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const problemData = await ApiService.getProblem(problemId);
            const langs = await ApiService.getLanguages();
            const subs = await ApiService.getSubmissions(problemId);

            setProblem(problemData);
            setLanguages(langs);
            setSelectedLanguage(langs[0]?.id || 1);
            setSubmissions(subs);
        };

        fetchData();
    }, [problemId]);

    useEffect(() => {
        const fetchTemplate = async () => {
            const template = await ApiService.getCodeTemplate(problemId, selectedLanguage);
            setCode(template);
        };

        if (selectedLanguage) {
            fetchTemplate();
        }
    }, [problemId, selectedLanguage]);

    const handleSubmit = async () => {
        await ApiService.submitSolution(problemId, {
            code: problem.type === 'ANSWERS' ? selectedAnswers.join(",") : code,
            languageId: selectedLanguage,
        });
        alert('Отправлено!');
        const updatedSubs = await ApiService.getSubmissions(problemId);
        setSubmissions(updatedSubs);
    };

    const handleSubmissionClick = async (submissionId) => {
        const detail = await ApiService.getSubmissionDetails(submissionId);
        setSubmissionDetail(detail);
        setOpenModal(true);
    };

    const handleAnswerSelect = (answerId) => {
        setSelectedAnswers(prev => {
            if (prev.includes(answerId)) {
                return prev.filter(id => id !== answerId);
            } else {
                return [...prev, answerId];
            }
        });
    };

    const updateSubmission = (update, index) => {
        setSubmissions(prev => {
            const copy = [...prev];
            copy[index] = update
            return copy;
        });
    };

    if (!problem) return <Typography>Загрузка...</Typography>;

    return (
        <>
            {isMobile ? (
                <Box>
                    <Tabs
                        value={mobileTab}
                        onChange={(e, newVal) => setMobileTab(newVal)}
                        centered
                        variant="fullWidth"
                        textColor="inherit"
                        sx={{
                            borderRadius: 2,
                            margin: '5px 15px',
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
                        <Tab label="Задача"/>
                        <Tab label="Код"/>
                    </Tabs>

                    {mobileTab === 0 && (
                        <Box p={2}>
                            <Typography variant="h5" gutterBottom>
                                {problem.title}
                            </Typography>
                            <Chip
                                label={difficultyTranslation[problem.difficulty]}
                                color={getDifficultyColor(problem.difficulty)}
                                size="small"
                                sx={{mb: 2}}
                            />
                            <MarkdownContent content={problem.description} mode={mode} showToc={false}/>

                            {problem.type === 'CODE' &&
                                <>
                                    <ProblemLimitsCard problem={problem}/>
                                    <div style={{height: "10px"}}/>
                                </>
                            }

                            <ProblemTabs
                                problem={problem}
                                submissions={submissions}
                                handleSubmissionClick={handleSubmissionClick}
                                updateSubmission={updateSubmission}
                            />
                        </Box>
                    )}

                    {mobileTab === 1 && (
                        <Box p={2}>
                            {problem.type === 'INPUT' &&
                                <>
                                    <div style={{width: '10px'}}/>
                                    Напишите ответ
                                </>
                            }
                            {problem.type === 'CODE' &&
                                <FormControl fullWidth sx={{mb: 2}}>
                                    <InputLabel id="language-select-label">Язык</InputLabel>
                                    <Select
                                        labelId="language-select-label"
                                        value={selectedLanguage}
                                        label="Язык"
                                        onChange={(e) => setSelectedLanguage(e.target.value)}
                                    >
                                        {languages.map((lang) => (
                                            <MenuItem key={lang.id} value={lang.id}>
                                                {lang.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            }
                            <Button
                                variant="contained"
                                fullWidth
                                color="primary"
                                onClick={handleSubmit}
                                sx={{mb: 2}}
                            >
                                Отправить
                            </Button>

                            <Box
                                sx={{
                                    height: '60vh',
                                    border: problem.type === 'ANSWERS' ? '0px solid #ccc' : '1px solid #ccc',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                }}
                            >
                                {problem.type === 'ANSWERS' ?
                                    <Box sx={{width: "100%", maxWidth: 600, mx: "auto", my: 2}}>
                                        <Typography variant="h6" gutterBottom>
                                            Выберите правильные ответы:
                                        </Typography>
                                        <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                            {problem.answers.map((answer) => (
                                                <Card
                                                    key={answer.id}
                                                    variant="outlined"
                                                    sx={{
                                                        borderColor: selectedAnswers.includes(answer.id) ? "primary.main" : "divider",
                                                        bgcolor: selectedAnswers.includes(answer.id) ? "action.selected" : "background.paper",
                                                        transition: "all 0.2s",
                                                        "&:hover": {
                                                            borderColor: "primary.main",
                                                            bgcolor: "action.hover",
                                                        },
                                                    }}
                                                >
                                                    <CardContent sx={{py: 1, px: 2, "&:last-child": {pb: 1}}}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={selectedAnswers.includes(answer.id)}
                                                                    onChange={() => handleAnswerSelect(answer.id)}
                                                                    color="primary"
                                                                />
                                                            }
                                                            label={
                                                                <Typography variant="body1" color="text.primary">
                                                                    #{answer.id} - {answer.value}
                                                                </Typography>
                                                            }
                                                            sx={{width: "100%", m: 0}}
                                                        />
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Box>
                                    </Box>
                                    :
                                    <Editor
                                        language={languages.find((l) => l.id === selectedLanguage)?.name || 'java'}
                                        value={code}
                                        onChange={(value) => setCode(value || '')}
                                        options={{
                                            minimap: {enabled: false},
                                            fontSize: 14,
                                        }}
                                        height="100%"
                                        width="100%"
                                        theme={mode === 'dark' ? "vs-dark" : "vs"}
                                    />
                                }
                            </Box>
                        </Box>
                    )}
                </Box>
            ) : (
                <Grid container height="100vh">
                    {/* Левая часть: условия задачи */}
                    <Grid item xs={5} sx={{overflowY: 'auto', borderRight: '1px solid #eee', p: 3, width: '40%'}}>
                        <Typography variant="h4" gutterBottom>
                            {problem.title}
                        </Typography>
                        <Chip
                            label={difficultyTranslation[problem.difficulty]}
                            color={getDifficultyColor(problem.difficulty)}
                            size="small"
                        />
                        <MarkdownContent content={problem.description} mode={mode} showToc={false}/>

                        {problem.type === 'CODE' &&
                            <>
                                <ProblemLimitsCard problem={problem}/>
                                <div style={{height: "10px"}}/>
                            </>
                        }

                        <ProblemTabs
                            problem={problem}
                            submissions={submissions}
                            handleSubmissionClick={handleSubmissionClick}
                            updateSubmission={updateSubmission}
                        />
                    </Grid>

                    {/* Правая часть: редактор */}
                    <Grid
                        item
                        xs={7}
                        sx={{
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100vh',
                            boxSizing: 'border-box',
                            width: '60%',
                        }}
                    >
                        <Box display="flex" alignItems="center" mb={2}>
                            {problem.type === 'CODE' &&
                                <FormControl sx={{minWidth: 120, mr: 2}}>
                                    <InputLabel id="language-select-label">Язык</InputLabel>
                                    <Select
                                        labelId="language-select-label"
                                        value={selectedLanguage}
                                        label="Язык"
                                        onChange={(e) => setSelectedLanguage(e.target.value)}
                                    >
                                        {languages.map((lang) => (
                                            <MenuItem key={lang.id} value={lang.id}>
                                                {lang.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            }
                            <Button variant="contained" color="primary" onClick={handleSubmit}>
                                Отправить
                            </Button>

                            {problem.type === 'INPUT' &&
                                <>
                                    <div style={{width: '10px'}}/>
                                    Напишите ответ
                                </>
                            }
                        </Box>

                        <Box
                            sx={{
                                height: '85%',
                                border: problem.type === 'ANSWERS' ? '0px solid #ccc' : '1px solid #ccc',
                                borderRadius: 2,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {problem.type === 'ANSWERS' ?
                                <Box sx={{width: "100%", maxWidth: 600, mx: "auto", my: 2}}>
                                    <Typography variant="h6" gutterBottom>
                                        Выберите правильные ответы:
                                    </Typography>
                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        {problem.answers.map((answer) => (
                                            <Card
                                                key={answer.id}
                                                variant="outlined"
                                                sx={{
                                                    borderColor: selectedAnswers.includes(answer.id) ? "primary.main" : "divider",
                                                    bgcolor: selectedAnswers.includes(answer.id) ? "action.selected" : "background.paper",
                                                    transition: "all 0.2s",
                                                    "&:hover": {
                                                        borderColor: "primary.main",
                                                        bgcolor: "action.hover",
                                                    },
                                                }}
                                            >
                                                <CardContent sx={{py: 1, px: 2, "&:last-child": {pb: 1}}}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={selectedAnswers.includes(answer.id)}
                                                                onChange={() => handleAnswerSelect(answer.id)}
                                                                color="primary"
                                                            />
                                                        }
                                                        label={
                                                            <Typography variant="body1" color="text.primary">
                                                                #{answer.id} - {answer.value}
                                                            </Typography>
                                                        }
                                                        sx={{width: "100%", m: 0}}
                                                    />
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                </Box>
                                :
                                <Editor
                                    language={languages.find((l) => l.id === selectedLanguage)?.name || 'java'}
                                    value={code}
                                    onChange={(value) => setCode(value || '')}
                                    options={{
                                        minimap: {enabled: false},
                                        fontSize: 14,
                                    }}
                                    height="100%"
                                    width="100%"
                                    theme={mode === 'dark' ? "vs-dark" : "vs"}
                                />
                            }
                        </Box>
                    </Grid>
                </Grid>
            )}

            <SubmissionDetailsDialog
                open={openModal}
                onClose={() => setOpenModal(false)}
                submissionDetail={submissionDetail}
                mode={mode}
            />
        </>
    );
};