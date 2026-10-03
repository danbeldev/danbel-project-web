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
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import {useParams, Link} from 'react-router-dom';
import ApiService from '../network/API';

const formatFullName = (row) => {
    const parts = [row.lastName, row.firstName, row.patronymic].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : row.username;
};

export const CourseworkDetailsPage = () => {
    const {id} = useParams();
    const [coursework, setCoursework] = useState(null);
    const [rows, setRows] = useState([]);
    const [savingUserId, setSavingUserId] = useState(null);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

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
            <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
                Группы: {coursework.groups.map((g) => g.name).join(', ') || '—'}
            </Typography>

            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>ФИО</TableCell>
                            <TableCell>Группа</TableCell>
                            <TableCell sx={{minWidth: 200}}>Место практики</TableCell>
                            <TableCell sx={{minWidth: 200}}>Тема</TableCell>
                            <TableCell sx={{minWidth: 220}}>Описание</TableCell>
                            <TableCell align="center">Статус</TableCell>
                            <TableCell align="center">Действия</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => {
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
