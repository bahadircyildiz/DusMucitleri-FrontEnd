String.prototype.subword = function(first, last){
    var trimmedString = this.substr(first, last);
    //re-trim if we are in the middle of a word
    trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")));
    return trimmedString;
}

String.prototype.getImageID = function(){
    return this.split("/").pop();
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
        var data = {},
        
        callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            [
                {
                    table: "essaycat",
                    extra: global.extras.c_catList
                },
                {
                    table: "essays",
                    // query: {$sort: { timeStamp: -1 } },
                    extra: function(res){
                        var ret = {};
                        res.forEach(function(val){
                            val.body = striptags(val.body).subword(0, 100);
                            val.image ? val.image = global.thumbnailByHeight(250, val.image) : null;
                            val.timeStamp ? val.timeStamp = global.changeTimeFormat(val.timeStamp): null;
                            console.log(val.categoryID);
                            var cat = data.essaycat[val.categoryID].title;
                            if(!ret[cat]) ret[cat] = [];
                            ret[cat].push(val);
                        })
                        ret.subfooter = ret.Blog[0];
                        return ret;
                    }
                }
            ],
            {
                table: "userinfo",
                query: { role: global.roles.Instructor},
            },
            [
                {
                    table: "servicecat",
                    extra: function(res){
                        data.serviceCatList = global.extras.c_catList(res);
                        return res;
                    }
                },
                {
                    table: "services",
                    // query: {$sort: { timeStamp: -1 } },
                    extra: function(res){
                        var ret = {};
                        res.forEach(function(val){
                            val.body = striptags(val.body).subword(0, 100);
                            val.image ? val.image = global.thumbnailByHeight(150, val.image) : null;
                            val.timeStamp ? val.timeStamp = global.changeTimeFormat(val.timeStamp): null;
                            var cat = data.serviceCatList[val.categoryID].title;
                            if(cat == "Yetenek Geliştirme") val.apply = false;
                            else val.apply = true;
                        });
                        // ret.subfooter = ret.Blog[0];
                        return res;
                    }
                }
            ],
            // {  
            //     table: "services",
            //     extra: function(res){
            //         res.forEach(function(val){
            //             val.body = striptags(val.body).subword(0,100);
            //             val.image ? val.image = global.thumbnailByHeight(150, val.image) : null;
            //         })
            //         return res;
            //     }
            // },
            // {
            //     table: "servicecat"
            //     // extra: function(res){
            //     //     data.serviceCatList = global.extras.c_catList;
            //     //     return res;
            //     // }
            // },
            {
                table: "navigation",
                extra: global.extras.navigation
            },
            {
                table: "offers"
            },
            [
                {
                    table: "imagecat",
                    extra: global.extras.c_catList
                },
                {
                    table: "images",
                    extra : function(res){
                        var ret = {}
                        res.forEach(function(val, index){
                            var cat = data.imagecat[val.categoryID].title;
                            if(!ret[cat]) ret[cat] = [];
                            ret[cat].push(val);
                        });
                        if(ret.Gallery.length > 6) ret.Gallery.splice(0,6);
                        return ret;
                    }
                }
            ],
            {
                table: "contents",
                query: {$or: [ { content: {$in: ["home", "subfooter"] } }, {content: "aboutus", branch: "main"} ]},
                extra: global.extras.contents
            },
            {
                table: "kidservices"
            },
            {
                table: "sponsors"   
            }
        ];
        //Create async fuctions by the params in tables & queries
        
        //Async call handler that activates after all tasks are finished.
        global.callAsyncAll(callsets,data).then(function(results){
            data.breadcrumbs = req.breadcrumbs();
            console.log(data.essaycat);
            // console.log(data);
            // divideByCat("essays", "ecarr");
            // divideByCat("images", "icarr");
            // console.log("Data with all async calls completed", data);
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
        data.pageSize = 3, data.page = req.params.page, data.isListing = true, data.subfooter = {};
        //Database calling parameters
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            [
                {
                    table: "essaycat",
                    extra: function(res){
                        var ret = {};
                        res.forEach(function(val){
                            ret[val.title] = val;
                        })
                        data.categories = ret;
                        return ret;
                    }
                },
                {
                    table: "essays",
                    // query: {categoryID: data.essayCatList.Blog.id , $sort: { timeStamp: -1 } },
                    extra: function(res){
                        var ret = [];
                        res.forEach(function(val){
                            if(val.categoryID == data.essaycat.Blog.id) ret.push(val);    
                        })
                        data.allTags = global.getAllTags(ret);
                        if(req.query.tag) ret = global.sortByTag(ret, req.query.tag);
                        ret = global.paginate(ret, data);
                        data.subfooter.blog = [ret[0]];
                        ret.forEach(function(val){
                            val.body = striptags(val.body).subword(0,200);
                            val.timeStamp ? val.timeStamp = global.changeTimeFormat(val.timeStamp): null;
                        });
                        return ret; 
                    }
                }
            ],
            {
                table: "navigation",
                extra: global.extras.navigation
            },
            [
                {
                    table: "imagecat",
                    extra: global.extras.c_catList
                },
                {
                    table: "images",
                    extra : function(res){
                        var ret = {}
                        res.forEach(function(val, index){
                            var cat = data.imagecat[val.categoryID].title;
                            if(!ret[cat]) ret[cat] = [];
                            ret[cat].push(val);
                        });
                        return ret;
                    }
                }
            ],
            {
                table: "contents",
                query: { $or: [{content: "subbanner", branch: "blog"}, {content: "subfooter"}]},
                extra: function(res){
                    var ret = global.extras.contents(res);
                    ret.subbanner = ret.subbanner.blog;
                    return ret;
                }
            }
        ]
        
        //Create async fuctions by the params in tables & queries
        global.callAsyncAll(callsets,data).then(function(results){
            //Send them bitchslaps
            if(data.page < 1 || data.page > data.lastPage) res.redirect("/");
            else {
                req.breadcrumbs("Tüm Bloglar");
                data.breadcrumbs = req.breadcrumbs();
                // console.log("Data with all async calls completed", data);
                res.render('pages/post',data);
            }
        }).catch(function(error){
            console.log("Hata var hocam", error);
            res.send(error);
        });
    });
    
    app.get("/news/:page",function(req,res){
        var data = {};
        data.pageSize = 3, data.page = req.params.page, data.isListing = true, data.subfooter = {};
        //Database calling parameters
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            [
                {
                    table: "essaycat",
                    extra: function(res){
                        var ret = {};
                        res.forEach(function(val){
                            ret[val.title] = val;
                        })
                        data.categories = ret;
                        return ret;
                    }
                },
                {
                    table: "essays",
                    // query: {categoryID: data.essayCatList.Blog.id , $sort: { timeStamp: -1 } },
                    extra: function(res){
                        var ret = [];
                        res.forEach(function(val){
                            if(val.categoryID == data.essaycat.Haberler.id) ret.push(val);    
                        })
                        data.allTags = global.getAllTags(ret);
                        if(req.query.tag) ret = global.sortByTag(ret, req.query.tag);
                        ret = global.paginate(ret, data);
                        data.subfooter.blog = [ret[0]];
                        ret.forEach(function(val){
                            val.body = striptags(val.body).subword(0,200);
                            val.timeStamp ? val.timeStamp = global.changeTimeFormat(val.timeStamp): null;
                        });
                        return ret; 
                    }
                }
            ],
            {
                table: "navigation",
                extra: global.extras.navigation
            },
            [
                {
                    table: "imagecat",
                    extra: global.extras.c_catList
                },
                {
                    table: "images",
                    extra : function(res){
                        var ret = {};
                        res.forEach(function(val, index){
                            var cat = data.imagecat[val.categoryID].title;
                            if(!ret[cat]) ret[cat] = [];
                            ret[cat].push(val);
                        });
                        return ret;
                    }
                }
            ],
            {
                table: "contents",
                query: { $or: [{content: "subbanner", branch: "news"}, {content: "subfooter"}]},
                extra: function(res){
                    var ret = global.extras.contents(res);
                    ret.subbanner = ret.subbanner.news;
                    return ret;
                }
            }
        ]
        
        //Create async fuctions by the params in tables & queries
        global.callAsyncAll(callsets,data).then(function(results){
            //Send them bitchslaps
            if(data.page < 1 || data.page > data.lastPage) res.redirect("/");
            else {
                req.breadcrumbs("Tüm Bloglar");
                data.breadcrumbs = req.breadcrumbs();
                // console.log("Data with all async calls completed", data);
                res.render('pages/post',data);
            }
        }).catch(function(error){
            console.log("Hata var hocam", error);
            res.send(error);
        });
    });
    
    //tagged acilcak
    
    app.get("/content/tagged/:tag/:page",function(req,res){
        var data = {};
        data.pageSize = 3, data.page = req.params.page, data.isListing = true, data.subfooter = {};
        //Database calling parameters
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            [
                {
                    table: "essaycat",
                    extra: function(res){
                        var ret = {};
                        res.forEach(function(val){
                            ret[val.title] = val;
                        })
                        data.categories = ret;
                        return ret;
                    }
                },
                {
                    table: "essays",
                    // query: {categoryID: data.essayCatList.Blog.id , $sort: { timeStamp: -1 } },
                    extra: function(res){
                        data.allTags = global.getAllTags(res);
                        if(req.params.tag) res = global.sortByTag(res, req.params.tag);
                        res = global.paginate(res, data);
                        data.subfooter.blog = [res[0]];
                        res.forEach(function(val){
                            val.body = striptags(val.body).subword(0,200);
                            val.timeStamp ? val.timeStamp = global.changeTimeFormat(val.timeStamp): null;
                        });
                        return res; 
                    }
                }
            ],
            {
                table: "navigation",
                extra: global.extras.navigation
            },
            [
                {
                    table: "imagecat",
                    extra: global.extras.c_catList
                },
                {
                    table: "images",
                    extra : function(res){
                        var ret = {};
                        res.forEach(function(val, index){
                            var cat = data.imagecat[val.categoryID].title;
                            if(!ret[cat]) ret[cat] = [];
                            ret[cat].push(val);
                        });
                        return ret;
                    }
                }
            ],
            {
                table: "contents",
                query: { $or: [{content: "subbanner", branch: "news"}, {content: "subfooter"}]},
                extra: function(res){
                    var ret = global.extras.contents(res);
                    ret.subbanner = ret.subbanner.news;
                    return ret;
                }
            }
        ]
        
        //Create async fuctions by the params in tables & queries
        global.callAsyncAll(callsets,data).then(function(results){
            //Send them bitchslaps
            if(data.page < 1 || data.page > data.lastPage) res.redirect("/");
            else {
                req.breadcrumbs("Tüm Bloglar");
                data.breadcrumbs = req.breadcrumbs();
                // console.log("Data with all async calls completed", data);
                res.render('pages/post',data);
            }
        }).catch(function(error){
            console.log("Hata var hocam", error);
            res.send(error);
        });
    });
    
    //Blog Detail Route
    app.get("/content/details/:id",function(req,res){
        var data = {};
        data.isListing = false, data.subfooter = {};
        
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            {
                table: "essays",
                extra: function(res){
                    data.subfooter.blog = res;
                    data.allTags = global.getAllTags(res);
                    res.some(function(val){
                        if (val.id == req.params.id){
                            res = val;
                            val.timeStamp ? val.timeStamp = global.changeTimeFormat(val.timeStamp): null;
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
                table: "images",
                extra: global.extras.images
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
                table: "essaycat"
            }
        ]
        
        //Create async fuctions by the params in tables & queries
        global.callAsyncAll(callsets,data).then(function(results){
            if(!data.essays) res.redirect("/");
            else{
                req.breadcrumbs(data.essays.title);
                
                data.breadcrumbs = req.breadcrumbs();
                // console.log("Data with all async calls completed", data);
                res.render('pages/post',data);
            }
        }).catch(function(error){
            console.log("Hata var hocam", error);
            res.send(error);
        });
        
    });
    
    
    app.get("/practising/:page", function(req,res){
        var data = {}; 
        data.pageSize = 3, data.page = req.params.page, data.isListing = true, data.subfooter = {};
        //Database calling parameters
        
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            {
                table: "servicecat",
            },
            {
                table: "services",
                query: { categoryID: "952ee4cd940ea884", $sort: {order : 1}},
                extra: function(res){
                    data.allTags = global.getAllTags(res);
                    res = global.paginate(res, data);
                    res.forEach(function(val){
                        val.body = striptags(val.body).subword(0,200);
                    });
                    data.practising = true;
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
                table: "images",
                query: {$limit: 6},
                extra: global.extras.images
            },
            {
                table: "contents",
                query: { $or: [{content: "subbanner", branch: "practising"}, {content: "subfooter"}]},
                extra: function(res){
                    var ret = global.extras.contents(res);
                    ret.subbanner = ret.subbanner.practising;
                    return ret;
                }
            },
            {
                table: "essays",
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
                // req.breadcrumbs("Tüm Kurslar");
                data.breadcrumbs = req.breadcrumbs();
                // console.log("Data with all async calls completed", data);
                res.render('pages/post',data);
            }
            
        }).catch(function(error){
            console.log("Hata var hocam", error);
            res.send(error);
        });
    });

    app.get("/workshops/:page", function(req,res){
        var data = {}; 
        data.pageSize = 3, data.page = req.params.page, data.isListing = true, data.subfooter = {};
        //Database calling parameters
        
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            {
                table: "servicecat",
                extra: function(res){
                    return res;
                }
            },
            {
                table: "services",
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
                table: "images",
                query: {$limit: 6},
                extra: global.extras.images
            },
            {
                table: "contents",
                query: { $or: [{content: "subbanner", branch: "workshops"}, {content: "subfooter"}]},
                extra: function(res){
                    var ret = global.extras.contents(res);
                    ret.subbanner = ret.subbanner.workshops;
                    return ret;
                }
            },
            {
                table: "essays",
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
                // req.breadcrumbs("Tüm Kurslar");
                data.breadcrumbs = req.breadcrumbs();
                // console.log("Data with all async calls completed", data);
                res.render('pages/post',data);
            }
            
        }).catch(function(error){
            console.log("Hata var hocam", error);
            res.send(error);
        });
    });

    //Couse Listing Route
    app.get("/courses/:page",function(req,res){
        var data = {}; 
        data.pageSize = 3, data.page = req.params.page, data.isListing = true, data.subfooter = {};
        //Database calling parameters
        
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            {
                table: "servicecat",
                extra: function(res){
                    return res;
                }
            },
            {
                table: "services",
                query: { categoryID: "5c7d031753309898", $sort: {order : 1}},
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
                table: "images",
                query: {$limit: 6},
                extra: global.extras.images
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
                table: "essays",
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
                // req.breadcrumbs("Tüm Kurslar");
                data.breadcrumbs = req.breadcrumbs();
                // console.log("Data with all async calls completed", data);
                res.render('pages/post',data);
            }
            
        }).catch(function(error){
            console.log("Hata var hocam", error);
            res.send(error);
        });
    });
    
    //Course Detail Route
    app.get("/service/details/:id",function(req,res){
        var data = {};
        data.isListing = false, data.subfooter = {};
        
        var callsets = [
            {
                table: "settings",
                extra: global.extras.settings
            },
            {
                table: "essays",
                extra: function(res){
                    data.subfooter.blog = [res[0]];
                }
            },
            {
                table: "navigation",
                extra: global.extras.navigation
            },
            {
                table: "images",
                extra: global.extras.images
            },
            {
                table: "contents",
                query: { $or: [{content: "subbanner", branch: "servicedetails"}, {content: "subfooter"}]},
                extra: function(res){
                    var ret = global.extras.contents(res);
                    ret.subbanner = ret.subbanner.servicedetails;
                    return ret;
                }
            },
            {
                table: "services",
                query: { id: req.params.id },
            },
            {
                table:"servicecat"
            }
            
        ]
        
        //Create async fuctions by the params in tables & queries
        global.callAsyncAll(callsets,data).then(function(results){
            //Send them bitchslaps
            //We should totally start our fucking company! :D
            if(!data.services) res.redirect("/");
            else {
                req.breadcrumbs(data.services.title);
                data.breadcrumbs = req.breadcrumbs();
                // console.log("Data with all async calls completed", data);
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
                table: "essays",
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
                table: "images",
                extra: global.extras.images
            },
            {
                table: "contents",
                query: { content: {$in: ["home", "subfooter", req.params.content, "subbanner"]}},
                extra: function(res){
                    var ret = global.extras.contents(res);
                    ret.subbanner = ret[req.params.content].main,
                    ret.descriptive = [ret[req.params.content][req.params.branch]]
                    return ret;
                }
                
            },
            {
                table: "sponsors"
            }
        ];
        
        //Async call handler that activates after all tasks are finished.
        global.callAsyncAll(callsets,data).then(function(results){
            data.breadcrumbs = req.breadcrumbs();
            // console.log("Data with all async calls completed", data);
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
        // console.log(req.body);
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