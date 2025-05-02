import express from 'express'

import * as fighterController from '../controller/fighterController'

const fighterRouter = express.Router()

fighterRouter.route('/all-fighters').get(fighterController.getAllFighters)

export default fighterRouter
