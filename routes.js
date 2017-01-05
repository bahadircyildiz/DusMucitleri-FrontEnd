String.prototype.subword = function(first, last){
    var trimmedString = this.substr(first, last);
    //re-trim if we are in the middle of a word
    trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")));
    return trimmedString;
}

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
                        val.body = striptags(val.body).subword(0, 100);
                    })
                    if(!data.subfooter) data.subfooter = {};
                    data.subfooter.blog = [res[0]];
                    return res;
                }
            },
            {
                table: "userinfo",
                query: { role: global.roles.Instructor},
            },
            {
                table: "courses",
                extra: function(res){
                    res.forEach(function(val){
                        val.body = striptags(val.body).subword(0,100);
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
                table: "offers"
            },
            {
                table: "slider",
                extra: global.extras.slider
            },
            {
                table: "testimonials"
            },
            {
                table: "contents",
                query: {$or: [ { content: {$in: ["home", "subfooter"] } }, {content: "aboutus", branch: "main"} ]},
                extra: global.extras.contents
            },
            {
                table: "kidservices"
            },
            {
                table: "categories"   
            }
        ];
        
        //Create async fuctions by the params in tables & queries
        
        
        //Async call handler that activates after all tasks are finished.
        global.callAsyncAll(callsets,data).then(function(results){
            data.breadcrumbs = req.breadcrumbs();
            console.log("Data with all async calls completed", data.kidservices);
            //Send them bitchslaps
            res.render('pages/index',data);
        }).catch(function(error){
            console.log(error);
            res.send(error);
        });
        
    });
    
    app.get("/blog", function(req,res) {res.redirect("/blog/1")});
    
    app.get("/course", function(req,res) {res.redirect("/course/1")});
    
    app.get("/practising", function(req,res) {res.redirect("/practising/1")});
    
    app.get("/workshops", function(req,res) {res.redirect("/workshops/1")});
    
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
                query: req.query.q ? {title: {$regex: req.query.q}} : global.queries.blog,
                extra: function(res){
                    data.subfooter.blog = [res[0]];
                    data.allTags = global.getAllTags(res);
                    res = global.paginate(res, data);
                    res.forEach(function(val){
                        val.body = striptags(val.body).subword(0,200);
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
                extra: function(res){
                    var ret = global.extras.contents(res);
                    ret.subbanner = ret.subbanner.blog;
                    return ret;
                }
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
                    data.allTags = global.getAllTags(res);
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
                extra: function(res){
                    var ret = global.extras.contents(res);
                    ret.subbanner = ret.subbanner.blogdetails;
                    return ret;
                }
            },
            {
                table: "categories"
            }
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
    
    app.get("/practising/:page", function(req,res){
        var data = {}; 
        data.pageSize = 5, data.page = req.params.page, data.isListing = true, data.subfooter = {};
        //Database calling parameters
        
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            {
                table: "categories",
                extra: function(res){
                    return res;
                }
            },
            {
                table: "courses",
                query: { categoryID: "952ee4cd940ea884"},
                extra: function(res){
                    data.allTags = global.getAllTags(res);
                    res = global.paginate(res, data);
                    res.forEach(function(val){
                        val.body = striptags(val.body).subword(0,200);
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
                extra: function(res){
                    var ret = global.extras.contents(res);
                    ret.subbanner = ret.subbanner.courses;
                    return ret;
                }
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

    app.get("/workshops/:page", function(req,res){
        var data = {}; 
        data.pageSize = 5, data.page = req.params.page, data.isListing = true, data.subfooter = {};
        //Database calling parameters
        
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            {
                table: "categories",
                extra: function(res){
                    return res;
                }
            },
            {
                table: "courses",
                query: { categoryID: "2e30c4295ed8483a"},
                extra: function(res){
                    data.allTags = global.getAllTags(res);
                    res = global.paginate(res, data);
                    res.forEach(function(val){
                        val.body = striptags(val.body).subword(0,200);
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
                extra: function(res){
                    var ret = global.extras.contents(res);
                    ret.subbanner = ret.subbanner.courses;
                    return ret;
                }
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

    //Couse Listing Route
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
                table: "categories",
                extra: function(res){
                    return res;
                }
            },
            {
                table: "courses",
                extra: function(res){
                    data.allTags = global.getAllTags(res);
                    res = global.paginate(res, data);
                    res.forEach(function(val){
                        val.body = striptags(val.body).subword(0,200);
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
                extra: function(res){
                    var ret = global.extras.contents(res);
                    ret.subbanner = ret.subbanner.courses;
                    return ret;
                }
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
    
    //Course Detail Route
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
                extra: function(res){
                    var ret = global.extras.contents(res);
                    ret.subbanner = ret.subbanner.coursesdetails;
                    return ret;
                }
            },
            {
                table: "courses",
                query: { id: req.params.id },
            },
            {
                table: "userinfo",
                query: { role: "Instructor" },
            },
            {
                table:"categories"
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
    
    app.get('/:content/:branch', function (req, res, next) {
        
        //Get entries by using dpd param.
        var data = {};
        
        //Create async fuctions by the params in tables & queries
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
                    if(!data.subfooter) data.subfooter = {};
                    data.subfooter.blog = [res[0]];
                    return res;
                }
            },
            {
                table: "userinfo",
                query: { role: global.roles.Instructor},
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
                table: "slider",
                extra: global.extras.slider
            },
            {
                table: "contents",
                query: { content: {$in: ["home", "subfooter", req.params.content]}},
                extra: function(res){
                    var ret = global.extras.contents(res);
                    ret.subbanner = ret[req.params.content].main,
                    ret.descriptive = [ret[req.params.content][req.params.branch]]
                    return ret;
                }
                
            },
            {
                table: "skills",
                extra: global.extras.skills
            },
            {
                table: "sponsors"
            }
        ];
        
        //Async call handler that activates after all tasks are finished.
        global.callAsyncAll(callsets,data).then(function(results){
            data.breadcrumbs = req.breadcrumbs();
            console.log("Data with all async calls completed", data);
            //Send them bitchslaps
            res.render('pages/descriptive',data);
        }).catch(function(error){
            res.send(error);
        });
        
    });
    
    
    //Image Uploading API
    app.post('/upload', upload.single('file'), function (req, res, next) {
        res.send({status:true,message:'Uploaded'});
    });
    //Subscribe API
    app.post('/subscribe', function (req, res, next) {
        var status;
        console.log(req.body);
        if(req.body.email){
            dpd.subscribers.post({email: req.body.email}).then(function(success){
                status = success;
            }, function(error){
                status = error;
            })
        }
        res.send({status: status});
    });
};

module.exports = Routes;