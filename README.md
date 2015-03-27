###Complete set/get 
The value is set in the "set" route using. The value for key expires in 10 seconds
<pre>
client.set("key", "this message will self-destruct in 10 seconds")
client.expire("key",10)
</pre>

The retrieval of the value corresponding to"key" is retrieved in the get/ route. 
This is done as follows:
<pre>
client.get("key", function(err, value) {
    res.send(value)
});
</pre>

###Complete recent
The urls visited are stored in a queue.
The hook is defined in the .use function. The urls are stored against the key: "recenturl"
<pre>
client.lpush('recenturl',req.url)
</pre>

The 5 most recent urls are retrieved using lrangein the /recent route as follows.
<pre>
client.lrange('recenturl', 0, 5, function(err, reply) {
    res.send(reply); 
});
</pre>

###Complete upload/meow
The image content is stored in the upload route and retieved to be displayed as an image in the /meow route
use the below command to upload image:
curl -L -F "image=@./img/morning.jpg" localhost:3002/upload
<pre>
app.use('/uploads', express.static(__dirname + '/uploads'));
 app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
    console.log(req.files) // form files
    if( req.files.image )
    {
 	   fs.readFile( req.files.image.path, function (err, data) {
 	  		if (err) throw err;
 	  		var img = new Buffer(data).toString('base64');
			client.rpush('items',req.files.image.path)
 		});
 	}
    res.status(204).end()
 }]);
</pre>

The image is gesplayed using the /meow route

###Additional service instance running
An additional service is defined as a server which listens on port 3001.
<pre>
 var server2 = app.listen(3001, function () {

   var host = server2.address().address
   var port = server2.address().port
   client.lpush("url","http://"+host+":"+port)
   console.log('Example app listening at http://%s:%s', host, port)
 })
</pre>

###Demonstrate proxy
An third server listening on port 3002 is defined which acts as a proxy .
It redirects the urls by toggling between servers listening on port 3000 and 3001 alternatively.
The proxy uses rpoplpush to implement the toggling logic.
Thus all requested urls are recedived by this proxy .
<pre>
app_proxy.use(function(req,res,next){

	//logic to toggle between  two servers and redirect the url to appropriate server.
	var url = "http://";
	
	client.rpoplpush("url","url",function(err,value){
	console.log("redirecting to "+value+req.url)
	res.redirect(307,value+req.url);
	})

});
</pre>
