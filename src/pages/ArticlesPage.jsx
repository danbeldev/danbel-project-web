import React, {useEffect} from 'react';
import {
    Container,
} from '@mui/material';
import ArticleList from "../components/ArticleList";
import YandexBannerAd from "../components/YandexBannerAd";

export const ArticlesPage = () => {

    useEffect(() => {
        document.title = "DanBel";
    }, [])

    return (
        <Container maxWidth="lg" sx={{py: 4}}>
            <YandexBannerAd/>

            <div style={{height:'10px'}}/>

            <ArticleList tagIds={[]} authorIds={[]}/>
        </Container>
    );
};
