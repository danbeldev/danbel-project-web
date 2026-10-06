import React, {useEffect, useMemo, useState} from 'react';
import {
    Box, Button, Typography, TextField, IconButton, Paper, Stack, CircularProgress, Alert, Tooltip,
    Chip, Collapse, Divider, Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RuleIcon from '@mui/icons-material/Rule';
import NotesIcon from '@mui/icons-material/Notes';
import SaveIcon from '@mui/icons-material/Save';
import {Link as RouterLink} from 'react-router-dom';
import ApiService from '../network/API';

const STEP = 0.25;

// Заготовки популярных критериев — добавляются одним кликом и правятся как обычные.
const MYSQL_TEMPLATES = [
    {title: 'У каждой таблицы есть первичный ключ', maxPoints: 1, section: 'Структура',
        description: 'У всех таблиц задан PRIMARY KEY (суррогатный или составной — оба варианта допустимы).'},
    {title: 'Есть внешние ключи между связанными таблицами', maxPoints: 1, section: 'Структура',
        description: 'Связи между таблицами оформлены через FOREIGN KEY, а не только «по смыслу».'},
    {title: 'Схема соответствует 3НФ', maxPoints: 1.5, section: 'Нормализация',
        description: 'Нет повторяющихся групп колонок (phone1/phone2), нет зависимостей от части ключа и между неключевыми полями.'},
    {title: 'Импорт данных выполнен', maxPoints: 0.5, section: 'Данные',
        description: 'Данные из исходного файла загружены в таблицы, количество строк соответствует исходнику.'},
    {title: 'Подходящие типы данных и ограничения', maxPoints: 0.5, section: 'Структура',
        description: 'Типы колонок осмысленны; для ограниченных значений (роль, статус) использован ENUM или справочник.'},
];

const GIT_TEMPLATES = [
    {title: 'Оформлен README', maxPoints: 0.5, section: 'Оформление',
        description: 'В репозитории есть README: описание проекта, как запустить, что реализовано.'},
    {title: 'Осмысленные коммиты', maxPoints: 1, section: 'Процесс',
        description: 'Работа разбита на несколько коммитов с понятными сообщениями, а не один коммит «всё сразу».'},
    {title: 'Проект открывается и собирается', maxPoints: 1.5, section: 'Код',
        description: 'Есть решение/проект (.sln/.csproj), проект собирается без ошибок.'},
    {title: 'Нет лишних файлов в репозитории', maxPoints: 0.5, section: 'Оформление',
        description: 'Нет папок bin/obj, временных файлов и паролей в коде; настроен .gitignore.'},
    {title: 'Структура проекта и именование', maxPoints: 0.5, section: 'Код',
        description: 'Классы, формы и методы названы осмысленно, код разложен по файлам и папкам.'},
];

const round = (n) => Math.round(n * 100) / 100;
const toNumber = (v) => {
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
};
const normalize = (c) => ({
    id: c.id ?? null,
    title: c.title || '',
    description: c.description || '',
    maxPoints: String(c.maxPoints ?? 1),
    visible: c.visible !== false,
    section: c.section || '',
});

// Редактор рубрики задания (преподаватель). Баллы относительные: итог задачи — доля набранных
// баллов от суммы, умноженная на вес сложности. Шаг баллов — 0.25.
const CriteriaEditor = ({problemId, problemType}) => {
    const TEMPLATES = problemType === 'GIT_REPO' ? GIT_TEMPLATES : MYSQL_TEMPLATES;
    const [items, setItems] = useState(null);
    const [snapshot, setSnapshot] = useState('');
    const [saving, setSaving] = useState(false);
    const [openRubric, setOpenRubric] = useState({});
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const applyLoaded = (list) => {
        const normalized = list.map(normalize);
        setItems(normalized);
        setSnapshot(JSON.stringify(normalized));
    };

    useEffect(() => {
        ApiService.getCriteria(problemId)
            .then(applyLoaded)
            .catch((err) => setError(err.message || err.reason || 'Не удалось загрузить критерии'));
    }, [problemId]);

    const dirty = items !== null && JSON.stringify(items) !== snapshot;

    useEffect(() => {
        if (!dirty) return undefined;
        const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    const stats = useMemo(() => {
        const list = items || [];
        const total = list.reduce((sum, c) => sum + toNumber(c.maxPoints), 0);
        const hidden = list.filter((c) => !c.visible);
        return {
            total: round(total),
            count: list.length,
            hiddenCount: hidden.length,
            hiddenTotal: round(hidden.reduce((sum, c) => sum + toNumber(c.maxPoints), 0)),
        };
    }, [items]);

    const update = (index, patch) => setItems((prev) => prev.map((c, i) => (i === index ? {...c, ...patch} : c)));
    const bump = (index, delta) => setItems((prev) => prev.map((c, i) => {
        if (i !== index) return c;
        const next = Math.min(100, Math.max(STEP, round(toNumber(c.maxPoints) + delta)));
        return {...c, maxPoints: String(next)};
    }));
    const move = (index, delta) => setItems((prev) => {
        const target = index + delta;
        if (target < 0 || target >= prev.length) return prev;
        const next = [...prev];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
    });
    const remove = (index) => {
        const c = items[index];
        if (c.id && !window.confirm(`Удалить критерий «${c.title || 'без названия'}»? Баллы студентов по нему тоже удалятся.`)) return;
        setItems((prev) => prev.filter((_, i) => i !== index));
    };
    const add = (template) => {
        setItems((prev) => [...prev, normalize(template || {title: '', maxPoints: 1})]);
    };

    const save = async () => {
        const invalid = items.findIndex((c) => !c.title.trim() || toNumber(c.maxPoints) <= 0);
        if (invalid >= 0) {
            setError(`Критерий №${invalid + 1}: заполните название и баллы больше нуля`);
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const saved = await ApiService.setCriteria(problemId, items.map((c) => ({
                id: c.id,
                title: c.title,
                description: c.description,
                maxPoints: toNumber(c.maxPoints),
                visible: c.visible,
                section: c.section,
            })));
            applyLoaded(saved);
            setToast('Критерии сохранены');
        } catch (err) {
            setError(err.message || err.reason || 'Не удалось сохранить');
        } finally {
            setSaving(false);
        }
    };

    if (!items) {
        return error ? <Alert severity="error" sx={{m: 3}}>{error}</Alert> : (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress size={28}/></Box>
        );
    }

    return (
        <Box>
            <Box sx={{p: {xs: 2, sm: 3}}}>
                <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" alignItems={{sm: 'center'}} gap={2}>
                    <Box>
                        <Typography variant="h5" fontWeight={800}>Критерии оценки</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mt: 0.5, maxWidth: 560}}>
                            Из критериев складывается оценка за задачу: итог — доля набранных баллов от суммы,
                            умноженная на вес сложности. Скрытые критерии студент видит только после публикации проверки.
                        </Typography>
                    </Box>
                    <Button component={RouterLink} to={`/admin/problems/${problemId}/grading`} variant="contained" startIcon={<RuleIcon/>} sx={{flexShrink: 0}}>
                        Проверка работ
                    </Button>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{mt: 2}}>
                    <Chip label={`Критериев: ${stats.count}`}/>
                    <Chip color="primary" label={`Сумма: ${stats.total} б.`}/>
                    <Chip variant="outlined" icon={<VisibilityOffIcon/>} label={`Скрытых: ${stats.hiddenCount} (${stats.hiddenTotal} б.)`}/>
                </Stack>
            </Box>

            <Divider/>

            <Box sx={{p: {xs: 2, sm: 3}}}>
                {error && <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>{error}</Alert>}

                {items.length === 0 && (
                    <Box sx={{textAlign: 'center', py: 4, color: 'text.secondary'}}>
                        <RuleIcon sx={{fontSize: 40, opacity: 0.5}}/>
                        <Typography sx={{mt: 1}}>Критериев пока нет. Добавьте свои или начните с заготовок ниже.</Typography>
                    </Box>
                )}

                <Stack spacing={2}>
                    {items.map((c, i) => {
                        const rubricOpen = openRubric[i] ?? !!c.description;
                        return (
                            <Paper key={c.id ?? `new-${i}`} variant="outlined" sx={{
                                p: 2, borderRadius: 3, borderLeft: 4, borderLeftColor: c.visible ? 'primary.main' : 'text.disabled',
                            }}>
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0, mt: 0.75,
                                        bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Typography variant="caption" fontWeight={800}>{i + 1}</Typography>
                                    </Box>

                                    <Box sx={{flexGrow: 1, minWidth: 0}}>
                                        <TextField
                                            placeholder="Название критерия, например «Схема соответствует 3НФ»"
                                            size="small" fullWidth value={c.title}
                                            onChange={(e) => update(i, {title: e.target.value})}
                                        />
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{mt: 1.5}}>
                                            <Stack direction="row" alignItems="center" sx={{border: 1, borderColor: 'divider', borderRadius: 2}}>
                                                <IconButton size="small" onClick={() => bump(i, -STEP)} aria-label="Меньше"><RemoveIcon fontSize="small"/></IconButton>
                                                <TextField
                                                    variant="standard" size="small" type="number" value={c.maxPoints}
                                                    onChange={(e) => update(i, {maxPoints: e.target.value})}
                                                    inputProps={{min: STEP, max: 100, step: STEP, style: {textAlign: 'center', width: 56}}}
                                                    InputProps={{disableUnderline: true}}
                                                />
                                                <IconButton size="small" onClick={() => bump(i, STEP)} aria-label="Больше"><AddIcon fontSize="small"/></IconButton>
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary">баллов</Typography>

                                            <TextField
                                                placeholder="Раздел" size="small" value={c.section} sx={{width: 160}}
                                                onChange={(e) => update(i, {section: e.target.value})}
                                            />

                                            <Chip
                                                clickable size="small" variant={c.visible ? 'filled' : 'outlined'}
                                                color={c.visible ? 'primary' : 'default'}
                                                icon={c.visible ? <VisibilityIcon/> : <VisibilityOffIcon/>}
                                                label={c.visible ? 'Открытый' : 'Скрытый'}
                                                onClick={() => update(i, {visible: !c.visible})}
                                            />
                                            <Chip
                                                clickable size="small" variant="outlined" icon={<NotesIcon/>}
                                                label={rubricOpen ? 'Скрыть рубрику' : (c.description ? 'Рубрика' : 'Добавить рубрику')}
                                                onClick={() => setOpenRubric((prev) => ({...prev, [i]: !rubricOpen}))}
                                            />
                                        </Stack>

                                        <Collapse in={rubricOpen} unmountOnExit>
                                            <TextField
                                                label="Рубрика: как судить, что засчитывать"
                                                size="small" fullWidth multiline minRows={2} sx={{mt: 1.5}}
                                                value={c.description}
                                                onChange={(e) => update(i, {description: e.target.value})}
                                            />
                                        </Collapse>
                                    </Box>

                                    <Stack sx={{flexShrink: 0}}>
                                        <Tooltip title="Выше"><span><IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpwardIcon fontSize="small"/></IconButton></span></Tooltip>
                                        <Tooltip title="Ниже"><span><IconButton size="small" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDownwardIcon fontSize="small"/></IconButton></span></Tooltip>
                                        <Tooltip title="Удалить"><IconButton size="small" color="error" onClick={() => remove(i)}><DeleteOutlineIcon fontSize="small"/></IconButton></Tooltip>
                                    </Stack>
                                </Stack>
                            </Paper>
                        );
                    })}
                </Stack>

                <Button startIcon={<AddIcon/>} onClick={() => add()} sx={{mt: 2}}>Добавить критерий</Button>

                <Typography variant="overline" color="text.secondary" sx={{display: 'block', mt: 3}}>Заготовки</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {TEMPLATES.map((t) => (
                        <Chip key={t.title} variant="outlined" clickable icon={<AddIcon/>} label={t.title} onClick={() => add(t)}/>
                    ))}
                </Stack>
            </Box>

            <Box sx={{
                position: 'sticky', bottom: 0, zIndex: 2, p: 2, bgcolor: 'background.paper',
                borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2,
            }}>
                <Typography variant="body2" color={dirty ? 'warning.main' : 'text.secondary'} sx={{flexGrow: 1}}>
                    {dirty ? 'Есть несохранённые изменения' : 'Все изменения сохранены'}
                </Typography>
                <Typography variant="body2" fontWeight={700}>Сумма: {stats.total}</Typography>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit"/> : <SaveIcon/>}
                        onClick={save} disabled={saving || !dirty}>
                    Сохранить
                </Button>
            </Box>

            <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)} message={toast}/>
        </Box>
    );
};

export default CriteriaEditor;
