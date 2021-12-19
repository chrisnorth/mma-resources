from . import gw

import json, string, os
import numpy as np
from matplotlib import pyplot as plt
# from . import xray

def d2r(d):
    # convert degree to radians
    return(d/180.*np.pi)

def lb2vec(loc):
    """
    Convert lon,lat to unit vector
    Input: [list] 2-element list containing [longitude,latitude] (in degrees)
    Output: [lest] unit vector
    """
    vec=np.array([np.cos(d2r(loc[0]))*np.cos(d2r(loc[1])),
        np.sin(d2r(loc[0]))*np.cos(d2r(loc[1])),
        np.sin(d2r(loc[1]))])
    return vec

class Event(object):
    def __init__(self,paramin,detectors={}):
        """
        Object for event. Created attributes based on parameters
        Inputs:
          * [dict]: dictionary of parameters
          * detectors [dict, optional]: detectors to use to initialise event
        Output: None
        """
        for p in paramin:
            self.initParams=paramin
        self.name=paramin.get('name','')
        self.messengers=paramin.get('messengers',[])
        self.datetime=paramin.get('datetime','')
        self.dist_Mpc=paramin.get('dist_Mpc',None)
        self._setLoc()
        self.vec=self.toVec()
        
        self.isGw=('GW' in self.messengers)
        self.isXray=('xray' in self.messengers)
        if self.isGw and detectors:
            self.gw=self.EventGW(self,detectors=detectors)
        return
        
    def _setLoc(self):
        """
        Set location of event, based on initParams
        Inputs: None
        Output: None
        Attributes added:
          * lon: [list] 2-element list containing [longitude,latitude] (degrees)
          * lon: [float] longitude (degrees)
          * lat: [float] latitude (degrees)
        """
        if 'loc' in self.initParams:
            self.loc=self.initParams['loc']
        elif 'lon' in self.initParams and 'lat' in self.initParams:
            self.loc=[self.initParams['lon'],self.initParams['lat']]
        else:
            self.loc=[]
        assert len(self.loc)==2, 'ERROR: non-valid location: {}'.format(self.loc)
        self.lon=self.loc[0]
        self.lat=self.loc[1]
        return 
        
    def toVec(self):
        """
        Convert lon,lat to a unit vector
        Inputs: None
        Output: [numpy array (length 3)] unit vector
        """
        vec=np.array([np.cos(d2r(self.lon))*np.cos(d2r(self.lat)),
            np.sin(d2r(self.lon))*np.cos(d2r(self.lat)),
            np.sin(d2r(self.lat))])
        return vec
        
    class EventGW(object):
        def __init__(self,parent,detectors={}):
            self.parent=parent
            self.detlist=parent.initParams.get('gw_dets',[])
            self.loc=parent.loc
            self.name=parent.name
            self.chirpmass_Msun=parent.initParams.get('chirpmass_Msun',None)
            self.setGwDets(detectors)
            return
            
        def gridLoc(self):
            """
            Set location of event, centred on 15deg grid squares
            Inputs: None
            Output: [float,float]: [lon,lat]
            """
            grid=15.
            gridlon=np.floor(self.loc[0]/grid)*grid + grid/2
            gridlat=np.floor(self.loc[1]/grid)*grid + grid/2
            return [gridlon,gridlat]
        
        def setGwDets(self,detsIn):
            """
            Add detector info to EventGW, based on detector list in Event, and using Detector info provided.
            Attributes added:
              * cell: [string] cell name of event
              * matcharr: [numpy.array] RA,Dec grid of number of detector pairs that match each cell
              * cellmatches: [list] List of cells that are matched by all detector pairs
            Inputs:
              * [dict]: dictionary containing gw.Detector objects for detectors
            Output: None
            """
            self.gridloc=self.gridLoc()
            gridvec=lb2vec(self.gridloc)
            self.detectors={}
            for d in self.detlist:
                if d in detsIn:
                    self.detectors[d]=detsIn[d]
                    print('adding detector {}'.format(d))
            self.detpairs=gw.dets2pairs(self.detectors)
            self.dt={}
            raStr=string.ascii_uppercase[:24]
            decStr=[str(x) for x in np.arange(12) + 1]
            decStr.reverse()
            self.cell=raStr[int(self.gridloc[0]/15)]+decStr[int((90-self.gridloc[1])/15)]
            print('\n\n\n',self.name,self.loc,self.gridloc,self.gridloc[0]/15,(self.gridloc[1]+90)/15,self.cell)
            dplist=[]
            for dd in self.detpairs:
                dtobj={}
                detp=self.detpairs[dd]
                dtobj['arr']=detp.dtData()
                dtobj['value']=detp.vec2dt(gridvec).to(dtobj['arr']['units']).value
                
                dtobj['matchmap'],dtobj['cells']=detp.getGridLocs(gridvec)
                self.dt[dd]=dtobj
                
                print(dd,dtobj['value'])
                print(dtobj['cells'])
                
            cellmatches=[]
            npair=len(self.dt)
            matcharr=np.zeros_like(dtobj['arr']['arr'])
            for dd in self.detpairs:
                matcharr=matcharr+self.dt[dd]['matchmap']
            for r in range(len(raStr)):
                for d in range(len(decStr)):
                    if matcharr[d,r]==npair:
                        cellmatches.append(raStr[r]+decStr[d])
            self.matcharr=matcharr
            
            self.cellmatches=cellmatches
            print('cell matches:',self.cellmatches)
            return

        def plotmatches(self,plotDir=''):
            """
            Plot grid of matches for each cell
            Inputs:
              * plotDir: [string, optional] directory to output image to. Default=''
            Output: none
            """
            matcharr=self.matcharr
            
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
    """
    Read event and detector parameters from file, and convert to Event and Detector objects
    Inputs:
      * [string OR dict] filename to read parameters from (json format) OR dict of parameters
    Output: [dict] dict containing Event and Detector objects
    """
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
    """
    Read event parameters from file, and convert to Event objects
    Inputs:
      * [string OR dict] filename to read event parameters from (json format) OR dict of parameters
    Output: [dict] dict containing Event objects
    """
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
