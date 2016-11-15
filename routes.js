var Routes = function(app,dpd,express){
    // Serve static files
    app.use('/static', express.static('./static'));
    
    app.get('/', function (req, res) {
        res.render('pages/index',{a:"naber",username:"TOLGA"});
        // res.send("Hello")
    });
    
    app.get("/dpd",function(req,res){
        dpd.navigation.get(function(results, err) {
            console.log("DATA:",results);
            res.send(results);
        });
    })

    app.get("/naber",function(req,res){
        res.send("Iyidir senden bro ? ");
    })
}

module.exports = Routes;