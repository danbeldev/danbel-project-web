import React, { useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Typography,
    Alert,
    Stack,
    TextField,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import ApiService from '../network/API';

export const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [filename, setFilename] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleUpload = async () => {
        if (!file || !filename) {
            setError('Укажите файл и имя файла для загрузки');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const result = await ApiService.uploadFile(file, filename);
            setUploadedFileName(result.filename || filename);
        } catch (err) {
            setError(typeof err === 'string' ? err : 'Ошибка при загрузке файла');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Box>
            <Stack spacing={2}>
                <TextField
                    label="Название файла (например: cover.jpg)"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    fullWidth
                />

                <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    disabled={isUploading}
                >
                    Выбрать файл
                    <input
                        type="file"
                        hidden
                        onChange={(e) => setFile(e.target.files[0] || null)}
                    />
                </Button>

                {file && (
                    <Typography variant="body2" color="text.secondary">
                        Выбран: {file.name}
                    </Typography>
                )}

                <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={!file || !filename || isUploading}
                >
                    Загрузить
                </Button>

                {isUploading && <CircularProgress size={24} />}

                {uploadedFileName && !isUploading && (
                    <Typography variant="body2" color="success.main">
                        Загружено как: {uploadedFileName}
                    </Typography>
                )}

                {error && <Alert severity="error">{error}</Alert>}
            </Stack>
        </Box>
    );
};

