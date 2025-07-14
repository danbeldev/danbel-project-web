import React from "react";
import { Typography, Paper, Avatar, Stack } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { styled } from "@mui/material/styles";

const evaluationMap = {
    HAS_2: 2,
    HAS_3: 3,
    HAS_4: 4,
    HAS_5: 5,
};

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    backgroundColor: theme.palette.background.paper,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: "#fff",
    width: 48,
    height: 48,
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
}));

const EvaluationDisplay = ({ value }) => {
    const number = evaluationMap[value];

    if (number === undefined) {
        return (
            <Typography color="error" fontFamily="Roboto" fontWeight="medium">
                Неизвестное значение: {value}
            </Typography>
        );
    }

    return (
        <StyledPaper elevation={0}>
            <StyledAvatar>
                <StarIcon />
            </StyledAvatar>
            <Stack spacing={0.5}>
                <Typography variant="subtitle2" color="text.secondary">
                    Оценка
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                    {number}
                </Typography>
            </Stack>
        </StyledPaper>
    );
};

export default EvaluationDisplay;
