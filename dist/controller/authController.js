"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = exports.isSignedIn = exports.signOut = exports.signIn = exports.signUp = void 0;
const email_1 = require("../utils/email");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = __importDefault(require("../model/userModel"));
const catchAsync_1 = require("../utils/catchAsync");
const signInToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '90d',
    });
};
const createSendToken = (user, statusCode, res) => {
    const token = signInToken(user._id);
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() +
            Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000),
    };
    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }
    res.cookie('jwt', token, cookieOptions);
    user.password = '';
    user.confirmPassword = '';
    const response = {
        status: 'success',
        token,
        data: {
            user,
        },
    };
    res.status(statusCode).json(response);
};
exports.signUp = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const newUser = await userModel_1.default.create(req.body);
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new email_1.Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);
});
exports.signIn = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password)
        throw new Error('Please provide email and password!');
    const user = await userModel_1.default.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
        throw new Error('Wrong email or password!');
    }
    createSendToken(user, 200, res);
});
exports.signOut = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ status: 'success' });
});
const isSignedIn = async (req, res, next) => {
    const token = req.cookies?.jwt;
    if (!token)
        return next();
    try {
        const decoded = await new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    return reject(err);
                }
                if (!decoded ||
                    typeof decoded !== 'object' ||
                    !('id' in decoded)) {
                    return reject(new Error('Invalid token payload'));
                }
                resolve(decoded);
            });
        });
        const user = await userModel_1.default.findById(decoded.id);
        if (!user)
            return next();
        // if (user.changedPasswordAfter(decoded.iat)) {
        //     return next()
        // }
        req.user = user;
        res.locals.user = user;
        next();
    }
    catch (err) {
        if (err instanceof Error) {
            console.error('JWT verification error:', err.message);
        }
        next();
    }
};
exports.isSignedIn = isSignedIn;
exports.protect = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    // 1) Getting token and check of it's there
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(new Error('You are not logged in! Please log in to get access.'));
    }
    // 2) Verification token
    const decoded = await new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err)
                return reject(err);
            resolve(decoded);
        });
    });
    // 3) Check if user still exists
    const currentUser = await userModel_1.default.findById(decoded.id);
    if (!currentUser) {
        return next(new Error('The user belonging to this token does no longer exist.'));
    }
    // 4) Check if user changed password after the token was issued
    // if (currentUser.changedPasswordAfter(decoded.iat)) {
    //   return next(
    //     new AppError('User recently changed password! Please log in again.', 401)
    //   );
    // }
    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});
