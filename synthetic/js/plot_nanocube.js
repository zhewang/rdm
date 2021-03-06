var nanocube_server_url = 'http://hdc.cs.arizona.edu/nanocube/10010/';
var quadtree_level = 25;
var variable_schema = ['count', '0', '1', '2', '0*0', '0*1', '0*2', '1*1', '1*2', '2*2'];
nc.setup(variable_schema);

d3.json("./data/data.json", function(data) {
    //plot2DScatter(data);

    plotXYHeatmap(data, 50);

    nc.query(nanocube_server_url+'count.a("test_category",dive([],1))', function(d){
        console.log(d);
        plotHist(d);
    });

});

function plotHist(data) {
    data = data.root.children;
    var plotWidth = 400;
    var plotHeight = 300;

    var svgSel = d3.select('#histogram').append('svg').
        attr('width', plotWidth).
        attr('height', plotHeight);

    var xExtent = d3.extent(data, function(row) {
        return row.val.count;
    });

    var xScale = d3.scale.linear().domain([0, 16]).range([50, plotWidth - 30]);
    var yScale = d3.scale.linear().domain([0, xExtent[1]*1.1]).range([plotHeight - 30, 30]);

    var barSel = svgSel.selectAll("rect").data(data).enter().append("rect");
    barSel.attr('x', function(d, i){ return xScale((i+1)*2);}).
          attr('y', function(d){ return yScale(d.val.count);}).
          attr('width', 30).
          attr('height', function(d){ return plotHeight-30-yScale(d.val.count); }).
          attr('fill', 'steelblue').
          attr('stroke', 'black');

    barSel.on("mouseenter", function(d){
        query_categorty(d.path, plotPCA);
    });

    var xAxis = d3.svg.axis().scale(xScale).ticks(0);
    var yAxis = d3.svg.axis().scale(yScale).ticks(5);
    svgSel.append("g")
    .attr("transform", "translate(0, " + (plotHeight - 30).toString() + ")")
    .call(xAxis);

    yAxis.orient("left");
    svgSel.append("g")
    .attr("transform", "translate(50, 0)")
    .call(yAxis);
}

var xExtent;
var yExtent;
function plot2DScatter(data) {
    var plotWidth = 500;
    var plotHeight = 500;

    var svgSel = d3.select('#scatterplot').append('svg').
        attr('width', plotWidth).
        attr('height', plotHeight);

    xExtent = d3.extent(data, function(row) {
        return row[0];
    });
    yExtent = d3.extent(data, function(row) {
        return row[1];
    });

    var xScale = d3.scale.linear().domain(xExtent).range([50, plotWidth - 30]);
    var yScale = d3.scale.linear().domain(yExtent).range([plotHeight - 30, 30]);
    var xAxis = d3.svg.axis().scale(xScale).ticks(10);
    var yAxis = d3.svg.axis().scale(yScale).ticks(10);

    var circleSel = svgSel.selectAll("circle").data(data).enter();

    circleSel.append("circle").
        attr('fill', 'red').
        attr("fill-opacity", 0.3).
        attr('cx', function(d){return xScale(d[0])}).
        attr('cy', function(d){return yScale(d[1])}).
        attr('r', 3);

    svgSel.append("g")
    .attr("transform", "translate(0, " + (plotHeight - 30).toString() + ")")
    .call(xAxis);

    yAxis.orient("left");
    svgSel.append("g")
    .attr("transform", "translate(50, 0)")
    .call(yAxis);

    // Brush
    var brush = svgSel.append("g")
        .attr("class", "brush")
        .call(d3.svg.brush()
        .x(xScale)
        .y(yScale)
        .on("brush", brushmove)
        .on("brushend", brushend));
}

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
    xExtent = d3.extent(data, function(row) {
        return row[0];
    });
    yExtent = d3.extent(data, function(row) {
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

    // Brush
    var brush = svg.append("g")
        .attr("class", "brush")
        .call(d3.svg.brush()
        .x(xScale)
        .y(yScale)
        .on("brush", brushmove)
        .on("brushend", brushend));

}

function brushmove() {
    var extent = d3.event.target.extent();
    query_quadtree(extent, xExtent, yExtent, plotPCA);
}

function brushend() {
    if (d3.event.target.empty()) {
        var q = nanocube_server_url+'count';
        nc.query(q, plotPCA);
    }
}

function plotPCA(m) {
    if(typeof m === 'undefined') {
        return;
    }
    var plotWidth = 500;
    var plotHeight = 50;

    d3.select('#pcaresult').select('svg').remove();
    var svgSel = d3.select('#pcaresult').append('svg').
        attr('width', plotWidth).
        attr('height', plotHeight);
    svgSel.append('text')
        .attr('x', 10)
        .attr('y', 10)
        .text(m)
        .attr("font-size", "10px");
    console.log(m);
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


function query_quadtree(extent, xExtent, yExtent, handleFunc) {
    var n = Math.pow(2, quadtree_level);
    var xRange = xExtent[1]-xExtent[0];
    var yRange = yExtent[1]-yExtent[0];
    var lowXTile = Math.min(n,Math.floor((Math.max(0,extent[0][0]-xExtent[0])/xRange)*n));
    var lowYTile = Math.min(n,Math.floor((Math.max(0,extent[0][1]-xExtent[0])/xRange)*n));
    var upXTile = Math.min(n,Math.floor((Math.max(0,extent[1][0]-yExtent[0])/yRange)*n));
    var upYTile = Math.min(n,Math.floor((Math.max(0,extent[1][1]-yExtent[0])/yRange)*n));

    var query = nanocube_server_url+'/count.r("location",range2d(tile2d({0},{1},{4}),tile2d({2},{3},{4})))'.format(lowXTile,lowYTile,upXTile,upYTile,quadtree_level);

    nc.query(query, handleFunc);
}

function query_categorty(c_id, handleFunc) {
    var query = nanocube_server_url+'/count.r("test_category",set(['+c_id+']))'
    nc.query(query, handleFunc);
};
