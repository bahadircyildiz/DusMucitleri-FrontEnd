var Routes = function(app,dpd,express,Q){
    // Serve static files
    app.use('/static', express.static('./static'));
    
    app.get('/', function (req, res) {
        
        //Get entities by using dpd param.
        var data = {}, calls = [];
        
        //Database calling parameters
        var tables = ["blog","courses","facts","features","instructors","navigation","offers","settings","slider", "testimonials"];
        var queries = {
            settings: {$limit: 1},
            blog: {$limit: 9}
        };
        
        //Create async fuctions by the params in tables & queries
        tables.forEach(function(val){
            calls.push( 
                dpd[val].get(queries[val], function(results, err){
                    data[val] = results;
                })
            );
        });
        
        //Async call handler that activates after all tasks are finished.
        Q.all(calls).then(function(results, err){
            console.log("Data with all async calls completed", data);
            //Send them bitchslaps
            res.render('pages/index',data);
        });
        
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