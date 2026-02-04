import React from 'react';
import Title from '../../layouts/Title/Title';
import { Link } from 'react-router-dom';
import './UserSupport.css';
function UserSupport() {
    return (
        <div className="container-fluid">
            <Title title="Support" breadcrumb={[["Support", "/support"], "Support"]} />
            <div className="row">
                <div className="col-md-3">
                    <div className="">
                        <div className="card-body text-center">
                            <i className="fa-solid fa-circle-question badge-icon mb-3 text-secondary"></i>
                            <h5 className="card-title">FAQ</h5>
                            <p className="card-text">
                                Find quick answers to common questions in our comprehensive Frequently Asked Questions section.
                            </p>
                            <Link to="/support/faq" className="btn btn-outline-secondary btn-sm mt-3">
                                Browse FAQs
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 d-none">
                    <div className="">
                        <div className="card-body text-center">
                            <i className="fa-solid fa-robot badge-icon mb-3 text-primary"></i>
                            <h5 className="card-title text-primary">ChatBot</h5>
                            <p className="card-text">
                                Get Instant Help 24/7 from our AI-Powered Assistant. It can guide you through most common issues.
                            </p>
                            <span onClick={() => {
                                document.getElementById('chatbox-button').click();
                            }} className="btn btn-primary btn-sm">
                                Start Chat
                            </span>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="">
                        <div className="card-body text-center">
                            <i className="fa-solid fa-pen-to-square badge-icon mb-3 text-success"></i>
                            <h5 className="card-title text-success">Feedback</h5>
                            <p className="card-text">
                                Share your feedback or queries through our form. Your message will be sent directly to our support team via email.
                            </p>
                            <Link to="/support/feedback" className="btn btn-success btn-sm mt-3">
                                Give Feedback
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
export default UserSupport;