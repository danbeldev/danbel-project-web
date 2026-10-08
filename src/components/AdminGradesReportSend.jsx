import React, {useEffect, useState} from 'react';
import {Alert, Button, Menu, MenuItem, Snackbar} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ApiService from '../network/API';

// Ручная отправка итогов по оценкам лекции группе (Max-чат + Telegram студентам). Список групп отдаётся только
// админу, у остальных запрос падает и кнопка не показывается.
const AdminGradesReportSend = ({articleId}) => {
    const [groups, setGroups] = useState([]);
    const [anchor, setAnchor] = useState(null);
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (!localStorage.getItem('accessToken')) return;
        ApiService.getDeadlines(articleId).then(setGroups).catch(() => setGroups([]));
    }, [articleId]);

    if (groups.length === 0) return null;

    const send = async (group) => {
        setAnchor(null);
        const ok = window.confirm(
            `Отправить итоги по оценкам группе ${group.groupName}?\n\n` +
            'Список оценок уйдёт в чат группы в Max, а каждому студенту — в Telegram. ' +
            'Отправка сработает даже если проверены не все работы и даже если итоги уже отправлялись.');
        if (!ok) return;
        setBusy(true);
        try {
            await ApiService.sendGradesReport(articleId, group.groupId);
            setResult({severity: 'success', text: `Итоги группы ${group.groupName} поставлены в отправку`});
        } catch (e) {
            setResult({severity: 'error', text: typeof e === 'string' ? e : (e?.message || 'Не удалось отправить итоги')});
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <Button variant="outlined" size="small" startIcon={<SendIcon/>} disabled={busy}
                    onClick={(e) => setAnchor(e.currentTarget)}>
                Отправить итоги
            </Button>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                {groups.map((g) => (
                    <MenuItem key={g.groupId} onClick={() => send(g)}>
                        {g.groupName}{g.closesAt ? '' : ' (нет срока)'}
                    </MenuItem>
                ))}
            </Menu>
            <Snackbar open={Boolean(result)} autoHideDuration={6000} onClose={() => setResult(null)}
                      anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
                {result ? <Alert severity={result.severity} onClose={() => setResult(null)}>{result.text}</Alert> : undefined}
            </Snackbar>
        </>
    );
};

export default AdminGradesReportSend;
