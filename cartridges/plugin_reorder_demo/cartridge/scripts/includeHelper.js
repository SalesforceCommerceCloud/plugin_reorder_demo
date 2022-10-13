'use strict';

/**
 * This script is a helper class for use with isinclude.
 */

/**
 * Resolve the path to include for a conditional template.
 * @param {boolean} condition - true if the cartridge template should be included or false if the base template should be included
 * @param {string} template - relative path of template to be included
 * @returns {string} path to template that should be included
 */
exports.conditional = function (condition, template) {
    if (condition) {
        return '_commercepayments/' + template;
    }

    return '_base/' + template;
};
