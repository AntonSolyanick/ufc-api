import mongoose from 'mongoose'

export interface eventDocument extends mongoose.Document {
    firstFighter: string
    secondFighter: string
    fightDate: string
}

const eventSchema = new mongoose.Schema({
    firstFighter: {
        type: String,
        trim: true,
    },
    secondFighter: {
        type: String,
        trim: true,
    },
    fightDate: {
        type: String,
        trim: true,
    },
})

const Event = mongoose.model<eventDocument>('Event', eventSchema)

export default Event
