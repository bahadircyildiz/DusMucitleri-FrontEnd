var app = require('express')();
var exphbs  = require('express-handlebars');

var io = require('socket.io').listen(server, {'log level': 0});
var ExpressPORT = 8080;
var DeploydPORT = 3000;

// Deployd Actions
var server = require('deployd')({
        port: DeploydPORT,
        env:"development"
    })
    server.listen()
var internalClient = require('deployd/lib/internal-client')

var dpd;
process.server.on('listening', function() {
    dpd = internalClient.build(process.server);

});
// Deployd ENDS


var hbs = exphbs.create({
    layoutsDir:"views/",
    partialsDir:"views/partials"
})
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    res.render('pages/index',{a:"naber",username:"TOLGA"});
    // res.send("Hello")
});

app.get("/dpd",function(req,res){
    dpd.navigation.get(function(results, err) {
        console.log("DATA:",results)
        res.send(results)
    });
})



app.listen(ExpressPORT);
