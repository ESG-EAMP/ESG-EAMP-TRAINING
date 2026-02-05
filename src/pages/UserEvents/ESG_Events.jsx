import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import LandingEvents from '../Landing/Event/Events';

const ESG_Events = () => {
   

    return (
        <div className="container-fluid">
            <Title
                title="Calendar"
                breadcrumb={[["Events", "/user/events"], "Events"]}
            />
          <LandingEvents landing={false}/>
        </div>
    );
};

export default ESG_Events;
