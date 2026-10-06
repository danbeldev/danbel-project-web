import React, {useCallback, useEffect, useState} from 'react';
import {
    Alert, Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    IconButton, Stack, TextField, Typography, useMediaQuery
} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RuleRoundedIcon from '@mui/icons-material/RuleRounded';
import {useNavigate} from 'react-router-dom';
import {format} from 'date-fns';
import ApiService from '../network/API';
import {getTimezoneLabel} from './DeadlineBanner';

const pct = (v) => `${Math.round(v * 100)}%`;

const personLabel = (u) => (u.fullName ? `${u.fullName} (${u.username})` : u.username);

const GRADE_COLORS = {2: '#ef5350', 3: '#ffa726', 4: '#42a5f5', 5: '#66bb6a'};

// Иконка в цветном круге — заголовок карточки.
const IconBadge = ({icon: Icon, color = 'primary.main', size = 40}) => (
    <Box sx={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: color, color: '#fff',
    }}>
        <Icon sx={{fontSize: size * 0.58}}/>
    </Box>
);

const Check = ({children}) => (
    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{mb: 0.75}}>
        <CheckCircleRoundedIcon sx={{fontSize: 18, mt: '3px', color: 'success.main', flexShrink: 0}}/>
        <Typography variant="body2" color="text.primary">{children}</Typography>
    </Stack>
);

const InfoCard = ({icon, color, title, children}) => (
    <Box sx={{
        p: 2, borderRadius: 3, border: 1, borderColor: 'divider',
        bgcolor: 'action.hover',
    }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{mb: 1.5}}>
            <IconBadge icon={icon} color={color} size={34}/>
            <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        </Stack>
        {children}
    </Box>
);

const Step = ({n, children}) => (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{mb: 1}}>
        <Box sx={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'currentColor',
        }}>
            <Typography component="span" fontWeight={800} sx={{color: 'background.paper', fontSize: 14}}>{n}</Typography>
        </Box>
        <Typography variant="body1" color="text.primary" fontWeight={500}>{children}</Typography>
    </Stack>
);

// Правила для студента. Работа в паре стоит первой и выделена: она разрешена не на всех
// задачах и важнее остального — студент должен точно заметить, можно ли ему работать вдвоём.
const ProblemRulesDialog = ({open, onClose, problemId, deadline, onPairChanged, hasCriteria, criteriaUrl}) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const [rules, setRules] = useState(null);
    const [pair, setPair] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        const [r, info] = await Promise.all([ApiService.getGradingRules(), ApiService.getPair(problemId)]);
        setRules(r);
        setPair(info);
        setSelected(info.partner ? {...info.partner} : null);
        if (info.allowed && !info.locked && !info.closed) {
            setCandidates(await ApiService.getPairCandidates(problemId));
        }
    }, [problemId]);

    useEffect(() => {
        if (!open) return;
        setError(null);
        load().catch(() => {});
    }, [open, load]);

    const savePartner = async () => {
        setBusy(true);
        setError(null);
        try {
            if (selected) await ApiService.setPair(problemId, selected.id);
            else await ApiService.removePair(problemId);
            await load();
            onPairChanged && onPairChanged();
        } catch (e) {
            setError(e?.reason || 'Не удалось сохранить');
        } finally {
            setBusy(false);
        }
    };

    const options = pair?.partner ? [pair.partner, ...candidates] : candidates;
    const changed = (selected?.id ?? null) !== (pair?.partner?.id ?? null);
    const tz = deadline?.closesAt ? getTimezoneLabel(new Date(deadline.closesAt)) : null;

    const pairAllowed = !!pair?.allowed && !pair?.partnerOf;
    const accent = pair?.partnerOf ? 'info' : pairAllowed ? 'success' : 'warning';

    const pairCard = pair && (
        <Box sx={(t) => ({
            p: {xs: 2, sm: 3}, borderRadius: 4, mb: 3,
            border: `2px solid ${t.palette[accent].main}`,
            bgcolor: `${t.palette[accent].main}1a`,
            color: `${accent}.main`,
        })}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{mb: 2}}>
                <IconBadge icon={PeopleAltRoundedIcon} color={`${accent}.main`} size={48}/>
                <Typography variant="h5" fontWeight={800} color="text.primary" sx={{flexGrow: 1}}>
                    Работа в паре
                </Typography>
                <Chip
                    color={accent}
                    sx={{fontWeight: 800, letterSpacing: 0.5}}
                    label={pair.partnerOf ? 'ВЫ НАПАРНИК' : pairAllowed ? 'РАЗРЕШЕНА' : 'НЕ РАЗРЕШЕНА'}
                />
            </Stack>

            {pair.partnerOf ? (
                <Typography variant="body1" color="text.primary">
                    Вы указаны напарником у <b>{personLabel(pair.partnerOf)}</b>. Если он решит эту задачу, она
                    засчитается и вам. Свои решения вы тоже можете отправлять.
                </Typography>
            ) : !pair.allowed ? (
                <>
                    <Typography variant="h6" color="text.primary" fontWeight={700} sx={{mb: 1}}>
                        Оценку получит только владелец аккаунта — тот, под кем вы вошли.
                    </Typography>
                    <Typography variant="body1" color="text.primary">
                        Если вы делаете задачу вдвоём, оценка достанется только одному — вам. Хотите работать в
                        паре — попросите преподавателя разрешить это на данной задаче.
                    </Typography>
                </>
            ) : (
                <>
                    <Box sx={{mb: 2}}>
                        <Step n="1">Вы вдвоём работаете под <b>одним аккаунтом — вашим</b></Step>
                        <Step n="2">Укажите напарника из <b>своей группы</b> (максимум 2 человека)</Step>
                        <Step n="3">Когда работа принята (решение прошло проверку или преподаватель опубликовал оценку по критериям), баллы идут <b>вам обоим</b></Step>
                    </Box>

                    <Box sx={{mb: 2}}>
                        <Check>Подтверждение от напарника не нужно — преподаватель видит все пары.</Check>
                        <Check>Указать или сменить напарника можно только <b>до принятия работы</b> (первое принятое решение или опубликованная проверка) и до конца срока сдачи.</Check>
                        <Check>Если никого не указать — оценку получите только вы.</Check>
                    </Box>

                    {pair.closed ? (
                        <Alert severity="info">Срок сдачи истёк — пару изменить нельзя.</Alert>
                    ) : pair.locked ? (
                        <Alert severity="success">
                            Решение принято, напарник: <b>{personLabel(pair.partner)}</b>. Изменить уже нельзя.
                        </Alert>
                    ) : (
                        <Stack spacing={1.5}>
                            <Autocomplete
                                options={options}
                                value={selected}
                                onChange={(e, v) => setSelected(v)}
                                getOptionLabel={personLabel}
                                isOptionEqualToValue={(a, b) => a.id === b.id}
                                noOptionsText="Нет доступных одногруппников"
                                renderInput={(params) => (
                                    <TextField {...params} label="Напарник (по ФИО или логину)" placeholder="Начните вводить…"/>
                                )}
                            />
                            {error && <Alert severity="error">{error}</Alert>}
                            <Stack direction="row" spacing={1}>
                                <Button variant="contained" color="success" size="large" disabled={busy || !changed} onClick={savePartner}>
                                    {selected ? 'Сохранить напарника' : 'Работаю один'}
                                </Button>
                                {pair.partner && (
                                    <Button disabled={busy} onClick={() => setSelected(null)}>Убрать</Button>
                                )}
                            </Stack>
                        </Stack>
                    )}
                </>
            )}
        </Box>
    );

    return (
        <Dialog
            open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper" fullScreen={fullScreen}
            PaperProps={{sx: {borderRadius: fullScreen ? 0 : 4, backgroundImage: 'none', bgcolor: 'background.paper'}}}
        >
            <DialogTitle sx={{pr: 7}}>
                <Typography variant="h5" fontWeight={800}>Правила по заданию</Typography>
                <Typography variant="body2" color="text.secondary">
                    Прочитайте один раз — потом всё доступно по кнопке «Правила и оценка».
                </Typography>
                <IconButton onClick={onClose} sx={{position: 'absolute', right: 12, top: 12}} aria-label="Закрыть">
                    <CloseRoundedIcon/>
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{p: {xs: 2, sm: 3}}}>
                {pairCard}

                {hasCriteria && (
                    <Box sx={{mb: 2}}>
                        <InfoCard icon={RuleRoundedIcon} color="secondary.main" title="Критерии оценки">
                            <Typography variant="body2" color="text.primary" sx={{mb: 1}}>
                                Эта задача проверяется преподавателем <b>по критериям</b> — это список пунктов, за каждый из которых
                                даются баллы (например, «схема соответствует 3НФ» или «есть README и осмысленные коммиты»).
                            </Typography>
                            <Check>Часть критериев <b>открыта</b> — вы видите их заранее и можете на них ориентироваться.</Check>
                            <Check>Часть <b>скрыта</b>: до проверки видно только их число и сумму баллов, а полностью они раскроются после проверки.</Check>
                            <Check>Баллы могут быть частичными: например, 1 из 1.5 за пункт, если выполнено не всё.</Check>
                            <Check>Результат появится после того, как преподаватель опубликует проверку. Доля набранных баллов идёт в оценку за лекцию <b>пропорционально сложности</b> задачи.</Check>
                            <Button size="small" variant="outlined" sx={{mt: 1}}
                                    onClick={() => { onClose(); navigate(criteriaUrl); }}>
                                Открыть критерии
                            </Button>
                        </InfoCard>
                    </Box>
                )}

                {rules && (
                    <Box sx={{display: 'grid', gap: 2, gridTemplateColumns: {xs: '1fr', md: '1fr 1fr'}}}>
                        <InfoCard icon={BarChartRoundedIcon} color="primary.main" title="Как ставится оценка">
                            <Typography variant="body2" color="text.primary" sx={{mb: 1}}>
                                По доле решённых заданий лекции. Баллы за задание:
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{mb: 1.5}} flexWrap="wrap" useFlexGap>
                                <Chip size="small" color="success" variant="outlined" label={`Лёгкое — ${rules.weights.easy}`}/>
                                <Chip size="small" color="warning" variant="outlined" label={`Среднее — ${rules.weights.medium}`}/>
                                <Chip size="small" color="error" variant="outlined" label={`Сложное — ${rules.weights.hard}`}/>
                            </Stack>
                            <Box sx={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75, mb: 1.5}}>
                                {[
                                    [2, `< ${pct(rules.thresholds.grade3)}`],
                                    [3, `от ${pct(rules.thresholds.grade3)}`],
                                    [4, `от ${pct(rules.thresholds.grade4)}`],
                                    [5, `от ${pct(rules.thresholds.grade5)}`],
                                ].map(([grade, label]) => (
                                    <Box key={grade} sx={{
                                        textAlign: 'center', py: 0.75, borderRadius: 2,
                                        bgcolor: GRADE_COLORS[grade], color: '#111',
                                    }}>
                                        <Typography fontWeight={800} fontSize={22} lineHeight={1.1}>{grade}</Typography>
                                        <Typography fontSize={12} fontWeight={600}>{label}</Typography>
                                    </Box>
                                ))}
                            </Box>
                            <Check>Считаются только принятые решения (зелёный статус).</Check>
                            <Check>Задания на проверку преподавателем оценивает он.</Check>
                        </InfoCard>

                        <InfoCard icon={SyncRoundedIcon} color="info.main" title="Когда оценка меняется">
                            <Check>Сразу после принятого решения и ещё раз ночью (в 03:00).</Check>
                            <Check>Автоматически оценка <b>только растёт</b> и сама не снижается.</Check>
                            <Check>Оценку, выставленную преподавателем вручную, автоматика не меняет.</Check>
                            <Check>Пока нет ни одной попытки — оценки нет. Сбой проверяющей системы попыткой не считается.</Check>
                        </InfoCard>

                        <InfoCard icon={AccessTimeRoundedIcon} color="warning.main" title="Срок сдачи">
                            {deadline?.hasDeadline ? (
                                <>
                                    <Typography variant="body1" fontWeight={700} sx={{mb: 0.25}}>
                                        до {format(new Date(deadline.closesAt), 'dd.MM.yyyy HH:mm')}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 1}}>{tz}</Typography>
                                    <Check>После срока решения не принимаются, оценка не пересчитывается.</Check>
                                    <Check>Если к сроку ничего не решено — ставится «2».</Check>
                                    <Check>Преподаватель может продлить срок или пересчитать оценки.</Check>
                                </>
                            ) : (
                                <Typography variant="body2" color="text.primary">
                                    Для этой лекции срок не задан — решать можно в любое время. Если преподаватель
                                    назначит срок, здесь появится таймер.
                                </Typography>
                            )}
                        </InfoCard>

                        <InfoCard icon={SendRoundedIcon} color="secondary.main" title="Отправка решений">
                            <Check>Между отправками одной задачи пауза {rules.submitCooldownSeconds} секунд.</Check>
                            <Check>Пока решение проверяется, окно результата закрыть нельзя — дождитесь ответа.</Check>
                        </InfoCard>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{px: 3, py: 2}}>
                <Button variant="contained" size="large" onClick={onClose}>Понятно</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProblemRulesDialog;
