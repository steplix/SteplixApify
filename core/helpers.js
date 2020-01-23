'use strict';

const _ = require('lodash');
const debug = require('debug')('steplix:apify');
const minimatch = require('minimatch');

/**
 * Resolve matcher
 *
 * @private
 * @param {function|regexp|number|string} matcher - Matcher
 * @param {mixed} value - value to match
 */
function resolveMatcher (matcher, value) {
    if (_.isFunction(matcher)) {
        return matcher(value);
    }
    else if (_.isRegExp(matcher)) {
        return matcher.test(value);
    }
    else if (_.isString(matcher)) {
        return minimatch(value, matcher);
    }
    return value === matcher;
}

/**
 * Filter matches
 *
 * @private
 * @param {function|regexp|number|string} matcher - Matcher
 * @param {mixed} value - value to match
 */
function filterMatches (matches, filter) {
    if (!filter) {
        return matches;
    }

    return _.filter(matches, match => {
        let include = true;

        if (filter.includes && filter.includes.length) {
            include &= !!_.find(filter.includes, matcher => resolveMatcher(matcher, match));
        }
        if (filter.excludes && filter.excludes.length) {
            include &= !!_.find(filter.excludes, matcher => !resolveMatcher(matcher, match));
        }
        return include;
    });
}

module.exports = {
    resolveMatcher,
    filterMatches,
    debug
};
