http = require('http');
fs = require('fs');
var url = require('url')

var server = http.createServer( function(req, res) {
    if(req.method == 'POST'){
        console.log("POST");
    }
    console.log("Headers");
    console.log(req.headers)
    var body = '';
    req.on('data', function (data) {
        body += data;
        // console.log("Partial body: " + body);
    });
    req.on('end', function () {
        console.log("Body: " + body);
    });
    res.writeHead(200,{'Content-Type': 'text/html'});
    res.end('Done');
    // console.dir(req.param);

    // if (req.method == 'POST') {
    //     console.log("POST");
    //     res.writeHead(200, {'Content-Type': 'text/html'});
    //     res.end('post received');
    // }
    // else
    // {
    //     console.log("GET");
    //     //var html = '<html><body><form method="post" action="http://localhost:3000">Name: <input type="text" name="name" /><input type="submit" value="Submit" /></form></body>';
    //     var html = fs.readFileSync('index.html');
    //     res.writeHead(200, {'Content-Type': 'text/html'});
    //     res.end(html);
    // }

});

port = 8000;
host = '0.0.0.0';
server.listen(port, host);
console.log('Listening at http://' + host + ':' + port);