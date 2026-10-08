import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Avatar,
    Stack,
    Chip,
    Divider,
    Breadcrumbs,
    ToggleButtonGroup,
    ToggleButton,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Paper,
    Tooltip,
    Menu,
    MenuItem,
    Divider as MenuDivider,
    Snackbar,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ViewListIcon from '@mui/icons-material/ViewList';
import TableChartIcon from '@mui/icons-material/TableChart';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import KeyIcon from '@mui/icons-material/Key';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ApiService from '../network/API';
import { copyToClipboard } from '../copyToClipboard';

// Простой CSV (Excel открывает его штатно), без сторонних зависимостей.
// BOM в начале — чтобы Excel корректно определил UTF-8 и не сломал кириллицу.
const downloadCsv = (filename, headers, rows) => {
    const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const lines = [headers, ...rows].map((row) => row.map(escape).join(';'));
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

const GRADE_VALUE = { HAS_2: 2, HAS_3: 3, HAS_4: 4, HAS_5: 5 };
const GRADE_OPTIONS = [5, 4, 3, 2];

// Все три части ФИО необязательны — собираем только то, что есть.
const formatFullName = (person) =>
    [person?.lastName, person?.firstName, person?.patronymic].filter(Boolean).join(' ');

const gradeColor = (grade) => {
    if (grade >= 5) return 'success';
    if (grade >= 4) return 'primary';
    if (grade >= 3) return 'warning';
    return 'error';
};

const GradeChip = ({ evaluation }) => {
    const grade = GRADE_VALUE[evaluation];
    return <Chip label={grade} size="small" color={gradeColor(grade)} sx={{ fontWeight: 700, minWidth: 36 }} />;
};

// Ячейка таблицы: у оценки может не быть записи вовсе ("нет оценки" — студент не пытался решать),
// а не только значения 2-5, поэтому явно показываем прочерк, а не пустую ячейку.
// Кликабельна — преподаватель может поставить/изменить/убрать оценку вручную.
const GradeCell = ({ evaluation, onClick }) => {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'flex',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: 1,
                py: 0.5,
                '&:hover': { backgroundColor: 'action.hover' }
            }}
        >
            {evaluation ? (
                <GradeChip evaluation={evaluation} />
            ) : (
                <Tooltip title="Нет оценки — студент ещё не пытался решить ни одной задачи. Нажмите, чтобы поставить вручную">
                    <Typography variant="body2" color="text.disabled">
                        —
                    </Typography>
                </Tooltip>
            )}
        </Box>
    );
};

export const GroupDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const [articlesByTag, setArticlesByTag] = useState({});
    const [editCell, setEditCell] = useState(null); // { anchorEl, userId, username, articleId, articleTitle }
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [recalculating, setRecalculating] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addUsernamesText, setAddUsernamesText] = useState('');
    const [addResult, setAddResult] = useState(null); // [{userId, username, password}]
    const [addSubmitting, setAddSubmitting] = useState(false);

    const [resetDialog, setResetDialog] = useState(null); // {userId, username, password} | null
    const [resetSubmitting, setResetSubmitting] = useState(false);

    const fetchGroup = () => {
        return ApiService.getGroupById(id)
            .then(setGroup)
            .catch((err) => setError(err.message || 'Не удалось загрузить группу'));
    };

    useEffect(() => {
        fetchGroup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const openGradeMenu = (event, { userId, username, articleId, articleTitle }) => {
        setEditCell({ anchorEl: event.currentTarget, userId, username, articleId, articleTitle });
    };

    const closeGradeMenu = () => setEditCell(null);

    const handleSetGrade = async (grade) => {
        if (!editCell) return;
        setSaving(true);
        try {
            await ApiService.setEvaluation(editCell.userId, editCell.articleId, grade);
            await fetchGroup();
        } catch (err) {
            setActionError(err.message || 'Не удалось сохранить оценку');
        } finally {
            setSaving(false);
            closeGradeMenu();
        }
    };

    const handleClearGrade = async () => {
        if (!editCell) return;
        setSaving(true);
        try {
            await ApiService.clearEvaluation(editCell.userId, editCell.articleId);
            await fetchGroup();
        } catch (err) {
            setActionError(err.message || 'Не удалось убрать оценку');
        } finally {
            setSaving(false);
            closeGradeMenu();
        }
    };

    const handleRecalculate = async () => {
        setRecalculating(true);
        try {
            await ApiService.calculateGroupGrade(id);
            await fetchGroup();
            setSuccessMessage('Оценки пересчитаны');
        } catch (err) {
            setActionError(err.message || 'Не удалось пересчитать оценки');
        } finally {
            setRecalculating(false);
        }
    };

    const openAddDialog = () => {
        setAddUsernamesText('');
        setAddResult(null);
        setAddDialogOpen(true);
    };

    const closeAddDialog = () => {
        setAddDialogOpen(false);
        setAddResult(null);
        // Если студенты были созданы — подтягиваем актуальный ростер.
        if (addResult) fetchGroup();
    };

    const handleCreateStudents = async () => {
        // Формат строки: логин;Фамилия;Имя;Отчество — только логин обязателен.
        const entries = addUsernamesText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const [username, lastName, firstName, patronymic] = line.split(';').map((p) => p?.trim() || '');
                return { username, lastName, firstName, patronymic };
            });

        if (entries.length === 0) return;

        setAddSubmitting(true);
        try {
            const created = await ApiService.createStudents(id, entries);
            setAddResult(created);
        } catch (err) {
            // Часть студентов могла успеть создаться до ошибки (например, дубликат логина
            // в середине списка) — покажем то, что реально получилось, а не молчим об этом.
            if (err.partialResults?.length) {
                setAddResult(err.partialResults);
            }
            setActionError(err.message || 'Не удалось создать студентов');
        } finally {
            setAddSubmitting(false);
        }
    };

    const handleResetPassword = async (userId, username) => {
        setResetSubmitting(true);
        try {
            const result = await ApiService.resetPassword(userId);
            setResetDialog(result);
            await fetchGroup();
        } catch (err) {
            setActionError(err.message || 'Не удалось сбросить пароль');
        } finally {
            setResetSubmitting(false);
        }
    };

    const handleExportCredentials = () => {
        if (!group) return;
        const withPasswords = group.students.filter((s) => s.password);
        if (withPasswords.length === 0) {
            setActionError('Ни у одного студента нет сохранённого пароля для экспорта (пароли видны только для аккаунтов, созданных через «Добавить студентов» или после сброса пароля)');
            return;
        }
        downloadCsv(
            `${group.name}_логины.csv`,
            ['Фамилия', 'Имя', 'Отчество', 'Логин', 'Пароль'],
            withPasswords.map((s) => [
                s.user.lastName || '',
                s.user.firstName || '',
                s.user.patronymic || '',
                s.user.username,
                s.password
            ])
        );
    };

    const handleCopy = (text) => {
        copyToClipboard(text);
        setSuccessMessage('Скопировано');
    };

    // Предметы группы — объединяем по всем студентам, т.к. у студента без единой
    // оценки предмет вообще не попадёт в его список (нет строки в user_evaluations).
    const subjectsById = useMemo(() => {
        if (!group) return {};
        const map = {};
        for (const student of group.students) {
            for (const subject of student.subjects) {
                map[subject.tag.id] = { id: subject.tag.id, name: subject.tag.name, exam: subject.exam };
            }
        }
        return map;
    }, [group]);

    useEffect(() => {
        if (viewMode !== 'table' || !group) return;

        Object.keys(subjectsById).forEach((tagId) => {
            if (articlesByTag[tagId]) return;
            ApiService.getAllArticles([tagId], [], 0, 100)
                .then((articles) => {
                    // Лекции слева направо в порядке появления (с сервера приходят от новых к старым).
                    const ordered = [...articles].sort((a, b) => a.id - b.id);
                    setArticlesByTag((prev) => ({ ...prev, [tagId]: ordered }));
                })
                .catch(() => {
                    setArticlesByTag((prev) => ({ ...prev, [tagId]: [] }));
                });
        });
    }, [viewMode, group, subjectsById, articlesByTag]);

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography color="error">{error}</Typography>
            </Container>
        );
    }

    if (!group) {
        return (
            <Box display="flex" justifyContent="center" py={10}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link to="/groups" style={{ color: 'inherit', textDecoration: 'none' }}>Группы</Link>
                <Typography color="text.primary">{group.name}</Typography>
            </Breadcrumbs>

            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                <Typography variant="h5" fontWeight={700}>
                    {group.name}
                </Typography>

                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    size="small"
                    onChange={(e, value) => value && setViewMode(value)}
                >
                    <ToggleButton value="cards">
                        <ViewListIcon fontSize="small" sx={{ mr: 1 }} /> Карточки
                    </ToggleButton>
                    <ToggleButton value="table">
                        <TableChartIcon fontSize="small" sx={{ mr: 1 }} /> Таблица
                    </ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={recalculating ? <CircularProgress size={16} /> : <RefreshIcon />}
                    onClick={handleRecalculate}
                    disabled={recalculating}
                >
                    Пересчитать оценки
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={openAddDialog}
                >
                    Добавить студентов
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportCredentials}
                >
                    Экспорт логинов (CSV)
                </Button>
            </Stack>

            {group.students.length === 0 ? (
                <Typography color="text.secondary">В этой группе пока нет студентов.</Typography>
            ) : viewMode === 'cards' ? (
                group.students.map(({ user, subjects, password }) => {
                    const allGrades = subjects.flatMap((s) => s.evaluations.map((e) => GRADE_VALUE[e.evaluation]));
                    const overallAverage = allGrades.length
                        ? (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(1)
                        : null;

                    return (
                        <Accordion key={user.id} sx={{ mb: 1.5, borderRadius: 2, '&:before': { display: 'none' } }} variant="outlined">
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', pr: 2 }}>
                                    <Avatar
                                        src={user.avatarFileName ? ApiService.getFileUrl(user.avatarFileName) : undefined}
                                        sx={{ width: 36, height: 36 }}
                                        onClick={(e) => { e.stopPropagation(); navigate(`/users/${user.id}`); }}
                                    >
                                        {!user.avatarFileName && user.username[0].toUpperCase()}
                                    </Avatar>
                                    <Box sx={{ flexGrow: 1 }}>
                                        {formatFullName(user) && (
                                            <Typography variant="body2">{formatFullName(user)}</Typography>
                                        )}
                                        <Typography variant={formatFullName(user) ? 'caption' : 'body1'} color={formatFullName(user) ? 'text.secondary' : 'text.primary'}>
                                            {user.username}
                                        </Typography>
                                    </Box>
                                    {overallAverage ? (
                                        <Chip label={`ср. балл: ${overallAverage}`} size="small" variant="outlined" />
                                    ) : (
                                        <Chip label="нет оценок" size="small" variant="outlined" color="default" />
                                    )}
                                </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box
                                    sx={{
                                        mb: 2,
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: 'action.hover',
                                        display: 'flex',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: 2
                                    }}
                                >
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Логин</Typography>
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <Typography variant="body2" fontFamily="monospace">{user.username}</Typography>
                                            <IconButton size="small" onClick={() => handleCopy(user.username)}>
                                                <ContentCopyIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Stack>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Пароль</Typography>
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            {password ? (
                                                <>
                                                    <Typography variant="body2" fontFamily="monospace">{password}</Typography>
                                                    <IconButton size="small" onClick={() => handleCopy(password)}>
                                                        <ContentCopyIcon sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </>
                                            ) : (
                                                <Typography variant="body2" color="text.disabled">
                                                    неизвестен (аккаунт создан вне платформы)
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Box>
                                    <Button
                                        size="small"
                                        startIcon={<KeyIcon />}
                                        disabled={resetSubmitting}
                                        onClick={() => handleResetPassword(user.id, user.username)}
                                        sx={{ ml: 'auto' }}
                                    >
                                        Сбросить пароль
                                    </Button>
                                </Box>

                                {subjects.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                        Нет предметов, назначенных группе, либо оценок по ним пока нет.
                                    </Typography>
                                ) : (
                                    subjects.map((subject) => (
                                        <Box key={subject.tag.id} sx={{ mb: 2 }}>
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                                <Typography variant="subtitle2" fontWeight={700}>
                                                    {subject.tag.name}
                                                </Typography>
                                                {subject.exam && <Chip label="Экзамен" size="small" color="primary" variant="outlined" />}
                                                {subject.averageGrade != null && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        — средний: {subject.averageGrade.toFixed(1)}
                                                    </Typography>
                                                )}
                                            </Stack>
                                            {subject.evaluations.length === 0 && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Оценок пока нет. Поставить оценку можно в режиме «Таблица».
                                                </Typography>
                                            )}
                                            <Stack spacing={0.5}>
                                                {subject.evaluations.map((e) => (
                                                    <Stack key={e.article.id} direction="row" alignItems="center" spacing={1.5}>
                                                        <GradeChip evaluation={e.evaluation} />
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                            onClick={() => navigate(`/articles/${e.article.id}`)}
                                                        >
                                                            {e.article.title}
                                                        </Typography>
                                                    </Stack>
                                                ))}
                                            </Stack>
                                            <Divider sx={{ mt: 2 }} />
                                        </Box>
                                    ))
                                )}
                            </AccordionDetails>
                        </Accordion>
                    );
                })
            ) : (
                Object.values(subjectsById).length === 0 ? (
                    <Typography color="text.secondary">Нет предметов, назначенных этой группе.</Typography>
                ) : (
                    Object.values(subjectsById).map((subject) => {
                        const articles = articlesByTag[subject.id];

                        return (
                            <Box key={subject.id} sx={{ mb: 4 }}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        {subject.name}
                                    </Typography>
                                    {subject.exam && <Chip label="Экзамен" size="small" color="primary" variant="outlined" />}
                                </Stack>

                                {!articles ? (
                                    <Box display="flex" justifyContent="center" py={4}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : articles.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                        В этом предмете пока нет лекций.
                                    </Typography>
                                ) : (
                                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                                                        Студент
                                                    </TableCell>
                                                    {articles.map((article) => (
                                                        <TableCell
                                                            key={article.id}
                                                            align="center"
                                                            sx={{ fontWeight: 700, cursor: 'pointer', minWidth: 140 }}
                                                            onClick={() => navigate(`/articles/${article.id}`)}
                                                        >
                                                            {article.title}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell align="center" sx={{ fontWeight: 700, minWidth: 100 }}>
                                                        Средний балл
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {group.students.map(({ user, subjects }) => {
                                                    const studentSubject = subjects.find((s) => s.tag.id === subject.id);
                                                    const evaluationByArticleId = {};
                                                    (studentSubject?.evaluations || []).forEach((e) => {
                                                        evaluationByArticleId[e.article.id] = e.evaluation;
                                                    });

                                                    return (
                                                        <TableRow key={user.id} hover>
                                                            <TableCell
                                                                sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', cursor: 'pointer' }}
                                                                onClick={() => navigate(`/users/${user.id}`)}
                                                            >
                                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                                    <Avatar
                                                                        src={user.avatarFileName ? ApiService.getFileUrl(user.avatarFileName) : undefined}
                                                                        sx={{ width: 24, height: 24, fontSize: '0.7rem' }}
                                                                    >
                                                                        {!user.avatarFileName && user.username[0].toUpperCase()}
                                                                    </Avatar>
                                                                    <Typography variant="body2">
                                                                        {formatFullName(user) || user.username}
                                                                    </Typography>
                                                                </Stack>
                                                            </TableCell>
                                                            {articles.map((article) => (
                                                                <TableCell key={article.id} align="center">
                                                                    <GradeCell
                                                                        evaluation={evaluationByArticleId[article.id]}
                                                                        onClick={(e) => openGradeMenu(e, {
                                                                            userId: user.id,
                                                                            username: user.username,
                                                                            articleId: article.id,
                                                                            articleTitle: article.title
                                                                        })}
                                                                    />
                                                                </TableCell>
                                                            ))}
                                                            <TableCell align="center">
                                                                {studentSubject?.averageGrade != null ? (
                                                                    <Typography variant="body2" fontWeight={700}>
                                                                        {studentSubject.averageGrade.toFixed(1)}
                                                                    </Typography>
                                                                ) : (
                                                                    <Typography variant="body2" color="text.disabled">—</Typography>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Box>
                        );
                    })
                )
            )}

            <Menu
                anchorEl={editCell?.anchorEl}
                open={Boolean(editCell)}
                onClose={closeGradeMenu}
            >
                <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, display: 'block' }}>
                    {editCell?.username} — {editCell?.articleTitle}
                </Typography>
                <MenuDivider />
                {GRADE_OPTIONS.map((grade) => (
                    <MenuItem key={grade} disabled={saving} onClick={() => handleSetGrade(grade)}>
                        <Chip label={grade} size="small" color={gradeColor(grade)} sx={{ fontWeight: 700, mr: 1.5, minWidth: 32 }} />
                        Поставить {grade}
                    </MenuItem>
                ))}
                <MenuDivider />
                <MenuItem disabled={saving} onClick={handleClearGrade}>
                    Убрать оценку
                </MenuItem>
            </Menu>

            {/* Добавление студентов */}
            <Dialog open={addDialogOpen} onClose={closeAddDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Добавить студентов в {group.name}</DialogTitle>
                <DialogContent>
                    {!addResult ? (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                По одной записи в строке, формат: <code>логин;Фамилия;Имя;Отчество</code>.
                                Обязателен только логин — остальное можно не указывать. Пароли сгенерируются
                                автоматически и будут показаны один раз сразу после создания (их также можно
                                посмотреть позже в карточке студента или экспортировать в CSV).
                            </Typography>
                            <TextField
                                autoFocus
                                multiline
                                minRows={5}
                                fullWidth
                                placeholder={'ivanov_i;Иванов;Иван;Иванович\npetrova_a;Петрова;Анна\nsidorov_p'}
                                value={addUsernamesText}
                                onChange={(e) => setAddUsernamesText(e.target.value)}
                            />
                        </>
                    ) : (
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ФИО</TableCell>
                                        <TableCell>Логин</TableCell>
                                        <TableCell>Пароль</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {addResult.map((s) => (
                                        <TableRow key={s.userId}>
                                            <TableCell>{formatFullName(s) || <Typography variant="body2" color="text.disabled">—</Typography>}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>{s.username}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>{s.password}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    {!addResult ? (
                        <>
                            <Button onClick={closeAddDialog}>Отмена</Button>
                            <Button
                                variant="contained"
                                disabled={addSubmitting || !addUsernamesText.trim()}
                                onClick={handleCreateStudents}
                            >
                                Создать
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                startIcon={<DownloadIcon />}
                                onClick={() => downloadCsv(
                                    `${group.name}_новые_студенты.csv`,
                                    ['Фамилия', 'Имя', 'Отчество', 'Логин', 'Пароль'],
                                    addResult.map((s) => [s.lastName || '', s.firstName || '', s.patronymic || '', s.username, s.password])
                                )}
                            >
                                Скачать CSV
                            </Button>
                            <Button variant="contained" onClick={closeAddDialog}>Готово</Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Результат сброса пароля */}
            <Dialog open={Boolean(resetDialog)} onClose={() => setResetDialog(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Новый пароль</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Старый пароль пользователя <b>{resetDialog?.username}</b> больше не действует. Новый пароль:
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h6" fontFamily="monospace">{resetDialog?.password}</Typography>
                        <IconButton onClick={() => handleCopy(resetDialog?.password)}>
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={() => setResetDialog(null)}>Готово</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={Boolean(actionError)}
                autoHideDuration={4000}
                onClose={() => setActionError(null)}
            >
                <Alert severity="error" onClose={() => setActionError(null)}>
                    {actionError}
                </Alert>
            </Snackbar>

            <Snackbar
                open={Boolean(successMessage)}
                autoHideDuration={2000}
                onClose={() => setSuccessMessage(null)}
            >
                <Alert severity="success" onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default GroupDetailsPage;
