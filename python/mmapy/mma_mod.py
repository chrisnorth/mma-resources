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
            self.gw=gw.EventGW(self,detectors=detectors)
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

