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

eventsIn=mmapy.readEvents(os.path.join(dataDir,'scenario-1_init.json'),fromCat=False)
allwffig,wfax=plt.subplots()

wfp=0
eventsOut=mmapy.Events()
for e in eventsIn:
    ev=eventsIn[e]
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
        wfax.plot(ev.gw.waveform.data['t']-ev.gw.t0_ms/1000,wfp+ev.gw.waveform.data['strain']*1e+21)
        wfp=wfp+1

        # plot waveforms for each detector
        dtwffig,dtwfax=plt.subplots()
        wfd=0
        yticks=[]
        yticklabels=[]
        for d in ev.gw.detlist:
            dtwfax.plot(ev.gw.waveform.data['t']+ev.gw.dtvals[d],wfd+ev.gw.waveform.data['strain']*1e+21)
            yticks.append(wfd)
            yticklabels.append(d)
            wfd=wfd+1
        dtwfax.set_xlim(-0.05+ev.gw.t0_ms/1000,0.05+ev.gw.t0_ms/1000)
        dtwfax.grid(axis='x',which='both')
        dtwfax.set_yticks(yticks,yticklabels)
        dtwffig.savefig(os.path.join(plotDir,'GW/waveforms','dt_waveforms_{}.png'.format(e)))

    allwffig.savefig(os.path.join(plotDir,'GW/waveforms','waveforms.png'))
    eventsOut.addEvent(ev)


detectors=mmapy.gw.readDetectors('gw_catalogue.json')
eventsOut.addMeta({'gw-detectors':mmapy.gw.Detectors(detectors)})

eventsOut.to_json(os.path.join(dataDir,'scenario-1.json'),indent=2)
