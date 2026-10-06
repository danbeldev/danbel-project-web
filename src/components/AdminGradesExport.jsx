import React, {useEffect, useState} from 'react';
import {Button, Menu, MenuItem} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ApiService from '../network/API';
import {downloadGradesXlsx} from './gradesReportXlsx';

// Выгрузка оценок группы по лекции. Список групп отдаётся только админу,
// у остальных запрос падает и кнопка не показывается.
const AdminGradesExport = ({articleId}) => {
    const [groups, setGroups] = useState([]);
    const [anchor, setAnchor] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('accessToken')) return;
        ApiService.getDeadlines(articleId).then(setGroups).catch(() => setGroups([]));
    }, [articleId]);

    if (groups.length === 0) return null;

    const exportGroup = async (groupId) => {
        setAnchor(null);
        setBusy(true);
        try {
            downloadGradesXlsx(await ApiService.getGradesReport(articleId, groupId));
        } catch (e) {
            alert('Не удалось выгрузить оценки');
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon/>}
                disabled={busy}
                onClick={(e) => (groups.length === 1 ? exportGroup(groups[0].groupId) : setAnchor(e.currentTarget))}
            >
                Скачать оценки (Excel)
            </Button>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                {groups.map((g) => (
                    <MenuItem key={g.groupId} onClick={() => exportGroup(g.groupId)}>{g.groupName}</MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default AdminGradesExport;
