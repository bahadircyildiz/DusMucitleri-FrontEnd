//Fake data generator
var f = require("faker");
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
        var fake = {
            blog: function(){
                return {
                    title: f.lorem.sentence(),
                    body: f.lorem.paragraph(),
                    timeStamp: f.date.past() 
                }
            },
            courses: function(){
                return {
                    title: f.lorem.sentence(),
                    description: f.lorem.paragraph(),
                    price: f.random.number(),
                    ribbon: {
                        color: f.internet.color(),
                        category: f.random.word()
                    }
                }
            },
            slider: function(){
                var ret = {
                    title: f.lorem.sentence(),
                    description: f.lorem.paragraph(),
                    isBanner: f.random.boolean()
                }
                ret.image = ret.isBanner ? f.random.image() : f.image.avatar();
                return ret;
            }
            
        }, created = {}, calls = [], tables = ["blog", "courses", "slider"]
        
        
        tables.forEach(function(val, index){
            created[val] = [];
            var amount = req.query[val] || 0;
            for (var x=0 ; x<amount ; x++){
                var fakedata = fake[val]();
                fakedata.active = true;
                console.log(fakedata);
                var deferred = Q.defer();
                calls.push(
                    dpd[val].post(fakedata).then(
                        function(success){
                            deferred.resolve(success);
                            created[val].push(success);
                            return deferred.promise;
                        },
                        function(error){
                            deferred.reject(error);
                            return deferred.promise;
                        }
                    )
                );
            }
        });
        
        Q.all(calls).then(function(){
            res.send("Done without errors"); 
        }).catch(function(error){
            console.log(error);
        });
        
        
        
        console.log();
        res.send();
    })
}

module.exports = Routes;