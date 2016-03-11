var nanocube_server_url = 'http://localhost:29512/';
var quadtree_level = 25;
var variable_schema = ['count', '0', '1', '2', '0*0', '0*1', '0*2', '1*1', '1*2', '2*2'];
nc.setup(variable_schema);

d3.json("/static/data.json", function(data) {
    var diveLevel = 10;
    var q = nanocube_server_url+'/count.a("location",dive(tile2d(0,0,0),'+diveLevel+'))'
    nc.query(q, function(d){
        console.log(d);
        plotXYHeatmap(data, 50);
    });

});

function plotHeatmap(data, svgSel, plotWidth, plotHeight){
    var data_flatten = []
    for(var i = 0; i < data.length; i ++){
        data_flatten = data_flatten.concat(data[i]);
    }

    var colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb",
                  "#41b6c4","#1d91c0","#225ea8","#253494","#081d58"];
    var extent = d3.extent(data_flatten, function(d) {
        if(d.count != 0)
            return d.count;
    });

    var colorScale = function(count) {
        if(count == 0)
            return '#ffffff';
        var step = (extent[1]-extent[0])/colors.length;
        var index = Math.min(colors.length-1, Math.floor((count-extent[0])/step))
        return colors[index];
    };

    var gridSize = Math.floor(plotWidth / data[0].length);

    function setDotColors(sel) {
        sel.attr("fill", function(d) {
            return colorScale(d.count);
        })
        .attr("stroke", "#f0f0f0")
        .attr("x", function(d, i) {
            var x = (i%data[0].length)*gridSize;
            return x;
        })
        .attr("y", function(d, i) {
            var y = (Math.floor(i/data[0].length))*gridSize;
            return y;
        })
        .attr("width", gridSize)
        .attr("height", gridSize)
        .on("mouseover", function(d) {
            //console.log(d[2]);
        });
    }

    svgSel.selectAll("rect").data(data_flatten).enter()
        .append("rect")
        .call(setDotColors);
}

// Assume X binSize == Y binSize
function plotXYHeatmap(data, binSize) {
    var xExtent = d3.extent(data, function(row) {
        return row[0];
    });
    var yExtent = d3.extent(data, function(row) {
        return row[1];
    });

    var xStep = (xExtent[1]-xExtent[0]) / binSize;
    var yStep = (yExtent[1]-yExtent[0]) / binSize;

    var data_binned = [];
    for(var i = 0; i < binSize; i ++) {
        var r = [];
        for(var j = 0; j < binSize; j ++) {
            r.push({'count':0});
        }
        data_binned.push(r);
    }

    for(var i = 0; i < data.length; i ++) {
        var x = Math.min(Math.floor(data[i][0]/xStep), binSize-1);
        var y = Math.min(Math.floor(data[i][1]/yStep), binSize-1);
        data_binned[y][x].count += 1;
    }


    var margin = { top: 0, right: 0, bottom: 30, left: 30 };
    var plotWidth = 500 - margin.left - margin.right;
    var plotHeight = 500 - margin.top - margin.bottom;

    var svgSel = d3.select("#heatmap")
        .append("svg")
        .attr("width", plotWidth+margin.left+margin.right)
        .attr("height", plotHeight+margin.top+margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.bottom+ ")");
    plotHeatmap(data_binned, svgSel, plotWidth, plotHeight);

    var xScale = d3.scale.linear().domain(xExtent).range([margin.left, plotWidth+10]);
    var yScale = d3.scale.linear().domain(yExtent).range([plotHeight+10, margin.bottom]);

    var xAxis = d3.svg.axis().scale(xScale).ticks(10);
    var yAxis = d3.svg.axis().scale(yScale).ticks(10);

    var svg = d3.select("#heatmap").select('svg');
    svg.append("g")
    .attr("transform", "translate(0, "+(plotHeight+10).toString()+")")
    .call(xAxis);

    yAxis.orient("left");
    svg.append("g")
    .attr("transform", "translate("+margin.left+", 0)")
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
