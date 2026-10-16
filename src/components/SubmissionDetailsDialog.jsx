import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    Chip,
    Stack,
    Box,
    Divider,
    Paper,
    Button,
    Alert,
    AlertTitle
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Editor } from '@monaco-editor/react';
import YandexAdBlock from './ads/YandexAdBlock';
import CircularProgress from '@mui/material/CircularProgress';

const SubmissionDetailsDialog = ({ open, onClose, submissionDetail, mode }) => {
    const isExam = Boolean(submissionDetail?.exam);
    const isInput = submissionDetail?.problemType === 'INPUT' && !isExam;
    // Письменный ответ ждёт проверки (после срока или преподавателем) — это не «идёт проверка», закрыть окно можно.
    const isPending = !isInput && !isExam && (submissionDetail?.status === 'PENDING' || submissionDetail?.status === 'RUNNING');
    // Пока решение проверяется, закрыть модалку нельзя — ни крестиком, ни кликом
    // по фону, ни Escape. При обновлении страницы её заново открывает эффект
    // в ProblemCodeDetailsPage, если последняя отправка ещё не завершена.
    const handleClose = (event, reason) => {
        if (isPending) return;
        onClose(event, reason);
    };

    const renderInputResult = () => {
        let data = null;
        try {
            data = typeof submissionDetail.resultJson === 'string' ? JSON.parse(submissionDetail.resultJson) : submissionDetail.resultJson;
        } catch (e) {
            data = null;
        }
        const ok = submissionDetail.status === 'SUCCESS';
        return (
            <Alert severity={ok ? 'success' : 'error'}>
                <AlertTitle>{ok ? 'Ответ верный — задача пройдена' : 'Ответ неверный'}</AlertTitle>
                {data?.comment || (ok ? '' : 'Комментарий не оставлен')}
            </Alert>
        );
    };

    const renderResult = () => {
        if (isInput) return renderInputResult();
        if (isExam && submissionDetail.status === 'PENDING') return null;
        try {
            const resultData = typeof submissionDetail.resultJson === 'string'
                ? JSON.parse(submissionDetail.resultJson)
                : submissionDetail.resultJson;

            if (submissionDetail.status === 'SUCCESS' || submissionDetail.status === 'FAILED') {
                if (Array.isArray(resultData)) {
                    return resultData.map((test, index) => (
                        <Paper
                            key={index}
                            variant="outlined"
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                backgroundColor: (theme) =>
                                    theme.palette.mode === 'dark'
                                        ? theme.palette.grey[900]
                                        : theme.palette.grey[100],
                                boxShadow: (theme) =>
                                    theme.palette.mode === 'dark'
                                        ? '0 2px 8px rgba(0,0,0,0.7)'
                                        : '0 2px 8px rgba(0,0,0,0.1)',
                                transition: 'background-color 0.3s ease'
                            }}
                        >
                            <Typography fontWeight={600} variant="subtitle1" gutterBottom>
                                Тест #{index + 1}: {test.passed ? '✅ Успех' : '❌ Ошибка'}
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography
                                variant="body2"
                                fontFamily="monospace"
                                whiteSpace="pre-wrap"
                                sx={{ mb: 1 }}
                            >
                                <strong>Ввод:</strong>{"\n"}{test.input.replace(/\\n/g, '\n')}
                            </Typography>
                            <Typography
                                variant="body2"
                                fontFamily="monospace"
                                whiteSpace="pre-wrap"
                                sx={{ mb: 1 }}
                            >
                                <strong>Ожидалось:</strong>{"\n"}{test.expected}
                            </Typography>
                            <Typography
                                variant="body2"
                                fontFamily="monospace"
                                whiteSpace="pre-wrap"
                            >
                                <strong>Получено:</strong>{"\n"}{test.output}
                            </Typography>
                        </Paper>
                    ));
                }
                return <Typography color="error">Некорректный формат данных тестов</Typography>;
            } else if (submissionDetail.status === 'ERROR') {
                return (
                    <Typography color="error" fontFamily="monospace" sx={{ whiteSpace: 'pre-wrap' }}>
                        {resultData.error}
                    </Typography>
                );
            } else {
                return <Typography>Нет данных о результатах</Typography>;
            }
        } catch (e) {
            console.error('Ошибка при обработке resultJson:', e);
            return (
                <Typography color="error">
                    Ошибка при обработке результатов
                </Typography>
            );
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            disableEscapeKeyDown={isPending}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: (theme) =>
                        theme.palette.mode === 'dark'
                            ? '0 8px 24px rgba(0,0,0,0.9)'
                            : '0 8px 24px rgba(0,0,0,0.15)',
                },
            }}
        >
            <DialogTitle
                sx={{
                    pr: 6,
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                    backgroundColor: (theme) => theme.palette.background.paper,
                    borderBottom: (theme) =>
                        `1px solid ${theme.palette.divider}`,
                    position: 'relative',
                }}
            >
                Детали отправки #{submissionDetail?.id}
                {!isPending && (
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                            position: 'absolute',
                            right: 12,
                            top: 12,
                            color: (theme) => theme.palette.text.secondary,
                            transition: 'color 0.3s ease',
                            '&:hover': { color: (theme) => theme.palette.text.primary },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                )}
            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    backgroundColor: (theme) => theme.palette.background.default,
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    px: 3,
                    py: 2,
                }}
            >
                <Box sx={{mb: 2}}>
                    <YandexAdBlock blockId="R-A-20141312-11" minHeight={90}/>
                </Box>
                {submissionDetail ? (
                    <Stack spacing={3}>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <Typography variant="subtitle1" fontWeight="bold">Статус:</Typography>
                            <Chip
                                label={isExam && submissionDetail.status === 'PENDING' ? 'Принято' : isInput ? ({PENDING: 'Ожидает проверки', SUCCESS: 'Верно', FAILED: 'Неверно'}[submissionDetail.status] || submissionDetail.status) : submissionDetail.status}
                                color={
                                    submissionDetail.status === 'SUCCESS'
                                        ? 'success'
                                        : submissionDetail.status === 'FAILED'
                                            ? 'error'
                                            : 'default'
                                }
                                variant="outlined"
                                sx={{
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                }}
                            />
                            {(submissionDetail.status === 'PENDING' || submissionDetail.status === 'RUNNING') && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CircularProgress size={16} />
                                    <Typography variant="body2" color="text.secondary">
                                        Проверяется, обновление каждые 5 секунд…
                                    </Typography>
                                </Stack>
                            )}
                        </Stack>

                        {isExam && submissionDetail.status === 'PENDING' && (
                            <Alert severity="success">
                                Решение принято. Во время экзамена результат проверки не показывается — проверяется последнее отправленное решение.
                            </Alert>
                        )}
                        {isInput && submissionDetail.status === 'PENDING' && (
                            <Alert severity="info">
                                Ответ принят и ждёт проверки. Проверяется последний отправленный ответ — результат и комментарий появятся здесь после проверки.
                            </Alert>
                        )}
                        {!isInput && (
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                <strong>Язык:</strong> {submissionDetail.language.name}
                            </Typography>
                        )}
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            <strong>Создано:</strong> {new Date(submissionDetail.createdAt).toLocaleString()}
                        </Typography>

                        {submissionDetail.resultJson && submissionDetail.status !== 'PENDING' && (
                            <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
                                    Результат:
                                </Typography>
                                <Stack spacing={2}>
                                    {renderResult()}
                                </Stack>
                            </Box>
                        )}

                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 3 }}>
                            {isInput ? 'Ваш ответ:' : 'Отправленное решение:'}
                        </Typography>
                        {isInput ? (
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {submissionDetail.code}
                            </Paper>
                        ) : (
                        <Paper
                            elevation={2}
                            sx={{
                                borderRadius: 2,
                                overflow: 'hidden',
                                boxShadow: (theme) =>
                                    theme.palette.mode === 'dark'
                                        ? '0 4px 20px rgba(255,255,255,0.05)'
                                        : '0 4px 20px rgba(0,0,0,0.1)',
                            }}
                        >
                            <Editor
                                language={submissionDetail.language.name}
                                value={submissionDetail.code}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    readOnly: true,
                                    wordWrap: 'on',
                                }}
                                height="400px"
                                width="100%"
                                theme={mode === 'dark' ? 'vs-dark' : 'vs'}
                            />
                        </Paper>
                        )}
                    </Stack>
                ) : (
                    <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                        Загрузка...
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                    onClick={handleClose}
                    disabled={isPending}
                    variant="contained"
                    color="primary"
                    sx={{ fontWeight: 600, textTransform: 'none' }}
                >
                    {isPending ? 'Ожидание проверки…' : 'Закрыть'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SubmissionDetailsDialog;
