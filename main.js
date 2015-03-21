var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})

///////////// WEB ROUTES

// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next)
{
	console.log(req.method, req.url);

	client.lpush('recenturl',req.url)

	next(); // Passing the request to the next handler in the stack.
});

app.use('/uploads', express.static(__dirname + '/uploads'));

 app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
    //console.log(req.body) // form fields
    console.log(req.files) // form files

    if( req.files.image )
    {
 	   fs.readFile( req.files.image.path, function (err, data) {
 	  		if (err) throw err;
 	  		var img = new Buffer(data).toString('base64');
			client.rpush('items',req.files.image.path)
 	  		console.log("YO!"+req.files.image.path);
 		});
 	}

    res.status(204).end()
 }]);

 app.get('/meow', function(req, res) {
 	{
 		//if (err) throw err
 		//res.writeHead(200, {'content-type':'text/html'});
 		client.rpop('items',function (err,imagedata) 
 		{
		res.writeHead(200, {'content-type':'text/html'});
               res.write("<h1>\n<img src='/"+imagedata+"'/>");
		res.end();

 		});
    	
 	}
 })

// HTTP SERVER
 var server = app.listen(3000, function () {

   var host = server.address().address
   var port = server.address().port

   console.log('Example app listening at http://%s:%s', host, port)
 })
app.get('/set', function(req, res) {
client.set("key", "this message will self-destruct in 10 seconds")
client.expire("key",10)
res.send("value set.Will expire in 10 seconds!")
})

app.get('/get', function(req, res) {

client.get("key", function(err, value) {
    res.send(value)
});
})

app.get('/', function(req, res) {
  res.send('hello world')
})

app.get('/recent', function(req, res) {
client.lrange('recenturl', 0, 5, function(err, reply) {
    res.send(reply); 
});
})
/*app.get('/meow', function(req, res) {
    {

        client.rpop("uploads", function(err, value){

            if (err)
                throw err;
            if(value != null){

                res.writeHead(200, {'content-type':'text/html'});
               res.write("<h1>\n<img src='/"+value+"'/>");
               res.end();
            } else{
                res.send("no images")
            }
        });
    }
})*/
