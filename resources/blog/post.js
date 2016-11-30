var now = new Date();

this.date = now.toDateString() +" "+ now.toTimeString().split(" ")[0];
this.timeStamp = now.getTime();

