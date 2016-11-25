var express = require("express");
var app = express();
var exphbs  = require('express-handlebars');

var io = require('socket.io').listen(server, {'log level': 0});
var config = require("./../config.js");

// Deployd Actions
var server = require('deployd')({
        port: config.dpdPort,
        env:"development"
    })
    server.listen()
var internalClient = require('deployd/lib/internal-client')

var dpd;
var Q = require("q");
process.server.on('listening', function() {
    dpd = internalClient.build(process.server);
    
    // Bind routes after Deployd server is ready
    require("./routes.js")(app,dpd,express,Q);

});
// Deployd ENDS


var hbs = exphbs.create({
    layoutsDir:"views/",
    partialsDir:"views/partials",
    helpers: {
        if_eq: function(a, b, options){
            if(a == b) return options.fn(this);
            else return options.inverse(this);
        },
        coursetags: function (coursetags, options){
            var index = "";
            var allcoursetags = options.data.root.settings.allcoursetags;
            coursetags.forEach(function(val){
                index += allcoursetags.indexOf(val) + " ";
            });
            return index;
        },
        getInstructor: function(id, options){
            var result;
            options.data.root.instructors.forEach(function(val){
                if(val.id == id) result = val;
            });
            return options.fn(result);
        }
    }
})

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');



app.listen(config.expressPort);
