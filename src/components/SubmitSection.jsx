import { useEffect, useState } from "react";
import {
    Button,
    Box,
    Typography,
    CircularProgress,
    useMediaQuery,
} from "@mui/material";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";

export function SubmitSection({ problem, handleSubmit }) {
    const [secondsLeft, setSecondsLeft] = useState(problem.canSubmit.secondsLeft);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        if (secondsLeft <= 0) return;

        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [secondsLeft]);

    return (
        <Box>
            {secondsLeft <= 0 ? (
                <motion.div
                    style={{ width: isMobile ? "100%" : "auto" }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth={isMobile}
                        sx={{
                            borderRadius: "12px",
                            px: isMobile ? 2 : 3,
                            py: 1.4,
                            fontWeight: 600,
                            textTransform: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            mb: isMobile ? 2 : 0,
                        }}
                        onClick={() => {
                            setSecondsLeft(15);
                            handleSubmit();
                        }}
                    >
                        🚀 Отправить
                    </Button>
                </motion.div>
            ) : (
                <Box position="relative" display="inline-flex">
                    <CircularProgress
                        variant="determinate"
                        value={(secondsLeft / 15) * 100}
                        size={64}
                        thickness={5}
                        sx={{ color: "primary.main" }}
                    />
                    <Box
                        top={0}
                        left={0}
                        bottom={0}
                        right={0}
                        position="absolute"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Typography
                            variant="h6"
                            component="div"
                            color="text.secondary"
                            fontWeight={600}
                        >
                            {secondsLeft}
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
