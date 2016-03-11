var nanocube_server_url = 'http://localhost:29512/';
var quadtree_level = 25;
var variable_schema = ['count', '0', '1', '2', '0*0', '0*1', '0*2', '1*1', '1*2', '2*2'];
nc.setup(variable_schema);

var diveLevel = 3;

d3.json("/static/data.json", function(data) {
    plot(data);
});

// Assume X binSize == Y binSize
function plot(data, binSize) {
    var xExtent = d3.extent(data, function(row) {
        return row[0];
    });
    var yExtent = d3.extent(data, function(row) {
        return row[1];
    });
    xExtent = [0,10];
    yExtent = [0,10];

    var plotWidth = 500;
    var plotHeight = 500;

    var margin = { top: 10, right: 10, bottom: 30, left: 30 };

    var svgSel = d3.select("#heatmap")
        .append("svg")
        .attr("width", plotWidth)
        .attr("height", plotHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top+ ")");

    var contentWidth = plotWidth-margin.left-margin.right;
    var contentHeight = plotHeight-margin.top-margin.bottom;

    var xScale = d3.scale.linear().domain(xExtent).range([0, contentWidth]);
    var yScale = d3.scale.linear().domain(yExtent).range([contentHeight, 0]);

    var q = nanocube_server_url+'/count.a("location",dive(tile2d(0,0,0),'+diveLevel+'),"img")'
    nc.query(q, function(d){
        var data = d.root.children;

        var gridXSize = (plotWidth-margin.left-margin.right)/Math.pow(2,diveLevel);
        var gridYSize = (plotHeight-margin.top-margin.bottom)/Math.pow(2,diveLevel);

        var binSel = svgSel.selectAll("rect").data(data).enter()
        .append("rect")
        .call(setBin);

        function setBin(sel) {
            sel.attr("fill", function(d) {
                var r = Math.floor(d.val.cov_matrix[0][0]*10);
                var g = Math.floor(d.val.cov_matrix[1][1]*10);
                var b = Math.floor(d.val.cov_matrix[2][2]*10);
                return 'rgb({0},{1},{2})'.format(r,g,b);
            })
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("x", function(d) {
                return d.x*gridXSize;
            })
            .attr("y", function(d) {
                return plotHeight-margin.top-margin.bottom-(d.y+1)*gridYSize;
            })
            .attr("width", gridXSize)
            .attr("height", gridYSize)
            .on("click", function(d) {
                console.log(d);
            });
        }

    });


    var xAxis = d3.svg.axis().scale(xScale).ticks(10);
    var yAxis = d3.svg.axis().scale(yScale).ticks(10);

    var svg = d3.select("#heatmap").select('svg');
    svg.append("g")
    .attr("transform", "translate("+margin.left+", "+(contentHeight+margin.top).toString()+")")
    .call(xAxis);

    yAxis.orient("left");
    svg.append("g")
    .attr("transform", "translate("+margin.left+", "+margin.top+")")
    .call(yAxis);

}

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}
