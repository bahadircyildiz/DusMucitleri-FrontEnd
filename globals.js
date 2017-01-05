var global = function(dpd,Q){
    return {
        roles : {
            Admin: "e8c3e2161a60ca0a", 
            Moderator:"4661206640e8e8af", 
            Psychologist: "482d6b0a03ba09dd", 
            Student: "23a36107a3a89a0f", 
            Parent: "56027a4997be69e4", 
            Instructor: "f50e89a29481f8e6"
        },
        queries : {
            navigation: {$sort: {order : 1}},
            settings: { $limit: 1},
            blog: {$sort: {timeStamp : -1}},
            slider: {$sort: {order : 1}}
        },
        extras: {
            settings: function(res){
                //Arranging keywords for further SEO optimizations
                if(res[0].siteKeywords){
                    var arr = res[0].siteKeywords, kw = "";
                    arr.forEach(function(key, index){
                        kw += key;
                        if(arr.length - 1 != index) kw += ",";
                    });
                    res[0].siteKeywords = kw;
                }
                return res[0];
            },
            navigation: function(res){
                var papas = [], kids = [];
                res.forEach(function(val, index){
                    if(!val.parentID) papas.push(val);
                    else kids.push(val);
                })
                // console.log("Papas", papas, "Kids", kids);
                kids.forEach(function(kid, index){
                    papas.forEach(function(papa, index){
                        if(kid.parentID == papa.id){
                            if(!papa.children) papa.children = [];
                            papa.children.push(kid);
                        }
                    })
                })
                return papas;
            },
            slider: function(res){
                var banner = [], gallery = []; 
                res.forEach(function(val){
                    if(val.isBanner) banner.push(val);
                    else gallery.push(val);
                });
                return {banner: banner, gallery: gallery, subfooter: gallery.slice(0,6)};
            },
            contents: function(res){
                var ret = {};
                res.forEach(function(item){
                    if(!ret[item.content]) ret[item.content] = {}; 
                    ret[item.content][item.branch] = item;
                })
                return ret;
            },
            skills: function(res){
                var left = [], right = [];
                res.forEach(function(val){
                    if(val.isRight) right.push(val);
                    else left.push(val);
                })
                return {left: left, right: right};
            }
        },
        getAllTags: function(res){
            var tags = [], temp = [], temp2 = {};
            res.forEach(function(val){
                if(val.tags) temp = temp.concat(val.tags);
            })
            temp.forEach(function(val){
                if(!temp2[val]) temp2[val] = 1; else temp2[val]++;
            })
            for (var key in temp2) {
                // skip loop if the property is from prototype
                if (!temp2.hasOwnProperty(key)) continue;
                
                var tag = temp2[key];
                tags.push({title: key, amount: tag});
            }
            return tags;
        },
        paginate: function(res, data){
            var $skip = data.pageSize * (data.page - 1), $limit = (res.length - $skip >= data.pageSize) ? data.pageSize : res.length - $skip;
            data.lastPage = Math.ceil(res.length / data.pageSize);
            res = res.slice($skip, $skip+$limit);
            // console.log("All dem zitz", $skip, $limit, data.lastPage, res );
            return res;
        },
        callAsyncAll : function(callsets, data){
            var self = this, prep = [];
            //Create async fuctions by the params in tables & queries
            callsets.forEach(function(call){
                var query = call.query || self.queries[call.table] || {};
                query.active = true;
                var deferred = Q.defer();
                prep.push( 
                    dpd[call.table].get(query).then(function(results){
                        if(call.extra) results = call.extra(results);
                        data[call.table] = results;
                        deferred.resolve(results);
                        return deferred.promise;
                    }, function(error){
                        deferred.reject(error);
                        return deferred.promise;
                    })
                );
            });
            return Q.all(prep);
        }
    };
}
module.exports = global;