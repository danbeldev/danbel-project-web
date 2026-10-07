import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: 'https://danbel.teacher.alspio.com/danbel-project-api',
});

// Request interceptor to add auth token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized access (e.g., redirect to login)
            console.error('Unauthorized access - possibly invalid token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('userRole');
            // You might want to redirect to login here
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const ApiService = {
    // Auth methods
    // Только для админа: создаёт аккаунт (пароль можно не передавать — сгенерируется сам),
    // опционально сразу привязывает к группе.
    signUp: async (username, password, groupId, lastName, firstName, patronymic) => {
        try {
            const response = await api.post('/users/security/sign-up', {
                username,
                password: password || null,
                groupId: groupId || null,
                lastName: lastName || null,
                firstName: firstName || null,
                patronymic: patronymic || null,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    signIn: async (username, password) => {
        try {
            const response = await api.post('/users/security/sign-in', {
                username,
                password,
            });
            // Store token and user info in localStorage
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('userId', response.data.userId);
            localStorage.setItem('userRole', response.data.role);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
    },

    // File methods
    uploadFile: async (file, filename) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post(`/files/upload?filename=${filename}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getFile: async (filename) => {
        try {
            const response = await api.get(`/files/${filename}`, {
                responseType: 'blob',
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Прямая ссылка на файл (обложки, аватары) — единая точка, чтобы не хардкодить домен по всему фронту.
    getFileUrl: (filename) => `${api.defaults.baseURL}/files/${filename}`,

    // Article methods
    getAllArticles: async (tagIds = [], authorIds = [], pageNumber = 0, pageSize = 20) => {
        try {
            const params = new URLSearchParams();
            tagIds.forEach(id => params.append('tagIds', id));
            authorIds.forEach(id => params.append('authorIds', id));
            params.append('pageNumber', pageNumber);
            params.append('pageSize', pageSize);

            const response = await api.get(`/articles?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getDefaultCovers: async () => {
        try {
            const response = await api.get('/articles/default-covers');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    createArticle: async (articleData) => {
        try {
            const response = await api.post(`/articles`, articleData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    updateArticle: async (id, articleData) => {
        try {
            const response = await api.put(`/articles/${id}`, articleData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getArticleById: async (id) => {
        try {
            const response = await api.get(`/articles/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // User methods
    getAllUsers: async () => {
        try {
            const response = await api.get('/users');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getUserById: async (id) => {
        try {
            const response = await api.get(`/users/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Tag methods
    getAllTags: async () => {
        try {
            const response = await api.get('/tags');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getTagById: async (id) => {
        try {
            const response = await api.get(`/tags/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Group methods (только для админа)
    getAllGroups: async () => {
        try {
            const response = await api.get('/groups');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getGroupById: async (id) => {
        try {
            const response = await api.get(`/groups/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Создаёт несколько студентов через единый sign-up (по одному вызову на запись),
    // каждый сразу привязывается к группе. entries: [{username, lastName, firstName, patronymic}].
    // Если кто-то из логинов уже занят — бросает ошибку с указанием, на каком остановились.
    createStudents: async (groupId, entries) => {
        const results = [];
        for (const entry of entries) {
            try {
                const created = await ApiService.signUp(
                    entry.username, null, groupId,
                    entry.lastName, entry.firstName, entry.patronymic
                );
                results.push(created);
            } catch (error) {
                const reason = error?.reason || error?.message || (typeof error === 'string' ? error : 'ошибка создания');
                const err = new Error(`${reason} (логин: ${entry.username})`);
                err.partialResults = results;
                throw err;
            }
        }
        return results;
    },

    resetPassword: async (userId) => {
        try {
            const response = await api.post(`/users/${userId}/reset-password`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    calculateGroupGrade: async (groupId) => {
        try {
            const response = await api.post(`/groups/${groupId}/calculate-grade`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Coursework (курсовые) methods
    getAllCourseworks: async () => {
        try {
            const response = await api.get('/courseworks');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getCourseworkById: async (id) => {
        try {
            const response = await api.get(`/courseworks/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    createCoursework: async (title, groupIds) => {
        try {
            const response = await api.post('/courseworks', {title, groupIds});
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getMyCourseworks: async () => {
        try {
            const response = await api.get('/courseworks/my');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    updateCourseworkSubmission: async (courseworkId, userId, data) => {
        try {
            const response = await api.put(`/courseworks/${courseworkId}/submissions/${userId}`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    approveCourseworkSubmission: async (courseworkId, userId) => {
        try {
            const response = await api.post(`/courseworks/${courseworkId}/submissions/${userId}/approve`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    unapproveCourseworkSubmission: async (courseworkId, userId) => {
        try {
            const response = await api.post(`/courseworks/${courseworkId}/submissions/${userId}/unapprove`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getGradingRules: async () => {
        try {
            const response = await api.get(`/problems/grading-rules`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getPair: async (problemId) => {
        try {
            const response = await api.get(`/problems/${problemId}/pair`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getPairCandidates: async (problemId) => {
        try {
            const response = await api.get(`/problems/${problemId}/pair/candidates`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    setPair: async (problemId, partnerId) => {
        try {
            const response = await api.put(`/problems/${problemId}/pair`, { partnerId });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    removePair: async (problemId) => {
        try {
            const response = await api.delete(`/problems/${problemId}/pair`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    setPairAllowed: async (problemId, allowed) => {
        try {
            const response = await api.put(`/problems/${problemId}/pair-allowed`, { allowed });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getPairPermissions: async (problemId) => {
        try {
            const response = await api.get(`/problems/${problemId}/pair-permissions`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    setPairPermission: async (problemId, userId, allowed) => {
        try {
            const response = await api.put(`/problems/${problemId}/pair-permissions/${userId}`, { allowed });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    removePairPermission: async (problemId, userId) => {
        try {
            const response = await api.delete(`/problems/${problemId}/pair-permissions/${userId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getPairs: async (problemId) => {
        try {
            const response = await api.get(`/problems/${problemId}/pairs`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    removePairByAdmin: async (problemId, ownerId) => {
        try {
            const response = await api.delete(`/problems/${problemId}/pairs/${ownerId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getMyDeadline: async (articleId) => {
        try {
            const response = await api.get(`/articles/${articleId}/deadline`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getDeadlines: async (articleId) => {
        try {
            const response = await api.get(`/articles/${articleId}/deadlines`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    setDeadline: async (articleId, groupId, closesAt) => {
        try {
            const response = await api.put(`/articles/${articleId}/groups/${groupId}/deadline`, { closesAt });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Критерии задания (рубрика). Студент: getMyCriteria; преподаватель: остальные.
    getMyCriteria: async (problemId) => {
        try {
            const response = await api.get(`/problems/${problemId}/criteria`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getCriteria: async (problemId) => {
        try {
            const response = await api.get(`/problems/${problemId}/criteria/all`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    setCriteria: async (problemId, criteria) => {
        try {
            const response = await api.put(`/problems/${problemId}/criteria`, criteria);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getCriteriaGrading: async (problemId) => {
        try {
            const response = await api.get(`/problems/${problemId}/criteria/grading`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getTelegramStatus: async () => {
        try {
            const response = await api.get('/notifications/telegram');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    createTelegramLink: async () => {
        try {
            const response = await api.post('/notifications/telegram/link');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getLlmUsage: async (days = 30) => {
        try {
            const response = await api.get('/admin/llm/usage', {params: {days}});
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // AI-проверка критериев (черновики баллов): статус/настройки, оценка объёма, запуск.
    getCriteriaAiStatus: async (problemId) => {
        try {
            const response = await api.get(`/problems/${problemId}/criteria/ai/status`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getCriteriaAiEstimate: async (problemId, groupId, recheck = false) => {
        try {
            const response = await api.get(`/problems/${problemId}/criteria/ai/estimate`, {params: {...(groupId ? {groupId} : {}), ...(recheck ? {recheck: true} : {})}});
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    setCriteriaAiAutoPublish: async (problemId, enabled) => {
        try {
            const response = await api.put(`/problems/${problemId}/criteria/ai/auto-publish`, {enabled});
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    runCriteriaAi: async (problemId, force = false, groupId = null, recheck = false) => {
        try {
            const response = await api.post(`/problems/${problemId}/criteria/ai/run`, null, {params: {force, ...(groupId ? {groupId} : {}), ...(recheck ? {recheck: true} : {})}});
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    runCriteriaAiForUser: async (problemId, userId, force = true, overwriteManual = false) => {
        try {
            const response = await api.post(`/problems/${problemId}/criteria/ai/run/${userId}`, null, {params: {force, overwriteManual}});
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    saveCriteriaResults: async (problemId, userId, data) => {
        try {
            const response = await api.put(`/problems/${problemId}/criteria/grading/${userId}`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getGradesReport: async (articleId, groupId) => {
        try {
            const response = await api.get(`/articles/${articleId}/groups/${groupId}/grades-report`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    recalculateGroupGrades: async (articleId, groupId) => {
        try {
            const response = await api.post(`/articles/${articleId}/groups/${groupId}/calculate-grade`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    setEvaluation: async (userId, articleId, grade) => {
        try {
            const response = await api.put(`/users/${userId}/evaluations/${articleId}`, { grade });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    clearEvaluation: async (userId, articleId) => {
        try {
            const response = await api.delete(`/users/${userId}/evaluations/${articleId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Lab (SSH_LAB) methods
    startLab: async (problemId) => {
        try {
            const response = await api.post(`/labs/start`, null, { params: { problemId } });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    stopLab: async (sessionId) => {
        try {
            const response = await api.post(`/labs/${sessionId}/stop`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    pauseLab: async (sessionId) => {
        try {
            const response = await api.post(`/labs/${sessionId}/pause`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    resumeLab: async (sessionId) => {
        try {
            const response = await api.post(`/labs/${sessionId}/resume`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getMyLab: async () => {
        try {
            const response = await api.get('/labs/mine');
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) return null;
            throw error.response?.data || error.message;
        }
    },

    getLabById: async (id) => {
        try {
            const response = await api.get(`/labs/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getLabStats: async (id) => {
        try {
            const response = await api.get(`/labs/${id}/stats`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getLabConfig: async () => {
        try {
            const response = await api.get('/labs/config');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getAllActiveLabs: async () => {
        try {
            const response = await api.get('/labs');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Git-задачи (self-hosted Gitea)
    createGitRepo: async (problemId) => {
        try {
            const response = await api.post(`/git-tasks/${problemId}/create-repo`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getMyGitRepo: async (problemId) => {
        try {
            const response = await api.get(`/git-tasks/${problemId}/mine`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) return null;
            throw error.response?.data || error.message;
        }
    },

    getGitCredentials: async () => {
        try {
            const response = await api.get('/git-tasks/credentials');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getAllGitTasks: async () => {
        try {
            const response = await api.get('/git-tasks');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // MySQL-задачи (своя база на студента под задачу)
    createMysqlDb: async (problemId) => {
        try {
            const response = await api.post(`/mysql-tasks/${problemId}/create-db`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getMyMysqlDb: async (problemId) => {
        try {
            const response = await api.get(`/mysql-tasks/${problemId}/mine`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) return null;
            throw error.response?.data || error.message;
        }
    },

    getAllMysqlTasks: async () => {
        try {
            const response = await api.get('/mysql-tasks');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getLabTerminalUrl: (sessionId, env) => {
        const base = api.defaults.baseURL.replace(/^http/, 'ws');
        const token = localStorage.getItem('accessToken');
        return `${base}/ws/labs/terminal?token=${encodeURIComponent(token)}&sessionId=${sessionId}&env=${encodeURIComponent(env)}`;
    },

    // Helper method to check auth status
    isAuthenticated: () => {
        return !!localStorage.getItem('accessToken');
    },

    isAdmin: () => {
        return localStorage.getItem('userRole') === "ADMIN";
    },

    // Helper method to get current user info
    getCurrentUser: () => {
        return {
            userId: localStorage.getItem('userId'),
            userRole: localStorage.getItem('userRole'),
        };
    },

    getProblems: async (articleId) => {
        try {
            const response = await api.get(`/problems?articleId=${articleId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    getLanguages: async () => {
        try {
            const response = await api.get(`/problems/languages`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    getProblem: async (problemId) => {
        try {
            const response = await api.get(`/problems/${problemId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    submitSolution: async (problemId, data) => {
        try {
            const response = await api.post(`/problems/${problemId}/submit`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    getSubmissions: async (problemId) => {
        try {
            const response = await api.get(`/problems/${problemId}/submissions`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    getSubmissionShort: async (submissionId) => {
        try {
            const response = await api.get(`/problems/submissions/${submissionId}/short`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    getSubmissionDetails: async (submissionId) => {
        try {
            const response = await api.get(`/problems/submissions/${submissionId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    getCodeTemplate: async (problemId, languageId) => {
        try {
            const response = await api.get(`/problems/${problemId}/template?languageId=${languageId}`);
            return response.data;
        } catch (error) {
            // throw error.response?.data || error.message;
        }
    },
    getMeUser: async () => {
        try {
            const response = await api.get(`/users/me`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    getEvaluation: async (articleId) => {
        try {
            const response = await api.get(`/users/evaluation?articleId=${articleId}`);
            return response.data;
        } catch (error) {
            // throw error.response?.data || error.message;
        }
    },
    getEvaluations: async () => {
        try {
            const response = await api.get(`/users/evaluations/by-group-tags`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default ApiService;