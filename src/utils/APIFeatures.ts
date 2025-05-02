import { Document, Query } from 'mongoose'
interface QueryString {
    page?: number | string
    limit?: number | string
    sort?: string
    fields?: string
}

export class APIFeatures<T extends Document> {
    query: Query<T[], T>
    private queryString: QueryString

    constructor(query: Query<T[], T>, queryString: QueryString) {
        this.query = query
        this.queryString = queryString
    }
    paginate() {
        const page = Number(this.queryString.page) || 1
        const limit = Number(this.queryString.limit) || 20
        const skip = (page - 1) * limit

        this.query = this.query.skip(skip).limit(limit)
        return this
    }
}
