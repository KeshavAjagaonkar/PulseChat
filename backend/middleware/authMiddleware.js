import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const protect = async (req, res, next) => {
    let token;
    token = req.cookies.jwt;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRETE)
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (err) {
            console.error(err);
            res.status(401).json({ message: 'Not authorized, token failed' });
       }
    } else {
        res.status(401).json({ message: "Not authorized , no token" });
    }

}

export { protect };