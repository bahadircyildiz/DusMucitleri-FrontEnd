// Authentication
if(!me){
    cancel("you are not authorized to do that!",402);
}

var now = new Date();

this.date = now.toDateString() +" "+ now.toTimeString().split(" ")[0];
this.timeStamp = now.getTime();

