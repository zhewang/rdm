///////////////////////////////////////////////
// NanoCube query helpers
///////////////////////////////////////////////

var nc = {};

nc.query = function (q, f) {
    console.log("------------------------");
    var start = new Date().getTime();
    $.getJSON(q, function(data) {
        var mid = new Date().getTime();
        console.log("Query Time: "+(mid-start)+"ms");
        f(data);
    });
};
