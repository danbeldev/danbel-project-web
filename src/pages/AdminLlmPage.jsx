import React, {useEffect, useMemo, useState} from 'react';
import {
    Alert, Box, Chip, CircularProgress, Container, LinearProgress, Paper, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import {Link as RouterLink} from 'react-router-dom';
import {format} from 'date-fns';
import {
    Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis,
} from 'recharts';
import ApiService from '../network/API';

const fmtUsd = (v) => `$${v >= 1 ? v.toFixed(2) : v >= 0.01 ? v.toFixed(3) : v.toFixed(4)}`;
const fmtNum = (v) => new Intl.NumberFormat('ru-RU').format(Math.round(v));
const dayLabel = (iso) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

const STATUS = {
    OK: {label: 'оценено', color: 'success'},
    SKIPPED: {label: 'пропущено', color: 'default'},
    ERROR: {label: 'ошибка', color: 'error'},
};

const StatCard = ({title, value, hint, children}) => (
    <Paper variant="outlined" sx={{p: 2, borderRadius: 3, flex: '1 1 200px', minWidth: 0}}>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h5" fontWeight={800} sx={{mt: 0.5}}>{value}</Typography>
        {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
        {children}
    </Paper>
);

// Расход LLM: сколько потрачено (токены и $), по дням, по задачам и последние запросы.
const AdminLlmPage = () => {
    const theme = useTheme();
    const [days, setDays] = useState(30);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        setData(null);
        ApiService.getLlmUsage(days)
            .then(setData)
            .catch((err) => setError(err.message || err.reason || 'Не удалось загрузить расход'));
    }, [days]);

    const chartData = useMemo(() => (data?.daily || []).map((d) => ({...d, label: dayLabel(d.date)})), [data]);

    if (error) return <Container sx={{py: 4}}><Typography color="error">{error}</Typography></Container>;
    if (!data) return <Box display="flex" justifyContent="center" py={10}><CircularProgress/></Box>;

    const {config, totals} = data;
    const totalTokens = totals.promptTokens + totals.completionTokens;
    const budgetShare = config.monthlyTokenBudget > 0 ? Math.min(100, (config.usedTokensThisMonth / config.monthlyTokenBudget) * 100) : null;
    const axis = {fill: theme.palette.text.secondary, fontSize: 12};

    return (
        <Container maxWidth="lg" sx={{py: 4}}>
            <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" alignItems={{sm: 'center'}} gap={2} sx={{mb: 3}}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Расход LLM</Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{mt: 0.5}}>
                        <Chip size="small" color={config.enabled ? 'success' : 'default'}
                              label={config.enabled ? `Подключена · ${config.model}` : 'Не подключена'}/>
                    </Stack>
                </Box>
                <ToggleButtonGroup size="small" exclusive value={days} onChange={(_, v) => v && setDays(v)}>
                    <ToggleButton value={7}>7 дней</ToggleButton>
                    <ToggleButton value={30}>30 дней</ToggleButton>
                    <ToggleButton value={90}>90 дней</ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            {!config.pricesSet && (
                <Alert severity="info" sx={{mb: 3}}>
                    Цена не задана, поэтому стоимость в $ не считается. Укажите на сервере LLM_PRICE_INPUT_PER_M и
                    LLM_PRICE_OUTPUT_PER_M (USD за 1 млн токенов, входные и выходные) — стоимость появится у новых запросов.
                </Alert>
            )}

            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={2} sx={{mb: 3}}>
                <StatCard title={`Потрачено за ${days} дн.`} value={config.pricesSet ? fmtUsd(totals.costUsd) : '—'}
                          hint={`${fmtNum(totalTokens)} токенов`}/>
                <StatCard title="В этом месяце" value={config.pricesSet ? fmtUsd(config.costThisMonthUsd) : '—'}
                          hint={`${fmtNum(config.usedTokensThisMonth)} токенов${config.monthlyTokenBudget > 0 ? ` из ${fmtNum(config.monthlyTokenBudget)}` : ''}`}>
                    {budgetShare !== null && (
                        <LinearProgress variant="determinate" value={budgetShare} color={budgetShare > 90 ? 'error' : budgetShare > 70 ? 'warning' : 'primary'}
                                        sx={{mt: 1, height: 6, borderRadius: 3}}/>
                    )}
                </StatCard>
                <StatCard title="Проверок" value={totals.checks}
                          hint={`пропущено ${totals.skipped} · ошибок ${totals.errors}`}/>
                <StatCard title="Токены" value={`${fmtNum(totals.promptTokens)} / ${fmtNum(totals.completionTokens)}`}
                          hint="вход / выход"/>
            </Stack>

            {config.pricesSet && (
                <Paper variant="outlined" sx={{p: 2, borderRadius: 3, mb: 3}}>
                    <Typography fontWeight={700} sx={{mb: 1}}>Стоимость по дням, $</Typography>
                    <Box sx={{height: 260}}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{top: 8, right: 8, left: 0, bottom: 0}}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider}/>
                                <XAxis dataKey="label" tick={axis} interval="preserveStartEnd" minTickGap={16}/>
                                <YAxis tick={axis} width={56} tickFormatter={(v) => `$${v}`}/>
                                <ChartTooltip formatter={(v) => [fmtUsd(v), 'Стоимость']} labelFormatter={(l) => `День ${l}`}
                                              contentStyle={{background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`}}/>
                                <Bar dataKey="costUsd" name="Стоимость" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            )}

            <Paper variant="outlined" sx={{p: 2, borderRadius: 3, mb: 3}}>
                <Typography fontWeight={700} sx={{mb: 1}}>Токены по дням</Typography>
                <Box sx={{height: 260}}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{top: 8, right: 8, left: 0, bottom: 0}}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider}/>
                            <XAxis dataKey="label" tick={axis} interval="preserveStartEnd" minTickGap={16}/>
                            <YAxis tick={axis} width={56} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}/>
                            <ChartTooltip formatter={(v, name) => [fmtNum(v), name]} labelFormatter={(l) => `День ${l}`}
                                          contentStyle={{background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`}}/>
                            <Legend/>
                            <Bar dataKey="promptTokens" name="Вход" stackId="t" fill={theme.palette.primary.main}/>
                            <Bar dataKey="completionTokens" name="Выход" stackId="t" fill={theme.palette.warning.main} radius={[4, 4, 0, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>

            <Typography fontWeight={700} sx={{mb: 1}}>По задачам</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{borderRadius: 3, mb: 3}}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Задача</TableCell>
                            <TableCell align="right">Проверок</TableCell>
                            <TableCell align="right">Токенов</TableCell>
                            <TableCell align="right">$</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.byProblem.length === 0 && (
                            <TableRow><TableCell colSpan={4}><Typography color="text.secondary">За период запросов не было.</Typography></TableCell></TableRow>
                        )}
                        {data.byProblem.map((p) => (
                            <TableRow key={p.problemId} hover>
                                <TableCell><RouterLink to={`/admin/problems/${p.problemId}/grading`}>{p.title}</RouterLink></TableCell>
                                <TableCell align="right">{p.checks}</TableCell>
                                <TableCell align="right">{fmtNum(p.tokens)}</TableCell>
                                <TableCell align="right">{config.pricesSet ? fmtUsd(p.costUsd) : '—'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Typography fontWeight={700} sx={{mb: 1}}>Последние запросы</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{borderRadius: 3}}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Время</TableCell>
                            <TableCell>Студент</TableCell>
                            <TableCell>Задача</TableCell>
                            <TableCell>Статус</TableCell>
                            <TableCell align="right">Вход / выход</TableCell>
                            <TableCell align="right">$</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.recent.length === 0 && (
                            <TableRow><TableCell colSpan={6}><Typography color="text.secondary">Пока пусто.</Typography></TableCell></TableRow>
                        )}
                        {data.recent.map((r, i) => {
                            const st = STATUS[r.status] || {label: r.status, color: 'default'};
                            return (
                                <TableRow key={`${r.at}-${i}`} hover>
                                    <TableCell sx={{whiteSpace: 'nowrap'}}>{format(new Date(r.at), 'dd.MM HH:mm')}</TableCell>
                                    <TableCell>{r.student}</TableCell>
                                    <TableCell>{r.problemTitle}</TableCell>
                                    <TableCell>
                                        <Tooltip title={r.message || ''}>
                                            <Chip size="small" color={st.color} variant="outlined" label={st.label}/>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="right">{fmtNum(r.promptTokens)} / {fmtNum(r.completionTokens)}</TableCell>
                                    <TableCell align="right">{config.pricesSet ? fmtUsd(r.costUsd) : '—'}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default AdminLlmPage;
