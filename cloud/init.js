const Parse = require('parse/node');
const fs = require('fs');
const request = require('request');

const INSTALL_PATH = 'cloud/install';

var ServerURL = '';
var appID = '';
var masterKey = '';

class Permission { 
    constructor() {
        this.find = {
            default: false,
            admin: true,
            all: false
        };
        this.get = {
            default: false,
            admin: true,
            all: false
        };
        this.create = {
            default: false,
            admin: true,
            all: false
        };
        this.update = {
            default: false,
            admin: true,
            all: false
        };
        this.delete = {
            default: false,
            admin: true,
            all: false
        };
    }
    toJson() {
        let j = {
            classLevelPermissions: {
                find: {
                    "role:default": this.find.default,
                    "role:admin": this.find.admin,
                    "*": this.find.all
                },
                get: {
                    "role:default": this.get.default,
                    "role:admin": this.get.admin,
                    "*": this.get.all
                },
                create: {
                    "role:default": this.create.default,
                    "role:admin": this.create.admin,
                    "*": this.create.all
                },
                update: {
                    "role:default": this.update.default,
                    "role:admin": this.update.admin,
                    "*": this.update.all
                },
                delete: {
                    "role:default": this.delete.default,
                    "role:admin": this.delete.admin,
                    "*": this.delete.all
                }
            }
        };
        for(let k in j.classLevelPermissions){
            for(let k2 in j.classLevelPermissions[k]){
                if(!j.classLevelPermissions[k][k2]){
                    delete j.classLevelPermissions[k][k2];
                }
            }
        }
        return j;
    }
}

async function setClassLevelPermissions(className, permissions) {
    console.log('set' + className + 'CLP');
    try {
        let res = await new Promise((reso, rej) => {
            Parse.Cloud.httpRequest({
                url: ServerURL + '/schemas/' + className,
                headers: {
                    'X-Parse-Application-Id': appID,
                    'X-Parse-Master-Key': masterKey,
                    'Content-Type': 'application/json'
                },
                body: permissions.toJson(),
                method: 'put'
            }).then(res => {
                if (res.status == 200) {
                    reso();
                } else {
                    rej();
                }
            }, () => {
                rej();
            })
        });
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

async function defindSchema() {
    console.log('create schemas');
    // Image
    let permissions = new Permission();
    permissions.find.default = true;
    permissions.get.default = true;
    permissions.create.default = false;
    permissions.create.admin = true;
    permissions.update.default = false;
    permissions.update.admin = true;
    permissions.delete.default = false;
    permissions.delete.admin = true;
    if (!await setClassLevelPermissions('Image', permissions)) {
        return false;
    }
    // BBox
    permissions = new Permission();
    permissions.find.default = true;
    permissions.get.default = true;
    permissions.create.default = true;
    permissions.update.default = true;
    permissions.delete.default = true;
    if (!await setClassLevelPermissions('BBox', permissions)) {
        return false;
    }
    // Mark
    permissions = new Permission();
    permissions.find.default = true;
    permissions.get.default = true;
    permissions.create.default = false;
    permissions.create.admin = true;
    permissions.update.default = true;
    permissions.update.admin = true;
    permissions.delete.default = false;
    permissions.delete.admin = true;
    if (!await setClassLevelPermissions('Mark', permissions)) {
        return false;
    }
    // Job
    permissions = new Permission();
    permissions.find.default = true;
    permissions.get.default = true;
    permissions.create.default = false;
    permissions.create.admin = true;
    permissions.update.default = true;
    permissions.update.admin = true;
    permissions.delete.default = false;
    permissions.delete.admin = true;
    if (!await setClassLevelPermissions('Job', permissions)) {
        return false;
    }
    // Project
    permissions = new Permission();
    permissions.find.default = true;
    permissions.get.default = true;
    permissions.create.default = false;
    permissions.create.admin = true;
    permissions.update.default = false;
    permissions.update.admin = true;
    permissions.delete.default = false;
    permissions.delete.admin = true;
    if (!await setClassLevelPermissions('Project', permissions)) {
        return false;
    }
    // _User
    permissions = new Permission();
    permissions.find.default = true;
    permissions.get.default = true;
    permissions.create.default = true;
    permissions.create.all = true;
    permissions.update.default = true;
    permissions.delete.default = false;
    permissions.delete.admin = true;
    if (!await setClassLevelPermissions('_User', permissions)) {
        return false;
    }
    // _Role
    permissions = new Permission();
    permissions.find.default = true;
    permissions.get.default = true;
    permissions.create.default = false;
    permissions.create.admin = true;
    permissions.update.default = false;
    permissions.update.admin = true;
    permissions.delete.default = false;
    permissions.delete.admin = true;
    if (!await setClassLevelPermissions('_Role', permissions)) {
        return false;
    }
    return true;
}

async function defineClass() {
    console.log('create classes');
    var allSchemas = await Parse.Schema.all({
        useMasterKey: masterKey
    });
    allSchemas = allSchemas.map(ele => {
        return ele.className
    });
    // allSchemas.forEach(async sc => {
    //     if(sc.className == 'Image' || sc.className == 'BBox' || sc.className == 'Mark' || sc.className == 'Project' || sc.className == 'Job') {
    //         await sc.delete({
    //             useMasterKey: masterKey
    //         });
    //     }
    // });
    // Image class
    let imageSchema = new Parse.Schema('Image');
    if(allSchemas.indexOf('Image')){
        await imageSchema.delete();
    }
    imageSchema.addString('url')
        .addNumber('marks')
        .addNumber('width')
        .addNumber('height')
        .addPointer('project', 'Project')
        .addPointer('user', '_User');
    await imageSchema.save();
    // BBox class
    let bboxSchema = new Parse.Schema('BBox');
    if(allSchemas.indexOf('BBox')){
        await bboxSchema.delete();
    }
    bboxSchema.addPointer('user', '_User')
        .addPointer('mark', 'Mark')
        .addNumber('x')
        .addNumber('y')
        .addNumber('w')
        .addNumber('h')
        .addNumber('t')
        .addNumber('label');
    await bboxSchema.save();
    // Mark class
    let markSchema = new Parse.Schema('Mark');
    if(allSchemas.indexOf('Mark')){
        await markSchema.delete();
    }
    markSchema.addPointer('image', 'Image')
        .addBoolean('hide')
        .addRelation('bboxes', 'BBox');
    await markSchema.save();
    // Job class
    let jobSchema = new Parse.Schema('Job');
    if(allSchemas.indexOf('Job')){
        await jobSchema.delete();
    }
    jobSchema.addPointer('project', 'Project')
        .addPointer('user', '_User')
        .addString('name')
        .addBoolean('current')
        .addBoolean('active')
        .addNumber('commit')
        .addNumber('rollback')
        .addRelation('next', 'Job')
        .addRelation('pre', 'Job')
        .addArray('logs')
        .addNumber('posX')
        .addNumber('posY')
        .addNumber('current')
        .addNumber('filter')
        .addRelation('marks', 'Mark');
    await jobSchema.save();
    // Project class
    let projectSchema = new Parse.Schema('Project');
    if(allSchemas.indexOf('Project')){
        await projectSchema.delete();
    }
    projectSchema.addString('name')
        .addString('description')
        .addArray('types')
        .addRelation('jobs', 'Job');
    await projectSchema.save();
}

async function defineAdminUser() {
    console.log('create admin user');
    var query = new Parse.Query(Parse.User);
    query.equalTo("username", "admin");
    let res = await query.find({useMasterKey: masterKey});
    if (res.length > 0) {
        return res[0];
    } else {
        // admin user
        var admin = new Parse.User();
        admin.set('username', 'admin');
        admin.set('password', '04140906');
        return new Promise((res, rej) => {
            admin.signUp()
                .then((user) => {
                    res(user);
                })
                .catch(async (err) => {
                    rej(err);
                });
        });
    }
}

async function defineACL(adminUser) {
    if (!adminUser) {
        throw 'admin user is null!';
    }
    console.log('create role');
    var adminRole = null;
    let query = new Parse.Query(Parse.Role);
    query.equalTo("name", "admin");
    let res = await query.find({useMasterKey: masterKey});
    if (res.length < 1) {
        // admin role
        console.log('create admin role');
        let adminACL = new Parse.ACL();
        adminACL.setPublicReadAccess(true);
        adminACL.setPublicWriteAccess(true);
        adminRole = new Parse.Role('admin', adminACL);
        adminRole.getUsers().add(adminUser);
        await adminRole.save(null, {useMasterKey: masterKey});
    } else {
        adminRole = res[0];
    }
    query = new Parse.Query(Parse.Role);
    query.equalTo("name", "default");
    res = await query.find({useMasterKey: masterKey});
    if (res.length < 1) {
        // default role
        console.log('create default role');
        let defaultACL = new Parse.ACL();
        defaultACL.setPublicReadAccess(true);
        defaultACL.setPublicWriteAccess(true);
        let defaultRole = new Parse.Role('default', defaultACL);
        defaultRole.getRoles().add(adminRole);
        await defaultRole.save(null, {useMasterKey: masterKey});
    }
}

module.exports = async function (ServerURL_, appID_, masterKey_) {
    if (fs.existsSync(INSTALL_PATH) || !ServerURL_ || !appID_ || !masterKey_) {
        console.log('server has been inited!');
        return;
    }
    ServerURL = ServerURL_;
    appID = appID_;
    masterKey = masterKey_;
    try {
        console.log('start init db');
        let adminUser = await defineAdminUser();
        await defineACL(adminUser);
        await defineClass();
        if (!await defindSchema()) {
            return;
        }
        fs.mkdirSync(INSTALL_PATH);
    } catch (e) {
        // console.log(e);
    }

}