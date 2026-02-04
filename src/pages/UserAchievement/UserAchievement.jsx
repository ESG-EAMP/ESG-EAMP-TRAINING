import React, { useState, useEffect } from 'react';
import Title from '../../layouts/Title/Title';
import './UserAchievement.css';
import api from '../../utils/api';

function UserAchievement() {
    const [achievements, setAchievements] = useState({
        total_achievements: 0,
        achievements_by_type: {},
        recent_achievements: [],
        in_progress: [],
        current_year: new Date().getFullYear(),
        year_progress: {}
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUserAchievements();
    }, []);

    const fetchUserAchievements = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get('/achievements/user/my-achievements');
            const data = response.data;
            console.log('Achievement data received:', data);
            setAchievements(data);
        } catch (error) {
            console.error('Error fetching achievements:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="ESG Achievements" breadcrumb={[['ESG Achievement', '/achievements'], 'ESG Achievement']} />
                <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading your achievements...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid">
                <Title title="ESG Achievements" breadcrumb={[['ESG Achievement', '/achievements'], 'ESG Achievement']} />
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Error!</h4>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={fetchUserAchievements}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Title title="ESG Achievements" breadcrumb={[['ESG Achievement', '/achievements'], 'ESG Achievement']} />

            {/* ESG Score Section (distinct background) */}
            {achievements.year_progress && Object.keys(achievements.year_progress).length > 0 && (
                <section className="mt-4">
                    <div className="ua-section-header">
                        <h5 className="ua-title mb-2">YOUR ESG SCORES</h5>
                        <p className="ua-subtitle">Results from your latest assessment</p>
                    </div>
                    <div className="row g-3">
                        <div className="col-12 col-sm-6 col-xl-3">
                            <div className="ua-score-card ua-score-env card h-100 rounded-4 shadow">
                                <div className="text-center p-3">
                                    <i className="badge-icon fa-solid fa-leaf text-success"></i>
                                </div>
                                <div className="card-body text-center">
                                    <div className="ua-score-value">{achievements.year_progress.environmental_score || 0}%</div>
                                    <div className="ua-score-label">Environmental</div>
                                    <div className="progress mt-3">
                                        <div 
                                            className="progress-bar bg-success" 
                                            role="progressbar" 
                                            style={{width: `${achievements.year_progress.environmental_score || 0}%`}}
                                            aria-valuenow={achievements.year_progress.environmental_score || 0} 
                                            aria-valuemin="0" 
                                            aria-valuemax="100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-xl-3">
                            <div className="ua-score-card ua-score-soc card h-100 rounded-4 shadow">
                                <div className="text-center p-3">
                                    <i className="badge-icon fa-solid fa-heart text-info"></i>
                                </div>
                                <div className="card-body text-center">
                                    <div className="ua-score-value">{achievements.year_progress.social_score || 0}%</div>
                                    <div className="ua-score-label">Social</div>
                                    <div className="progress mt-3">
                                        <div 
                                            className="progress-bar bg-info" 
                                            role="progressbar" 
                                            style={{width: `${achievements.year_progress.social_score || 0}%`}}
                                            aria-valuenow={achievements.year_progress.social_score || 0} 
                                            aria-valuemin="0" 
                                            aria-valuemax="100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-xl-3">
                            <div className="ua-score-card ua-score-gov card h-100 rounded-4 shadow">
                                <div className="text-center p-3">
                                    <i className="badge-icon fa-solid fa-shield-alt text-warning"></i>
                                </div>
                                <div className="card-body text-center">
                                    <div className="ua-score-value">{achievements.year_progress.governance_score || 0}%</div>
                                    <div className="ua-score-label">Governance</div>
                                    <div className="progress mt-3">
                                        <div 
                                            className="progress-bar bg-warning" 
                                            role="progressbar" 
                                            style={{width: `${achievements.year_progress.governance_score || 0}%`}}
                                            aria-valuenow={achievements.year_progress.governance_score || 0} 
                                            aria-valuemin="0" 
                                            aria-valuemax="100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6 col-xl-3">
                            <div className="ua-score-card ua-score-overall card h-100 rounded-4 shadow">
                                <div className="text-center p-3">
                                    <i className="badge-icon fa-solid fa-chart-line text-primary"></i>
                                </div>
                                <div className="card-body text-center">
                                    <div className="ua-score-value">{achievements.year_progress.overall_score || 0}%</div>
                                    <div className="ua-score-label">Overall</div>
                                    <div className="progress mt-3">
                                        <div 
                                            className="progress-bar bg-primary" 
                                            role="progressbar" 
                                            style={{width: `${achievements.year_progress.overall_score || 0}%`}}
                                            aria-valuenow={achievements.year_progress.overall_score || 0} 
                                            aria-valuemin="0" 
                                            aria-valuemax="100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}


            {/* Achievements Section (white base) */}
            <section className="ua-section ua-badges mt-4">
                <div className="ua-section-header">
                    <h5 className="ua-title mb-2">YOUR BADGES</h5>
                    <p className="ua-subtitle">Badges you have earned</p>
                </div>
                <div className="row g-3">
                    {achievements.recent_achievements && achievements.recent_achievements.length > 0 ? (
                        achievements.recent_achievements.map((achievement, index) => (
                            <div key={achievement.id || achievement._id || `achievement-${index}`} className="col-12 col-sm-6 col-lg-4 col-xxl-3">
                                <div className="ua-badge-card card h-100 rounded-4 shadow">
                                    <div className="text-center p-3">
                                        <i className={`badge-icon fa-solid ${achievement.icon_class || 'fa-trophy'}`}></i>
                                    </div>
                                    <div className="card-body text-center">
                                        <h6 className="card-title mb-1">{achievement.name}</h6>
                                        <p className="card-text mb-2">{achievement.description}</p>
                                        <span className="badge bg-light text-dark border ua-earned-pill">Earned: {new Date(achievement.earned_date || Date.now()).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12">
                            <div className="alert alert-info" role="alert">
                                <i className="fa-solid fa-info-circle me-1"></i>
                                No achievements earned yet. Complete your ESG assessment to start earning badges!
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* In Progress Section */}
            <section className="ua-section ua-progress">
                <div className="ua-section-header">
                    <h5 className="ua-title mb-2">IN PROGRESS</h5>
                    <p className="ua-subtitle">Achievements you are working on</p>
                </div>
                <div className="row g-3">
                    {achievements.in_progress && achievements.in_progress.length > 0 ? (
                        achievements.in_progress.map((achievement, index) => (
                            <div key={achievement.id || achievement._id || `progress-${index}`} className="col-12 col-sm-6 col-lg-4 col-xxl-3">
                                <div className="ua-badge-card card h-100 rounded-4 shadow">
                                    <div className="text-center p-3">
                                        <i className={`badge-icon fa-solid ${achievement.icon_class || 'fa-clock'}`}></i>
                                    </div>
                                    <div className="card-body text-center">
                                        <h6 className="card-title mb-1">{achievement.name}</h6>
                                        <p className="card-text mb-2">{achievement.description}</p>
                                        <div className="progress mt-2">
                                            <div 
                                                className="progress-bar bg-warning" 
                                                role="progressbar" 
                                                style={{width: `${achievement.progress_percentage || 0}%`}}
                                                aria-valuenow={achievement.progress_percentage || 0} 
                                                aria-valuemin="0" 
                                                aria-valuemax="100"
                                            >
                                                {achievement.progress_percentage || 0}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12">
                            <div className="alert alert-secondary " role="alert">
                                <i className="fa-solid fa-clock me-1"></i>
                                No achievements in progress at the moment.
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default UserAchievement;