import express, { Router } from 'express'
import * as authController from '../controller/authController'
import * as userController from '../controller/userController'

const userRouter: Router = express.Router()

userRouter.route('/signup').post(authController.signUp)
userRouter.route('/signin').post(authController.signIn)
userRouter.route('/signout').get(authController.signOut)

userRouter.use(authController.protect)

userRouter.get('/me', userController.getMe, userController.getUser)

export default userRouter
