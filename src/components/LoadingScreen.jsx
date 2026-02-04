import React from "react";

function LoadingScreen () {
    return (
        <div className="text-center justify-content-center align-items-center d-flex" style={{ height: "80vh" }}>
            <i className="mdi mdi-dots-circle mdi-spin text-muted h3"></i>
        </div>
    );
};
export default LoadingScreen;
