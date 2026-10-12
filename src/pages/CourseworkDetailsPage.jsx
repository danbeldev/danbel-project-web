import React, {useEffect, useState} from 'react';
import {
    Container,
    Typography,
    Box,
    CircularProgress,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Paper,
    TextField,
    IconButton,
    Chip,
    Tooltip,
    Breadcrumbs,
    Link as MuiLink,
    Snackbar,
    Alert,
    ToggleButton,
    ToggleButtonGroup,
    Button,
    FormControlLabel,
    Switch,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import {useParams, Link} from 'react-router-dom';
import ApiService from '../network/API';

const formatFullName = (row) => {
    const parts = [row.lastName, row.firstName, row.patronymic].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : row.username;
};

const formatSaved = (iso) =>
    new Date(iso).toLocaleString('ru-RU', {
        timeZone: 'Europe/Samara',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

export const CourseworkDetailsPage = () => {
    const {id} = useParams();
    const [coursework, setCoursework] = useState(null);
    const [rows, setRows] = useState([]);
    const [savingUserId, setSavingUserId] = useState(null);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [groupFilter, setGroupFilter] = useState('all');
    const [reminding, setReminding] = useState(false);

    const load = () => {
        ApiService.getCourseworkById(id)
            .then((data) => {
                setCoursework(data);
                setRows(data.roster);
            })
            .catch((err) => setError(err.message || 'Не удалось загрузить курсовую'));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const updateRow = (userId, field, value) => {
        setRows((prev) => prev.map((r) => (r.userId === userId ? {...r, [field]: value} : r)));
    };

    const handleSave = async (row) => {
        setSavingUserId(row.userId);
        try {
            await ApiService.updateCourseworkSubmission(id, row.userId, {
                placeOfPractice: row.placeOfPractice,
                topic: row.topic,
                description: row.description,
            });
            load();
            setToast({severity: 'success', message: 'Сохранено'});
        } catch (err) {
            setToast({severity: 'error', message: err.message || 'Не удалось сохранить'});
        } finally {
            setSavingUserId(null);
        }
    };

    const handleApprove = async (row) => {
        setSavingUserId(row.userId);
        try {
            if (row.approved) {
                await ApiService.unapproveCourseworkSubmission(id, row.userId);
            } else {
                await ApiService.approveCourseworkSubmission(id, row.userId);
            }
            load();
        } catch (err) {
            setToast({severity: 'error', message: err.message || 'Не удалось изменить статус'});
        } finally {
            setSavingUserId(null);
        }
    };

    const handleRemind = async () => {
        setReminding(true);
        try {
            const r = await ApiService.remindCourseworkPlace(id);
            const parts = [];
            if (r.sent) parts.push(`отправлено в чаты групп: ${r.sent}`);
            if (r.allFilled) parts.push(`все заполнили: ${r.allFilled}`);
            if (r.noChat) parts.push(`нет чата у групп: ${r.noChat}`);
            setToast({severity: r.sent ? 'success' : 'info', message: parts.join(', ') || 'Нечего отправлять'});
        } catch (err) {
            setToast({severity: 'error', message: err.message || 'Не удалось отправить'});
        } finally {
            setReminding(false);
        }
    };

    const handleToggleDaily = async (enabled) => {
        setCoursework((prev) => ({...prev, dailyReminder: enabled}));
        try {
            await ApiService.setCourseworkDailyReminder(id, enabled);
        } catch (err) {
            setCoursework((prev) => ({...prev, dailyReminder: !enabled}));
            setToast({severity: 'error', message: err.message || 'Не удалось изменить настройку'});
        }
    };

    if (error) {
        return (
            <Container maxWidth="lg" sx={{py: 4}}>
                <Typography color="error">{error}</Typography>
            </Container>
        );
    }

    if (!coursework) {
        return (
            <Box display="flex" justifyContent="center" py={10}>
                <CircularProgress/>
            </Box>
        );
    }

    // Сначала недавно сохранившие; не заполнившие — в конце (по ФИО, как пришло с сервера).
    const visibleRows = (groupFilter === 'all' ? rows : rows.filter((r) => r.groupName === groupFilter))
        .slice()
        .sort((a, b) => {
            if (!a.savedAt && !b.savedAt) return 0;
            if (!a.savedAt) return 1;
            if (!b.savedAt) return -1;
            return new Date(b.savedAt) - new Date(a.savedAt);
        });

    return (
        <Container maxWidth="lg" sx={{py: 4}}>
            <Breadcrumbs sx={{mb: 2}}>
                <MuiLink component={Link} to="/admin/courseworks" underline="hover" color="inherit">
                    Курсовые
                </MuiLink>
                <Typography color="text.primary">{coursework.title}</Typography>
            </Breadcrumbs>

            <Typography variant="h5" fontWeight={700} sx={{mb: 1}}>
                {coursework.title}
            </Typography>
            {coursework.groups.length > 1 ? (
                <Box sx={{mb: 3, overflowX: 'auto'}}>
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        color="primary"
                        value={groupFilter}
                        onChange={(_, v) => v && setGroupFilter(v)}
                    >
                        <ToggleButton value="all">Все ({rows.length})</ToggleButton>
                        {coursework.groups.map((g) => (
                            <ToggleButton key={g.id ?? g.name} value={g.name}>
                                {g.name} ({rows.filter((r) => r.groupName === g.name).length})
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
                    Группы: {coursework.groups.map((g) => g.name).join(', ') || '—'}
                </Typography>
            )}

            <Paper variant="outlined" sx={{p: 2, mb: 3}}>
                <Typography variant="subtitle2" fontWeight={700} sx={{mb: 1}}>
                    Место практики заполнили
                </Typography>
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2}}>
                    {(coursework.progress || []).map((p) => (
                        <Chip
                            key={p.groupId}
                            color={p.filled === p.total ? 'success' : 'warning'}
                            variant="outlined"
                            label={`${p.groupName}: ${p.filled} из ${p.total} (не заполнили ${p.total - p.filled})`}
                        />
                    ))}
                </Box>
                <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2}}>
                    <Button
                        variant="contained"
                        startIcon={<NotificationsActiveIcon/>}
                        onClick={handleRemind}
                        disabled={reminding}
                    >
                        Напомнить в чатах групп
                    </Button>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={coursework.dailyReminder !== false}
                                onChange={(e) => handleToggleDaily(e.target.checked)}
                            />
                        }
                        label="Каждый день в 10:00, пока не заполнят"
                    />
                </Box>
            </Paper>

            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>ФИО</TableCell>
                            <TableCell>Группа</TableCell>
                            <TableCell sx={{minWidth: 200}}>Место практики</TableCell>
                            <TableCell sx={{minWidth: 200}}>Тема</TableCell>
                            <TableCell sx={{minWidth: 220}}>Описание</TableCell>
                            <TableCell sx={{whiteSpace: 'nowrap'}}>Сохранено</TableCell>
                            <TableCell align="center">Статус</TableCell>
                            <TableCell align="center">Действия</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {visibleRows.map((row) => {
                            const busy = savingUserId === row.userId;
                            return (
                                <TableRow key={row.userId} hover>
                                    <TableCell sx={{whiteSpace: 'nowrap'}}>{formatFullName(row)}</TableCell>
                                    <TableCell>{row.groupName}</TableCell>
                                    <TableCell>
                                        <TextField
                                            variant="standard"
                                            fullWidth
                                            value={row.placeOfPractice || ''}
                                            disabled={row.approved || busy}
                                            onChange={(e) => updateRow(row.userId, 'placeOfPractice', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            variant="standard"
                                            fullWidth
                                            value={row.topic || ''}
                                            disabled={row.approved || busy}
                                            onChange={(e) => updateRow(row.userId, 'topic', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            variant="standard"
                                            fullWidth
                                            multiline
                                            maxRows={4}
                                            value={row.description || ''}
                                            disabled={row.approved || busy}
                                            onChange={(e) => updateRow(row.userId, 'description', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                                        {row.savedAt ? formatSaved(row.savedAt) : <Typography variant="body2" color="text.disabled">не заполнено</Typography>}
                                    </TableCell>
                                    <TableCell align="center">
                                        {row.approved ? (
                                            <Chip size="small" color="success" label="Утверждено"/>
                                        ) : (
                                            <Chip size="small" label="Черновик"/>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Сохранить">
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleSave(row)}
                                                    disabled={row.approved || busy}
                                                >
                                                    <SaveIcon fontSize="small"/>
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title={row.approved ? 'Снять утверждение' : 'Утвердить'}>
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    color={row.approved ? 'warning' : 'success'}
                                                    onClick={() => handleApprove(row)}
                                                    disabled={busy}
                                                >
                                                    {row.approved ? <LockOpenIcon fontSize="small"/> : <CheckCircleIcon fontSize="small"/>}
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}>
                {toast && <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>}
            </Snackbar>
        </Container>
    );
};

export default CourseworkDetailsPage;
