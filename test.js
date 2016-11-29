//node.js 

var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var boot_time = new Date().getTime() / 1000;
// Connection URL
var url = 'mongodb://localhost:27017/twitch';
var daba;
// Use connect method to connect to the server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
  daba = db;
  var collection = db.collection('viewers');
  setInterval(function(){onNames(["augu","dogu"],collection)}, 2000);
  //db.close();
});

//primary thing to do:
//check when join/part get called and when they show up
//what does a refresh do?
//what happens if there are joins from multiple sources
//what happens during chaos joins/parts



//array flags[]
//when using an account set flags[username] = true
//before doing an action add 

//recurring function every 4:59 mins to add 5 mins time to all users still in chat

//at boot set all user.online to false
//db.viewers.update({online : true} ,{$set: {online:false}}, { multi: true })

function onjoin(){ }
	/*if(user is in db)
	{

	} */
	// if there is no upsert will it spit out an error? //set user.online = true //db.viewers.update({name : user.name} ,{$set: {online:true}}, { multi: true })
	//set user.last_time = new Date().getTime() / 1000
//else{}
	//insert new user with user.online: true, user.last_time: new Date().getTime() / 1000


function onpart(username){
	var current = db.viewers.find({name: username});
if(current)
{
	var time_delt = (new Date().getTime() / 1000) - user.last_time)
	if(time_delt < 300)
	{

	} 
	else
	{

	}
}

db.viewers.update({name : username} ,{$set: {online:false}}, {})
 } 
//set user.online = false
//if(new added time is less than 5 mins) set user.time += (new Date().getTime() / 1000) - user.last_time




function onNames(users,coll) {
    for(var i = 0; i < users.length; i++)
    {
        var current_user = users[i].toLowerCase();

        coll.findOne({name:current_user}, function(err,docs){
        	
        	if(docs && docs.time){
        		console.log(docs.name);
        		console.log(new Date().getTime() / 1000)
				console.log(docs.time);
			}
        });
        

	}
}

