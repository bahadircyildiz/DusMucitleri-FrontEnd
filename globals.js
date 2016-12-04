var global = function(dpd,Q){
    return {
        instructorIDs: ["b11cb1c5be508b49", "04362a43cbb648f1", "f820abc77c5969d5", "d0cb61d7abe48b51"],
        queries : {
            navigation: {$sort: {order : 1}},
            settings: { $limit: 1}
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
            }
        },
        callAsyncAll : function(inputs, outputs){
            //Create async fuctions by the params in tables & queries
            inputs.tables.forEach(function(val){
                var query = inputs.queries[val] || {};
                query.active = true;
                var deferred = Q.defer();
                outputs.calls.push( 
                    dpd[val].get(query).then(function(results){
                        if(inputs.extras[val]) results = inputs.extras[val](results);
                        outputs.data[val] = results;
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