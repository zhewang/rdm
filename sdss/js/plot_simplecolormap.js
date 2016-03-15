///////////////////////////////////////////////////////////////////////////////
// Global variables
///////////////////////////////////////////////////////////////////////////////

var nanocube_server_url = 'http://hdc.cs.arizona.edu/nanocube/10020/';
//var nanocube_server_url = 'http://localhost:29512/';
var quadtree_level = 15;
var variable_schema = ['count', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0*0', '0*1', '0*2', '0*3', '0*4', '0*5', '0*6', '0*7', '0*8', '0*9', '1*1', '1*2', '1*3', '1*4', '1*5', '1*6', '1*7', '1*8', '1*9', '2*2', '2*3', '2*4', '2*5', '2*6', '2*7', '2*8', '2*9', '3*3', '3*4', '3*5', '3*6', '3*7', '3*8', '3*9', '4*4', '4*5', '4*6', '4*7', '4*8', '4*9', '5*5', '5*6', '5*7', '5*8', '5*9', '6*6', '6*7', '6*8', '6*9', '7*7', '7*8', '7*9', '8*8', '8*9', '9*9'];

// auto setup of other values
var G_Feature_Dimensions = Math.floor((Math.sqrt(8*(variable_schema.length)+1)-3) / 2);
var G_Schema_Map = {};
for(var i = 0; i < variable_schema.length; i ++) {
    G_Schema_Map[String(variable_schema[i])] = i;
}


///////////////////////////////////////////////////////////////////////////////
// Common Functions to Setup the Page and Help Plot Heatmaps
///////////////////////////////////////////////////////////////////////////////

// Change Dive Level
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

function plot(diveLevel) {
    d3.select("#heatmap").selectAll("svg").remove();
    d3.select("#heatmap").selectAll("rect").remove();

    var q = nanocube_server_url+
            '/count.a("location",dive(tile2d(0,0,0),'+
            diveLevel+'),"img")';

    nc.query(q, function(d){
        // Plot different kinds of heatmap here
        //plotHeatmap(diveLevel, d, CovMatColorMap, RepackWithPCA);
        plotHeatmap(diveLevel, d, onlyCount);
        plotHeatmap(diveLevel, d, U_CountAveVar);
    });
}

function plotHeatmap(diveLevel, data,
                     cellStyleFunc, // How to render each cell
                     dataTransformFunc=function(d){return d;} // Optional. Never change the original data.
                    )
{
    data = dataTransformFunc(data);
    data = data.root.children;

    var xExtent = [12,33];
    var yExtent = [10,33];

    var plotWidth = 500;
    var plotHeight = 500;

    var margin = { top: 10, right: 30, bottom: 30, left: 30 };
    var viewBoxWidth = 500;
    var viewBoxHeight = 500;

    var contentWidth = viewBoxWidth-margin.left-margin.right;
    var contentHeight = viewBoxHeight-margin.top-margin.bottom;

    // plot heatmap
    var svgSel = d3.select("#heatmap")
        .append("svg")
        .attr("width", plotWidth)
        .attr("height", plotHeight)
        .attr('viewBox', '0 0 '+viewBoxWidth+' '+viewBoxHeight)
        .attr('id', 'plot');

    var xScale = d3.scale.linear().domain(xExtent).range([0, contentWidth]);
    var yScale = d3.scale.linear().domain(yExtent).range([contentHeight, 0]);

    var gridXSize = (xScale(xExtent[1])-xScale(xExtent[0]))/Math.pow(2,diveLevel);
    var gridYSize = (yScale(yExtent[0]-yScale(yExtent[1])))/Math.pow(2,diveLevel);

    svgSel.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top+ ")")
        .selectAll("rect").data(data).enter()
        .append("rect")
        .attr("x", function(d) {
            return d.x*gridXSize;
        })
        .attr("y", function(d) {
            return contentHeight-(d.y+1)*gridYSize;
        })
        .attr("width", gridXSize)
        .attr("height", gridYSize)
        .call(cellStyleFunc, data);

    // Draw the axis
    var xAxis = d3.svg.axis().scale(xScale).ticks(10);
    var yAxis = d3.svg.axis().scale(yScale).ticks(10);

    svgSel.append("g")
    .attr("transform", "translate("+margin.left+", "+
          (contentHeight+margin.top).toString()+")")
    .call(xAxis);

    yAxis.orient("left");
    svgSel.append("g")
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

    svgSel.call(setAxisStyle);
}

///////////////////////////////////////////////////////////////////////////////
// Different Color Mapping Strategies
///////////////////////////////////////////////////////////////////////////////
function onlyCount(rectSel, data) {
    var countExtent = d3.extent(data, function(d){
        return d.val[0];
    });
    countExtent[0] = 0;
    var opacityScale = d3.scale.linear().domain(countExtent).range([0.05, 1]);

    rectSel.call(setCellStyle);

    function setCellStyle(sel) {
        sel.attr("fill", 'red')
        .attr('opacity', function(d){return opacityScale(d.val[0])})
        .on('click', function(d){ console.log(d); });
    }
}

// Count, Average(u), Variance(u)
var U_CAVUtils = {
    'countExtent': null,
    'uAveExtent': null,
    'uVarExtent': null
};
function U_CountAveVar(rectSel, data) {
    function calVariance(d) {
        var mean = d.val[1]/d.val[0];
        var variance = (d.val[11]-2*mean*d.val[1]+d.val[0]*mean*mean) / d.val[0];
        return Math.max(0, variance);
    }

    if(U_CAVUtils.countExtent == null) {
        U_CAVUtils.countExtent = d3.extent(data, function(d){
            return d.val[0];
        });
        U_CAVUtils.countExtent[0] = 0;

        U_CAVUtils.uAveExtent = d3.extent(data, function(d){
            return d.val[1]/d.val[0];
        });

        U_CAVUtils.uVarExtent = d3.extent(data, function(d){
            return calVariance(d);
        });
    }

    var opacityScale = d3.scale.linear()
        .domain(U_CAVUtils.countExtent)
        .range([0.05, 1]);
    var hueScale = d3.scale.linear().domain(U_CAVUtils.uAveExtent).range([0, 360]);
    var saturationScale = d3.scale.linear().domain(U_CAVUtils.uVarExtent).range([0,1]);

    rectSel.call(setCellStyle);

    function setCellStyle(sel) {
        sel.attr("fill", 'red')
        .attr('opacity', function(d){return opacityScale(d.val[0])})
        .attr('fill', function(d){
            var h = hueScale(d.val[1]/d.val[0]);
            var s = saturationScale(calVariance(d));
            return d3.hsl(h,s,0.5);
        })
        .on('click', function(d){
            //console.log(d);
            var a = d.val[1]/d.val[0];
            var v = calVariance(d);
            var c = d.val[0];
            console.log('Mean: ',a, ' Variance: ',v, ' Count: ', c);
        });
    }
}

function CovMatColorMap(rectSel, data) {
    var countExtent = d3.extent(data, function(d){
        return d.val.count
    });
    countExtent[0] = 0;
    var opacityScale = d3.scale.linear().domain(countExtent).range([0, 1]);

    rectSel.call(setCellStyle);

    function setCellStyle(sel) {
        sel.attr("fill", function(d){
            var r = Math.abs(Math.floor(d.val.cov_matrix[0][0]*10));
            var g = Math.abs(Math.floor(d.val.cov_matrix[1][1]*10));
            var b = Math.abs(Math.floor(d.val.cov_matrix[2][2]*10));
            return 'rgb({0},{1},{2})'.format(r,g,b);
        })
        .attr('opacity', function(d){return opacityScale(d.val.count)})
        .on('click', function(d){ console.log(d); });
    }
}

///////////////////////////////////////////////////////////////////////////////
// Helper Functions
///////////////////////////////////////////////////////////////////////////////

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

function svg2img(svgID){
    var svg  = document.getElementById(svgID);
    var xml  = new XMLSerializer().serializeToString(svg);
    var data = "data:image/svg+xml;base64," + btoa(xml);
    var img  = new Image();

    img.setAttribute('src', data);
    document.body.appendChild(img);
}

// PCA related
function RepackWithPCA(original_data) {

    // Deep copy. TODO: more elegent way
    var data = $.parseJSON(JSON.stringify(original_data));

    if('val' in data.root) {
        data.root.val = CalculatePCA(data.root.val);
        return data;
    } else if('children' in data.root) {
        for(var i = 0; i < data.root.children.length; i ++) {
            data.root.children[i].val = CalculatePCA(data.root.children[i].val);
        }
        return data;
    }

    function CalculatePCA(vec) {
        var d = G_Feature_Dimensions;
        var s = G_Schema_Map;

        if(typeof vec === 'undefined') {
            return null;
        }

        var covMat = new Array(d);
        for(var i = 0; i < d; i ++) {
            covMat[i] = new Array(d);
        }

        // build the upper triangular area
        var count = vec[s.count];
        if(count == 1) {
            for(var row = 0; row < d; row ++) {
                covMat[row][row] = 25.5;
            }
        } else {
            for(var row = 0; row < d; row ++) {
                for(var col = row; col < d; col ++) {
                    var sum_x = vec[s[String(row)]];
                    var sum_y = vec[s[String(col)]];
                    var sum_xy = vec[s[String(row)+'*'+String(col)]];
                    covMat[row][col] = (sum_xy-sum_x*sum_y/count)/(count-1);
                }
            }
        }

        // fill the lower triangular area
        for(var row = 1; row < d; row ++) {
            for(var col = 0; col < row; col ++) {
                covMat[row][col] = covMat[col][row];
            }
        }

        // if count < dimensions, PCA won't work
        if(vec[s.count] < d) {
            return {'cov_matrix': covMat,
                'eig_value': null,
                'eig_vector':null,
                'count': vec[s.count]};
        }

        // calculate eigen value and eigen vector
        var eig = numeric.eig(covMat);
        var eig_value = eig.lambda.x;
        var eig_vector = eig.E.x;
        var list = [];
        for(var i = 0; i < eig_value.length; i ++) {
            list.push({'value':eig_value[i], 'vector':eig_vector[i]});
        }
        list.sort(function(a, b) {
            return -(a.value - b.value);
        });
        for(var i = 0; i < eig_value.length; i ++) {
            eig_value[i] = list[i].value;
            eig_vector[i] = list[i].vector;
        }

        var results = {'cov_matrix': covMat,
            'eig_value': eig_value,
            'eig_vector': eig_vector,
            'count': vec[s.count]};
            return results;
    }
}
