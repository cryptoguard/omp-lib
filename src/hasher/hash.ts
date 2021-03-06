import { sha256 } from 'js-sha256';
import { isString, isObject, isArray, isNumber } from '../format-validators/util';
import { MPA_EXT_LISTING_ADD } from '../interfaces/omp'
import { ContentReference, ProtocolDSN } from '../interfaces/dsn'

export function hash(v: any): string {
    if(typeof v === 'undefined') {
        throw new Error('hash(): value is undefined');
    }

    if(isObject(v)){
        return hashObject(v);
    } else {
        return sha256(v);
    }

}

function hashObject(unordered: object): string {
    const sorted = deepSortObject(unordered);

    let keyHashes = sha256.update('OpenMarketProtocol');
    deep(sorted, (toHash) => {
        keyHashes.update(toHash);
    });

    return sha256(keyHashes.array().join());
}

export function hashListing(l: MPA_EXT_LISTING_ADD) {

    // remove the local image data from the hashing
    // the ContentReference hash already provides us
    // with authentication for the data
    if(l.action.item.information.images) {
        l.action.item.information.images.forEach((img: ContentReference) => {
            img.data.forEach((dsn) => {
                if(dsn.protocol === ProtocolDSN.LOCAL) {
                    delete dsn.data;
                }
            });
        })
    } 

     //console.log(JSON.stringify(l, null, 4));
    
    return hash(l);

}


export function deepSortObject(unordered: any): any {
    // order the keys alphabetically!
    let result = {};
    let ordered = undefined;
    if(isArray(unordered)) {
        ordered = unordered.sort();
    } else if(isObject(unordered)) {
        ordered = Object.keys(unordered).sort();
    } else {
        return unordered;
    }

    ordered.forEach(function(key) {
        // if value is object, recursively sort it
        if(isArray(unordered[key])) {
            result[key] = [];
            unordered[key].forEach((elem) => {
                result[key].push(deepSortObject(elem));
            })

            result[key] = result[key].sort(deepCompare);
        }
        else if(isObject(unordered[key])) {
            result[key] = deepSortObject(unordered[key])
        } else {
            result[key] = unordered[key];
        }
    });

    return result;
}


function deep(sorted: any, callback: Function, parentKey?: string) {

    parentKey = parentKey ? (parentKey + ":") : "";
    if(isArray(sorted)) {
        sorted.forEach(elem => {
            deep(elem, callback, parentKey);
        });
    } else if(isObject(sorted)) {
        Object.keys(sorted).forEach((key) => {
            const childKey =  parentKey + key;
            deep(sorted[key], callback, childKey);
        });
    } else {
        const toHash = parentKey + sorted;
        callback(toHash)
    }
}

/**
 * Compares a string, number, and objects.
 * If it's an object, grab the first key.
 * Make sure to use _sorted_ objects for deterministic
 * behavior.
 * @param a object, string, number
 * @param b object, string, number
 */
function deepCompare (a, b) {

    if(isObject(a)) {
        a = Object.keys(a)[0];
    }

    if(isObject(b)) {
        b = Object.keys(b)[0];
    }

    if(a > b) {
        return 1
    }

    if (b > a) {
        return -1
    }

    return 0;
}