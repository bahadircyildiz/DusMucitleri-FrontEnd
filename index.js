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
    partialsDir:"views/partials"
})
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');



app.listen(config.expressPort);
