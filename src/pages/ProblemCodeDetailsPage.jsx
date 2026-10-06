import React, {useEffect, useState} from 'react';
import {
    Box,
    Grid,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    useTheme,
    useMediaQuery,
    Tabs,
    Tab, Checkbox, Card, CardContent, FormControlLabel, Stack, Button
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RuleIcon from '@mui/icons-material/Rule';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import {useNavigate, useParams} from 'react-router-dom';
import {Editor} from '@monaco-editor/react';
import ApiService from '../network/API';
import {difficultyTranslation, getDifficultyColor} from "./ArticlesDetailsPage";
import MarkdownContent from "../components/MarkdownContent";
import SubmissionDetailsDialog from "../components/SubmissionDetailsDialog";
import ProblemTabs from "../components/ProblemTabs";
import ProblemLimitsCard from "../components/ProblemLimitsCard";
import LabLimitsCard from "../components/LabLimitsCard";
import {SubmitSection} from "../components/SubmitSection";
import LabPanel from "../components/LabPanel";
import GitTaskPanel from "../components/GitTaskPanel";
import MysqlTaskPanel from "../components/MysqlTaskPanel";
import SubmitStatusChip from "../components/SubmitStatusChip";
import DeadlineBanner, {useDeadline} from "../components/DeadlineBanner";
import ProblemRulesDialog from "../components/ProblemRulesDialog";
import {showFullscreenAd} from "../components/ads/showFullscreenAd";

const NO_SUBMIT_TYPES = ['SSH_LAB', 'GIT_REPO', 'MYSQL_DB'];
const CRITERIA_TYPES = ['MYSQL_DB', 'GIT_REPO'];
const PENDING_STATUSES = ['PENDING', 'RUNNING'];

export const ProblemCodeDetailsPage = ({mode}) => {
    const {problemId} = useParams();
    const [problem, setProblem] = useState(null);
    const deadline = useDeadline(problem?.articleId);
    const [rulesOpen, setRulesOpen] = useState(false);
    const [pairInfo, setPairInfo] = useState(null);
    const [hasCriteria, setHasCriteria] = useState(false);
    const navigate = useNavigate();

    const rulesSeenKey = `rulesSeen:${localStorage.getItem('userId')}:${problemId}`;

    const loadPairInfo = () => ApiService.getPair(problemId).then(setPairInfo).catch(() => {});

    // Информационный диалог показываем один раз на задачу и аккаунт; дальше он доступен
    // по кнопке «Правила и оценка».
    useEffect(() => {
        if (!problem || !localStorage.getItem('accessToken') || ApiService.isAdmin()) return;
        loadPairInfo();
        try {
            if (!localStorage.getItem(rulesSeenKey)) setRulesOpen(true);
        } catch (e) {
            // localStorage недоступен — просто не показываем автоматически
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [problem, problemId]);

    // Критерии оценки пока включены для MySQL- и git-задач; студенту кнопка нужна, только если они заведены.
    useEffect(() => {
        if (!problem || !CRITERIA_TYPES.includes(problem.type) || !localStorage.getItem('accessToken') || ApiService.isAdmin()) return;
        ApiService.getMyCriteria(problemId)
            .then((view) => setHasCriteria(view.criteria.length > 0 || view.hiddenCount > 0))
            .catch(() => setHasCriteria(false));
    }, [problem, problemId]);

    const closeRules = () => {
        setRulesOpen(false);
        try {
            localStorage.setItem(rulesSeenKey, '1');
        } catch (e) {
            // не критично
        }
    };

    const isAdminUser = ApiService.isAdmin();
    const showCriteriaButton = CRITERIA_TYPES.includes(problem?.type) && (isAdminUser || hasCriteria);
    const rulesBar = (!isAdminUser || showCriteriaButton) && (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{mb: 1}}>
            {!isAdminUser && (
                <Button size="small" variant="outlined" startIcon={<InfoOutlinedIcon/>} onClick={() => setRulesOpen(true)}>
                    Правила и оценка
                </Button>
            )}
            {showCriteriaButton && (
                <Button size="small" variant="outlined" startIcon={<RuleIcon/>} onClick={() => navigate(`/problems/${problemId}/criteria`)}>
                    Критерии оценки
                </Button>
            )}
            {isAdminUser && showCriteriaButton && (
                <Button size="small" variant="contained" startIcon={<FactCheckIcon/>} onClick={() => navigate(`/admin/problems/${problemId}/grading`)}>
                    Проверка работ
                </Button>
            )}
            {!isAdminUser && pairInfo?.allowed && !pairInfo.partner && !pairInfo.partnerOf && !pairInfo.locked && !pairInfo.closed && (
                <Chip color="success" onClick={() => setRulesOpen(true)}
                      sx={{fontWeight: 700}}
                      label="👥 Работа в паре разрешена — укажите напарника"/>
            )}
            {!isAdminUser && pairInfo?.partner && (
                <Chip size="small" color="primary" onClick={() => setRulesOpen(true)}
                      label={`Пара: ${pairInfo.partner.fullName || pairInfo.partner.username}`}/>
            )}
            {!isAdminUser && pairInfo?.partnerOf && (
                <Chip size="small" color="primary" onClick={() => setRulesOpen(true)}
                      label={`Вы напарник: ${pairInfo.partnerOf.fullName || pairInfo.partnerOf.username}`}/>
            )}
        </Stack>
    );
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

            // Если последняя отправка ещё не завершена (например, страницу
            // обновили, пока шла проверка) — открываем модалку заново, не даём
            // студенту потерять из виду попытку, которая уже отправлена.
            const lastSubmission = subs[0];
            if (lastSubmission && PENDING_STATUSES.includes(lastSubmission.status)) {
                handleSubmissionClick(lastSubmission.id);
            }
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
        showFullscreenAd();

        let submissionId;
        try {
            submissionId = await ApiService.submitSolution(problemId, {
                code: problem.type === 'ANSWERS' ? selectedAnswers.join(",") : code,
                languageId: selectedLanguage,
            });
        } catch (err) {
            // Срок сдачи лекции для группы студента прошёл (сервер отвечает 403 с этим reason).
            if (err?.reason === 'Приём решений закрыт') {
                alert('Приём решений закрыт — срок сдачи этой лекции для вашей группы истёк.');
                return;
            }
            throw err;
        }

        const updatedSubs = await ApiService.getSubmissions(problemId);
        setSubmissions(updatedSubs);

        if (submissionId) {
            handleSubmissionClick(submissionId);
        }
    };

    const PENDING_STATUSES = ['PENDING', 'RUNNING'];

    useEffect(() => {
        if (!openModal || !submissionDetail || !PENDING_STATUSES.includes(submissionDetail.status)) {
            return;
        }

        const timer = setTimeout(async () => {
            const detail = await ApiService.getSubmissionDetails(submissionDetail.id);
            setSubmissionDetail(detail);
            if (!PENDING_STATUSES.includes(detail.status)) {
                const updatedSubs = await ApiService.getSubmissions(problemId);
                setSubmissions(updatedSubs);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [openModal, submissionDetail, problemId]);

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
                            position: 'sticky',
                            top: 0,
                            zIndex: 10,
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
                            <DeadlineBanner deadline={deadline} compact/>
                            {rulesBar}
                            <Typography variant="h5" gutterBottom>
                                {problem.title}
                            </Typography>

                            <Stack direction="row" spacing={1}>
                                <Chip
                                    label={difficultyTranslation[problem.difficulty]}
                                    color={getDifficultyColor(problem.difficulty)}
                                    size="small"
                                    sx={{mb: 2}}
                                />

                                <SubmitStatusChip submitSuccess={problem.submitSuccess}/>
                            </Stack>

                            <MarkdownContent content={problem.description} mode={mode} showToc={false}/>

                            {problem.type === 'CODE' &&
                                <>
                                    <ProblemLimitsCard problem={problem}/>
                                    <div style={{height: "10px"}}/>
                                </>
                            }
                            {problem.type === 'SSH_LAB' &&
                                <>
                                    <LabLimitsCard/>
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
                            <DeadlineBanner deadline={deadline} compact/>
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

                            {!NO_SUBMIT_TYPES.includes(problem.type) &&
                                <SubmitSection problem={problem} handleSubmit={handleSubmit} closed={deadline.closed} />
                            }

                            <Box
                                sx={{
                                    height: '60vh',
                                    border: (problem.type === 'ANSWERS' || NO_SUBMIT_TYPES.includes(problem.type)) ? '0px solid #ccc' : '1px solid #ccc',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                }}
                            >
                                {problem.type === 'SSH_LAB' ?
                                    <LabPanel problem={problem} />
                                : problem.type === 'GIT_REPO' ?
                                    <GitTaskPanel problem={problem} />
                                : problem.type === 'MYSQL_DB' ?
                                    <MysqlTaskPanel problem={problem} />
                                : problem.type === 'ANSWERS' ?
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
                <Grid container height="calc(100vh - 64px)">
                    {/* Левая часть: условия задачи */}
                    <Grid item xs={5} sx={{overflowY: 'auto', borderRight: '1px solid #eee', p: 3, width: '40%'}}>
                      <Box sx={{maxWidth: 720, mx: 'auto'}}>
                        <DeadlineBanner deadline={deadline} compact/>
                        {rulesBar}
                        <Typography variant="h4" gutterBottom>
                            {problem.title}
                        </Typography>

                        <Stack direction="row" spacing={1}>
                            <Chip
                                label={difficultyTranslation[problem.difficulty]}
                                color={getDifficultyColor(problem.difficulty)}
                                size="small"
                            />
                            <SubmitStatusChip submitSuccess={problem.submitSuccess}/>
                        </Stack>

                        <MarkdownContent content={problem.description} mode={mode} showToc={false}/>

                        {problem.type === 'CODE' &&
                            <>
                                <ProblemLimitsCard problem={problem}/>
                                <div style={{height: "10px"}}/>
                            </>
                        }
                        {problem.type === 'SSH_LAB' &&
                            <>
                                <LabLimitsCard/>
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
                    </Grid>

                    {/* Правая часть: редактор */}
                    <Grid
                        item
                        xs={7}
                        sx={{
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            height: 'calc(100vh - 64px)',
                            boxSizing: 'border-box',
                            width: '60%',
                        }}
                    >
                        {!NO_SUBMIT_TYPES.includes(problem.type) &&
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

                                <SubmitSection problem={problem} handleSubmit={handleSubmit} closed={deadline.closed} />

                                {problem.type === 'INPUT' &&
                                    <>
                                        <div style={{width: '10px'}}/>
                                        Напишите ответ
                                    </>
                                }
                            </Box>
                        }

                        <Box
                            sx={{
                                height: NO_SUBMIT_TYPES.includes(problem.type) ? '100%' : '85%',
                                border: (problem.type === 'ANSWERS' || NO_SUBMIT_TYPES.includes(problem.type)) ? '0px solid #ccc' : '1px solid #ccc',
                                borderRadius: 2,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {problem.type === 'SSH_LAB' ?
                                <LabPanel problem={problem} />
                            : problem.type === 'GIT_REPO' ?
                                <GitTaskPanel problem={problem} />
                            : problem.type === 'MYSQL_DB' ?
                                <MysqlTaskPanel problem={problem} />
                            : problem.type === 'ANSWERS' ?
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

            <ProblemRulesDialog
                hasCriteria={hasCriteria}
                criteriaUrl={`/problems/${problemId}/criteria`}
                open={rulesOpen}
                onClose={closeRules}
                problemId={problemId}
                deadline={deadline}
                onPairChanged={loadPairInfo}
            />

            <SubmissionDetailsDialog
                open={openModal}
                onClose={() => setOpenModal(false)}
                submissionDetail={submissionDetail}
                mode={mode}
            />
        </>
    );
};