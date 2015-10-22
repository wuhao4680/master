var http = require("http");
var fs = require("fs");//读写文件
var path = require("path");//处理文件路径
var url = require("url");//处理URL
var mime = require('mime');   //文件的类型
var server = http.createServer(function (req, res) {

    //icon请求忽略
    if (req.url == '/favicon.ico') {
        res.end();
        return;
    }

    //访问请求的文件地址标准化,过滤掉 .. 之类的路径
    var reqPath = path.normalize(req.url);
    //console.log(reqPath)
    //缓存请求路径，在拼超链接字符串的时候会用到。
    var cachepath = reqPath;

    //获取当前文件的路径
    var filepath = path.join(__dirname, reqPath);

    //判断文件是否存在
    fs.exists(filepath, function (exists) {

        //文件存在
        if (exists) {

            //判断是否是目录
            if (fs.statSync(filepath).isDirectory()) {
                var addStr = '<link rel="stylesheet" href="/pub/css/index.css"/>';
                addStr += '<h1>FileManager system directory</h1>';
                addStr += '<ul class="ul">';

                //遍历文件
                fs.readdir(filepath, function (err, files) {
                    res.writeHead(200, {"Content-Type": "text/html;charset=utf-8"});
                    if (err) {
                        console.log(err);
                    } else {
                        files.forEach(function (file) {//开始循环父目录下的所有文件
                            if (path.extname(file)) {//有后缀意味着是文件
                                addStr += '<li class="gray"><a href="' + path.join(cachepath,file) + '" style="">' + file + ' </a></li>';
                            } else {//没有文件后缀意味着是目录
                                addStr += '<li ><a href="' + path.join(cachepath,file) + '" style="">' + file + '</a></li>';
                            }
                        });
                    }
                    res.end(addStr + "</ul><p class='alt'>提示：以上目录列表，蓝色是文件夹，可点击继续进入下一节。</p>");
                });
            } else if (fs.statSync(filepath).isFile()) {

                //当访问的是文件时，判断文件类型，并读文件
                res.writeHead(200, {'Content-Type': mime.lookup(path.basename(filepath)) + ';charset=utf-8'});
                fs.readFile(filepath, {flag: "r"}, function (err, data) {
                    if (err) {
                        res.end(err);
                    } else {
                        res.end(data);
                    }
                });
            }
        } else {
            res.writeHead(404, {"Content-Type": "text/html"});
            res.write('<span style="color:red">"' + filepath + '"</span> was not found on this server.');
            res.end();
        }
    });

});
server.listen(8081);