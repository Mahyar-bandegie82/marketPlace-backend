import createError from "http-errors";

export function notFound(err, req, res, next) {
     next(createError(404, 'route not found'))
}

export function handlleError (err, req, res, next) {
    let status = err.status || err.statusCode || 500;
    let message = err.message;


    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
        status = 401;
        message = "invalid or expired token";
    } else if (err.code === "P2002") {
        status = 409;
        message = "a user with this phone number or email already exists";
    } else if (err.code === "P2025") {
        status = 404;
        message = "record not found";
    }

    if (status >= 500) {
        console.error(err);
        message = "internal server error";      // don't leak internals
    }

    return res.status(status).json({error: message});
}