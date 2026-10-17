import React, {useEffect, useRef, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {
    Box, Button, Dialog, DialogActions, DialogContent, IconButton, Link as MuiLink, Paper, Stack, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import ApiService from '../network/API';

const formatDue = (iso) =>
    new Date(iso).toLocaleString('ru-RU', {timeZone: 'Europe/Samara', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});

const dueText = (lecture) => {
    if (!lecture.closesAt) return 'срок не задан';
    return lecture.closed ? `срок истёк ${formatDue(lecture.closesAt)}` : `до ${formatDue(lecture.closesAt)}`;
};

// Диалог при каждом заходе на сайт у студента, которому не хватает допуска к экзамену: по каким предметам, какие лекции сдать
// (минимум на 3) и до какого срока. «Понятно» закрывает его до следующего запуска.
const ExamAdmissionDialog = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const checked = useRef(false);

    useEffect(() => {
        if (!ApiService.isAuthenticated()) {
            checked.current = false; // после выхода и нового входа проверим заново
            setOpen(false);
            return;
        }
        if (checked.current || location.pathname === '/sign-in' || ApiService.isAdmin()) return;
        checked.current = true;
        ApiService.getMyPendingAdmissions()
            .then((list) => {
                if (Array.isArray(list) && list.length > 0) {
                    setItems(list);
                    setOpen(true);
                }
            })
            .catch(() => {});
    }, [location.pathname]);

    const close = () => setOpen(false);
    const go = (path) => {
        setOpen(false);
        navigate(path);
    };

    return (
        <Dialog
            open={open}
            onClose={close}
            maxWidth="sm"
            fullWidth
            slotProps={{paper: {sx: {borderRadius: '24px', overflow: 'hidden', m: 2, backgroundImage: 'none'}}}}
        >
            <Box sx={{
                position: 'relative', px: 3, pt: 4, pb: 3, textAlign: 'center', color: '#fff',
                background: 'linear-gradient(135deg, #f5a623 0%, #e8590c 100%)',
            }}>
                <IconButton onClick={close} aria-label="Закрыть" size="small"
                            sx={{position: 'absolute', top: 10, right: 10, color: 'rgba(255,255,255,0.85)'}}>
                    <CloseIcon fontSize="small"/>
                </IconButton>
                <Box sx={{
                    width: 72, height: 72, mx: 'auto', mb: 2, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'rgba(255,255,255,0.2)', boxShadow: '0 0 0 8px rgba(255,255,255,0.12)',
                }}>
                    <SchoolOutlinedIcon sx={{fontSize: 44}}/>
                </Box>
                <Typography variant="h5" sx={{fontWeight: 700}}>Нет допуска к экзамену</Typography>
                <Typography sx={{mt: 0.5, opacity: 0.95}}>Чтобы получить допуск, сдайте лекции минимум на 3</Typography>
            </Box>

            <DialogContent sx={{px: 3, pt: 3, pb: 1}}>
                <Stack spacing={2}>
                    {items.map((item) => (
                        <Paper key={item.tagId} variant="outlined" sx={{p: 2, borderRadius: 3}}>
                            <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1} sx={{mb: 1}}>
                                <Typography fontWeight={700}>{item.tagName}</Typography>
                                <Typography variant="body2" color="text.secondary">Сдано {item.passed} из {item.required}</Typography>
                            </Stack>
                            {item.missing.length > 0 ? (
                                <>
                                    <Typography variant="body2" color="text.secondary" sx={{mb: 0.5}}>Нужно сдать:</Typography>
                                    <Stack spacing={0.5}>
                                        {item.missing.map((l) => (
                                            <Box key={l.articleId} sx={{display: 'flex', justifyContent: 'space-between', gap: 2}}>
                                                <MuiLink component="button" type="button" underline="hover" sx={{textAlign: 'left'}}
                                                         onClick={() => go(`/articles/${l.articleId}`)}>
                                                    {l.title}
                                                </MuiLink>
                                                <Typography variant="body2" color={l.closed ? 'error' : 'text.secondary'} sx={{whiteSpace: 'nowrap'}}>
                                                    {dueText(l)}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </>
                            ) : (
                                <Typography variant="body2" color="text.secondary">Все лекции сданы, но преподаватель пока не допускает вас к экзамену.</Typography>
                            )}
                            {item.manual === false && item.missing.length > 0 && (
                                <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 1}}>
                                    Решение о допуске принимает преподаватель.
                                </Typography>
                            )}
                            <Button size="small" sx={{mt: 1}} onClick={() => go(`/tags/${item.tagId}`)}>К предмету</Button>
                        </Paper>
                    ))}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 2, textAlign: 'center'}}>
                    Время указано по самарскому времени. Сообщение показывается при каждом заходе, пока допуска нет.
                </Typography>
            </DialogContent>

            <DialogActions sx={{px: 3, pt: 2, pb: 2.5}}>
                <Button fullWidth size="large" variant="contained" onClick={close} sx={{borderRadius: '14px', py: 1.2}}>Понятно</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ExamAdmissionDialog;
