# Generate .dmp file from .csv
import argparse
import csv
import itertools
import struct
import sys

def isfloat(value):
    try:
        float(value)
        return True
    except ValueError:
        return False

def noNull(row):
    legal = True
    for i in range(6, 21):
        if isfloat(row[i]) is False:
            legal = False
    return legal

def header():
    header = "name: sdss_dr7_stars\n"+ \
             "encoding: binary\n"+ \
             "field: location nc_dim_quadtree_{0}\n"+ \
             "metadata: tbin 2016-01-01_00:00:00_3600s\n"+ \
             "field: time nc_dim_time_2\n"
    header = header.format(LEVEL)

    # This includes the count dimension, not includes time dimension
    for i in range(count):
        header = header + 'field: dim' + str(i) + ' nc_var_float_8' + '\n'
    sys.stdout.write(header+'\n')

def body(filepath):
    global flag
    data_schema = []
    filteredCount = 0
    legalCount = 0
    with open(filepath, 'r') as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        for row in reader:
            if noNull(row) is False:
                filteredCount += 1
            else:
                legalCount += 1
                u = float(row[6])-float(row[11])
                g = float(row[7])-float(row[12])
                r = float(row[8])-float(row[13])
                i = float(row[9])-float(row[14])
                z = float(row[10])-float(row[15])
                key = [g-r, i-z]
                v = []
                v.append(u)
                v.append(g)
                v.append(r)
                v.append(i)
                v.append(z)
                v.append(float(row[16]))
                v.append(float(row[17]))
                v.append(float(row[18]))
                v.append(float(row[19]))
                v.append(float(row[20]))

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

                if flag is True:
                    print("NanoCube variable dimensions: "+str(count))
                    print("NanoCube quadtree level: "+str(LEVEL))
                    print('Variable Schema: {}'.format(data_schema))
                    flag = False
                    if args.s is True:
                        sys.exit(0)

                # Dump
                pack_str = '<iiH' + 'd'*count

                resolution = 2**LEVEL
                xMin = g_rExtent[0]
                yMin = i_zExtent[0]
                xRange = g_rExtent[1]-g_rExtent[0]
                yRange = i_zExtent[1]-i_zExtent[0]

                xTile = int(resolution*((key[0]*1.0-xMin)/xRange))
                yTile = int(resolution*((key[1]*1.0-yMin)/yRange))
                binStr = struct.pack(pack_str,xTile,yTile,0,*var)
                sys.stdout.write(binStr)

    with open(filepath+'.stat', 'w') as f:
        f.write('Original total Count: {}\n'.format(filteredCount+legalCount))
        f.write('Valid row count: {}\n'.format(legalCount))
        f.write('Has missing value: {}\n'.format(filteredCount))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate testing data')
    parser.add_argument('filepath', help='file path')
    parser.add_argument('-l', type=int, default=15, help='quadtree level')
    parser.add_argument('-s', action='store_true', default=False, help='only show schema of dmp file')
    args = parser.parse_args()

    LEVEL = args.l
    flag = args.s

    DIMS = 10
    count = DIMS*(DIMS+1)/2 + DIMS + 1

    # SDSS Sample
    # uExtent = [12.0,33.0]
    # gExtent = [10.0,33.0]
    # rExtent = [10.0,31.0]
    # iExtent = [9.0,31.0]
    # zExtent = [8.0,29.0]
    # g_rExtent = [-7.0,16.0]
    # i_zExtent = [-10.0,13.0]

    # SDSS 180M
    # g_rExtent = [-10054.0,10027.0]
    # i_zExtent = [-10031.0,10027.0]

    # SDSS 180M, using statistics from sample data
    g_rExtent = [-21,23]
    i_zExtent = [-20,23]

    if args.s is False:
        header()

    body(args.filepath)
