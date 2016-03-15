//var nanocube_server_url = 'http://hdc.cs.arizona.edu/nanocube/10010/';
var nanocube_server_url = 'http://localhost:29512/';
var quadtree_level = 15;
var variable_schema = ['count', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0*0', '0*1', '0*2', '0*3', '0*4', '0*5', '0*6', '0*7', '0*8', '0*9', '1*1', '1*2', '1*3', '1*4', '1*5', '1*6', '1*7', '1*8', '1*9', '2*2', '2*3', '2*4', '2*5', '2*6', '2*7', '2*8', '2*9', '3*3', '3*4', '3*5', '3*6', '3*7', '3*8', '3*9', '4*4', '4*5', '4*6', '4*7', '4*8', '4*9', '5*5', '5*6', '5*7', '5*8', '5*9', '6*6', '6*7', '6*8', '6*9', '7*7', '7*8', '7*9', '8*8', '8*9', '9*9'];
nc.setup(variable_schema);


$(document).ready(function(){
    var sel = d3.select('#levelChange');
    var levels = [];
    for(var i = 0; i < 10; i ++) {
        levels.push(i);
    }
    sel.selectAll('option').data(levels).enter()
    .append('option')
    .attr('value', function(d){ return d;})
    .text(function(d){ return d;});

    sel.on('change', function(d){
        plot(this.value);
    });

    document.getElementById('levelChange').value=5;
    plot(5);

});


function svg2img(svgID){
    var svg  = document.getElementById(svgID);
    var xml  = new XMLSerializer().serializeToString(svg);
    var data = "data:image/svg+xml;base64," + btoa(xml);
    var img  = new Image();

    img.setAttribute('src', data);
    document.body.appendChild(img);
}

function plot(diveLevel) {
    var xExtent = [12,33];
    var yExtent = [10,33];

    var plotWidth = 500;
    var plotHeight = 500;

    var margin = { top: 30, right: 30, bottom: 30, left: 30 };

    var contentWidth = plotWidth-margin.left-margin.right;
    var contentHeight = plotHeight-margin.top-margin.bottom;

    var gridXSize = Math.max(1,Math.floor(contentWidth/Math.pow(2,diveLevel)+0.5));
    var gridYSize = Math.max(Math.floor(contentHeight/Math.pow(2,diveLevel)+0.5));

    // Update the width and height because grid size id converted to integer, so
    // gridSize*number_of_bins is changed
    contentWidth = gridXSize*Math.pow(2,diveLevel);
    contentHeight = gridYSize*Math.pow(2,diveLevel);

    plotWidth = contentWidth+margin.left+margin.right;
    plotHeight = contentHeight+margin.top+margin.bottom;

    d3.select("#heatmap").selectAll("svg").remove();
    d3.select("#heatmap").selectAll("rect").remove();

    // plot heatmap
    var svgSel = d3.select("#heatmap")
        .append("svg")
        .attr("width", plotWidth)
        .attr("height", plotHeight)
        .attr('viewBox', '0 0 '+plotWidth+' '+plotHeight)
        .attr('id', 'plot')
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top+ ")");

    var xScale = d3.scale.linear().domain(xExtent).range([0, contentWidth]);
    var yScale = d3.scale.linear().domain(yExtent).range([contentHeight, 0]);

    // Draw the axis
    var xAxis = d3.svg.axis().scale(xScale).ticks(10);
    var yAxis = d3.svg.axis().scale(yScale).ticks(10);

    var svg = d3.select("#heatmap").select('svg');
    svg.append("g")
    .attr("transform", "translate("+margin.left+", "+
          (contentHeight+margin.top).toString()+")")
    .call(xAxis);

    yAxis.orient("left");
    svg.append("g")
    .attr("transform", "translate("+margin.left+", "+margin.top+")")
    .call(yAxis);

    var setAxisStyle = function (sel) {
        sel.selectAll('.domain')
        .attr('stroke-width', 2)
        .attr('stroke', 'black')
        .attr('fill', 'none');

        sel.selectAll('.tick').selectAll('line')
        .attr('stroke', 'black')
        .attr('fill', 'none');

        sel.selectAll('.tick').selectAll('text')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 10);
    };

    svg.call(setAxisStyle);

    // Draw the heatmap
    var q = nanocube_server_url+
            '/count.a("location",dive(tile2d(0,0,0),'+
            diveLevel+'),"img")';

    nc.query(q, function(d){
        var data = d.root.children;

        var binSel = svgSel.selectAll("rect").data(data).enter()
        .append("rect")
        .call(setBin);

        //svg2img('plot');
    });

    function setBin(sel) {
        function getColor (d) {
            var r = Math.abs(Math.floor(d.val.cov_matrix[0][0]*10));
            var g = Math.abs(Math.floor(d.val.cov_matrix[1][1]*10));
            var b = Math.abs(Math.floor(d.val.cov_matrix[2][2]*10));
            return 'rgb({0},{1},{2})'.format(r,g,b);
        };

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
