var url = require('url');
var irc = require("irc");
var nodeio = require("node.io");
var googl = require('short-url');
var _ = require('underscore');
var settings = require("./settings.json");

var irc_conn = new irc.Client(settings.irc.server, settings.irc.nick, settings.irc.options);

var job = new nodeio.Job();


function printLinkTitles(from, to, text){
  var urls = text.trim().split(/\s+/).filter(function(word){
    return !! new RegExp('^https?:').exec(url.parse(word).protocol);
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
            text = text.replace(/[\n\r]/," ").replace(/\s+/g," ").trim();
	}
	else{
            text = ""
        }

          googl.shorten(url, function(err, shortened){
            var shorted = "";
            if(!err){
              shorted = " (" + shortened + ")"
            }
            irc_conn.say(to, text+shorted);
          });
      }
      catch(err){}
    });
  });
}

var commands = {
  "help": function(nick, to){
    irc_conn.say(to, "Commands: " + _.keys(commands).sort().join(" "));
  },
  "join": function(nick, to, args, message){
    irc_conn.say(to, "Joining: " + args);
    irc_conn.join(args);
  },
  "part": function(nick, to, args, message){
    irc_conn.say(to, "parting: " + args);
    irc_conn.part(args);
  }
};

irc_conn.on('message', function(nick, to, text, message){
  var commandRegex = new RegExp("^"+settings.irc.nick+":?\\s+(\\S+)(.*)$");
  var wasCommand = commandRegex.exec(text);
  if(wasCommand){
    var command = commands[wasCommand[1]];
    if(command){
      command(nick, to, wasCommand[2], message);
    }
    else{
      printLinkTitles(nick, to, text);
    }
  }
  else{
    printLinkTitles(nick, to, text);
  }
});

irc_conn.on('error', function(err){
  console.log("Irc error")
});
