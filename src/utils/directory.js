const fs = require('fs');

const { options } = require('./yargs')

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

const resetDeployDir = () => {
    let deleteFolderRecursive = (path) => {
        try {
            if (fs.existsSync(path)) {
                fs.readdirSync(path).forEach((file, index) => {
                    let curPath = path + "/" + file;
                    if (fs.lstatSync(curPath).isDirectory()) { // recurse
                        deleteFolderRecursive(curPath);
                    } else { // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);
            }
        }
        catch (err) {
            console.error(err);
            process.exit(1);
        }
    };

    let dir;
    dir = `${options.deploy}`;
    createDir(dir);

    dir = `${options.deploy}` + '/force-app';
    deleteFolderRecursive(dir);
    createDir(dir);

    dir = `${options.deploy}` + '/force-app/main';
    createDir(dir);

    dir = `${options.deploy}` + '/force-app/main/default';
    createDir(dir);
}

module.exports = {
    createDir,
    copyDirectory,
    resetDeployDir
}