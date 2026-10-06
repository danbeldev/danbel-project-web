import React, {useEffect, useState} from 'react';
import {Container, Breadcrumbs, Typography, Link as MuiLink, Paper} from '@mui/material';
import {Link, useParams} from 'react-router-dom';
import ApiService from '../network/API';
import CriteriaEditor from '../components/CriteriaEditor';
import CriteriaStudentView from '../components/CriteriaStudentView';

// Критерии оценки задачи: редактор для преподавателя, рубрика с результатом для студента.
const CriteriaPage = () => {
    const {problemId} = useParams();
    const isAdmin = ApiService.isAdmin();
    const [title, setTitle] = useState(null);
    const [type, setType] = useState(null);

    useEffect(() => {
        ApiService.getProblem(problemId).then((p) => { setTitle(p.title); setType(p.type); }).catch(() => {});
    }, [problemId]);

    return (
        <Container maxWidth="md" sx={{py: 4}}>
            <Breadcrumbs sx={{mb: 2}}>
                <MuiLink component={Link} to={`/problems/${problemId}`} underline="hover" color="inherit">
                    {title || 'Задача'}
                </MuiLink>
                <Typography color="text.primary">Критерии оценки</Typography>
            </Breadcrumbs>
            <Paper variant="outlined" sx={{borderRadius: 3, overflow: 'clip'}}>
                {isAdmin ? <CriteriaEditor problemId={problemId} problemType={type}/> : <CriteriaStudentView problemId={problemId}/>}
            </Paper>
        </Container>
    );
};

export default CriteriaPage;
