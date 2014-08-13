var url = require('url');
var irc = require("irc");
var nodeio = require("node.io");
var settings = require("./settings.json");
var googl = require('short-url');

var irc_conn = new irc.Client(settings.irc.server, settings.irc.nick, settings.irc.options);

var job = new nodeio.Job();


function printLinkTitles(from, to, text){
  var urls = text.trim().split(/\s+/).filter(function(word){
    return url.parse(word).protocol == 'http:';
  });

  urls.forEach(function(url){
    job.getHtml(url, function(err, $, data){
      if(err){
        console.log(err);
        return;
      }
      try{
        var text = $('title').text;
        if(text){
          googl.shorten(url, function(err, shortened){
            var shorted = "";
            if(!err){
              shorted = " (" + shortened + ")"
            }
            irc_conn.say(to, text+shorted);
          });
        }
      }
      catch(err){}
    });
  });
}

irc_conn.on('message', function(nick, to, text, message){
  printLinkTitles(nick, to, text);
});

irc_conn.on('error', function(err){
  console.log("Irc error")
});
