import json
import requests
import numpy as np
import time

data = json.load(open('data.json'))

def naive():


    count = 0
    sum_a = sum_b = sum_c = 0.0
    sum_aa = sum_bb = sum_cc = 0.0
    sum_ab = sum_ac = sum_bc = 0.0

    for r in data:
        count += 1
        sum_a += r[0]
        sum_b += r[1]
        sum_c += r[2]
        sum_aa += r[0]*r[0]
        sum_bb += r[1]*r[1]
        sum_cc += r[2]*r[2]
        sum_ab += r[0]*r[1]
        sum_ac += r[0]*r[2]
        sum_bc += r[1]*r[2]

    print('sums naively calculated:\n [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}]'.format(count,
         sum_a, sum_b, sum_c,
         sum_aa, sum_bb, sum_cc,
         sum_ab, sum_ac, sum_bc))


def nanocube():
    r = requests.get('http://localhost:29512/count')
    d = json.loads(r.text)
    sums = d['root']['val']
    print('sums from nanocube:\n {0}'.format(sums))


t1 = time.clock()
naive()
t2 = time.clock()
print('---- '+str(t2-t1)+' seconds')
t3= time.clock()
nanocube()
t4 = time.clock()
print('---- '+str(t4-t3)+' seconds')
