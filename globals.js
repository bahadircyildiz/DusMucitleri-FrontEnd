var global = function(dpd,Q){
    return {
        instructorIDs: ["b11cb1c5be508b49", "04362a43cbb648f1", "f820abc77c5969d5", "d0cb61d7abe48b51"],
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
                res.forEach(function(val,index){
                    if(val.parent){
                        res.forEach(function(parent, pIndex){
                            if(parent.id == val.parent){
                                if(!parent.children) parent.children = [];
                                parent.children.push(val);
                                res.splice(index, 1);
                            }
                        })
                    }
                    
                });
                return res;
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
        callAsyncAll : function(callsets, outputs){
            var self = this;
            //Create async fuctions by the params in tables & queries
            callsets.forEach(function(call){
                var query = call.query || self.queries[call.table] || {};
                query.active = true;
                var deferred = Q.defer();
                outputs.calls.push( 
                    dpd[call.table].get(query).then(function(results){
                        if(call.extra) results = call.extra(results);
                        outputs.data[call.table] = results;
                        deferred.resolve(results);
                        return deferred.promise;
                    }, function(error){
                        deferred.reject(error);
                        return deferred.promise;
                    })
                );
            });
        }
    };
}
module.exports = global;