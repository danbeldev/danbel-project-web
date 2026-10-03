import React, {useEffect, useState} from 'react';
import {
    Container,
    Typography,
    List,
    ListItemButton,
    ListItemText,
    Chip,
    Box,
    CircularProgress,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Stack,
    Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {useNavigate} from 'react-router-dom';
import ApiService from '../network/API';

export const AdminCourseworksPage = () => {
    const navigate = useNavigate();
    const [courseworks, setCourseworks] = useState(null);
    const [groups, setGroups] = useState([]);
    const [error, setError] = useState(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [groupIds, setGroupIds] = useState([]);
    const [saving, setSaving] = useState(false);
    const [dialogError, setDialogError] = useState(null);

    const loadCourseworks = () => {
        ApiService.getAllCourseworks()
            .then(setCourseworks)
            .catch((err) => setError(err.message || 'Не удалось загрузить курсовые'));
    };

    useEffect(() => {
        loadCourseworks();
        ApiService.getAllGroups().then(setGroups).catch(() => {});
    }, []);

    const openDialog = () => {
        setTitle('');
        setGroupIds([]);
        setDialogError(null);
        setDialogOpen(true);
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            setDialogError('Укажите название курсовой');
            return;
        }
        setSaving(true);
        setDialogError(null);
        try {
            await ApiService.createCoursework(title.trim(), groupIds);
            setDialogOpen(false);
            loadCourseworks();
        } catch (err) {
            setDialogError(err.message || 'Не удалось создать курсовую');
        } finally {
            setSaving(false);
        }
    };

    if (error) {
        return (
            <Container maxWidth="md" sx={{py: 4}}>
                <Typography color="error">{error}</Typography>
            </Container>
        );
    }

    if (!courseworks) {
        return (
            <Box display="flex" justifyContent="center" py={10}>
                <CircularProgress/>
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{py: 4}}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{mb: 3}}>
                <Typography variant="h5" fontWeight={700}>
                    Курсовые
                </Typography>
                <Button variant="contained" startIcon={<AddIcon/>} onClick={openDialog}>
                    Создать курсовую
                </Button>
            </Stack>

            {courseworks.length === 0 ? (
                <Typography color="text.secondary">Курсовых пока нет.</Typography>
            ) : (
                <Paper variant="outlined" sx={{borderRadius: 3, overflow: 'hidden'}}>
                    <List disablePadding>
                        {courseworks.map((cw) => (
                            <ListItemButton
                                key={cw.id}
                                onClick={() => navigate(`/admin/courseworks/${cw.id}`)}
                                divider
                            >
                                <ListItemText
                                    primary={cw.title}
                                    secondary={cw.groups.map((g) => g.name).join(', ') || 'Группы не выбраны'}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                </Paper>
            )}

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Новая курсовая</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Название"
                        fullWidth
                        margin="normal"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <TextField
                        label="Группы"
                        select
                        SelectProps={{multiple: true}}
                        fullWidth
                        margin="normal"
                        value={groupIds}
                        onChange={(e) => setGroupIds(e.target.value)}
                        helperText="Можно выбрать несколько групп"
                    >
                        {groups.map((g) => (
                            <MenuItem key={g.id} value={g.id}>
                                {g.name}
                            </MenuItem>
                        ))}
                    </TextField>
                    {dialogError && <Alert severity="error" sx={{mt: 2}}>{dialogError}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={saving}>
                        {saving ? <CircularProgress size={20}/> : 'Создать'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminCourseworksPage;
