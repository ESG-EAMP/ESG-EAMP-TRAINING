import React from 'react';
import Title from '../../layouts/Title/Title';
import QuestionSectionV2 from './QuestionSectionV2';

function UserAssessmentV2() {
    return (
        <div className="container-fluid">
            <Title title="User Assessment" breadcrumb={[["User Assessment", "/assessment-v2"], "User Assessment v2"]} />
            <QuestionSectionV2 />
        </div>
    );
}

export default UserAssessmentV2;


