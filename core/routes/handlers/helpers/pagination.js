'use strict';

module.exports = (query, defaultPageSize = 0) => {
    if (!query) {
        return {};
    }

    const pageSize = Number(query.page_size || query.pageSize || defaultPageSize);
    const page = Number(query.page || 1) - 1;

    if (!pageSize) {
        return {};
    }

    return {
        limit: pageSize,
        offset: page * pageSize
    };
};
