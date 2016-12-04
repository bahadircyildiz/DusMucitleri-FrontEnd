var helpers = {
        if_eq: function(a, b, options){
            if(a == b) return options.fn(this);
            else return options.inverse(this);
        },
        coursetags: function (coursetags = [], options){
            var index = "";
            var allcoursetags = options.data.root.settings.allcoursetags;
            coursetags.forEach(function(val){
                index += allcoursetags.indexOf(val) + " ";
            });
            return index;
        },
        getInstructor: function(id, options){
            var result;
            options.data.root.instructors.forEach(function(val){
                if(val.id == id) result = val;
            });
            return options.fn(result);
        },
        math: function(lvalue, operator, rvalue, options) {
            lvalue = parseFloat(lvalue);
            rvalue = parseFloat(rvalue);
                
            return {
                "+": lvalue + rvalue,
                "-": lvalue - rvalue,
                "*": lvalue * rvalue,
                "/": lvalue / rvalue,
                "%": lvalue % rvalue
            }[operator];
        },
        count: function(array, count, options){
            var res = '';
            for(var x=0; x<count; x++){
                res += options.fn(array[x]);   
            }
            return res;
        }
}

module.exports = helpers;