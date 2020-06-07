const fs = require('fs')

const { copyFile } = require('../utils/file')
const { createDir, copyDirectory } = require('../utils/directory')
const { options } = require('../utils/yargs')

const processGeneric = (path, members, pathLen = 1) => {
    const meta = '.' + path.substring(0, path.length - pathLen) + '-meta.xml'
    let dir
    dir = `${options.deploy}` + '/force-app/main/default/' + path
    createDir(dir)

    for (let member of members) {
        let file = member
        let srcpath = `${options.src}` + '/main/default/' + path + '/' + file + meta
        let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + meta

        copyFile(srcpath, destpath)
    }
}

const processGenericByFolder = (path, members, pathLen = 1) => {
    const meta = '.' + path.substring(0, path.length - pathLen) + '-meta.xml'
    let dir
    dir = `${options.deploy}` + '/force-app/main/default/' + path
    createDir(dir)

    for (let member of members) {
        let nameArr = member.split('.')
        let file = nameArr[0]

        let srcpath = `${options.src}` + '/main/default/' + path + '/' + file + meta
        let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + meta

        copyFile(srcpath, destpath)
    }
}

const processObjectItem = (type, path, members, pathLen = 1) => {
    const subdir = '/' + type
    const meta = '.' + type.substring(0, type.length - pathLen) + '-meta.xml'
    let dir
    dir = `${options.deploy}` + '/force-app/main/default/' + path
    createDir(dir)

    for (let member of members) {
        let nameArr = member.split('.')
        let folder = nameArr[0]
        let file = nameArr[1]

        dir = `${options.deploy}` + '/force-app/main/default/' + path + '/' + folder
        createDir(dir)

        let srcpath
        let destpath
        if (type == 'objects' || type == 'objectTranslations') {
            srcpath = `${options.src}` + '/main/default/' + path + '/' + folder + '/' + folder + meta
            destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + folder + '/' + folder + meta
        } else {
            dir = `${options.deploy}` + '/force-app/main/default/' + path + '/' + folder + subdir
            createDir(dir)

            srcpath = `${options.src}` + '/main/default/' + path + '/' + folder + subdir + '/' + file + meta
            destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + folder + subdir + '/' + file + meta
        }
        copyFile(srcpath, destpath)


    }
}

const processGenericWithFile = (extension, path, members) => {
    const meta = '-meta.xml'
    let dir
    dir = `${options.deploy}` + '/force-app/main/default/' + path
    createDir(dir)

    for (let member of members) {
        let file = member + '.' + extension
        let srcpath
        let destpath

        srcpath = `${options.src}` + '/main/default/' + path + '/' + file
        destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file
        copyFile(srcpath, destpath)

        srcpath = `${options.src}` + '/main/default/' + path + '/' + file + meta
        destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + meta
        copyFile(srcpath, destpath)
    }
}

const processFolder = (path, members) => {
    let dir
    dir = `${options.deploy}` + '/force-app/main/default/' + path
    createDir(dir)

    for (let member of members) {
        dir = member
        let srcpath = `${options.src}` + '/main/default/' + path + '/' + dir
        let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + dir

        if (path == 'dashboards' || path == 'documents' || path == 'email' || path == 'reports') {
            let nameArr = member.split('/')
            dir = nameArr[0]
            file = nameArr[1]

            if (file === undefined && path != 'email') {
                switch (path) {
                    case 'dashboards':
                        processDifferentMeta('dashboardFolder', path, member.split())
                        break
                    case 'documents':
                        processDifferentMeta('documentFolder', path, member.split())
                        break
                    case 'reports':
                        processDifferentMeta('reportFolder', path, member.split())
                        break
                }
                if (fs.existsSync(srcpath)) {
                    copyDirectory(srcpath, destpath)
                }
            } else if (path == 'email') {
                if (file === undefined) {
                    processDifferentMeta('emailFolder', path, member.split())
                }
                srcpath = `${options.src}` + '/main/default/' + path + '/' + dir
                destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + dir

                if (!fs.existsSync(destpath) && fs.existsSync(srcpath)) {
                    copyDirectory(srcpath, destpath)
                }
            }
        } else {
            copyDirectory(srcpath, destpath)
        }

    }
}

const processCustomLabel = (path, members) => {
    let dir
    dir = `${options.deploy}` + '/force-app/main/default/' + path
    createDir(dir)

    let file = 'CustomLabels.labels-meta.xml'

    let srcpath = `${options.src}` + '/main/default/' + path + '/' + file
    let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file

    copyFile(srcpath, destpath)
}

const processWorkflow = (path, members) => {
    const meta = '.workflow-meta.xml'
    let dir
    dir = `${options.deploy}` + '/force-app/main/default/' + path
    createDir(dir)

    for (let member of members) {
        let nameArr = member.split('.')
        let file = nameArr[0]

        let srcpath = `${options.src}` + '/main/default/' + path + '/' + file + meta
        let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + meta

        copyFile(srcpath, destpath)
    }
}

const processDifferentMeta = (metaext, path, members, split = true) => {
    const meta = '.' + metaext + '-meta.xml'
    let dir
    dir = `${options.deploy}` + '/force-app/main/default/' + path
    createDir(dir)

    for (let member of members) {
        let nameArr = member.split('.')
        let file = (split === true && metaext != 'keywords') ? nameArr[0] : member

        let srcpath = `${options.src}` + '/main/default/' + path + '/' + file + meta
        let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + meta

        copyFile(srcpath, destpath)
    }
}

const processDifferentMetaWithFile = (metaext, path, members, split = true) => {
    const meta = '.' + metaext + '-meta.xml'
    const fileext = '.' + metaext
    let dir
    dir = `${options.deploy}` + '/force-app/main/default/' + path
    createDir(dir)

    for (let member of members) {
        let nameArr = member.split('.')
        let file = (split === true) ? nameArr[0] : member

        let srcpath
        let destpath

        srcpath = `${options.src}` + '/main/default/' + path + '/' + file + meta
        destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + meta

        copyFile(srcpath, destpath)

        srcpath = `${options.src}` + '/main/default/' + path + '/' + file + fileext
        destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + fileext

        copyFile(srcpath, destpath)
    }
}

const processStaticResource = (metaext, path, members) => {
    const meta = '.' + metaext + '-meta.xml'

    let dir
    let srcpath
    let destpath
    let files = new Array()

    dir = `${options.deploy}` + '/force-app/main/default/' + path
    createDir(dir)

    srcpath = `${options.src}` + '/main/default/' + path
    fs.readdirSync(srcpath).forEach(file => {
        if (!file.endsWith(meta)) {
            let filebits = file.split('.')
            let thisfile = new Array()
            if (filebits.length > 1) {
                thisfile["ext"] = filebits[filebits.length - 1]
                filebits.length = filebits.length - 1
            }
            thisfile["name"] = filebits.join('')
            files.push(thisfile)
        }
    })

    for (let member of members) {
        let file = files.filter(f => f.name == member)[0]
        if (file.ext === undefined) {
            srcpath = `${options.src}` + '/main/default/' + path + '/' + file.name
            destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file.name
            copyFile(srcpath + meta, destpath + meta)
            copyDirectory(srcpath, destpath)
        } else {
            srcpath = `${options.src}` + '/main/default/' + path + '/' + file.name
            destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file.name
            copyFile(srcpath + meta, destpath + meta)
            copyFile(srcpath + '.' + file.ext, destpath + '.' + file.ext)
        }
    }
}

module.exports = {
    processGeneric,
    processGenericByFolder,
    processObjectItem,
    processGenericWithFile,
    processFolder,
    processCustomLabel,
    processWorkflow,
    processDifferentMeta,
    processDifferentMetaWithFile,
    processStaticResource
}