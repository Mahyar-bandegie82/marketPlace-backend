import jwt from 'jsonwebtoken';

export function accessVerification(req, res, next) {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({message: "Token not found"});
    }

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, payload) => {
            if (err) {
                const expired = err.name === 'TokenExpiredError';
                return res.status(401).json({
                    message: expired ? "Token expired" : "Token was invalid",
                });
            }
            req.id = payload.id;
            next();
        }
    );
}