import React, { useEffect } from "react";
import { Link } from "react-router-dom";

function Title({ title, breadcrumb }) {
    useEffect(() => {
        document.title = 'PLATFORM PKSLestari  | ' + title;
    }, [title]);

    return (
        <div className="row">
            <div className="col-12">
                <div className="page-title-box">
                    <div className="page-title-right">
                        <ol className="breadcrumb m-0 d-none">
                            {breadcrumb.map((crumb, index) => {
                                const isLast = index === breadcrumb.length - 1;
                                const name = Array.isArray(crumb) ? crumb[0] : crumb;
                                const url = Array.isArray(crumb) ? crumb[1] : "#";
                                return (
                                    <li
                                        key={index}
                                        className={`breadcrumb-item ${isLast ? "text-muted" : ""}`}
                                    >
                                        {isLast ? (
                                            <span>{name}</span>
                                        ) : (
                                            <Link to={url}>{name}</Link>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                    <h4 className="page-title">{title}</h4>
                </div>
            </div>
        </div>
    );
}

export default Title;

// Usage example
 