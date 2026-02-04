import React from 'react';
import Title from '../../layouts/Title/Title';
import AdminQuestionSectionV2 from './AdminQuestionSectionV2';

function AdminAssessmentV2() {
    return (
        <div className="container-fluid">
            <Title title="Admin Assessment v2" breadcrumb={[["Admin Dashboard", "/dashboard"], "Admin Assessment v2"]} />
            <AdminQuestionSectionV2 />
        </div>
    );
}

export default AdminAssessmentV2;
