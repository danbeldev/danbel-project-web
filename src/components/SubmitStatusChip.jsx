import { Chip } from "@mui/material";

export default function SubmitStatusChip({ submitSuccess }) {
    if (submitSuccess) {
        return (
            <Chip
                label="Решено"
                color="success"
                size="small"
                variant="outlined"
            />
        );
    }

    return (
        <Chip
            label="Не решено"
            color="default"
            size="small"
            variant="outlined"
        />
    );
}
