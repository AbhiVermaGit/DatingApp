export interface Pagination {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
}

export class PaginatedResult<T> {   //T is for any type of result
    result: T;
    pagination: Pagination;
}