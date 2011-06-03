
/**
 * Module dependencies.
 */

var express = require('express')
  , twitter = require('twitter')
  , sys = require('sys')
  , tweetsWithoutHashtag = require('./tweets')

var twit = new twitter({});

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
   var params = {rpp:100};
   if (maxId) {
      params.since_id = maxId; 
   }
   helper.getTwitsbyHashtag(req, res, params);
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}

var tweets = [];
var maxId = null;

var helper = {
   getTwitsbyHashtag: function(req, res, param) {
      twit.search('#front_end', param, function(data) {
         maxId = data.max_id;
         if (data.results.length > 0) {
            tweets = tweets.concat(data.results); 
            //sys.puts(sys.inspect(data));
         }
         if (data.next_page) {
            helper.getTwitsbyHashtag(req, res, {page:data.page+1, max_id:data.max_id, rpp:100});
         } else {
            helper.getSpecificTweet(req, res);
         }
      });
   }
 , getSpecificTweet: function(req, res) {
      twit.get('/statuses/show/' + tweetsWithoutHashtag.pop() + '.json', {include_entities:true}, function(data) {
         if (data.user) {
            var tweet = {
               'profile_image_url':data.user.profile_image_url
             , 'created_at': data.created_at
             , 'from_user': data.user.screen_name
             , 'text': data.text
            };
            tweets.push(tweet); 
         }
         if (tweetsWithoutHashtag.length > 0) {
            helper.getSpecificTweet(req, res); 
         } else {
            //sys.puts(sys.inspect(tweets)); 
            //sys.puts(tweets.length);
            res.render('index', {
               tweets: tweets
            });
         } 
      }); 
   }
};
