import axios from 'axios';
import EvaluationDisplay from "../components/EvaluationDisplay";

// Create axios instance
const api = axios.create({
    baseURL: 'https://map.matstart.ru:30/danbel-project-api',
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
    signUp: async (username, password) => {
        try {
            const response = await api.post('/users/security/sign-up', {
                username,
                password,
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
            const response = await api.get(`/users/evaluations`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default ApiService;