var nanocube_server_url = 'http://localhost:29512/';
var quadtree_level = 25;
var variable_schema = ['count', '0', '1', '2', '0*0', '0*1', '0*2', '1*1', '1*2', '2*2'];
nc.setup(variable_schema);


$(document).ready(function(){
    var sel = d3.select('#levelChange');
    sel.selectAll('option').data([0,1,2,3,4,5,6,7,8]).enter()
    .append('option')
    .attr('value', function(d){ return d;})
    .text(function(d){ return d;});

    sel.on('change', function(d){
        plot(this.value);
    });

    plot();
});

function plot(diveLevel=5) {
    var xExtent = [0,10];
    var yExtent = [0,10];

    var plotWidth = 600;
    var plotHeight = 600;

    var margin = { top: 30, right: 30, bottom: 30, left: 30 };

    d3.select("#heatmap").selectAll("svg").remove();
    d3.select("#heatmap").selectAll("rect").remove();
    var svgSel = d3.select("#heatmap")
        .append("svg")
        .attr("width", plotWidth)
        .attr("height", plotHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top+ ")");

    var contentWidth = plotWidth-margin.left-margin.right;
    var contentHeight = plotHeight-margin.top-margin.bottom;

    var gridXSize = Math.floor(contentWidth/Math.pow(2,diveLevel));
    var gridYSize = Math.floor(contentHeight/Math.pow(2,diveLevel));

    // Update the width and height because grid size id converted to integer, so
    // gridSize*number_of_bins is changed
    contentWidth = gridXSize*Math.pow(2,diveLevel);
    contentHeight = gridYSize*Math.pow(2,diveLevel);

    var xScale = d3.scale.linear().domain(xExtent).range([0, contentWidth]);
    var yScale = d3.scale.linear().domain(yExtent).range([contentHeight, 0]);

    // Draw the axis
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

    // Draw the heatmap
    var q = nanocube_server_url+'/count.a("location",dive(tile2d(0,0,0),'+diveLevel+'),"img")'
    nc.query(q, function(d){
        var data = d.root.children;

        var binSel = svgSel.selectAll("rect").data(data).enter()
        .append("rect")
        .call(setBin);

        function getColor (d) {
            var r = Math.floor(d.val.cov_matrix[0][0]*10);
            var g = Math.floor(d.val.cov_matrix[1][1]*10);
            var b = Math.floor(d.val.cov_matrix[2][2]*10);
            return 'rgb({0},{1},{2})'.format(r,g,b);
        };

        function setBin(sel) {
            sel.attr("fill", function(d){return getColor(d)})
            .attr("x", function(d) {
                return d.x*gridXSize;
            })
            .attr("y", function(d) {
                return contentHeight-(d.y+1)*gridYSize;
            })
            .attr("width", gridXSize)
            .attr("height", gridYSize)
            .on("click", function(d) {
                if(d3.select(this).classed('selected') == false) {
                    sel.attr('opacity', '0.5');
                    d3.select(this)
                    .attr('opacity', '1.0');
                    d3.select(this).classed('selected', true);
                } else {
                    d3.select(this).classed('selected', false);
                    sel.attr('opacity', '1.0');
                }
                console.log(d);
            });
        }

    });
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
