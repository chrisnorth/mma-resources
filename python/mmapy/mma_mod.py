from . import gw

import json, string, os
import numpy as np
from matplotlib import pyplot as plt
# from . import xray

def d2r(d):
    # convert degree to radians
    return(d/180.*np.pi)
    
class Event(object):
    def __init__(self,paramin,detectors={}):
        for p in paramin:
            self.initParams=paramin
        self.name=paramin.get('name','')
        self.messengers=paramin.get('messengers',[])
        self.datetime=paramin.get('datetime','')
        self.dist_Mpc=paramin.get('dist_Mpc',None)
        self._setloc(paramin)
        self.vec=self.tovec()
        
        self.isgw=('GW' in self.messengers)
        self.isxray=('xray' in self.messengers)
        if self.isgw and detectors:
            self.gw={}
            self.gw['detlist']=paramin.get('gw_dets',[])
            self.gw['chirpmass_Msun']=paramin.get('chirpmass_Msun',None)
            self.setGwDets(detectors)
        return
        
    def _setloc(self,paramin):
        if 'loc' in paramin:
            self.loc=paramin['loc']
        elif 'lon' in paramin and 'lat' in paramin:
            self.loc=[paramin['lon'],paramin['lat']]
        else:
            self.loc=[]
        assert len(self.loc)==2, 'ERROR: non-valid location: {}'.format(self.loc)
        self.lon=self.loc[0]
        self.lat=self.loc[1]
        return 
        
    def tovec(self):
        # convert a lon,lat pair to a unit vector
        vec=np.array([np.cos(d2r(self.lon))*np.cos(d2r(self.lat)),
            np.sin(d2r(self.lon))*np.cos(d2r(self.lat)),
            np.sin(d2r(self.lat))])
        return vec
        
    def setGwDets(self,detsIn):
        self.gw['detectors']={}
        for d in self.gw['detlist']:
            if d in detsIn:
                self.gw['detectors'][d]=detsIn[d]
        self.gw['detpairs']=gw.dets2pairs(self.gw['detectors'])
        self.gw['dt']={}
        raStr=string.ascii_uppercase[:24]
        decStr=[str(x) for x in np.arange(12) + 1]
        # decStr.reverse()
        self.cell=raStr[int(self.lon/15)]+decStr[int((self.lat+90)/15)]
        print('\n\n\n',self.name,self.loc,self.lon/15,(self.lat+90)/15,self.cell)
        dplist=[]
        for dd in self.gw['detpairs']:
            dtobj={}
            detp=self.gw['detpairs'][dd]
            dtobj['arr']=detp.dtData()
            dtobj['value']=detp.vec2dt(self.vec).to(dtobj['arr']['units']).value
            
            dtobj['cells']=detp.getGridLocs(self.vec)
            self.gw['dt'][dd]=dtobj
            
            print(dd,dtobj['value'])
            print(dtobj['cells'])
            
        cellmatches=[]
        npair=len(self.gw['dt'])
        matcharr=np.zeros_like(dtobj['arr']['arr'])
        for r in range(len(raStr)):
            for d in range(len(decStr)):
                cell=raStr[r]+decStr[d]
                n=0
                for dd in self.gw['dt']:
                    if cell in self.gw['dt'][dd]['cells']:
                        n=n+1
                matcharr[d,r]=n
                if n==npair:
                    cellmatches.append(cell)
        self.gw['matcharr']=matcharr
        
        self.gw['cellmatches']=cellmatches
        print('cell matches:',self.gw['cellmatches'])
        return

    def plotmatches(self,plotDir):
        matcharr=self.gw['matcharr']
        
        (nDec,nRA)=np.shape(matcharr)
        dRAgrid=nRA/24
        dDecgrid=nDec/12
        
        plt.figure()
        plt.clf()
        plt.imshow(matcharr)
        ax=plt.gca()
        ax.set_aspect('equal')
        ax.set_xticks(np.arange(0,nRA,dRAgrid)-0.5,['']*24)
        ax.set_xticks(np.arange(np.max([0,(dRAgrid-1)/2]),nRA,dRAgrid),
            string.ascii_uppercase[:24],minor=True)
        ax.set_yticks(np.arange(0,nDec,dDecgrid)-0.5,['']*12)
        yticklabs=[str(x) for x in np.arange(12) + 1]
        yticklabs.reverse()
        ax.set_yticks(np.arange(np.max([0,(dDecgrid-1)/2]),nDec,dDecgrid),
            yticklabs,minor=True)
        ax.tick_params(axis='both',which='minor',length=0)
        plt.title('Matching time differences: {}'.format(self.name))
        
        ax.xaxis.set_ticks_position('bottom')
        ax.yaxis.set_ticks_position('left')
        ax.grid(axis='both',which='major',alpha=1)
        plt.colorbar(location='bottom',label='N matches')
        
        plt.savefig(os.path.join(plotDir,'{}_matchcells.png'.format(self.name)))
        return
        
def readInitParams(fileIn):
    if isinstance(fileIn,str):
        dataIn=json.load(open(fileIn))
    else:
        dataIn=fileIn
    if 'detectors' in dataIn:
        dets={}
        for d in dataIn['detectors']:
            dets[d]=gw.Detector(dataIn['detectors'][d])
    if 'events' in dataIn:
        events={}
        for e in dataIn['events']:
            events[e]=Event(dataIn['events'][e],detectors=dets)
            
    initParams={'events':events,'detectors':dets}
    return(initParams)
    
def readEvents(fileIn):
    if isinstance(fileIn,str):
        dataIn=json.load(open(fileIn))
    else:
        dataIn=fileIn
    if 'events' in dataIn:
        eventsIn=dataIn['events']
    else:
        eventsIn=dataIn
    
    # detlist=[]
    events={}
    for e in eventsIn:
        events[e]=Event(eventsIn[e])
    
    return(events)
