import React from 'react';
import Title from '../../layouts/Title/Title';
import QuestionSection from './QuestionSection';
function UserAssessment() {
    return (
        <div className="container-fluid">
            <Title title="User Assessment" breadcrumb={[["User Assessment", "/user-assessment"], "User Assessment"]} />
            <QuestionSection />
        </div>
    );
}

export default UserAssessment;