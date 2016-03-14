# Generate .dmp file from .csv
import argparse
import csv
import sys
import math


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('filein', help='file path')
    args = parser.parse_args()

    filein = open(args.filein, 'r')
    reader = csv.reader(filein, delimiter=',')

    uMax = gMax = rMax = iMax = zMax = -99999999999
    uMin = gMin = rMin = iMin = zMin = 99999999999
    for row in reader:
        uMax = max(uMax, float(row[6])-float(row[11]))
        gMax = max(gMax, float(row[7])-float(row[12]))
        rMax = max(rMax, float(row[8])-float(row[13]))
        iMax = max(iMax, float(row[9])-float(row[14]))
        zMax = max(zMax, float(row[10])-float(row[15]))
        uMin = min(uMin, float(row[6])-float(row[11]))
        gMin = min(gMin, float(row[7])-float(row[12]))
        rMin = min(rMin, float(row[8])-float(row[13]))
        iMin = min(iMin, float(row[9])-float(row[14]))
        zMin = min(zMin, float(row[10])-float(row[15]))

    print('uExtent = [{},{}]'.format(math.floor(uMin), math.ceil(uMax)))
    print('gExtent = [{},{}]'.format(math.floor(gMin), math.ceil(gMax)))
    print('rExtent = [{},{}]'.format(math.floor(rMin), math.ceil(rMax)))
    print('iExtent = [{},{}]'.format(math.floor(iMin), math.ceil(iMax)))
    print('zExtent = [{},{}]'.format(math.floor(zMin), math.ceil(zMax)))
