import argparse
import io
import struct
import json
import random
import numpy as np
import itertools
import math


def GetGaussInt(a, b):
    value = random.gauss((a+b)/2, (b-a)/4)
    while int(value) < a or int(value) > b:
        value = random.gauss((a+b)/2, (b-a)/2)
    return int(value)

parser = argparse.ArgumentParser(description='Generate testing data')
parser.add_argument('-f', action='store_true', default=False)
parser.add_argument('dimensions', type=int, help='dimension of features')
parser.add_argument('rows', type=int, help='number of rows')
args = parser.parse_args()
DIMS = args.dimensions
ROWS = args.rows

# Generate data
data_key = []
data_var = []
xMin = 9999999999999
xMax = -9999999999999
yMin = 9999999999999
yMax = -9999999999999
for n in range(ROWS):
    r = [n%4+0.5, n%4+0.5, 1]
    if args.f is False:
        r = [random.uniform(0.00001,10) for i in range(DIMS-1)]
        r.append(5)
    xMin = min(xMin, r[0])
    xMax = max(xMax, r[0])
    yMin = min(yMin, r[1])
    yMax = max(yMax, r[1])
    mean = [0 for i in range(DIMS)]
    cov = np.diag(r)
    v = np.random.multivariate_normal(mean, cov).tolist()
    data_key.append(r)
    data_var.append(v)

with open('data.json', 'w') as f:
    f.write(json.dumps(data_key))

# Preprocess data for NanoCube
data_nc = []
data_schema = []
flag = True
for row in data_var:
    r = [1]+row
    if flag is True:
        data_schema.append('count')
        for i in range(len(row)):
            data_schema.append(str(i))
    comb = itertools.combinations_with_replacement(range(DIMS), 2)
    for c in comb:
        r.append(row[int(c[0])]*row[int(c[1])])
        if flag is True:
            data_schema.append(str(c[0])+'*'+str(c[1]))

    r = [round(i, 6) for i in r]
    data_nc.append(r)
    if flag is True:
        print('Variable Schema: {}'.format(data_schema))
        flag = False


with open('data_nc.dmp', 'w') as f:
    header = """name: test_file
encoding: binary
metadata: location__origin degrees_mercator_quadtree25
field: location nc_dim_quadtree_25
field: test_category nc_dim_cat_1
valname: test_category 0 CATEGORY_A
valname: test_category 1 CATEGORY_B
valname: test_category 2 CATEGORY_C
valname: test_category 3 CATEGORY_D
valname: test_category 4 CATEGORY_E
metadata: tbin 2016-01-01_00:00:00_3600s
field: time nc_dim_time_2\n"""

    count = DIMS*(DIMS+1)/2 + DIMS + 1 # This includes the count dimension, not includes time dimension
    print("NanoCube variable dimensions: "+str(count))
    for i in range(count):
        header = header + 'field: dim' + str(i) + ' nc_var_float_8' + '\n'
    f.write(header+'\n')

    pack_str = '<iiBH' + 'd'*count
    for i in range(len(data_nc)):
        # 1<<25 is 2**25
        xTile = min(1<<25,int(((data_key[i][0]-xMin)/(xMax-xMin))*(1<<25)))
        yTile = min(1<<25,int(((data_key[i][1]-yMin)/(yMax-yMin))*(1<<25)))
        v = struct.pack(pack_str,xTile,yTile,GetGaussInt(0,4),0,*data_nc[i])
        f.write(v)

