import React, {useEffect} from 'react';
import {
    Container,
} from '@mui/material';
import ArticleList from "../components/ArticleList";
import YandexAdBlock from "../components/ads/YandexAdBlock";

const FEED_BLOCK_ID = "R-A-20141312-5";

export const ArticlesPage = () => {

    useEffect(() => {
        document.title = "DanBel";
    }, [])

    return (
        <Container maxWidth="lg" sx={{py: 4}}>
            <ArticleList tagIds={[]} authorIds={[]}/>
            <YandexAdBlock blockId={FEED_BLOCK_ID} type="feed"/>
        </Container>
    );
};
