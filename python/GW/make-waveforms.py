import os,sys
import numpy as np
from pycbc.waveform import get_td_waveform
from matplotlib import pyplot as plt
import pandas as pd

plt.ion()

if os.getcwd().split('/')[-1]=='python':
    # in python director
    sys.path.append("./")
    dataDir='../data'
    plotDir='../plots'
else:
    # assuming directory above python directory
    sys.path.append("./python")
    dataDir='data'
    plotDir='plots'
import mmapy

mtot_arr=np.array([10,30])
q_arr=np.arange(0.1,1,0.1)
dist=400

for mtot in mtot_arr:
    for q in q_arr:
        m1=mtot/(1+q)
        m2=mtot-m1
        mch=(m1*m2)**0.6 / (m1+m2)**0.2
        print(mtot,q,m1,m2)
        tres=1./4096
        f_lower=20*30/mtot
        if m1+m2 > 67:
            f_lower=np.min([f_lower,20])
        # if m1+m2 > 67:
        #     tres=1.0/4096
        #     f_lower=20
        # elif m1+m2>5:
        #     tres=1.0/4096
        #     f_lower=25
        # else:
        #     tres=1.0/8192
        #     f_lower=30
        print('processing {} + {} [{}] ({} MPc) at 1/{}s resolution from {}Hz '.format(m1,m2,mch,dist,1./tres,f_lower))
        hp,hc = get_td_waveform(approximant="SEOBNRv3_opt_rk4",
                     mass1=m1,
                     mass2=m2,
                     delta_t=tres,
                     f_lower=f_lower,
                     distance=dist)
        t= hp.sample_times
        wf=pd.DataFrame({'t':t.data,'strain*1e21':hp.data*1e21})
        file='wf_Mtot{:.0f}_q{:.1f}_D{:.0f}_fmin{:.0f}_tres{:.0f}.csv'.format(mtot,q,dist,f_lower,1./tres)
        wf.to_csv(os.path.join(dataDir,'GW','templates',file),float_format='%.4f',index=False)
        

