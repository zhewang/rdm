import argparse
import csv
import itertools
import struct
import sys
from astropy.io import fits

def set2dict(s):
    s = sorted(list(s))
    m = {}
    for i, e in enumerate(s):
        m[e] = i
    return m

def body(filepath):
    f = fits.open(filepath)
    rowCounts = f[1].data.shape[0]
    set1 = set()
    set2 = set()
    for i in range(rowCounts):
        row = f[1].data[i]
        type1 = row[19]
        type2 = row[20]
        set1.add(type1)
        set2.add(type2)

    print(set2dict(set1))
    print(set2dict(set2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate testing data')
    parser.add_argument('filepath', help='file path')
    parser.add_argument('-l', type=int, default=15, help='quadtree level')
    parser.add_argument('-s', action='store_true', default=False, help='only show schema of dmp file')
    args = parser.parse_args()

    LEVEL = args.l
    flag = args.s

    body(args.filepath)
