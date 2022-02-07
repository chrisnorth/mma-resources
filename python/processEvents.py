import os,sys
from matplotlib import pyplot as plt
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

initParams=mmapy.readInitParams(os.path.join(dataDir,'init_params.json'),fromCat=True)
fig,wfax=plt.subplots()

wfp=0
events=[]
for e in initParams['events']:
    ev=initParams['events'][e]
    if ev.isGw:
        pdir=os.path.join(plotDir,'GW','loc_maps')
        if not os.path.isdir(pdir):
            os.makedirs(pdir)
        ddir=os.path.join(dataDir,'GW','waveforms')
        if not os.path.isdir(ddir):
            os.makedirs(ddir)
        ev.gw.plotmatches(plotDir=pdir)
        ev.gw.makewaveform(dataDir=ddir)
        wfax.plot(ev.gw.waveform.data['t'],wfp+ev.gw.waveform.data['strain']*1e+21)
        wfp=wfp+1
    events.append(ev)
    # if ev.isXray:
