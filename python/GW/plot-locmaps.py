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

dets=mmapy.gw.readDetPairs(os.path.join(dataDir,'init_params.json'))

mmapy.gw.plotMaps(dets,plotDir=os.path.join(plotDir,'GW','timing_maps'),dataDir=os.path.join(dataDir,'GW','timing_maps'),verbose=True)
mmapy.gw.plotMaps(dets,plotDir=os.path.join(plotDir,'GW','timing_maps'),dataDir=os.path.join(dataDir,'GW','timing_maps'),plottype='contour',verbose=True,grid=5)