var Routes = function(app,dpd){
    
    app.get('/', function (req, res) {
        res.render('pages/index',{a:"naber",username:"TOLGA"});
        // res.send("Hello")
    });
    
    app.get("/dpd",function(req,res){
        dpd.navigation.get(function(results, err) {
            console.log("DATA:",results);
            res.send(results);
        });
    })

}

module.exports = Routes;