//Fake data generator
var f = require("faker");
//HTML stripping tool
var striptags = require("striptags");

var Routes = function(app,dpd,express,Q){
    
    //Global standarts within views
    var global = require("./globals.js")(dpd, Q);
    
    // Serve static files
    app.use('/static', express.static('./static'));
    
    app.get('/', function (req, res) {
        
        //Get entries by using dpd param.
        var data = {}, calls = [];
        
        //Database calling parameters
        var tables = ["settings","blog","courses","facts","features","instructors","navigation","offers","slider","testimonials"];
        var queries = {
            settings: global.queries.settings,
            blog: {$limit: 9, $sort: { timeStamp: 1 } },
            facts: {$limit: 6},
            navigation: global.queries.navigation
        };
        
        //Additional functions for tables if needed.
        var extras = {
            settings: function(res) { return global.extras.settings(res) },
            navigation: function(res) { return global.extras.navigation(res) },
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
            },
            courses: function(res){
                res.forEach(function(val){
                    val.body = striptags(val.body).substring(0,50);
                })
                return res;
            },
        };
        
        //Create async fuctions by the params in tables & queries
        global.callAsyncAll({
                        tables: tables, 
                        queries: queries, 
                        extras: extras
                    },
                    {
                        data: data, 
                        calls: calls
                    });
        
        //Async call handler that activates after all tasks are finished.
        Q.all(calls).then(function(results){
            // console.log("Data with all async calls completed", data);
            //Send them bitchslaps
            res.render('pages/index',data);
        }).catch(function(error){
            res.send(error);
        });
        
    });
    
    app.get("/blog/:page",function(req,res){
        var data = {}, calls = [], pageSize = 5;
        data.page = req.params.page;
        //Database calling parameters
        var tables = ["settings","blog","navigation"];
        var queries = {
            settings: global.queries.settings,
            navigation: global.queries.navigation,
            blog: {$sort: { timeStamp: -1 } }
        };
        
        //Additional functions for tables if needed.
        var extras = {
            settings: function(res){ return global.extras.settings(res); },
            blog: function(res){
                var $skip = pageSize * (data.page - 1), $limit = (res.length - $skip >= pageSize) ? pageSize : res.length - $skip;
                data.lastPage = Math.ceil(res.length / pageSize);
                res = res.slice($skip, $skip+$limit);
                // console.log("All dem shitz", $skip, $limit, data.lastPage, res );
                res.forEach(function(val){
                    val.body = striptags(val.body).substring(0,200);
                });
                return res;
            },
            navigation: function(res){ return global.extras.navigation(res); }
        };
        
        //Create async fuctions by the params in tables & queries
        global.callAsyncAll({
                        tables: tables, 
                        queries: queries, 
                        extras: extras
                    },
                    {
                        data: data, 
                        calls: calls
                    });
        
        Q.all(calls).then(function(results){
            // console.log("Data with all async calls completed", data);
            //Send them bitchslaps
            if(data.page < 1 || data.page > data.lastPage) res.redirect("/");
            else res.render('pages/blog',data);
        }).catch(function(error){
            console.log("Hata var hocam", error);
            res.send(error);
        });
    });
    
    app.get("/blog/details/:id",function(req,res){
        var data = {}, calls = [];

        //Database calling parameters
        var tables = ["settings","blog","navigation"];
        var queries = {
            settings: global.queries.settings,
            navigation: global.queries.navigation,
            blog: {id: req.params.id}
        };
        var extras = {
            settings: function(res){ return global.extras.settings(res); },
            blog: function(res){
                return res[0] ? res[0] : false;
            },
            navigation: function(res){ return global.extras.navigation(res); }
        };
        
        //Create async fuctions by the params in tables & queries
        global.callAsyncAll({
                        tables: tables, 
                        queries: queries, 
                        extras: extras
                    },
                    {
                        data: data, 
                        calls: calls
                    });
                    
        Q.all(calls).then(function(results){
            // console.log("Data with all async calls completed", data);
            //Send them bitchslaps
            if(!data.blog) res.redirect("/");
            else res.render('pages/blog.details',data);
        }).catch(function(error){
            console.log("Hata var hocam", error);
            res.send(error);
        });
        
    });

    app.get("/faker",function(req,res){
        
        var fake = {
            blog: function(){
                var ret = {
                    title: f.lorem.sentence(),
                    body: f.lorem.paragraph(),
                    timeStamp: f.date.past(),
                    image: f.random.image(),
                    date: f.date.recent(),
                    tags: f.random.arrayElement()
                }
                ret.timeStamp = ret.date.getTime() / 1000;
                return ret;
            },
            courses: function(){
                return {
                    title: f.lorem.sentence(),
                    description: f.lorem.sentence(),
                    price: Math.floor(Math.random()*80),
                    image: f.random.image(),
                    instructorID: global.instructorIDs[Math.floor(Math.random()*3)],
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
            },
            instructors: function(){
                return {
                    name: f.name.findName(),
                    title: f.name.jobTitle(),
                    description: f.name.jobDescriptor(),
                    email: f.internet.email(),
                    phone: f.phone.phoneNumber(),
                    image: f.image.avatar()
                }
            },
            contents: function(){
                var cats = ["offers", "facts", "courses", "gallery", "instructors", "testimonials", "aboutus","contactus", "blog"], ret = {home: {}};
                cats.forEach(function(val){
                    ret.home[val] = {
                        body: f.lorem.paragraph(), title: val + " Title", 
                        image_bg: f.random.image(), image: f.image.avatar()
                    }
                });
                return ret;
            },
            facts: function(){
                return{
                    number: Math.floor(Math.random()*80),
                    description: f.name.jobTitle(),
                    color: f.internet.color()
                }
            },
            offers: function(){
                return{
                    icon: "fa fa-pencil",
                    title: f.random.words(),
                    description: f.lorem.sentence(),
                    color: f.internet.color()
                }
            }
            
        }, created = {}, calls = [];
        
        for (var val in req.query) {
            // skip loop if the property is from prototype
            if (!req.query.hasOwnProperty(val)) continue;
        
            created[val] = [];
            var isPut = val == "contents";
            var amount = req.query[val] || 0;
            for (var x=0 ; x<amount ; x++){
                var deferred = Q.defer();
                var fakedata = fake[val]();
                isPut ? 
                    (fakedata = {id: "ede2dfe3773df8b7"}, fakedata[val] = fake[val]()) : 
                    fakedata.active = true;
                var table = isPut ? "settings" : val;
                var type = isPut ? "put" : "post";
                calls.push(
                    dpd[table][type](fakedata).then(
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
        }
        
        Q.all(calls).then(function(data){
            res.send(created); 
        }).catch(function(error){
            res.send(error);
        });
    })
}

module.exports = Routes;