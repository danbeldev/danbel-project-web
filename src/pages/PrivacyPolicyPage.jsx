import React from 'react';
import { Container, Typography, Link as MuiLink } from '@mui/material';

export const PrivacyPolicyPage = () => {
    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Политика конфиденциальности
            </Typography>

            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3 }}>
                Какие данные собираются
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                При регистрации аккаунта преподавателем сохраняются логин, ФИО (по желанию) и данные
                об учебном прогрессе (оценки, решённые задачи, созданные репозитории и базы данных
                в рамках учебных заданий). Эти данные используются исключительно в образовательных
                целях и не передаются третьим лицам.
            </Typography>

            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                Реклама и cookie
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                На сайте может показываться реклама через рекламную сеть Яндекса (РСЯ), которая
                использует файлы cookie и обезличенные данные для показа объявлений. Подробнее о том,
                как Яндекс обрабатывает такие данные, можно прочитать в{' '}
                <MuiLink href="https://yandex.ru/legal/confidential/" target="_blank" rel="noopener">
                    политике конфиденциальности Яндекса
                </MuiLink>.
            </Typography>

            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                Хранение паролей
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Пароли преподавателей хранятся в зашифрованном виде. Пароли студенческих аккаунтов
                генерируются автоматически и видны только преподавателю — они нужны исключительно
                для того, чтобы студент мог войти на платформу и работать с учебными заданиями.
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                По вопросам, связанным с обработкой данных, можно обратиться по адресу{' '}
                <MuiLink href="mailto:dan.bel.89@bk.ru">dan.bel.89@bk.ru</MuiLink>.
            </Typography>
        </Container>
    );
};

export default PrivacyPolicyPage;
