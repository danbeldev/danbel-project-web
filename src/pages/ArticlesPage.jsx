import React, {useEffect} from 'react';
import {
    Container,
} from '@mui/material';
import ArticleList from "../components/ArticleList";

export const ArticlesPage = () => {

    useEffect(() => {
        document.title = "DanBel";
    }, [])

    return (
        <Container maxWidth="lg" sx={{py: 4}}>
            <ArticleList tagIds={[]} authorIds={[]}/>
        </Container>
    );
};
