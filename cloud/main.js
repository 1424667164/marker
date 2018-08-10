const Parse = require('parse/node');
const fs = require('fs');
const path = require('path');
const unzip = require('unzip');
const cmd = require('child_process').exec;

function deleteall(path) {
	var files = [];
	if(fs.existsSync(path)) {
		files = fs.readdirSync(path);
		files.forEach(function(file, index) {
			var curPath = path + "/" + file;
			if(fs.statSync(curPath).isDirectory()) { // recurse
				deleteall(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
}

Parse.Cloud.define("deleteFile", function (request, response) {
    let url = request.params.url;
    try {
        url = url.substr(url.lastIndexOf('/') + 1);
        url = 'files/' + url;
        fs.unlinkSync(url);
        response.success(true);
    } catch (e) {
        response.error(e);
    }
});

Parse.Cloud.define("unzipFiles", function (request, response) {
    let url = request.params.url;
    try {
        url = url.substr(url.lastIndexOf('/') + 1);
        let root = url.replace('.zip', '');
        url = 'files/' + url;
        if (!fs.existsSync(url)) {
            response.error("not found!");
        }
        fs.mkdirSync(path.join(__dirname, '../files', root));
        cmd(`"C:/Program Files/2345Soft/HaoZip/HaoZipC.exe" x "${path.join(__dirname, '../', url)}" -o"${path.join(__dirname, '../files', root)}"`, (err) => {
            fs.unlinkSync(url);
            if(err) {
                response.error(err);
            }else{
                let files = fs.readdirSync(path.join(__dirname, '../files', root));
                let images = [];
                for(let file of files) {
                    if(!/[a-zA-Z0-9-_]+\.(jpg|png|jpeg)/.test(file)){
                        continue;
                    }
                    images.push(root + '-' + file);
                    fs.copyFileSync(path.join(__dirname, '../files', root, file), path.join(__dirname, '../files', root + '-' + file))
                }
                deleteall(path.join(__dirname, '../files', root));
                response.success(images);
            }
        });
    } catch (e) {
        response.error(e);
    }
});