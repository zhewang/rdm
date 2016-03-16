# Generate .dmp file from .csv
import argparse
import csv
import sys
import math

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

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('filein', help='file path')
    args = parser.parse_args()

    filein = open(args.filein, 'r')
    reader = csv.reader(filein, delimiter=',')

    uMax = gMax = rMax = iMax = zMax = g_rMax = i_zMax = -99999999999
    uMin = gMin = rMin = iMin = zMin = g_rMin = i_zMin = 99999999999
    for row in reader:
        if noNull(row) is True:
            u = float(row[6])-float(row[11])
            g = float(row[7])-float(row[12])
            r = float(row[8])-float(row[13])
            i = float(row[9])-float(row[14])
            z = float(row[10])-float(row[15])

            uMax = max(uMax, u)
            gMax = max(gMax, g)
            rMax = max(rMax, r)
            iMax = max(iMax, i)
            zMax = max(zMax, z)
            uMin = min(uMin, u)
            gMin = min(gMin, g)
            rMin = min(rMin, r)
            iMin = min(iMin, i)
            zMin = min(zMin, z)

            g_rMax = max(g_rMax, g-r)
            i_zMax = max(i_zMax, i-z)
            g_rMin = min(g_rMin, g-r)
            i_zMin = min(i_zMin, i-z)

    print('uExtent = [{},{}]'.format(math.floor(uMin), math.ceil(uMax)))
    print('gExtent = [{},{}]'.format(math.floor(gMin), math.ceil(gMax)))
    print('rExtent = [{},{}]'.format(math.floor(rMin), math.ceil(rMax)))
    print('iExtent = [{},{}]'.format(math.floor(iMin), math.ceil(iMax)))
    print('zExtent = [{},{}]'.format(math.floor(zMin), math.ceil(zMax)))
    print('g_rExtent = [{},{}]'.format(math.floor(g_rMin), math.ceil(g_rMax)))
    print('i_zExtent = [{},{}]'.format(math.floor(i_zMin), math.ceil(i_zMax)))
