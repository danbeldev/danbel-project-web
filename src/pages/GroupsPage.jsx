import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    List,
    ListItemButton,
    ListItemText,
    Chip,
    Box,
    CircularProgress,
    Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ApiService from '../network/API';

export const GroupsPage = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        ApiService.getAllGroups()
            .then(setGroups)
            .catch((err) => setError(err.message || 'Не удалось загрузить группы'));
    }, []);

    if (error) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography color="error">{error}</Typography>
            </Container>
        );
    }

    if (!groups) {
        return (
            <Box display="flex" justifyContent="center" py={10}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                Группы
            </Typography>

            {groups.length === 0 ? (
                <Typography color="text.secondary">Групп пока нет.</Typography>
            ) : (
                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <List disablePadding>
                        {groups.map((group) => (
                            <ListItemButton
                                key={group.id}
                                onClick={() => navigate(`/groups/${group.id}`)}
                                divider
                            >
                                <ListItemText primary={group.name} />
                                <Chip label={`${group.studentsCount} студ.`} size="small" />
                            </ListItemButton>
                        ))}
                    </List>
                </Paper>
            )}
        </Container>
    );
};

export default GroupsPage;
