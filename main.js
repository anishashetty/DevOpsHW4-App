var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()
var app_proxy = express()
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})
client.flushdb()

///////////// WEB ROUTES

// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next)
{
	console.log(req.method, req.url);

	client.lpush('recenturl',req.url)

	next(); // Passing the request to the next handler in the stack.
});

app_proxy.use(function(req,res,next){

	var url = "http://";
	
	client.rpoplpush("url","url",function(err,value){
	console.log("redirecting to "+value+req.url)
	res.redirect(307,value+req.url);
	})
	
	//res.writeHead(301,{Location: url});
	//res.end();
	//next()

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
 		if(imagedata != null){
		res.writeHead(200, {'content-type':'text/html'});
               res.write("<h1>\n<img src='/"+imagedata+"'/>");
		res.end();}
		else
		res.send("No image to display")

 		});
    	
 	}
 })



// HTTP SERVER
 var server1 = app.listen(3000, function () {

   var host = server1.address().address
   var port = server1.address().port
   
   client.lpush("url","http://"+host+":"+port)
    
   console.log('Example app listening at http://%s:%s', host, port)
 })

// HTTP SERVER 2
 var server2 = app.listen(3001, function () {

   var host = server2.address().address
   var port = server2.address().port
   client.lpush("url","http://"+host+":"+port)
   console.log('Example app listening at http://%s:%s', host, port)
 })

// HTTP PROXY SERVER 
 var proxy = app_proxy.listen(3002, function () {

	var host = proxy.address().address
	var port = proxy.address().port

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

