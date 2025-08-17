import React, {useMemo} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import {Box, Typography, List, Link, Divider, ListItemButton} from '@mui/material';
import YandexBannerAd from './YandexBannerAd';
import {BookOpenText} from 'lucide-react';

const COMPONENT_PLACEHOLDERS = {
    '{{YandexAd}}': <YandexBannerAd/>,
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
                    <List disablePadding>
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
