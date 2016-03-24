import argparse
import csv
import itertools
import struct
import sys
from astropy.io import fits

MapSPECTYPEHAMMER = {'dK': 45, 'L8': 34, 'G9': 19, 'G3': 13, 'M8': 43, 'F3': 3, 'G6': 16, 'M9': 44, 'L2': 29, 'G0': 10, 'G5': 15, 'K1': 21, 'F2': 2, 'K5': 25, 'esdM': 48, 'F7': 7, 'F4': 4, 'L6': 33, 'G1': 11, 'M5': 40, 'M6': 41, 'F6': 6, 'M2': 37, 'F0': 0, 'usdK': 51, 'sdM': 50, 'F9': 9, 'dM': 46, 'F8': 8, 'M0': 35, 'L3': 30, 'L1': 28, 'F5': 5, 'L4': 31, 'esdK': 47, 'L5': 32, 'usdM': 52, 'G4': 14, 'K7': 26, 'G8': 18, 'K4': 24, 'G7': 17, 'G2': 12, 'M1': 36, 'M4': 39, 'L0': 27, 'M7': 42, 'K0': 20, 'F1': 1, 'K2': 22, 'sdK': 49, 'M3': 38, 'K3': 23}

MapSPECTYPESUBCLASS = {'M2V': 29, 'L1': 18, 'M8': 35, 'F5': 8, 'B9': 2, 'L4': 21, 'M9': 36, 'QSO': 39, 'Carbon_lines': 6, 'M0V': 26, 'L2': 19, 'O': 37, 'G0': 10, 'G5': 12, 'M1': 27, 'K1': 13, 'F2': 7, 'K5': 15, 'M5': 32, 'K7': 16, 'L5.5': 23, 'CWD': 5, 'OB': 38, 'B6': 1, 'CAR': 3, 'G2': 11, 'M2': 28, 'T2': 40, 'CV': 4, 'M4': 31, 'L5': 22, 'L0': 17, 'L9': 24, 'L3': 20, 'M6': 33, 'M7': 34, 'F9': 9, 'M0': 25, 'M3': 30, 'K3': 14, '00': 0}

def isfloat(value):
    try:
        float(value)
        return True
    except ValueError:
        return False

def noNull(row):
    legal = True
    for i in range(4, 19):
        if isfloat(row[i]) is False:
            legal = False
            return legal
        elif float(row[i]) < 0 or float(row[i]) > 100:
            legal = False
            return legal
    return legal

def header():
    header = "name: sdss_dr7_stars\n"+ \
             "encoding: binary\n"+ \
             "field: location nc_dim_quadtree_{0}\n"+ \
             "field: SPECTYPEHAMMER nc_dim_cat_1"+ \
             "valname: SPECTYPEHAMMER 0 AA"+ \
             "field: SPECTYPESUBCLASS nc_dim_cat_1"+ \
             "valname: SPECTYPESUBCLASS 0 BA"+ \
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
    f = fits.open(filepath)
    rowCounts = f[1].data.shape[0]
    for i in range(rowCounts):
        row = f[1].data[i]
        if noNull(row) is False:
            filteredCount += 1
        else:
            legalCount += 1
            u = float(row[4])-float(row[9])
            g = float(row[5])-float(row[10])
            r = float(row[6])-float(row[11])
            i = float(row[7])-float(row[12])
            z = float(row[8])-float(row[13])
            key = [g-r, i-z]
            v = []
            v.append(u)
            v.append(g)
            v.append(r)
            v.append(i)
            v.append(z)
            v.append(float(row[14]))
            v.append(float(row[15]))
            v.append(float(row[16]))
            v.append(float(row[17]))
            v.append(float(row[18]))

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

            type1 = MapSPECTYPEHAMMER[row[19]]
            type2 = MapSPECTYPESUBCLASS[row[20]]
            print(type1, type2)

            # Dump
            pack_str = '<iiBBH' + 'd'*count

            resolution = 2**LEVEL
            xMin = g_rExtent[0]
            yMin = i_zExtent[0]
            xRange = g_rExtent[1]-g_rExtent[0]
            yRange = i_zExtent[1]-i_zExtent[0]

            xTile = int(resolution*((key[0]*1.0-xMin)/xRange))
            yTile = int(resolution*((key[1]*1.0-yMin)/yRange))
            binStr = struct.pack(pack_str,xTile,yTile,type1,type2,0,*var)
            sys.stdout.buffer.write(binStr)

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
    count = int(DIMS*(DIMS+1)/2 + DIMS + 1)

    # uExtent = [12.0,33.0]
    # gExtent = [10.0,33.0]
    # rExtent = [10.0,31.0]
    # iExtent = [9.0,31.0]
    # zExtent = [8.0,29.0]
    g_rExtent = [-7.0,16.0]
    i_zExtent = [-10.0,13.0]

    if args.s is False:
        header()

    body(args.filepath)
