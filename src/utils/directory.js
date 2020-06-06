const fs = require('fs');

const Directories = [];

const createDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

const copyDirectory = (srcpath, destpath) => {
    return new Promise((resolve, reject) => {
        const ncp = require('ncp').ncp;

        if (!Directories.includes(srcpath)) {
            Directories.push(srcpath);
            ncp.limit = 16;

            ncp(srcpath, destpath, (err) => {
                if (err) {
                    throw new Error("Failed to copy " + srcpath, err);
                    //exitApp("Failed to copy " + srcpath);
                }
            });
        }
    }).then((state) => {
        //console.log('done', state)
    })
        .catch((error) => {
            throw new Error("Failed to copy " + srcpath, err);
        });
}

module.exports = {
    createDir,
    copyDirectory
}