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
    Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Editor } from '@monaco-editor/react';

const SubmissionDetailsDialog = ({ open, onClose, submissionDetail, mode }) => {
    const renderResult = () => {
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
            onClose={onClose}
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
                <IconButton
                    aria-label="close"
                    onClick={onClose}
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
                {submissionDetail ? (
                    <Stack spacing={3}>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <Typography variant="subtitle1" fontWeight="bold">Статус:</Typography>
                            <Chip
                                label={submissionDetail.status}
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
                        </Stack>

                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            <strong>Язык:</strong> {submissionDetail.language.name}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            <strong>Создано:</strong> {new Date(submissionDetail.createdAt).toLocaleString()}
                        </Typography>

                        {submissionDetail.resultJson && (
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
                            Отправленное решение:
                        </Typography>
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
                    </Stack>
                ) : (
                    <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                        Загрузка...
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    color="primary"
                    sx={{ fontWeight: 600, textTransform: 'none' }}
                >
                    Закрыть
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SubmissionDetailsDialog;
