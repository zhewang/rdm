///////////////////////////////////////////////
// NanoCube query helpers
///////////////////////////////////////////////

var nc = {};

nc._variable_schema = {};
nc._num_feature_dimensionm = null;

nc.setup = function (s) {

    for(var i = 0; i < s.length; i ++) {
        nc._variable_schema[String(s[i])] = i;
    }

    // calculate the original feature dimension number
    nc._num_feature_dimensionm = Math.floor((Math.sqrt(8*(s.length)+1)-3) / 2);
};

nc.query = function (q, f) {
    console.log("------------------------");
    var start = new Date().getTime();
    $.getJSON(q, function(data) {
        //f(nc._pca(data.root.val));
        var mid = new Date().getTime();
        console.log("Query Time: "+(mid-start)+"ms");
        if('val' in data.root) {
            data.root.val = nc._pca(data.root.val);
            var end = new Date().getTime();
            console.log("PCA Time: "+(end-mid)+"ms");
            console.log("Total Time: "+(end-start)+"ms");
            f(data);
        } else if('children' in data.root) {
            for(var i = 0; i < data.root.children.length; i ++) {
                data.root.children[i].val = nc._pca(data.root.children[i].val);
            }
            var end = new Date().getTime();
            console.log("PCA Time: "+(end-mid)+"ms");
            console.log("Total Time: "+(end-start)+"ms");
            f(data);
        }

    });
};

nc._pca = function (vec) {
    var d = nc._num_feature_dimensionm;
    var s = nc._variable_schema;

    if(typeof vec === 'undefined') {
        return null;
    }

    var covMat = new Array(d);
    for(var i = 0; i < d; i ++) {
        covMat[i] = new Array(d);
    }

    // build the upper triangular area
    for(var row = 0; row < d; row ++) {
        for(var col = row; col < d; col ++) {
            var sum_x = vec[s[String(row)]];
            var sum_y = vec[s[String(col)]];
            var sum_xy = vec[s[String(row)+'*'+String(col)]];
            var count = vec[s.count];
            covMat[row][col] = (sum_xy-sum_x*sum_y/count)/(count-1);
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
};
