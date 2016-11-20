var Routes = function(app,dpd,express){
    // Serve static files
    app.use('/static', express.static('./static'));
    
    app.get('/', function (req, res) {
        //Get entities by using dpd param. List all dpd entities @test/dpd
        var data = {};
        dpd.settings.get({$limit: 1}, function(results, err){
            data.settings = results;
        });
        res.render('pages/index',data);
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