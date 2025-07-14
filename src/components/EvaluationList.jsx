// components/EvaluationList.jsx
import React from 'react';
import { Grid, Box, Paper, useTheme, useMediaQuery, Typography } from '@mui/material';
import ArticleCard from './ArticleCard';
import EvaluationDisplay from './EvaluationDisplay';

const EvaluationList = ({ items }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (!items || items.length === 0) {
        return (
            <Typography variant="body1" color="text.secondary">
                Нет доступных оценок.
            </Typography>
        );
    }

    return (
        <Grid container spacing={isMobile ? 2 : 4}>
            {items.map((item, index) => (
                <Grid item xs={12} key={index}>
                    <Paper
                        elevation={isMobile ? 1 : 3}
                        sx={{
                            p: isMobile ? 2 : 3,
                            borderRadius: 3,
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: 'flex-start',
                            gap: isMobile ? 2 : 4,
                        }}
                    >
                        <Box sx={{ minWidth: isMobile ? '100%' : 200 }}>
                            <EvaluationDisplay value={item.evaluation} />
                        </Box>
                        <Box sx={{ flexGrow: 1, width: '100%' }}>
                            <ArticleCard article={item.article} />
                        </Box>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );
};

export default EvaluationList;