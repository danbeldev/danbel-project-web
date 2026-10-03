// components/EvaluationList.jsx
import React from 'react';
import { Box, Typography, Chip, Paper, useTheme, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const GRADE_VALUE = { HAS_2: 2, HAS_3: 3, HAS_4: 4, HAS_5: 5 };

const gradeColor = (grade) => {
    if (grade >= 5) return 'success';
    if (grade >= 4) return 'primary';
    if (grade >= 3) return 'warning';
    return 'error';
};

const EvaluationList = ({ items }) => {
    const navigate = useNavigate();
    const theme = useTheme();

    if (!items || items.length === 0) {
        return (
            <Typography variant="body1" color="text.secondary">
                Нет доступных оценок.
            </Typography>
        );
    }

    return (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            {items.map((item, index) => {
                const grade = GRADE_VALUE[item.evaluation];

                return (
                    <Box
                        key={item.article?.id ?? index}
                        onClick={() => item.article && navigate(`/articles/${item.article.id}`)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            px: 2,
                            py: 1.5,
                            cursor: item.article ? 'pointer' : 'default',
                            borderBottom: index < items.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                            '&:hover': item.article ? { backgroundColor: 'action.hover' } : undefined,
                        }}
                    >
                        {grade ? (
                            <Chip
                                label={grade}
                                size="small"
                                color={gradeColor(grade)}
                                sx={{ fontWeight: 700, minWidth: 36 }}
                            />
                        ) : (
                            <Tooltip title="Нет оценки — вы ещё не пытались решить ни одной задачи в этой лекции">
                                <Box sx={{ minWidth: 36, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.disabled">—</Typography>
                                </Box>
                            </Tooltip>
                        )}

                        <Typography
                            variant="body2"
                            color={grade ? 'text.primary' : 'text.secondary'}
                            sx={{ flexGrow: 1 }}
                        >
                            {item.article?.title ?? 'Неизвестная лекция'}
                        </Typography>

                        {item.article?.createdAt && (
                            <Typography variant="caption" color="text.secondary">
                                {format(new Date(item.article.createdAt), 'd MMM yyyy', { locale: ru })}
                            </Typography>
                        )}
                    </Box>
                );
            })}
        </Paper>
    );
};

export default EvaluationList;
