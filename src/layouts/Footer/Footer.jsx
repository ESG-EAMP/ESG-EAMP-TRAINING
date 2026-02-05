import React from "react";
import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="footer">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-6">
                        2026 © SME CORP
                    </div>
                    <div className="col-md-6 d-none">
                        <div className="text-md-end footer-links d-none d-md-block">
                            <Link to="/">Manchester United</Link>
                            <Link to="/">Support</Link>
                            <Link to="/">Contact Us</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer; 