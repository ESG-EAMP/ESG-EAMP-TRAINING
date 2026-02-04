import React from 'react';
import LandingLayout from '../../layouts/LandingLayout/LandingLayout';

const ContactUs = () => {
    const contactInfo = [
        {
            icon: "bi bi-geo-alt-fill",
            title: "Office Address",
            content: "123 ESG Street, Business District, City, Country 12345",
            link: "#"
        },
        {
            icon: "bi bi-telephone-fill",
            title: "Phone Number",
            content: "+1 (555) 123-4567",
            link: "tel:+15551234567"
        },
        {
            icon: "bi bi-envelope-fill",
            title: "Email Address",
            content: "info@esgplatform.com",
            link: "mailto:info@esgplatform.com"
        },
        {
            icon: "bi bi-clock-fill",
            title: "Business Hours",
            content: "Monday - Friday: 9:00 AM - 6:00 PM",
            link: "#"
        }
    ];

    const departments = [
        {
            name: "General Inquiries",
            email: "info@esgplatform.com",
            phone: "+1 (555) 123-4567"
        },
        {
            name: "Technical Support",
            email: "support@esgplatform.com",
            phone: "+1 (555) 123-4568"
        },
        {
            name: "Sales & Partnerships",
            email: "sales@esgplatform.com",
            phone: "+1 (555) 123-4569"
        },
        {
            name: "Training & Education",
            email: "training@esgplatform.com",
            phone: "+1 (555) 123-4570"
        }
    ];

    return (
        <LandingLayout>
            <div className="page-title-section">
                <div className="container">
                    <div className="row">
                        <div className="col-12 text-center">
                            <h1 className="display-4 fw-bold">Contact Us</h1>
                            <p className="lead">Get in touch with our ESG experts. We're here to help you succeed.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mt-5">
                <div className="row g-5">
                    {/* Contact Information */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-4">
                                <h3 className="fw-bold mb-4">Get in Touch</h3>
                                <p className="text-muted mb-4">
                                    Have questions about our ESG platform? We'd love to hear from you. 
                                    Send us a message and we'll respond as soon as possible.
                                </p>
                                
                                {contactInfo.map((info, index) => (
                                    <div key={index} className="d-flex align-items-start mb-4">
                                        <div className="flex-shrink-0">
                                            <i className={`${info.icon} text-primary fs-4`}></i>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h6 className="fw-semibold mb-1">{info.title}</h6>
                                            <a 
                                                href={info.link} 
                                                className="text-muted text-decoration-none"
                                            >
                                                {info.content}
                                            </a>
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-4">
                                    <h6 className="fw-semibold mb-3">Follow Us</h6>
                                    <div className="d-flex gap-3">
                                        <a href="#" className="text-primary fs-4">
                                            <i className="bi bi-linkedin"></i>
                                        </a>
                                        <a href="#" className="text-primary fs-4">
                                            <i className="bi bi-twitter"></i>
                                        </a>
                                        <a href="#" className="text-primary fs-4">
                                            <i className="bi bi-facebook"></i>
                                        </a>
                                        <a href="#" className="text-primary fs-4">
                                            <i className="bi bi-instagram"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-4">
                                <h3 className="fw-bold mb-4">Send us a Message</h3>
                                <form>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label htmlFor="firstName" className="form-label fw-semibold">
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="firstName"
                                                placeholder="Enter your first name"
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="lastName" className="form-label fw-semibold">
                                                Last Name *
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="lastName"
                                                placeholder="Enter your last name"
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="email" className="form-label fw-semibold">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="email"
                                                placeholder="Enter your email address"
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="phone" className="form-label fw-semibold">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                id="phone"
                                                placeholder="Enter your phone number"
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label htmlFor="company" className="form-label fw-semibold">
                                                Company/Organization
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="company"
                                                placeholder="Enter your company name"
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label htmlFor="subject" className="form-label fw-semibold">
                                                Subject *
                                            </label>
                                            <select className="form-select" id="subject" required>
                                                <option value="">Select a subject</option>
                                                <option value="general">General Inquiry</option>
                                                <option value="technical">Technical Support</option>
                                                <option value="sales">Sales & Partnerships</option>
                                                <option value="training">Training & Education</option>
                                                <option value="feedback">Feedback & Suggestions</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label htmlFor="message" className="form-label fw-semibold">
                                                Message *
                                            </label>
                                            <textarea
                                                className="form-control"
                                                id="message"
                                                rows="5"
                                                placeholder="Tell us how we can help you..."
                                                required
                                            ></textarea>
                                        </div>
                                        <div className="col-12">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="newsletter"
                                                />
                                                <label className="form-check-label" htmlFor="newsletter">
                                                    Subscribe to our newsletter for ESG insights and updates
                                                </label>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <button type="submit" className="btn btn-primary">
                                                Send Message
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Department Contacts */}
                <div className="row mt-5">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-4">
                                <h3 className="fw-bold mb-4 text-center">Department Contacts</h3>
                                <div className="row g-4">
                                    {departments.map((dept, index) => (
                                        <div key={index} className="col-lg-3 col-md-6">
                                            <div className="text-center p-3">
                                                <h6 className="fw-semibold mb-2">{dept.name}</h6>
                                                <p className="text-muted mb-1">
                                                    <a href={`mailto:${dept.email}`} className="text-decoration-none">
                                                        {dept.email}
                                                    </a>
                                                </p>
                                                <p className="text-muted ">
                                                    <a href={`tel:${dept.phone}`} className="text-decoration-none">
                                                        {dept.phone}
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map Section */}
                <div className="row mt-5">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-0">
                                <div className="ratio ratio-21x9">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290355!2d-74.00369368400567!3d40.71312937933185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a23e28c1191%3A0x49f75d3281df052a!2s150%20Park%20Row%2C%20New%20York%2C%20NY%2010007%2C%20USA!5e0!3m2!1sen!2s!4v1640995200000!5m2!1sen!2s"
                                        style={{ border: 0 }}
                                        allowFullScreen=""
                                        loading="lazy"
                                        title="Office Location"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LandingLayout>
    );
};

export default ContactUs; 