import React, {useMemo} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import {Box, Typography, List, Link, Divider, ListItemButton} from '@mui/material';
import {BookOpenText} from 'lucide-react';
import YandexAdBlock from './ads/YandexAdBlock';

const ARTICLE_AD_BLOCK_ID = 'R-A-20141312-4';

// Ключевое слово {{ad}} в тексте статьи подменяется на рекламный блок —
// используется при написании лекций, чтобы вставить рекламу между абзацами.
const COMPONENT_PLACEHOLDERS = {
    '{{ad}}': <YandexAdBlock blockId={ARTICLE_AD_BLOCK_ID}/>,
};

function extractHeadings(markdown) {
    const headingRegex = /^(#{1,6})\s+(.*)$/gm;
    const headings = [];
    let match;
    while ((match = headingRegex.exec(markdown)) !== null) {
        const [_, hashes, text] = match;
        const level = hashes.length;
        const slug = text.toLowerCase().replace(/[^\w]+/g, '-');
        headings.push({level, text, slug});
    }
    return headings;
}

const MarkdownContent = ({content, mode, showToc = true}) => {
    const parts = content.split(/(\{\{.*?\}\})/g);

    // Извлекаем заголовки из частей без плейсхолдеров
    const markdownParts = parts.filter((part) => !COMPONENT_PLACEHOLDERS[part]);
    const combinedMarkdown = markdownParts.join('');
    const headings = useMemo(() => extractHeadings(combinedMarkdown), [combinedMarkdown]);

    return (
        <Box>
            { showToc &&
                <Box
                    sx={{
                        mb: 4,
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: mode === 'dark' ? '#1e1e1e' : '#f9f9f9',
                    }}
                >
                    <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                        <BookOpenText size={20} style={{marginRight: 8}}/>
                        <Typography variant="h6" fontWeight={600}>
                            Содержание
                        </Typography>
                    </Box>
                    <Divider sx={{mb: 1}}/>
                    <List
                        disablePadding
                        sx={{
                            maxHeight: {xs: 280, sm: 'none'},
                            overflowY: {xs: 'auto', sm: 'visible'},
                            overscrollBehavior: 'contain',
                        }}
                    >
                        {headings.map((heading, index) => (
                            <ListItemButton
                                key={index}
                                component={Link}
                                href={`#${heading.slug}`}
                                sx={{
                                    pl: `${(heading.level - 1) * 2 + 1}rem`,
                                    color: 'text.primary',
                                    fontSize: Math.max(19 - heading.level, 14),
                                    borderLeft: '2px solid transparent',
                                    '&:hover': {
                                        backgroundColor: mode === 'dark' ? '#2c2c2c' : '#efefef',
                                        borderLeftColor: 'primary.main',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                }}
                            >
                                {heading.text}
                            </ListItemButton>
                        ))}
                    </List>
                </Box>
            }

            {/* Markdown Content */}
            <Box
                sx={{
                    typography: 'body1',
                    lineHeight: 1.8,
                    '& pre': {
                        p: 2,
                        borderRadius: 2,
                        overflow: 'auto',
                        backgroundColor: mode === 'dark' ? '#0d1117' : '#f6f8fa',
                    },
                    '& code': {
                        fontFamily: 'Source Code Pro, monospace',
                    },
                    '& table': {
                        display: 'block',
                        width: '100%',
                        maxWidth: '100%',
                        overflowX: 'auto',
                        borderCollapse: 'collapse',
                        my: 2,
                    },
                    '& th, & td': {
                        border: '1px solid',
                        borderColor: 'divider',
                        px: 1.5,
                        py: 1,
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                    },
                    '& th': {
                        backgroundColor: mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                        fontWeight: 600,
                    },
                    '& blockquote': {
                        m: '16px 0',
                        px: 2,
                        py: 1,
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        borderRadius: 1,
                        color: 'text.secondary',
                        '& p': {
                            m: 0,
                        },
                    },
                    '& hr': {
                        border: 'none',
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        my: 3,
                    },
                    '& img': {
                        maxWidth: '100%',
                        borderRadius: 1,
                    },
                    '& ul, & ol': {
                        pl: 3,
                    },
                    '& li': {
                        mb: 0.5,
                    },
                }}
            >
                {parts.map((part, index) => {
                    if (COMPONENT_PLACEHOLDERS[part]) {
                        return <React.Fragment key={index}>{COMPONENT_PLACEHOLDERS[part]}</React.Fragment>;
                    } else {
                        return (
                            <ReactMarkdown
                                key={index}
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={{
                                    h1: ({node, ...props}) => {
                                        const slug = props.children.toString().toLowerCase().replace(/[^\w]+/g, '-');
                                        return <h1 id={slug} {...props} />;
                                    },
                                    h2: ({node, ...props}) => {
                                        const slug = props.children.toString().toLowerCase().replace(/[^\w]+/g, '-');
                                        return <h2 id={slug} {...props} />;
                                    },
                                    h3: ({node, ...props}) => {
                                        const slug = props.children.toString().toLowerCase().replace(/[^\w]+/g, '-');
                                        return <h3 id={slug} {...props} />;
                                    },
                                    h4: ({node, ...props}) => {
                                        const slug = props.children.toString().toLowerCase().replace(/[^\w]+/g, '-');
                                        return <h4 id={slug} {...props} />;
                                    },
                                    h5: ({node, ...props}) => {
                                        const slug = props.children.toString().toLowerCase().replace(/[^\w]+/g, '-');
                                        return <h5 id={slug} {...props} />;
                                    },
                                    h6: ({node, ...props}) => {
                                        const slug = props.children.toString().toLowerCase().replace(/[^\w]+/g, '-');
                                        return <h6 id={slug} {...props} />;
                                    }
                                }}
                            >
                                {part}
                            </ReactMarkdown>
                        );
                    }
                })}
            </Box>
        </Box>
    );
};

export default MarkdownContent;
