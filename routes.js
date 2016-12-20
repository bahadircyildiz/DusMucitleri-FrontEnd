//HTML stripping tool
var striptags = require("striptags");
// Multer file uploads
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
var bodyParser = require('body-parser');
var breadcrumbs = require('express-breadcrumbs');

var Routes = function(app,dpd,express,Q){
    app.use(bodyParser.json());
    
    //Breadcrumbs
    app.use(breadcrumbs.init());
    app.use(breadcrumbs.setHome({name: "Anasayfa"}));
    //Global standarts within views
    var global = require("./globals.js")(dpd, Q);
    
    // Serve static files
    app.use('/static', express.static('./static'));
    app.use('/dist', express.static('./dist'));
    
    
    //Homepage Route
    app.get('/', function (req, res) {
        
        //Get entries by using dpd param.
        var data = {}, calls = [];
        data.subfooter = {};
        
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            {
                table: "blog",
                query: {$limit: 9, $sort: { timeStamp: 1 } },
                extra: function(res){
                    res.forEach(function(val){
                        val.body = striptags(val.body).substring(0,50);
                    })
                    data.subfooter.blog = [res[0]];
                    return res;
                }
            },
            {
                table: "userinfo",
                query: { role: "Instructor"},
            },
            {
                table: "courses",
                extra: function(res){
                    res.forEach(function(val){
                        val.body = striptags(val.body).substring(0,50);
                    })
                    return res;
                }
            },
            {
                table: "facts",
                query: {$limit: 6},
                extra: global.extras.facts
            },
            {
                table: "navigation",
                extra: global.extras.navigation
            },
            {
                table: "offers",
                extra: function(res){
                    var left = [], right = [];
                    res.forEach(function(val, index){
                        if(index%2==0) left.push(val);
                        else right.push(val);
                    });
                    return {left: left, right: right};
                }
            },
            {
                table: "slider",
                extra: global.extras.settings
            },
            {
                table: "testimonials"
            },
            {
                table: "contents",
                query: { content: {$in: ["home", "subfooter"]}},
                extra: global.extras.contents
            }
        ];
        
        //Database calling parameters
        // var tables = ["settings","blog", "userinfo", "courses","facts","features","navigation","offers","slider","testimonials","contents"];
        // var queries = {
        //     settings: global.queries.settings,
        //     blog: {$limit: 9, $sort: { timeStamp: 1 } },
        //     facts: {$limit: 6},
        //     navigation: global.queries.navigation,
        //     contents: { content: {$in: ["home", "subfooter"]}},
        //     userinfo: { role: "Instructor"}
        // };
        
        // //Additional functions for tables if needed.
        // var extras = {
        //     settings: global.extras.settings,
        //     navigation: global.extras.navigation,
        //     slider: global.extras.slider,
        //     offers: function(res){
        //         var left = [], right = [];
        //         res.forEach(function(val, index){
        //             if(index%2==0) left.push(val);
        //             else right.push(val);
        //         });
        //         return {left: left, right: right};
        //     },
        //     blog: function(res){
        //         res.forEach(function(val){
        //             val.body = striptags(val.body).substring(0,50);
        //         })
        //         data.subfooter.blog = [res[0]];
        //         return res;
        //     },
        //     courses: function(res){
        //         res.forEach(function(val){
        //             val.body = striptags(val.body).substring(0,50);
        //         })
        //         return res;
        //     },
        //     contents: global.extras.contents
        // };
        
        //Create async fuctions by the params in tables & queries
        global.callAsyncAll(callsets,
                    {
                        data: data, 
                        calls: calls
                    });
        
        //Async call handler that activates after all tasks are finished.
        Q.all(calls).then(function(results){
            data.breadcrumbs = req.breadcrumbs();
            console.log("Data with all async calls completed", data);
            //Send them bitchslaps
            res.render('pages/index',data);
        }).catch(function(error){
            res.send(error);
        });
        
    });
    
    
    //Blog Listing Route
    app.get("/blog/:page",function(req,res){
        var data = {}, calls = [], pageSize = 5;
        data.page = req.params.page, data.isListing = true, data.subfooter = {};
        //Database calling parameters
        var tables = ["settings","blog","navigation", "slider","contents"];
        var queries = {
            settings: global.queries.settings,
            navigation: global.queries.navigation,
            blog: global.queries.blog,
            slider: { $limit: 6},
            contents: {content: {$in: ["subbanner", "subfooter"]}, branch: "blog"}
        };
        
        //Additional functions for tables if needed.
        var extras = {
            settings: function(res){ return global.extras.settings(res); },
            blog: function(res){
                data.subfooter.blog = res;
                var $skip = pageSize * (data.page - 1), $limit = (res.length - $skip >= pageSize) ? pageSize : res.length - $skip;
                data.lastPage = Math.ceil(res.length / pageSize);
                res = res.slice($skip, $skip+$limit);
                // console.log("All dem shitz", $skip, $limit, data.lastPage, res );
                res.forEach(function(val){
                    val.body = striptags(val.body).substring(0,200);
                });
                return res;
            },
            navigation: function(res){ return global.extras.navigation(res); },
            slider: function(res) {return global.extras.slider(res); },
            contents: global.extras.contents
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
            //Send them bitchslaps
            if(data.page < 1 || data.page > data.lastPage) res.redirect("/");
            else {
                req.breadcrumbs("Tüm Bloglar");
                data.breadcrumbs = req.breadcrumbs();
                console.log("Data with all async calls completed", data);
                res.render('pages/post',data);
            }
        }).catch(function(error){
            console.log("Hata var hocam", error);
            res.send(error);
        });
    });
    
    
    //Blog Detail Route
    app.get("/blog/details/:id",function(req,res){
        var data = {}, calls = [];
        data.isListing = false, data.subfooter = {};
        
        //Database calling parameters
        var tables = ["settings","blog","navigation", "slider", "contents"];
        var queries = {
            settings: global.queries.settings,
            navigation: global.queries.navigation,
            blog: global.queries.blog,
            contents: {content: "subbanner", branch: "blogdetails"}
        };
        var extras = {
            settings: function(res){ return global.extras.settings(res); },
            navigation: function(res){ return global.extras.navigation(res); },
            slider: function(res){ return global.extras.slider(res); },
            blog : function(res){
                var result;
                data.subfooter.blog = res;
                res.some(function(val){
                    if (val.id == req.params.id){
                        res = val;
                        return val;
                    }
                });
                return res;
            },
            contents: function(res) { return res[0]; }
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
            //Send them bitchslaps
            //We should totally start our fucking company! :D
            if(!data.blog) res.redirect("/");
            else{
                req.breadcrumbs(data.blog.title);
                data.breadcrumbs = req.breadcrumbs();
                console.log("Data with all async calls completed", data);
                res.render('pages/post',data);
            }
        }).catch(function(error){
            console.log("Hata var hocam", error);
            res.send(error);
        });
        
    });

    app.get("/course/:page",function(req,res){
        var data = {}, calls = [], pageSize = 5;
        data.page = req.params.page, data.isListing = true, data.subfooter = {};
        //Database calling parameters
        var tables = ["settings","courses","navigation","instructors", "blog", "slider","contents" ];
        var queries = {
            settings: global.queries.settings,
            navigation: global.queries.navigation,
            blog: global.queries.blog,
            contents: { content: "subbanner", branch: "courses" }
        };
        
        //Additional functions for tables if needed.
        var extras = {
            settings: function(res){ return global.extras.settings(res); },
            courses: function(res){
                var $skip = pageSize * (data.page - 1), $limit = (res.length - $skip >= pageSize) ? pageSize : res.length - $skip;
                data.lastPage = Math.ceil(res.length / pageSize);
                res = res.slice($skip, $skip+$limit);
                // console.log("All dem shitz", $skip, $limit, data.lastPage, res );
                res.forEach(function(val){
                    val.body = striptags(val.body).substring(0,200);
                });
                return res;
            },
            navigation: function(res){ return global.extras.navigation(res); },
            slider: function(res){ return global.extras.slider(res); },
            blog : function(res){
                data.subfooter.blog = res;
                return [];
            },
            contents: function(res){ return res[0]; }
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
            //Send them bitchslaps
            if(data.page < 1 || data.page > data.lastPage) res.redirect("/");
            else {
                req.breadcrumbs("Tüm Kurslar");
                data.breadcrumbs = req.breadcrumbs();
                console.log("Data with all async calls completed", data);
                res.render('pages/post',data);
            }
            
        }).catch(function(error){
            console.log("Hata var hocam", error);
            res.send(error);
        });
    });
    
    app.get("/course/details/:id",function(req,res){
        var data = {}, calls = [];
        data.isListing = false, data.subfooter = {};
        
        //Database calling parameters
        var tables = ["settings","courses","navigation", "instructors", "blog", "slider","contents"];
        var queries = {
            settings: global.queries.settings,
            navigation: global.queries.navigation,
            courses: { id: req.params.id },
            blog: global.queries.blog,
            contents: { content: "subbanner", branch: "coursesdetails" }
        };
        var extras = {
            settings: function(res){ return global.extras.settings(res); },
            navigation: function(res){ return global.extras.navigation(res); },
            slider: function(res){ return global.extras.slider(res); },
            blog: function(res){
                data.subfooter.blog = res;
            },
            contents: function(res){ 
                return res[0];
            }
            
            
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
            //Send them bitchslaps
            //We should totally start our fucking company! :D
            if(!data.courses) res.redirect("/");
            else {
                req.breadcrumbs(data.courses.title);
                data.breadcrumbs = req.breadcrumbs();
                console.log("Data with all async calls completed", data);
                res.render('pages/post',data);
            }
        }).catch(function(error){
            console.log("Hata var hocam", error, data);
            res.send(error);
        });
        
    });
    
    app.post('/upload', upload.single('file'), function (req, res, next) {
        res.send({status:true,message:'Uploaded'});
    });
};

module.exports = Routes;