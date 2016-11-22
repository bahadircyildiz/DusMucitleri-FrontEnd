var Routes = function(app,dpd,express,Q){
    // Serve static files
    app.use('/static', express.static('./static'));
    
    app.get('/', function (req, res) {
        
        //Get entries by using dpd param.
        var data = {}, calls = [];
        
        //Database calling parameters
        var tables = ["blog","courses","facts","features","instructors","navigation","offers","settings","slider","testimonials"];
        var queries = {
            settings: {$limit: 1},
            blog: {$limit: 9}
        };
        
        //Additional functions for tables if needed.
        var extras = {
            settings: function(res){
                if(res[0].siteKeywords){
                    var arr = res[0].siteKeywords, kw = "";
                    arr.forEach(function(key, index){
                        kw += key;
                        if(arr.length - 1 != index) kw += ",";
                    });
                    res[0].siteKeywords = kw;
                }
                return res[0];
            }
        };
        
        //Create async fuctions by the params in tables & queries
        tables.forEach(function(val){
            var query = queries[val] || {};
            query.active = true;
            calls.push( 
                dpd[val].get(query, function(results, err){
                    if(extras[val]) results = extras[val](results);
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