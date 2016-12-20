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
        var data = {};
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
            },
            {
                table: "kidservices"
            }
        ];
        
        //Create async fuctions by the params in tables & queries
        
        
        //Async call handler that activates after all tasks are finished.
        global.callAsyncAll(callsets,data).then(function(results){
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
        var data = {};
        data.pageSize = 5, data.page = req.params.page, data.isListing = true, data.subfooter = {};
        //Database calling parameters
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            {
                table: "blog",
                extra: function(res){
                    data.subfooter.blog = [res[0]];
                    var $skip = data.pageSize * (data.page - 1), $limit = (res.length - $skip >= data.pageSize) ? data.pageSize : res.length - $skip;
                    data.lastPage = Math.ceil(res.length / data.pageSize);
                    res = res.slice($skip, $skip+$limit);
                    // console.log("All dem shitz", $skip, $limit, data.lastPage, res );
                    res.forEach(function(val){
                        val.body = striptags(val.body).substring(0,200);
                    });
                    return res;
                }
            },
            {
                table: "navigation",
                extra: global.extras.navigation
            },
            {
                table: "slider",
                query: {$limit: 6},
                extra: global.extras.slider
            },
            {
                table: "contents",
                query: { $or: [{content: "subbanner", branch: "blog"}, {content: "subfooter"}]},
                extra: global.extras.contents
            },
        ]
        
        //Create async fuctions by the params in tables & queries
        global.callAsyncAll(callsets,data).then(function(results){
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
        var data = {};
        data.isListing = false, data.subfooter = {};
        
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            {
                table: "blog",
                extra: function(res){
                    data.subfooter.blog = res;
                    res.some(function(val){
                        if (val.id == req.params.id){
                            res = val;
                            return val;
                        }
                    });
                    return res;
                }
            },
            {
                table: "navigation",
                extra: global.extras.navigation
            },
            {
                table: "slider",
                extra: global.extras.slider
            },
            {
                table: "contents",
                query: { $or: [{content: "subbanner", branch: "blogdetails"}, {content: "subfooter"}]},
                extra: global.extras.contents
            },
        ]
        
        //Create async fuctions by the params in tables & queries
        global.callAsyncAll(callsets,data).then(function(results){
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
        var data = {}; 
        data.pageSize = 5, data.page = req.params.page, data.isListing = true, data.subfooter = {};
        //Database calling parameters
        
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            {
                table: "courses",
                extra: function(res){
                    var $skip = data.pageSize * (data.page - 1), $limit = (res.length - $skip >= data.pageSize) ? data.pageSize : res.length - $skip;
                    data.lastPage = Math.ceil(res.length / data.pageSize);
                    res = res.slice($skip, $skip+$limit);
                    // console.log("All dem shitz", $skip, $limit, data.lastPage, res );
                    res.forEach(function(val){
                        val.body = striptags(val.body).substring(0,200);
                    });
                    return res;
                }
            },
            {
                table: "navigation",
                extra: global.extras.navigation
            },
            {
                table: "userinfo",
                query: {role : "Instructor"}
            },
            {
                table: "slider",
                query: {$limit: 6},
                extra: global.extras.slider
            },
            {
                table: "contents",
                query: { $or: [{content: "subbanner", branch: "courses"}, {content: "subfooter"}]},
                extra: global.extras.contents
            },
            {
                table: "blog",
                extra: function(res){
                    data.subfooter.blog = [res[0]];
                    return [];
                }
            },
        ]
        
        //Create async fuctions by the params in tables & queries
        global.callAsyncAll(callsets,data).then(function(results){
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
        var data = {};
        data.isListing = false, data.subfooter = {};
        
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            {
                table: "blog",
                extra: function(res){
                    data.subfooter.blog = [res[0]];
                }
            },
            {
                table: "navigation",
                extra: global.extras.navigation
            },
            {
                table: "slider",
                extra: global.extras.slider
            },
            {
                table: "contents",
                query: { $or: [{content: "subbanner", branch: "coursesdetails"}, {content: "subfooter"}]},
                extra: global.extras.contents
            },
            {
                table: "courses",
                query: { id: req.params.id },
            },
            {
                table: "userinfo",
                query: { role: "Instructor" },
            }
        ]
        
        //Create async fuctions by the params in tables & queries
        global.callAsyncAll(callsets,data).then(function(results){
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