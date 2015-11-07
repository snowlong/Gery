var express = require('express');
var app = express();
var Youtube = require('youtube-node');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('db.sqlite3');
var bodyParser = require('body-parser');
var fs = require('fs');
var youtubedl = require('youtube-dl');
var config = require('config');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/get_yt_video', function(request, response){
  getYoutube();
  response.send('DONE');
});

function getYoutube(){
  var youtube = new Youtube();

  youtube.setKey(config.Youtube.API_KEY);

  var keyword = 'cat';
  var limit = 5;

  youtube.addParam('order', 'rating');
  youtube.addParam('type', 'video');
  youtube.addParam('videoLicence', 'creativeCommom');
  items = null;
  title = [];
  video_id = [];
  url = [];
  youtube.search(keyword, limit, function(err, result){
    if(err) {console.log(err); return};
    items = result["items"];
    for(var i in items) {
      var it = items[i];
      db.serialize(function(){
        title = it["snippet"]["title"];
        video_id= it["id"]["videoId"];
        url = "https://youtube.com/watch?v=" + video_id;

        if (it) {
          db.run("INSERT INTO videos (title, video_id) VALUES (?, ?)", title, video_id);
        }
      });
      console.log("+ " + title);
      console.log("| " + url);
      console.log("---------");
    }
  });
  console.log(title);
}

app.get('/', function(request, response) {

  db.serialize(function(){

    db.all("SELECT * FROM videos", function(err, rows){
      if (!err) {
        response.render('index', {
          title: 'Gery',
          content: rows,
        });
      }
    });
  });
});

app.post('/', function(request, response) {
  var video_id = request.body.video_id;
  console.log("post received: %s", video_id);

  var youtube = new Youtube();

  youtube.setKey('AIzaSyAsG69iBi3YnRgFVpan-EcGlzm_pGyFAMY');
  var url = "https://www.youtube.com/watch?v=" + video_id;
  youtubedl.getInfo('http://www.youtube.com/watch?v='  + video_id, function(err, info) {
    if (err) throw err;

    console.log('id:', info.id);
    console.log('title:', info.title);
    console.log('url:', info.url); // download link
    console.log('thumbnail:', info.thumbnail);
    console.log('description:', info.description);
    console.log('filename:', info._filename);
    console.log('duration:', info.duration);
    console.log('format_id:', info.format_id);
  });

  db.serialize(function(){

    db.all("SELECT * FROM videos", function(err, rows){
      if (!err) {
        response.render('index', {
          title: 'Gery',
          content: rows,
        });

      }
    });

  });
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});
