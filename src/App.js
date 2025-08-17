import './App.css';
import { ThemeProvider } from '@mui/material/styles';
import {ArticlesPage} from "./pages/ArticlesPage";
import {useEffect, useMemo, useState} from "react";
import {Box, createTheme, CssBaseline} from "@mui/material";
import {Header} from "./components/Header";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import {ArticlesDetailsPage} from "./pages/ArticlesDetailsPage";
import TagDetailsPage from "./pages/TagDetailsPage";
import UserProfilePage from "./pages/UserProfilePage";
import Footer from "./components/Footer";
import CreateArticlePage from "./pages/CreateArticlePage";
import SignInPage from "./pages/SignInPage";
import {ProblemCodeDetailsPage} from "./pages/ProblemCodeDetailsPage";
import {ProfilePage} from "./pages/ProfilePage";
import YandexBannerAd from "./components/YandexBannerAd";

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

                <Box
                    display="flex"
                    flexDirection="column"
                    minHeight="100vh"
                >
                    <Header mode={mode} toggleTheme={toggleTheme} />
                    
                    <Box flexGrow={1}>
                        <Routes>
                            <Route path="/articles" element={<ArticlesPage />} />
                            <Route path="/articles/:id" element={<ArticlesDetailsPage mode={mode}/>} />
                            <Route path="/problems/:problemId" element={<ProblemCodeDetailsPage mode={mode}/>} />
                            <Route path="/articles/new" element={<CreateArticlePage />} />
                            <Route path="/articles/edit/:id" element={<CreateArticlePage />} />
                            <Route path="/tags/:id" element={<TagDetailsPage />} />
                            <Route path="/users/:id" element={<UserProfilePage />} />
                            <Route path="/sign-in" element={<SignInPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="*" element={<Navigate to="/articles" />} />
                        </Routes>
                    </Box>
                </Box>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;