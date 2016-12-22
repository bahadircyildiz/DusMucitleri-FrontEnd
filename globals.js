var global = function(dpd,Q){
    return {
        queries : {
            navigation: {$sort: {order : 1}},
            settings: { $limit: 1},
            blog: {$sort: {timeStamp : -1}}
        },
        extras: {
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
            navigation: function(res){
                var papas = [], kids = [];
                res.forEach(function(val, index){
                    if(!val.parentID) papas.push(val);
                    else kids.push(val);
                })
                console.log("Papas", papas, "Kids", kids);
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
            }
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