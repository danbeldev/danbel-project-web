import './App.css';
import { ThemeProvider } from '@mui/material/styles';
import {ArticlesPage} from "./pages/ArticlesPage";
import {Suspense, lazy, useEffect, useMemo, useState} from "react";
import {Box, createTheme, CssBaseline} from "@mui/material";
import {Header} from "./components/Header";
import Footer from "./components/Footer";
import {BrowserRouter, Navigate, Route, Routes, useLocation} from "react-router-dom";
import {ArticlesDetailsPage} from "./pages/ArticlesDetailsPage";
import TagDetailsPage from "./pages/TagDetailsPage";
import UserProfilePage from "./pages/UserProfilePage";
import CreateArticlePage from "./pages/CreateArticlePage";
import SignInPage from "./pages/SignInPage";
import {ProblemCodeDetailsPage} from "./pages/ProblemCodeDetailsPage";
import {ProfilePage} from "./pages/ProfilePage";
import {GroupsPage} from "./pages/GroupsPage";
import {GroupDetailsPage} from "./pages/GroupDetailsPage";
import {AdminLabsPage} from "./pages/AdminLabsPage";
import {AdminGitTasksPage} from "./pages/AdminGitTasksPage";
import {AdminMysqlTasksPage} from "./pages/AdminMysqlTasksPage";
import AdminCriteriaGradingPage from "./pages/AdminCriteriaGradingPage";
import CriteriaPage from "./pages/CriteriaPage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminMessengersPage from "./pages/AdminMessengersPage";
import RequireAuth from "./components/RequireAuth";
import {TelegramConnectDialog} from "./components/TelegramConnect";
import {PrivacyPage} from "./pages/PrivacyPage";
import {PrivacyPolicyPage} from "./pages/PrivacyPolicyPage";
import {AdminCourseworksPage} from "./pages/AdminCourseworksPage";
import {CourseworkDetailsPage} from "./pages/CourseworkDetailsPage";
import YandexAdBlock from "./components/ads/YandexAdBlock";
import FloorAdBlock from "./components/ads/FloorAdBlock";
import InImageAdInjector from "./components/ads/InImageAdInjector";
import {showOverlayAd} from "./components/ads/showOverlayAd";

// Страница с графиками (recharts) грузится отдельным куском — основной бандл не раздуваем.
const AdminLlmPage = lazy(() => import("./pages/AdminLlmPage"));

const TOP_BANNER_BLOCK_ID = "R-A-20141312-3";

const getDesignTokens = (mode) => ({
    palette: {
        mode,
        ...(mode === 'light'
            ? {
                // Светлая тема (Modern Soft UI)
                primary: {
                    main: '#4361ee',  // Яркий кобальтовый синий
                    light: '#4895ef', // Электрический голубой
                },
                secondary: {
                    main: '#f72585',  // Неоновый пурпурный
                },
                background: {
                    default: '#f0f2f5',  // Светло-серый с голубым оттенком
                    paper: '#ffffff',   // Чистый белый
                },
                text: {
                    primary: '#2b2d42', // Темно-сине-серый
                    secondary: '#8d99ae', // Мягкий серо-голубой
                }
            }
            : {
                // Тёмная тема (Deep Space)
                primary: {
                    main: '#5e60ce',   // Фиолетово-синий (Neon)
                    light: '#5390d9',  // Сияющий сапфировый
                },
                secondary: {
                    main: '#80ffdb',  // Криптоново-бирюзовый
                },
                background: {
                    default: '#121826',  // Глубокий сине-черный
                    paper: '#1e293b',   // Углубленный темно-синий
                },
                text: {
                    primary: '#e2e8f0', // Светло-серебристый
                    secondary: '#94a3b8', // Дымчато-голубой
                }
            }),
    },
    typography: {
        fontFamily: 'Inter, sans-serif', // Inter - современный шрифт
        h5: {
            fontWeight: 700,           // Более жирное начертание
            letterSpacing: '-0.015em'  // Узкий кернинг
        },
        body1: {
            lineHeight: 1.7            // Улучшенная читаемость
        }
    },
    shape: {
        borderRadius: 16,            // Увеличиваем скругление
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: mode === 'light'
                        ? '0px 6px 24px rgba(149, 157, 165, 0.15)' // Мягкая тень (свет)
                        : '0px 8px 30px rgba(0, 0, 0, 0.35)',      // Глубокая тень (темная)
                    backdropFilter: 'blur(12px)',                 // Эффект матового стекла
                    background: mode === 'light'
                        ? 'rgba(255, 255, 255, 0.85)'              // Легкая прозрачность
                        : 'rgba(30, 41, 59, 0.7)',                 // Глубокий стеклянный эффект
                    border: mode === 'light'
                        ? '1px solid rgba(0, 0, 0, 0.05)'          // Тонкая граница (свет)
                        : '1px solid rgba(255, 255, 255, 0.05)'    // Тонкая граница (темно)
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',          // Без CAPS
                    fontWeight: 600,
                    padding: '10px 24px',
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: mode === 'light'
                            ? '0 4px 12px rgba(67, 97, 238, 0.3)'
                            : '0 4px 16px rgba(128, 255, 219, 0.4)'
                    }
                }
            }
        }
    },
    // Дополнительные глобальные эффекты
    shadows: mode === 'light'
        ? ['none', '0 2px 8px rgba(0,0,0,0.05)', ...Array(23).fill('none')]
        : ['none', '0 4px 16px rgba(0,0,0,0.4)', ...Array(23).fill('none')]
});

export const getTheme = (mode) => createTheme(getDesignTokens(mode));

function App() {
    const [mode, setMode] = useState(localStorage.getItem('theme_mode') ? localStorage.getItem('theme_mode') : "dark");
    const theme = useMemo(() => getTheme(mode), [mode]);

    useEffect(() => {
        localStorage.setItem("theme_mode", mode)
    }, [mode])

    const toggleTheme = () => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
        window.location.reload();
    };

    return (
        <BrowserRouter>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AppLayout mode={mode} toggleTheme={toggleTheme} />
            </ThemeProvider>
        </BrowserRouter>
    );
}

const NO_FOOTER_PATH_PREFIXES = ['/problems/'];

const AppLayout = ({ mode, toggleTheme }) => {
    const location = useLocation();
    const hideFooter = NO_FOOTER_PATH_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

    // Overlay-β не перекрывает контент целиком (в отличие от Полноэкранного),
    // поэтому его уместно триггерить на каждый переход по сайту, а не только
    // на конкретное действие — лимит показов всё равно регулируется в кабинете.
    useEffect(() => {
        showOverlayAd();
    }, [location.pathname]);

    return (
        <Box
            display="flex"
            flexDirection="column"
            minHeight="100vh"
        >
            <Header mode={mode} toggleTheme={toggleTheme} />

            <Box sx={{maxWidth: 'lg', mx: 'auto', width: '100%', px: 2, pt: 2}}>
                <YandexAdBlock blockId={TOP_BANNER_BLOCK_ID}/>
            </Box>

            {/* Floor Ad — липкий рекламный блок снизу экрана, рендерится Яндексом
                поверх контента (fixed-overlay). На коротких страницах без футера
                (например /sign-in) он перекрывал интерактивные элементы формы —
                см. найденный вживую баг: клик по полю пароля попадал в рекламу.
                Запас снизу не даёт последнему видимому элементу страницы упереться
                в зону, где появляется Floor Ad. */}
            <Box flexGrow={1} sx={{pb: 12}}>
                <Routes>
                    <Route path="/articles" element={<ArticlesPage />} />
                    <Route path="/articles/:id" element={<ArticlesDetailsPage mode={mode}/>} />
                    <Route path="/problems/:problemId" element={<ProblemCodeDetailsPage mode={mode}/>} />
                    <Route path="/problems/:problemId/criteria" element={<RequireAuth><CriteriaPage /></RequireAuth>} />
                    <Route path="/articles/new" element={<CreateArticlePage />} />
                    <Route path="/articles/edit/:id" element={<CreateArticlePage />} />
                    <Route path="/tags/:id" element={<TagDetailsPage />} />
                    <Route path="/users/:id" element={<UserProfilePage />} />
                    <Route path="/sign-in" element={<SignInPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/groups" element={<GroupsPage />} />
                    <Route path="/groups/:id" element={<GroupDetailsPage />} />
                    <Route path="/admin/labs" element={<RequireAuth><AdminLabsPage /></RequireAuth>} />
                    <Route path="/admin/git-tasks" element={<RequireAuth><AdminGitTasksPage /></RequireAuth>} />
                    <Route path="/admin/mysql-tasks" element={<RequireAuth><AdminMysqlTasksPage /></RequireAuth>} />
                    <Route path="/admin/llm" element={<RequireAuth><Suspense fallback={null}><AdminLlmPage /></Suspense></RequireAuth>} />
                    <Route path="/admin/problems/:problemId/grading" element={<RequireAuth><AdminCriteriaGradingPage /></RequireAuth>} />
                    <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
                    <Route path="/admin/messengers" element={<RequireAuth><AdminMessengersPage /></RequireAuth>} />
                    <Route path="/admin/max" element={<Navigate to="/admin/messengers?tab=groups" replace />} />
                    <Route path="/admin/chats" element={<Navigate to="/admin/messengers?tab=groups" replace />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    <Route path="/admin/courseworks" element={<RequireAuth><AdminCourseworksPage /></RequireAuth>} />
                    <Route path="/admin/courseworks/:id" element={<RequireAuth><CourseworkDetailsPage /></RequireAuth>} />
                    <Route path="*" element={<Navigate to="/articles" />} />
                </Routes>
            </Box>

            {!hideFooter && <Footer />}
            <TelegramConnectDialog/>
            <FloorAdBlock/>
            <InImageAdInjector/>
        </Box>
    );
};

export default App;