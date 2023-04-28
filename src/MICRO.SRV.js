// @ts-check
/* eslint-disable no-console */
const fs = require('fs');

const url = require('url');
const http = require('http');

const port = 13621;
// create a simple server that listens on port 3000:
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const query = url.parse(req.url || ``, true).query;
    function err(why) {
        res.end(JSON.stringify({ err: why }));
    }
    const nonEx = query.listNonExistent;
    if (typeof nonEx === 'string') {
        const arr = nonEx.split(`,`);
        const obj = { err: false, non: [], files: [], dirs: {}, risky: [], failed: [] };
        arr.forEach(x => {
            let exists = false;
            try {
                exists = fs.existsSync(x);
            } catch (err) {
                obj.failed.push(x);
            }
            if (!exists)
                try {
                    exists = fs.existsSync(x + `.hbs`)
                    if (exists)
                        x += `.hbs`;
                } catch (err) {
                    obj.failed.push(x);
                }

            if (exists && !securePath(x, () => { }))
                obj.risky.push(x);
            else
                try {
                    if (!exists)
                        obj.non.push(x);
                    else if (fs.lstatSync(x).isDirectory())
                        obj.dirs = { ...obj.dirs, [x]: listFilesInFolder(x).list };
                    else
                        obj.files.push(x);
                } catch (err) {
                    obj.failed.push(x);
                }
        });
        res.end(JSON.stringify(obj));
    } else if (query.fingerprintAg) {
        const path = query.fingerprintAg;
        if (!securePath(path)) return;
        const obj = readEntireDir(path);
        res.end(hashStrArr(obj));
        // res.end(JSON.stringify(obj, null, 2));

    } else if (query.path) {
        const path = query.path;
        if (!securePath(path)) return;
        // get the list of files in the path:
        const obj = listFilesInFolder(path);
        obj.list = obj.list.filter(x => isAllowedType(x));
        // send the list of files as a response:
        res.end(JSON.stringify(obj));
    } else {
        // send an error response:
        res.end(JSON.stringify({ err: `no action item, sorry` }));
        // res.end(JSON.stringify({ myReq: JSON.stringify(req) }));
    }
    function securePath(path, err_) {
        if (!err_) err_ = err;
        path = path.replace(/\\/g, `/`);
        path = path.replace(/\/\//g, `/`);
        if (!path.startsWith(`./`)) {
            err_(`path must start with "./"`);
            return false;
        }
        if (path.includes(`/../`)) {
            err_(`path must not include ".."`);
            return false;
        }
        if (!path.includes(`.ag/`)) {
            err_(`path must include ".ag/" folder, but it is \`${path}\``);
            return false;
        }
        return path;
    }
});

server.listen(port);
console.log(`MICRO SRV is listening on port ${port}`);


//--------------------------------------------------
//--------------------------------------------------
//--------------------------------------------------
//--------------------------------------------------
//--------------------------------------------------
//--------------------------------------------------
//--------------------------------------------------
/**
 * @param {string} x
 */
function isAllowedType(x) {
    return x.endsWith('.hbs') || x.endsWith('.ts');
}

/**
 * @param {string} key
 * @param {number} size
 */
function lewHash32(key, size) {
    const hash = Array(size).fill(1981), limitToBits = (x, bits) => x & (2 ** bits - 1), pass = (acc, val) => {
        acc += val;
        acc += acc << 10;
        acc ^= acc >> 6;
        return acc;
    };
    let i = key.length;
    while (i--) {
        const b = i % size;
        hash[b] = pass(hash[b], key.charCodeAt(i));
    }
    for (let u = size - 1; u >= 0; --u)
        for (i = 1; i < size; ++i) {
            hash[i] = pass(hash[i], hash[u]);
            hash[u] = pass(hash[u], hash[i]);
        }
    if (hash.length == 1)
        return [limitToBits(hash[0], 32)];
    return hash.map((x, i) => limitToBits(x, 32));
}


/**
 * @param {any} x
 */
function isStr(x) {
    return typeof x === 'string' || x instanceof String;
}

/**
 * @param {fs.PathLike} path
 */
function readEntireDir(path) {
    const paths = readEntireDirPaths(path).filter(isAllowedType);
    const contents = paths.map(fn => {
        return `file:${fn}, cont: ${fs.readFileSync(fn, 'utf8')}`;
    });
    return contents;
}
function hashStrArr(arr) {
    return lewHash32(arr.join(``), 8).map(x => x.toString(36)).join(``);
}

/**
 * @param {fs.PathLike} path
 */
function readEntireDirPaths(path) {
    const walk = (/** @type {fs.PathLike} */ dir) => {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach((file) => {
            file = dir + '/' + file;
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                /* Recurse into a subdirectory */
                results = results.concat(walk(file));
            } else {
                /* Is a file */
                results.push(file);
            }
        });
        return results;
    };
    return walk(path);
}

/**
 * @param {fs.PathLike} path
 */
function listFilesInFolder(path) {
    try {
        const files = fs.readdirSync(path);
        return { err: false, list: files }
    } catch (err) {
        return { err: `Reading error: ${err.message || JSON.stringify(err)}`, list: [] };
    }
}


