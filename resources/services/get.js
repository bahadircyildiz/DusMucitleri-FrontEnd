if(this.instructorID){
    dpd.userinfo.get({id: this.instructorID}).then(function(success){
        this.instructor = success;
    },function(err){
        this.instructor = err;
    })
}
