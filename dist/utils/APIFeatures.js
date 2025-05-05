"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIFeatures = void 0;
class APIFeatures {
    query;
    queryString;
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }
    paginate() {
        const page = Number(this.queryString.page) || 1;
        const limit = Number(this.queryString.limit) || 20;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}
exports.APIFeatures = APIFeatures;
