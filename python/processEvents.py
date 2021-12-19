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

initParams=mmapy.readInitParams(os.path.join(dataDir,'init_params.json'))
for e in initParams['events']:
    initParams['events'][e].plotmatches(plotDir=os.path.join(plotDir,'GW'))