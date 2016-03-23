import argparse
import io
import struct
import json
import random
import numpy as np
import itertools
import math
import sys



def GetGaussInt(a, b):
    value = random.gauss((a+b)/2, (b-a)/4)
    while int(value) < a or int(value) > b:
        value = random.gauss((a+b)/2, (b-a)/2)
    return int(value)

def header():
    header = "name: test_file\n"+ \
             "encoding: binary\n"+ \
             "field: location nc_dim_quadtree_{0}\n"+ \
             "field: test_category nc_dim_cat_1\n"+ \
             "valname: test_category 0 CATEGORY_A\n"+ \
             "valname: test_category 1 CATEGORY_B\n"+ \
             "valname: test_category 2 CATEGORY_C\n"+ \
             "valname: test_category 3 CATEGORY_D\n"+ \
             "valname: test_category 4 CATEGORY_E\n"+ \
             "metadata: tbin 2016-01-01_00:00:00_3600s\n"+ \
             "field: time nc_dim_time_2\n"
    header = header.format(LEVEL)

    # This includes the count dimension, not includes time dimension
    for i in range(count):
        header = header + 'field: dim' + str(i) + ' nc_var_float_8' + '\n'
    sys.stdout.write(header+'\n')

def getXY():
    key = [-1,-1]
    means = {1:[7,2], 2:[2,7], 3:[2,2]}
    r = random.randint(1,3)
    while (0 < key[0] < 10) is False or (0 < key[1] < 10) is False:
        key = np.random.multivariate_normal(means[r], np.diag([3,3])).tolist()
    return key


def body():
    global flag
    data_schema = []
    # Sample keys
    for n in range(ROWS):
        key = [n%4+0.5, n%4+0.5, 1]
        if args.f is False:
            key = getXY()
            key.append(10-abs(key[0]-key[1]))
        mean = [0 for i in range(DIMS)]
        cov = np.diag(key)
        v = np.random.multivariate_normal(mean, cov).tolist()

        # Calculate all comination for variables
        var = [1]+v
        if flag is True:
            data_schema.append('count')
            for i in range(len(v)):
                data_schema.append(str(i))

        comb = itertools.combinations_with_replacement(range(DIMS), 2)
        for c in comb:
            var.append(v[int(c[0])]*v[int(c[1])])
            if flag is True:
                data_schema.append(str(c[0])+'*'+str(c[1]))

        var = [round(i, 6) for i in var]

        if flag is True:
            print("NanoCube variable dimensions: "+str(count))
            print('Variable Schema: {}'.format(data_schema))
            flag = False
            if args.s is True:
                sys.exit(0)

        # Dump
        pack_str = '<iiBH' + 'd'*count

        resolution = 2**LEVEL
        xRange = xMax-xMin
        yRange = yMax-yMin

        xTile = int(resolution*((key[0]*1.0-xMin)/xRange))
        yTile = int(resolution*((key[1]*1.0-yMin)/yRange))
        binStr = struct.pack(pack_str,xTile,yTile,GetGaussInt(0,4),0,*var)
        sys.stdout.write(binStr)


if __name__ == '__main__':

    parser = argparse.ArgumentParser(description='Generate testing data')
    parser.add_argument('-f', action='store_true', default=False, help='fixed position')
    parser.add_argument('-s', action='store_true', default=False, help='only show schema of dmp file')
    parser.add_argument('-d', type=int, default=3, help='dimension of features')
    parser.add_argument('-r', type=int, default=1, help='number of rows')
    parser.add_argument('-l', type=int, default=15, help='quadtree level')
    args = parser.parse_args()
    DIMS = args.d
    ROWS = args.r
    LEVEL = args.l

    xMin = 0
    xMax = 10
    yMin = 0
    yMax = 10

    flag = args.s

    count = DIMS*(DIMS+1)/2 + DIMS + 1

    if flag is False:
        header()

    body()

