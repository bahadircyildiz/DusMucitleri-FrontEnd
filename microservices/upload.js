var express = require('express');
var router = express.Router();
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })
var fs = require('fs');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
      },
    filename: function (req, file, cb) {
        var fileName = file.originalname;
        var ext = fileName.substr(fileName.lastIndexOf('.') + 1);
        cb(null, new Date().getTime()+"."+ext);
    
    }
}) 

var upload = multer({storage:storage});

router.post('/upload',upload.single('avatar'), function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.send({path:req.file.path})
})

module.exports = router;