//Fake data generator
// var faker = require("faker");
//HTML stripping tool
var striptags = require("striptags")

var Routes = function(app,dpd,express,Q){
    // Serve static files
    app.use('/static', express.static('./static'));
    
    app.get('/', function (req, res) {
        
        //Get entries by using dpd param.
        var data = {}, calls = [];
        
        //Database calling parameters
        var tables = ["settings","blog","courses","facts","features","instructors","navigation","offers","slider","testimonials"];
        var queries = {
            settings: {$limit: 1},
            blog: {$limit: 9, $sort: { timeStamp: 1 } }
        };
        
        //Additional functions for tables if needed.
        var extras = {
            settings: function(res){
                //Arranging keywords for further SEO optimizations
                if(res[0].siteKeywords){
                    var arr = res[0].siteKeywords, kw = "";
                    arr.forEach(function(key, index){
                        kw += key.text;
                        if(arr.length - 1 != index) kw += ",";
                    });
                    res[0].siteKeywords = kw;
                }
                return res[0];
            },
            slider: function(res){
                var banner = [], gallery = []; 
                res.forEach(function(val){
                    if(val.isBanner) banner.push(val);
                    else gallery.push(val);
                });
                return {banner: banner, gallery: gallery};
            },
            offers: function(res){
                var left = [], right = [];
                res.forEach(function(val, index){
                    if(index%2==0) left.push(val);
                    else right.push(val);
                });
                return {left: left, right: right};
            },
            blog: function(res){
                res.forEach(function(val){
                    val.body = striptags(val.body).substring(0,50);
                })
                return res;
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
            // console.log("Data with all async calls completed", data);
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

    app.get("/faker",function(req,res){
        res.send("Iyidir senden bro ? ");
    })
}

module.exports = Routes;