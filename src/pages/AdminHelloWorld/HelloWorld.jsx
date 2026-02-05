import React from 'react';
import Title from '../../layouts/Title/Title';

function HelloWorld() {
    return (
        <div className="container-fluid">
            <Title 
                title="Hello World" 
                breadcrumb={['Home', 'Hello World IJANNNN']} 
            />
            
            <div className="row">
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Card 1</h5>
                            <p className="card-text">This is the first card. IJANNN</p>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Card 2</h5>
                            <p className="card-text">This is the second card.</p>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Card 3</h5>
                            <p className="card-text">This is the third card.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HelloWorld;