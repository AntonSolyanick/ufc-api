import { Model } from 'mongoose'
import { fighterDocument } from '../model/fighterModel'

export const getAllFighters = async (Model: Model<fighterDocument>) => {
    const fighters = await Model.find()

    return fighters
}
